
import 'https://deno.land/x/xhr@0.1.0/mod.ts'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import OpenAI from 'npm:openai';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  getWeatherContext,
  searchDocuments,
  fetchInventory,
  prepareMessages,
} from './helpers.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}


serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OPENAI_API_KEY not set in Supabase secrets');
      return new Response(JSON.stringify({ error: 'OpenAI API-nøkkel er ikke konfigurert. Vennligst kontakt administrator.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const openai = new OpenAI({ apiKey: openAIApiKey });
    
    const { history, image } = await req.json();
    if (!history || !Array.isArray(history) || history.length === 0) {
      return new Response(JSON.stringify({ error: 'History is required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Create supabase client with user's auth context
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get current date and time information
    const now = new Date();
    const norskTid = new Intl.DateTimeFormat('no-NO', {
      timeZone: 'Europe/Oslo',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit'
    }).format(now);

    const årstid = getÅrstid(now.getMonth());
    const månedsnavn = now.toLocaleDateString('no-NO', { month: 'long' });

    const weatherContext = await getWeatherContext();

    const latestUserMessage = history[history.length - 1];
    const userQuery = latestUserMessage?.content || '';

    const documentContext = await searchDocuments(supabaseClient, userQuery);

    const inventoryContext = await fetchInventory(supabaseClient);

    const systemPrompt = `
Du er "Hyttehjelperen", en vennlig og hjelpsom AI-assistent for Gaustablikk familiehytte.
Din kunnskap er basert på informasjon om hytta, dens omgivelser, generelle hytterutiner, inventarliste, værdata og interne dokumenter/manualer.
Vær alltid hyggelig, konsis og hjelpsom.

**NÅVÆRENDE DATO OG TID:**
${norskTid}
Årstid: ${årstid}
Måned: ${månedsnavn}

${weatherContext}

${documentContext}

${inventoryContext}

**Generell kunnskapsbase:**
- **Sted:** Vatnedalsvegen 27, Gaustablikk (1200 moh). Området er kjent for fantastisk utsikt mot Gaustatoppen og gode ski- og turmuligheter.
- **Sjekklister:** Du kjenner til sjekklistene for ankomst, avreise, og vedlikehold.
  - Ankomst: Slå på strøm og vann, sett varmepumpe til komfort.
  - Avreise: Varmepumpe til økonomi, kraner lukket, vinduer/dører stengt, strøm av i anneks.
- **Vær og aktiviteter:** Kombiner værdata med årstid for å gi relevante råd om aktiviteter og forberedelser.
- **Smøretips:** Gi smøretips basert på nåværende og forventet temperatur.

${image ? '**Bildeanalyse:** Du kan se bildet brukeren har sendt. Analyser det og gi relevant hjelp basert på hva du ser.' : ''}

**VIKTIGE INSTRUKSJONER:**
- Bruk ALLTID den nåværende datoen og tiden i dine svar når det er relevant.
- Kombiner værdata med årstid og måned for å gi sesongprogramme råd.
- Når du svarer på værrelaterte spørsmål, bruk de faktiske værdataene.
- Gi spesifikke råd basert på nåværende og forventet vær (f.eks. "Med dagens temperatur på X°C og morgen regn...")
- Når du svarer på spørsmål om utstyr, manualer eller prosedyrer, bruk informasjon fra de relevante dokumentene først.
- Hvis du finner relevant informasjon i dokumentene, referer eksplisitt til dokumentet.
- Kombiner informasjon fra dokumenter, vær og inventar for å gi omfattende svar.
- Gi alltid praktiske, konkrete råd basert på hytta sine spesifikke forhold og nåværende situasjon.

Når du svarer, hold deg til din rolle som hyttehjelper. Hvis du ikke vet svaret, si det og foreslå hvor brukeren kan finne informasjonen.
    `;

    const messages = prepareMessages(systemPrompt, history, image);

    const completion = await openai.chat.completions.create({
      model: image ? 'gpt-4o-mini' : 'gpt-4o-mini',
      messages: messages,
    });

    const reply = completion.choices[0].message.content;

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

function getÅrstid(måned: number): string {
  if (måned >= 2 && måned <= 4) return 'Vår';
  if (måned >= 5 && måned <= 7) return 'Sommer';
  if (måned >= 8 && måned <= 10) return 'Høst';
  return 'Vinter';
}
