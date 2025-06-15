
import 'https://deno.land/x/xhr@0.1.0/mod.ts'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import OpenAI from 'npm:openai';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    
    const { history } = await req.json();
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

    // Fetch user's inventory
    const { data: inventoryItems, error: inventoryError } = await supabaseClient
      .from('inventory_items')
      .select('name, description, brand, color, size, location, shelf, owner, notes, category');
      
    if (inventoryError) {
        console.error('Error fetching inventory for AI helper:', inventoryError);
        // Don't fail the request, just proceed without inventory context. The user will be notified in the prompt.
    }

    let inventoryContext = "Inventarlisten er for øyeblikket ikke tilgjengelig.";
    if (inventoryItems && inventoryItems.length > 0) {
      inventoryContext = `
Her er en liste over gjenstander i inventaret. Bruk denne informasjonen til å svare på brukerens spørsmål om gjenstander:
${inventoryItems.map(item => `
- Navn: ${item.name || 'N/A'}
  Beskrivelse: ${item.description || 'N/A'}
  Kategori: ${item.category || 'N/A'}
  Merke: ${item.brand || 'N/A'}
  Farge: ${item.color || 'N/A'}
  Størrelse: ${item.size || 'N/A'}
  Plassering: ${item.location || 'N/A'}${item.shelf ? ` (Hylle/Skuff: ${item.shelf})` : ''}
  Eier: ${item.owner || 'N/A'}
  Notater: ${item.notes || 'N/A'}
`).join('')}
      `.trim();
    }


    const systemPrompt = `
Du er "Hyttehjelperen", en vennlig og hjelpsom AI-assistent for en familiehytte.
Din kunnskap er basert på informasjon om hytta, dens omgivelser, generelle hytterutiner, og en sanntids inventarliste.
Vær alltid hyggelig, konsis og hjelpsom.

**Inventarliste:**
${inventoryContext}

**Kunnskapsbase:**
- **Sted:** Vatnedalsvegen 27. Området er kjent for gode ski- og turmuligheter.
- **Sjekklister:** Du kjenner til sjekklistene for ankomst, avreise, og vedlikehold.
  - Ankomst: Slå på strøm og vann, sett varmepumpe til komfort.
  - Avreise: Varmepumpe til økonomi, kraner lukket, vinduer/dører stengt, strøm av i anneks.
- **Vær:** Du kan gi generelle råd, men oppfordre brukeren til å sjekke en dedikert værtjeneste for nøyaktig varsel.
- **Smøretips:** Gi generelle smøretips basert på temperatur (f.eks. "for minusgrader, bruk blå voks").

Når du svarer, hold deg til din rolle som hyttehjelper. Svar på spørsmål om inventar basert på listen over. Hvis du ikke vet svaret, si det og foreslå hvor brukeren kan finne informasjonen.
    `;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
      ],
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
