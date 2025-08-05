
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
    
    const { image, family_members = [] } = await req.json();
    if (!image) {
      return new Response(JSON.stringify({ error: 'Bilde er påkrevd.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Build family member context for AI
    const familyContext = family_members.length > 0 
      ? `\n\nFAMILIEMEDLEMMER TIL STØRRELSESANALYSE:\n${family_members.map((member: any) => 
          `- ${member.name}${member.nickname ? ` (${member.nickname})` : ''}: ${member.role || 'ukjent rolle'}${member.height ? `, høyde ${member.height}cm` : ''}${member.birth_date ? `, født ${new Date(member.birth_date).getFullYear()}` : ''}`
        ).join('\n')}\n\nNår du ser klær, analyser størrelsen og foreslå hvilken person som mest sannsynlig eier den basert på høyde, alder og kjønn.`
      : '';

    const systemPrompt = `
Du er en AI som spesialiserer seg på å identifisere gjenstander for et hytteinventar og foreslå relevante handlinger.
Analyser bildet og returner informasjon om gjenstanden i JSON-format med foreslåtte handlinger.

KLÆSSTØRRELSER OG EIERSKAP:
Når du ser klær, analyser etiketter for størrelse (S/M/L, tallstørrelser, barnestørrelser som 134/140, etc.).
Hvis familiemedlemmer er oppgitt, foreslå eier basert på:
- Størrelsens forhold til høyde og alder
- Barnestørrelser → barn
- Store størrelser → voksne med større høyde
- Stil og design (barneklær vs voksenklær)
Returner forslag med årsak og konfidensgrad.${familyContext}

TILGJENGELIGE KATEGORIER OG UNDERKATEGORIER:

Klær:
- Skjørt, Kjole, Bukse, Shorts, Sokker, Undertøy, Topp, Genser, Jakke, Sko, Tilbehør

Sport:
- Langrennski, Langrennstaver, Alpint, Alpinstaver, Skisko, Bindinger, Hjelm, Briller, Hansker, Sportsbag, Annet sportsutstyr

Elektronikk:
- Telefon, Nettbrett, Laptop, Kamera, Høretelefoner, Ladere, Kabler, Annen elektronikk

Verktøy:
- Håndverktøy, Elektrisk verktøy, Måleverktøy, Hagearbeid, Annet verktøy

Bøker:
- Romaner, Fagbøker, Magasiner, Tegneserier, Annet lesestoff

Husstand:
- Kjøkkenutstyr, Rengjøring, Tekstiler, Dekorasjon, Annet husstand

Annet: (ingen underkategorier)

VURDER HANDLINGER BASERT PÅ BILDETS INNHOLD:

For INVENTARGJENSTANDER (klær, sport, elektronikk, verktøy, etc.):
- inventory: Legg til i inventarlisten

For VINDOKUMENTER (manualer, instruksjoner, kvitteringer, lapper):
- documents: Lagre under dokumenter
- checklist: Opprett sjekklistepunkt (hvis bildet viser noe som bør huskes/sjekkes)

For VINFLASKER/VINDRIKKER:
- wine: Legg til i vinlageret

For INTERESSANTE OPPLEVELSER/HENDELSER:
- hyttebok: Lagre som utkast til hytteboka

For PROBLEMER/VEDLIKEHOLD som trengs:
- checklist: Foreslå sjekklistepunkt

Returner alltid et JSON-objekt med følgende felter:
{
  "name": "kort, beskrivende navn på norsk",
  "description": "detaljert beskrivelse av gjenstanden på norsk",
  "category": "en av hovedkategoriene over",
  "subcategory": "passende underkategori basert på kategori, eller null hvis kategori er Annet",
  "brand": "merke hvis synlig, ellers null",
  "color": "hovedfarge på norsk",
  "size": "størrelse hvis relevant (S/M/L eller spesifikk størrelse)",
  "confidence": 0.95,
  "suggested_owner": {
    "family_member_id": "ID fra familiemedlemmer hvis foreslått eier, ellers null",
    "name": "navn på foreslått eier",
    "confidence": 0.8,
    "reason": "forklaring på hvorfor denne personen foreslås som eier"
  },
  "suggestedActions": [
    {
      "type": "inventory|documents|wine|hyttebok|checklist",
      "label": "Legg til i inventarlisten|Lagre under dokumenter|Legg til i vinlageret|Lagre i hytteboka|Lag sjekklistepunkt",
      "confidence": 0.95,
      "reason": "forklaring på hvorfor denne handlingen foreslås"
    }
  ]
}

VIKTIGE INSTRUKSJONER:
- Velg alltid den mest spesifikke og passende kategorien og underkategorien
- Hvis gjenstanden er skirelatert, bruk Sport kategorien med riktig underkategori
- For klær, vær spesifikk på type (ikke bare "klær")
- Hvis du ikke kan identifisere gjenstanden tydelig, sett confidence lavere
- Fokuser på detaljer som er relevante for et norsk hytteinventar
- Skriv alle feltene på norsk
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
