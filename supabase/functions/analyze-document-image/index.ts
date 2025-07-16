import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory cache with TTL
const analysisCache = new Map<string, { result: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Rate limiting (simple in-memory store)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per minute per IP

const cleanupCache = () => {
  const now = Date.now();
  for (const [key, value] of analysisCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      analysisCache.delete(key);
    }
  }
};

const checkRateLimit = (clientIP: string): boolean => {
  const now = Date.now();
  const rateLimitEntry = rateLimitStore.get(clientIP);
  
  if (!rateLimitEntry || now > rateLimitEntry.resetTime) {
    rateLimitStore.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (rateLimitEntry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  rateLimitEntry.count++;
  return true;
};

const generateCacheKey = (imageUrl: string, documentTitle: string, documentCategory: string): string => {
  try {
    // Use a simple hash approach that doesn't cause stack overflow
    const input = `${imageUrl}-${documentTitle}-${documentCategory}`;
    
    // Simple hash function using crypto API if available, otherwise fallback
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      // Use a simpler approach - just take first 100 chars of URL + other params
      const shortInput = `${imageUrl.substring(0, 100)}-${documentTitle}-${documentCategory}`;
      return btoa(shortInput).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
    }
    
    // Fallback: use timestamp + simplified input
    const timestamp = Date.now().toString(36);
    const simplified = `${imageUrl.substring(0, 50)}-${documentTitle}-${documentCategory}`;
    return btoa(simplified).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20) + timestamp;
  } catch (error) {
    console.error('Error generating cache key:', error);
    // Ultimate fallback: use timestamp
    return `fallback-${Date.now().toString(36)}`;
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Enhanced logging for debugging
    const requestId = crypto.randomUUID().slice(0, 8);
    console.log(`[${requestId}] Starting image analysis request`);

    // Rate limiting
    const clientIP = req.headers.get('cf-connecting-ip') || 
                    req.headers.get('x-forwarded-for') || 
                    'unknown';
    
    if (!checkRateLimit(clientIP)) {
      console.log(`[${requestId}] Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Try again later.',
          requestId,
          retryAfter: RATE_LIMIT_WINDOW / 1000
        }), 
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error(`[${requestId}] OPENAI_API_KEY not configured`);
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const { imageUrl, documentTitle, documentCategory } = await req.json();
    console.log(`[${requestId}] Processing image for document: "${documentTitle}" in category: "${documentCategory}"`);

    if (!imageUrl) {
      console.error(`[${requestId}] Missing imageUrl parameter`);
      throw new Error('Image URL is required');
    }

    // Enhanced input validation
    const imageUrlLength = imageUrl.length;
    console.log(`[${requestId}] Image URL length: ${imageUrlLength} characters`);
    
    if (imageUrlLength > 50000000) { // ~50MB base64 limit
      console.error(`[${requestId}] Image too large: ${imageUrlLength} characters`);
      throw new Error('Image size too large for processing');
    }
    
    if (imageUrlLength > 10000000) { // ~10MB warning
      console.warn(`[${requestId}] Large image detected: ${imageUrlLength} characters, processing may be slow`);
    }

    // Check cache first
    cleanupCache();
    const cacheKey = generateCacheKey(imageUrl, documentTitle || '', documentCategory || '');
    const cachedResult = analysisCache.get(cacheKey);
    
    if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_TTL) {
      console.log(`[${requestId}] Returning cached analysis for key: ${cacheKey}`);
      return new Response(JSON.stringify({
        ...cachedResult.result,
        requestId,
        fromCache: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[${requestId}] Starting AI analysis for new image (cache key: ${cacheKey})`);
    const startTime = Date.now();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: `Du er en AI-assistent som analyserer bilder for et hyttedokument-system. 
            Analyser bildet og gi korte, beskrivende navn og beskrivelser på norsk.
            Fokuser på hva som er relevant for hyttedokumentasjon.
            
            Dokumentets tittel: "${documentTitle || 'Ikke oppgitt'}"
            Dokumentets kategori: "${documentCategory || 'Ikke oppgitt'}"
            
            Du MÅ svare med gyldig JSON i følgende format (ikke inkluder noe annet):
            {
              "suggestedName": "Kort beskrivende navn (maks 50 tegn)",
              "description": "Detaljert beskrivelse av bildet (maks 200 tegn)",
              "tags": ["tag1", "tag2", "tag3"]
            }`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyser dette bildet og foreslå navn, beskrivelse og relevante tags. Svar kun med JSON:'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail: 'low'
                }
              }
            ]
          }
        ],
        max_tokens: 300,
        temperature: 0.1 // Lower temperature for more consistent JSON
      }),
    });

    const processingTime = Date.now() - startTime;
    console.log(`[${requestId}] OpenAI API call completed in ${processingTime}ms`);

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`[${requestId}] OpenAI API error (${response.status}):`, errorData);
      
      // More specific error handling
      if (response.status === 429) {
        throw new Error('OpenAI rate limit exceeded');
      } else if (response.status === 400) {
        throw new Error('Invalid image format or size');
      } else if (response.status === 401) {
        throw new Error('OpenAI API key invalid');
      }
      
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error(`[${requestId}] Invalid OpenAI response structure:`, data);
      throw new Error('Invalid response from OpenAI');
    }
    
    const content = data.choices[0].message.content;
    console.log(`[${requestId}] Raw AI response:`, content);

    // Parse and validate the JSON response
    let analysis;
    try {
      // Clean the content - remove any markdown formatting if present
      const cleanContent = content.trim().replace(/^```json\s*|\s*```$/g, '');
      console.log(`[${requestId}] Cleaned AI response for parsing:`, cleanContent);
      
      analysis = JSON.parse(cleanContent);
      
      // Validate required fields with detailed logging
      if (!analysis || typeof analysis !== 'object') {
        throw new Error('AI response is not a valid object');
      }
      
      if (!analysis.suggestedName || typeof analysis.suggestedName !== 'string') {
        console.warn(`[${requestId}] Missing or invalid suggestedName, using fallback`);
        analysis.suggestedName = `Bilde ${new Date().toLocaleDateString()}`;
      }
      
      if (!analysis.description || typeof analysis.description !== 'string') {
        console.warn(`[${requestId}] Missing or invalid description, using fallback`);
        analysis.description = "AI-generert beskrivelse utilgjengelig";
      }
      
      // Ensure tags is an array
      if (!Array.isArray(analysis.tags)) {
        console.warn(`[${requestId}] Invalid tags array, using fallback`);
        analysis.tags = ["dokument"];
      }
      
      // Truncate fields to prevent issues
      analysis.suggestedName = analysis.suggestedName.substring(0, 100);
      analysis.description = analysis.description.substring(0, 500);
      analysis.tags = analysis.tags.slice(0, 10).map(tag => String(tag).substring(0, 50));
      
      console.log(`[${requestId}] Successfully parsed and validated AI response`);
      
      // Cache the successful result
      analysisCache.set(cacheKey, {
        result: analysis,
        timestamp: Date.now()
      });
      
    } catch (parseError) {
      console.error(`[${requestId}] Failed to parse AI response:`, parseError);
      console.error(`[${requestId}] Original content:`, content);
      
      // Enhanced fallback response
      analysis = {
        suggestedName: `Analysert bilde ${new Date().toLocaleDateString()}`,
        description: "Automatisk analyse feilet - JSON parsing error",
        tags: ["dokument", "feil"]
      };
      
      // Log the parsing error for debugging
      console.error(`[${requestId}] Parse error details:`, {
        error: parseError.message,
        content: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
        contentLength: content.length
      });
    }

    const totalTime = Date.now() - startTime;
    console.log(`[${requestId}] Analysis completed successfully in ${totalTime}ms`);
    
    return new Response(JSON.stringify({
      ...analysis,
      requestId,
      processingTimeMs: totalTime,
      fromCache: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const requestId = 'unknown'; // Will be redefined if request was processed
    console.error(`[${requestId}] Error in analyze-document-image function:`, error);
    
    // Enhanced error categorization and logging
    let errorMessage = 'Kunne ikke analysere bildet automatisk';
    let statusCode = 500;
    let retryable = false;
    
    if (error.message.includes('rate limit') || error.message.includes('quota')) {
      errorMessage = 'AI-tjenesten har nådd grensene - prøv igjen senere';
      statusCode = 429;
      retryable = true;
      console.warn(`[${requestId}] Rate limit hit, suggesting retry`);
    } else if (error.message.includes('timeout') || error.message.includes('network') || error.message.includes('fetch')) {
      errorMessage = 'Nettverksfeil ved AI-analyse - prøv igjen';
      statusCode = 503;
      retryable = true;
      console.warn(`[${requestId}] Network error, suggesting retry`);
    } else if (error.message.includes('unauthorized') || error.message.includes('api key') || error.message.includes('invalid')) {
      errorMessage = 'AI-tjenesten er ikke konfigurert riktig';
      statusCode = 503;
      console.error(`[${requestId}] Authentication/configuration error`);
    } else if (error.message.includes('size') || error.message.includes('too large')) {
      errorMessage = 'Bildet er for stort for automatisk analyse';
      statusCode = 413;
      console.warn(`[${requestId}] Image too large for processing`);
    } else if (error.message.includes('Invalid image') || error.message.includes('format')) {
      errorMessage = 'Bildeformatet støttes ikke for analyse';
      statusCode = 415;
      console.warn(`[${requestId}] Unsupported image format`);
    }
    
    // Log detailed error information for debugging
    console.error(`[${requestId}] Error details:`, {
      message: error.message,
      stack: error.stack?.substring(0, 500),
      statusCode,
      retryable,
      timestamp: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        userMessage: errorMessage,
        retryable,
        requestId,
        // Always provide fallback response so upload can continue
        suggestedName: "Nytt bilde",
        description: errorMessage,
        tags: ["dokument", "feil"]
      }), 
      {
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});