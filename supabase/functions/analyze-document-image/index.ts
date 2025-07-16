import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const { imageUrl, documentTitle, documentCategory } = await req.json();

    if (!imageUrl) {
      throw new Error('Image URL is required');
    }

    console.log('Analyzing image:', imageUrl);

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
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      // Fallback response
      analysis = {
        suggestedName: "Analysert bilde",
        description: "Automatisk analysert bilde",
        tags: ["dokument"]
      };
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-document-image function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        // Fallback response
        suggestedName: "Nytt bilde",
        description: "Kunne ikke analysere bildet automatisk",
        tags: ["dokument"]
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});