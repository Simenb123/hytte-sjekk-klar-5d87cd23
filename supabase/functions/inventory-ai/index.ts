
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
    
    const { images, family_members = [] } = await req.json();
    if (!images || !Array.isArray(images) || images.length === 0) {
      return new Response(JSON.stringify({ error: 'Minst ett bilde er påkrevd.' }), {
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
Analyser ALLE bildene jeg sender og returner informasjon om gjenstanden i JSON-format med foreslåtte handlinger.
Du kan se gjenstanden fra flere vinkler - bruk alle bildene til å få en komplett forståelse av objektet.

MERKEGJENKJENNELSE - KRITISK VIKTIG:
Se nøye etter merker, logoer og etiketter på produktet. Analyser ALLE bildene grundig for:
- Logoer på klær (f.eks. Bjørn Dæhli, Devold, Bergans, Sweet Protection, Helly Hansen, Peak Performance, etc.)
- Etiketter og lapper med merkenavn (ofte på innsiden av klær)
- Broderte eller trykte merkenavn på utsiden
- Tekstiler og sportsutstyr har ofte synlige merker

VIKTIG - UNNGÅ FORVEKSLING:
- Størrelsesetiketter (S, M, L, XL, 36, 38, 40, etc.) er IKKE merkenavn
- Vaskemerker og størrelsesinformasjon skal IKKE registreres som brand
- Kun synlige merkenavnPÅ SELSKAPER/PRODUSENTER skal registreres som brand
- Hvis du ikke kan se et tydelig merkenavn, sett brand til null - IKKE GJETT!

KLÆSSTØRRELSER OG EIERSKAP - VÆR AGGRESSIV I FORSLAG:
Når du ser klær, analyser etiketter for størrelse (S/M/L, tallstørrelser, barnestørrelser som 134/140, etc.).
Hvis familiemedlemmer er oppgitt, DU MÅ ALLTID foreslå SPESIFIKK eier basert på:
- Størrelsens forhold til høyde og alder (bruk faktisk høyde hvis oppgitt)
- STØRRELSE 38: Typisk voksen kvinne eller mindre mann - foreslå voksen familiemedlem
- Barnestørrelser (128, 134, 140, 146, etc.) → barn
- Voksenstørrelser S/M (36-40) → voksen kvinne eller mindre mann
- Voksenstørrelser L/XL (42+) → større voksen mann eller større kvinne
- Stil og design (barneklær vs voksenklær, herrekl vs dameklær)
- Kjønn basert på snitt og design
VÆR IKKE FORSIKTIG - hvis familiemedlemmer finnes, ALLTID foreslå den mest sannsynlige eieren.
Returner konkret navn og sterk årsak med konfidensgrad minimum 0.7 hvis familie er oppgitt.

PLASSERING OG OPPBEVARING:
Vurder hvor gjenstanden mest sannsynlig befinner seg:
- "hjemme": hverdagsklær, elektronikk, bøker, hverdagsting
- "hytta": fritidsklær, sportsutstyr, utendørsutstyr, hytteutstyr  
- "reiser": bagasje, reiseutstyr, portable ting

FORESLÅ OGSÅ SPESIFIKK PLASSERING basert på gjenstandstype:
- Klær: "garderobe", "soverom", "gang", "vaskerom"
- Sportsutstyr: "bod", "kjeller", "garasje", "loft"
- Elektronikk: "stue", "kontor", "soverom"
- Verktøy: "garasje", "bod", "kjeller", "skur"${familyContext}

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
  "description": "detaljert beskrivelse basert på faktiske visuelle detaljer fra bildene - nevn materiale, farge, design, tilstand",
  "category": "en av hovedkategoriene over",
  "subcategory": "passende underkategori basert på kategori, eller null hvis kategori er Annet",
  "brand": "merke hvis TYDELIG synlig, ellers null - ikke gjett og ikke forveksle med størrelse",
  "color": "hovedfarge på norsk",
  "size": "størrelse hvis relevant (S/M/L eller spesifikk størrelse) - ikke forveksle med merkenavn",
  "primary_location": "hjemme|hytta|reiser - hvor gjenstanden mest sannsynlig befinner seg",
  "location": "foreslått spesifikk plassering basert på gjenstandstype (garderobe, bod, kjeller, etc.)",
  "confidence": 0.95,
  "suggested_owner": {
    "family_member_id": "ID fra familiemedlemmer hvis foreslått eier, ellers null",
    "name": "BARE FORNAVN på foreslått eier (f.eks. 'May-Tone', ikke 'May-Tone Eikum')",
    "confidence": 0.8,
    "reason": "spesifikk forklaring basert på størrelse, alder, høyde og kjønn"
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
- ALDRI forveksle størrelsesetiketter med merkenavn
- Kun sett brand hvis du ser et tydelig firmanavn/merkenavn
- Foreslå ALLTID en spesifikk eier hvis familiemedlemmer er oppgitt og størrelsen passer
- Gi konkrete og detaljerte beskrivelser basert på det du faktisk ser i bildene
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: `Analyser denne gjenstanden for hytteinventar. Jeg sender ${images.length} bilde${images.length > 1 ? 'r' : ''} som viser gjenstanden fra ulike vinkler:` },
            ...images.map((image: string) => ({ type: 'image_url', image_url: { url: image } }))
          ]
        }
      ],
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    
    // Log AI response for debugging
    console.log('AI Analysis Result:', JSON.stringify(result, null, 2));
    console.log(`AI analyzed ${images.length} image(s) successfully`);

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
