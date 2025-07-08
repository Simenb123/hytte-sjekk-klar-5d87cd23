
import 'https://deno.land/x/xhr@0.1.0/mod.ts'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import OpenAI from 'npm:openai';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OPENAI_API_KEY not set in Supabase secrets');
      return new Response(JSON.stringify({ error: 'OpenAI API-nøkkel er ikke konfigurert.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const openai = new OpenAI({ apiKey: openAIApiKey });
    
    const { image } = await req.json();
    if (!image) {
      return new Response(JSON.stringify({ error: 'Bilde er påkrevd.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const systemPrompt = `
Du er en AI som spesialiserer seg på å identifisere gjenstander for et hytteinventar.
Analyser bildet og returner informasjon om gjenstanden i JSON-format.

Returner alltid et JSON-objekt med følgende felter:
{
  "name": "kort, beskrivende navn",
  "description": "detaljert beskrivelse av gjenstanden",
  "category": "en av: Klær, Langrennski, Langrennstaver, Alpint, Verktøy, Kjøkkenutstyr, Møbler, Elektronikk, Sport, Annet",
  "brand": "merke hvis synlig, ellers null",
  "color": "hovedfarge",
  "size": "størrelse hvis relevant",
  "confidence": 0.95
}

Hvis du ikke kan identifisere gjenstanden tydelig, sett confidence lavere.
Fokuser på detaljer som er relevante for et hytteinventar.
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyser denne gjenstanden for hytteinventar:' },
            { type: 'image_url', image_url: { url: image } }
          ]
        }
      ],
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error processing inventory AI request:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
