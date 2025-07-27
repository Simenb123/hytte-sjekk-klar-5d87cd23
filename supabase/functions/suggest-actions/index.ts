import 'https://deno.land/x/xhr@0.1.0/mod.ts'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import OpenAI from 'npm:openai';
import { corsHeaders } from '../common/cors.ts'

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
    
    const { context, userMessage } = await req.json();
    if (!context && !userMessage) {
      return new Response(JSON.stringify({ error: 'Context eller userMessage er påkrevd.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const systemPrompt = `
Du er en AI som spesialiserer seg på å identifisere når brukersamtaler indikerer behov for konkrete handlinger i en hytte-app.

Analyser samtalekontext og foreslå relevante handlinger basert på brukerens melding.

TILGJENGELIGE HANDLINGSTYPER:

1. **inventory** - Foreslå når brukeren:
   - Beskriver gjenstander som bør registreres
   - Snakker om ting de har kjøpt/funnet
   - Nevner utstyr som mangler i systemet

2. **documents** - Foreslå når brukeren:
   - Nevner instruksjoner eller manualer
   - Snakker om viktige dokumenter
   - Beskriver prosedyrer som bør dokumenteres

3. **wine** - Foreslå når brukeren:
   - Nevner vinflasker eller alkohol
   - Snakker om vininnkjøp
   - Beskriver viner de vil lagre

4. **hyttebok** - Foreslå når brukeren:
   - Forteller om opplevelser eller minner
   - Beskriver interessante hendelser
   - Deler historier fra hytta

5. **checklist** - Foreslå når brukeren nevner:
   - "Vi må huske å..."
   - "Neste gang bør vi..."
   - "Problemet er at..."
   - "Det funker ikke..."
   - Beskriver vedlikehold eller oppgaver
   - Snakker om ting som må sjekkes

Returner alltid et JSON-objekt med følgende struktur:
{
  "suggestedActions": [
    {
      "type": "inventory|documents|wine|hyttebok|checklist",
      "label": "Kort beskrivelse av handlingen",
      "confidence": 0.85,
      "reason": "Forklaring på hvorfor denne handlingen foreslås"
    }
  ]
}

Hvis ingen relevante handlinger identifiseres, returner en tom array for suggestedActions.
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Analyser denne meldingen for handlingsforslag:

Brukermelding: "${userMessage}"

${context ? `Kontekst: ${context}` : ''}

Hvilke handlinger bør foreslås basert på denne samtalen?`
        }
      ],
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content || '{"suggestedActions": []}');

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error processing action suggestion request:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});