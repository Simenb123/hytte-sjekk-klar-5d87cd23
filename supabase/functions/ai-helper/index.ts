
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

    // Get the latest user message to search for relevant documents
    const latestUserMessage = history[history.length - 1];
    const userQuery = latestUserMessage?.content || '';

    // Search for relevant cabin documents
    let documentContext = "Ingen relevante dokumenter funnet.";
    try {
      const { data: relevantDocs, error: docsError } = await supabaseClient
        .rpc('search_cabin_documents', { search_query: userQuery })
        .limit(3);

      if (docsError) {
        console.error('Error searching cabin documents:', docsError);
      } else if (relevantDocs && relevantDocs.length > 0) {
        documentContext = `
**Relevante hytte-dokumenter:**
${relevantDocs.map(doc => `
**${doc.title}** (${doc.category})
${doc.content}
---
`).join('')}
        `.trim();
      }
    } catch (error) {
      console.error('Error in document search:', error);
    }

    // Fetch user's inventory
    const { data: inventoryItems, error: inventoryError } = await supabaseClient
      .from('inventory_items')
      .select('name, description, brand, color, size, location, shelf, owner, notes, category');
      
    if (inventoryError) {
        console.error('Error fetching inventory for AI helper:', inventoryError);
    }

    let inventoryContext = "Inventarlisten er for øyeblikket ikke tilgjengelig.";
    if (inventoryItems && inventoryItems.length > 0) {
      inventoryContext = `
**Inventarliste:**
${inventoryItems.map(item => `
- **${item.name || 'N/A'}**
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
Du er "Hyttehjelperen", en vennlig og hjelpsom AI-assistent for Gaustablikk familiehytte.
Din kunnskap er basert på informasjon om hytta, dens omgivelser, generelle hytterutiner, inventarliste og interne dokumenter/manualer.
Vær alltid hyggelig, konsis og hjelpsom.

${documentContext}

${inventoryContext}

**Generell kunnskapsbase:**
- **Sted:** Vatnedalsvegen 27, Gaustablikk (1200 moh). Området er kjent for fantastisk utsikt mot Gaustatoppen og gode ski- og turmuligheter.
- **Sjekklister:** Du kjenner til sjekklistene for ankomst, avreise, og vedlikehold.
  - Ankomst: Slå på strøm og vann, sett varmepumpe til komfort.
  - Avreise: Varmepumpe til økonomi, kraner lukket, vinduer/dører stengt, strøm av i anneks.
- **Vær:** Du kan gi generelle råd, men oppfordre brukeren til å sjekke en dedikert værtjeneste for nøyaktig varsel.
- **Smøretips:** Gi generelle smøretips basert på temperatur (f.eks. "for minusgrader, bruk blå voks").

${image ? '**Bildeanalyse:** Du kan se bildet brukeren har sendt. Analyser det og gi relevant hjelp basert på hva du ser.' : ''}

**VIKTIGE INSTRUKSJONER:**
- Når du svarer på spørsmål om utstyr, manualer eller prosedyrer, bruk ALLTID informasjon fra de relevante dokumentene først.
- Hvis du finner relevant informasjon i dokumentene, referer eksplisitt til dokumentet (f.eks. "Ifølge boblebad brukermanualen...")
- Kombiner informasjon fra dokumenter med dine generelle kunnskaper for å gi omfattende svar.
- Hvis spørsmålet gjelder inventar, søk først i inventarlisten.
- Gi alltid praktiske, konkrete råd basert på hytta sine spesifikke forhold.

Når du svarer, hold deg til din rolle som hyttehjelper. Hvis du ikke vet svaret, si det og foreslå hvor brukeren kan finne informasjonen.
    `;

    // Prepare messages with optional image
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map((msg: any) => {
        if (msg.role === 'user' && image && msg === history[history.length - 1]) {
          // Add image to the last user message
          return {
            role: 'user',
            content: [
              { type: 'text', text: msg.content },
              { type: 'image_url', image_url: { url: image } }
            ]
          };
        }
        return msg;
      }),
    ];

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
