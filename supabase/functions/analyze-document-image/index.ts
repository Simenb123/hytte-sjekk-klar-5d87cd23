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
  // Create a hash of the input parameters
  const encoder = new TextEncoder();
  const data = encoder.encode(`${imageUrl}-${documentTitle}-${documentCategory}`);
  return btoa(String.fromCharCode(...data)).slice(0, 32);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const clientIP = req.headers.get('cf-connecting-ip') || 
                    req.headers.get('x-forwarded-for') || 
                    'unknown';
    
    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Try again later.' }), 
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const { imageUrl, documentTitle, documentCategory } = await req.json();

    if (!imageUrl) {
      throw new Error('Image URL is required');
    }

    // Check cache first
    cleanupCache();
    const cacheKey = generateCacheKey(imageUrl, documentTitle || '', documentCategory || '');
    const cachedResult = analysisCache.get(cacheKey);
    
    if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_TTL) {
      console.log('Returning cached analysis for:', cacheKey);
      return new Response(JSON.stringify(cachedResult.result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Analyzing image:', imageUrl.substring(0, 50) + '...');

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
            
            Svar i følgende JSON-format:
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
                text: 'Analyser dette bildet og foreslå navn, beskrivelse og relevante tags:'
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
        temperature: 0.3
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('AI response:', content);

    // Parse the JSON response
    let analysis;
    try {
      analysis = JSON.parse(content);
      
      // Validate required fields
      if (!analysis.suggestedName || !analysis.description) {
        throw new Error('Invalid AI response format');
      }
      
      // Ensure tags is an array
      if (!Array.isArray(analysis.tags)) {
        analysis.tags = [];
      }
      
      // Cache the successful result
      analysisCache.set(cacheKey, {
        result: analysis,
        timestamp: Date.now()
      });
      
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      // Fallback response
      analysis = {
        suggestedName: "Analysert bilde",
        description: "Automatisk analysert bilde (parsing feilet)",
        tags: ["dokument"]
      };
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-document-image function:', error);
    
    // Determine error type for better responses
    let errorMessage = 'Kunne ikke analysere bildet automatisk';
    let statusCode = 500;
    
    if (error.message.includes('Rate limit') || error.message.includes('quota')) {
      errorMessage = 'AI-tjenesten er midlertidig utilgjengelig';
      statusCode = 503;
    } else if (error.message.includes('timeout') || error.message.includes('network')) {
      errorMessage = 'Nettverksfeil ved AI-analyse';
      statusCode = 503;
    } else if (error.message.includes('unauthorized') || error.message.includes('api key')) {
      errorMessage = 'AI-tjenesten er ikke konfigurert riktig';
      statusCode = 503;
    }
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        // Always provide fallback response so upload can continue
        suggestedName: "Nytt bilde",
        description: errorMessage,
        tags: ["dokument"]
      }), 
      {
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});