
import 'https://deno.land/x/xhr@0.1.0/mod.ts'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import OpenAI from 'npm:openai';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { LocationForecast } from '../../../src/types/weather.types';
import {
  transformWeatherData,
  getConditionFromSymbol,
  getWindDirection,
  getÅrstid,
  type WeatherData,
} from './utils.ts'
import { corsHeaders } from '../common/cors.ts';

const WEATHER_LAT = parseFloat(Deno.env.get('WEATHER_LAT') ?? '59.8726')
const WEATHER_LON = parseFloat(Deno.env.get('WEATHER_LON') ?? '8.6475')
const WEATHER_DATASET = Deno.env.get('WEATHER_DATASET') ?? 'compact'
const CONTACT_EMAIL = Deno.env.get('CONTACT_EMAIL') ?? 'contact@gaustablikk.no'
const SEARCH_API_KEY = Deno.env.get('SEARCH_API_KEY')
const SEARCH_API_URL = Deno.env.get('SEARCH_API_URL') ?? 'https://api.bing.microsoft.com/v7.0/search'

let weatherCache: { data: WeatherData | null; timestamp: number } | null = null;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface WebSearchResult {
  name: string;
  url: string;
  snippet: string;
}

interface HistoryMessage {
  role: string;
  content: string;
}

async function fetchSunTimes(date: string): Promise<{ sunrise: string; sunset: string } | null> {
  try {
    const url = `https://api.met.no/weatherapi/sunrise/3.0/sun?lat=${WEATHER_LAT}&lon=${WEATHER_LON}&date=${date}&offset=+00:00`;
    const res = await fetch(url, {
      headers: { 'User-Agent': `Gaustablikk-Hytte-App/1.0 (${CONTACT_EMAIL})` },
    });
    if (!res.ok) {
      console.error('Failed to fetch sun times', res.status);
      return null;
    }
    const data = await res.json();
    const first = data?.location?.time?.[0];
    const sunrise = first?.sunrise?.time;
    const sunset = first?.sunset?.time;
    if (!sunrise || !sunset) return null;
    return { sunrise, sunset };
  } catch (e) {
    console.error('Error fetching sun times:', e);
    return null;
  }
}

async function fetchWeatherData(): Promise<WeatherData | null> {
  try {
    const now = Date.now();
    if (weatherCache && now - weatherCache.timestamp < CACHE_TTL_MS) {
      return weatherCache.data;
    }

    const YR_API_BASE =
      `https://api.met.no/weatherapi/locationforecast/2.0/${WEATHER_DATASET}`;

    const response = await fetch(
      `${YR_API_BASE}?lat=${WEATHER_LAT}&lon=${WEATHER_LON}`,
      {
        headers: {
          'User-Agent': `Gaustablikk-Hytte-App/1.0 (${CONTACT_EMAIL})`,
        },
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch weather data:', response.status);
      return null;
    }

    const data: LocationForecast = await response.json();
    const transformed = transformWeatherData(data);

    const sunTimes = await fetchSunTimes(transformed.lastUpdated.split('T')[0]);
    if (sunTimes) {
      transformed.sunrise = sunTimes.sunrise;
      transformed.sunset = sunTimes.sunset;
    }

    weatherCache = { data: transformed, timestamp: now };
    return transformed;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
}


// Helper function to generate multiple search queries
function generateSearchQueries(originalQuery: string, currentTime: string): string[] {
  const queries = [originalQuery];
  
  // Synonym mapping for better search results
  const synonyms = {
    'gressklipper': ['kantklipper', 'gressklipping', 'plenklipper', 'hageutstyr', 'have', 'gress'],
    'kantklipper': ['gressklipper', 'kantklipping', 'gressklipping', 'hageutstyr', 'have'],
    'ryobi': ['batteri', 'elektrisk', 'klipper', 'verktøy'],
    'hageutstyr': ['gressklipper', 'kantklipper', 'have', 'gress', 'verktøy'],
    'gressklipping': ['gressklipper', 'kantklipper', 'klipping', 'have'],
    'klippere': ['klipper', 'gressklipper', 'kantklipper'],
    'slå gress': ['gressklipper', 'gressklipping', 'klipping', 'have'],
    'plen': ['gress', 'gressklipper', 'gressklipping', 'have'],
    'have': ['hageutstyr', 'gress', 'gressklipper', 'kantklipper'],
    'verktøy': ['utstyr', 'redskap', 'maskin'],
    'elektrisk': ['batteri', 'strøm', 'lading'],
    'batteri': ['elektrisk', 'lading', 'strøm', 'ryobi'],
    'oppbevaring': ['garasje', 'bod', 'lagring', 'plassering'],
    'garasje': ['oppbevaring', 'bod', 'lagring'],
    'vedlikehold': ['service', 'reparasjon', 'skjøtsel'],
    // Snø og vinterbegreper
    'snømåking': ['snøfjerning', 'snøfreser', 'snøskuffe', 'snøplog', 'snørydding', 'brøyting', 'vinter', 'snø'],
    'snøfjerning': ['snømåking', 'snøfreser', 'snøskuffe', 'snøplog', 'snørydding', 'brøyting', 'vinter', 'snø'],
    'snøfreser': ['snømåking', 'snøfjerning', 'snøskuffe', 'brøyting', 'vintermaskiner', 'snøutstyr', 'snø'],
    'snøskuffe': ['snømåking', 'snøfjerning', 'snøfreser', 'snørydding', 'snøutstyr', 'vinter', 'snø'],
    'snøplog': ['snømåking', 'snøfjerning', 'snøfreser', 'brøyting', 'snørydding', 'snø'],
    'snørydding': ['snømåking', 'snøfjerning', 'snøfreser', 'snøskuffe', 'brøyting', 'vinter', 'snø'],
    'brøyting': ['snømåking', 'snøfjerning', 'snøfreser', 'snørydding', 'vinter', 'snø'],
    'vintermaskiner': ['snøfreser', 'snøskuffe', 'snøutstyr', 'vinterutstyr', 'snømåking'],
    'snøutstyr': ['snøfreser', 'snøskuffe', 'vintermaskiner', 'vinterutstyr', 'snømåking'],
    'vinterutstyr': ['snøutstyr', 'vintermaskiner', 'snøfreser', 'snøskuffe', 'vinter'],
    'vinter': ['snø', 'snøfjerning', 'snømåking', 'vinterutstyr', 'frost', 'kulde'],
    'snø': ['snøfjerning', 'snømåking', 'snøfreser', 'snøskuffe', 'vinter', 'hvit', 'nedbør']
  };
  
  // Handle temporal references
  const timeReferences = {
    'i går': ['nylig', 'sist', 'forrige dag'],
    'igår': ['nylig', 'sist', 'forrige dag'],
    'yesterday': ['recent', 'latest', 'previous'],
    'nylig': ['i dag', 'sist'],
    'sist': ['forrige', 'nylig', 'igår'],
    'i dag': ['nå', 'dagens'],
    'idag': ['nå', 'dagens']
  };

  // Add synonym-based queries
  const queryLower = originalQuery.toLowerCase();
  for (const [term, relatedTerms] of Object.entries(synonyms)) {
    if (queryLower.includes(term)) {
      // Add queries with each related term
      for (const related of relatedTerms) {
        queries.push(related);
        // Also try replacing the original term with the related term
        const replacedQuery = queryLower.replace(term, related);
        queries.push(replacedQuery);
      }
    }
  }

  // Replace temporal references with alternatives
  for (const [temporal, alternatives] of Object.entries(timeReferences)) {
    if (originalQuery.toLowerCase().includes(temporal)) {
      for (const alt of alternatives) {
        const newQuery = originalQuery.toLowerCase().replace(temporal, alt);
        queries.push(newQuery);
      }
      // Also try without the temporal reference
      const withoutTemporal = originalQuery.toLowerCase().replace(temporal, '').trim();
      if (withoutTemporal.length > 0) {
        queries.push(withoutTemporal);
      }
    }
  }

  // Extract main topics and create focused queries
  const mainTopics = extractSearchTerms(originalQuery);
  for (const topic of mainTopics) {
    if (topic.length > 3) {
      queries.push(topic);
      // Also add synonyms for individual terms
      if (synonyms[topic]) {
        queries.push(...synonyms[topic]);
      }
    }
  }

  // Remove duplicates and empty strings
  return [...new Set(queries.filter(q => q.trim().length > 0))];
}

// Helper function to extract key search terms
function extractSearchTerms(query: string): string[] {
  // Common Norwegian stop words to filter out
  const stopWords = ['og', 'i', 'på', 'er', 'til', 'av', 'for', 'med', 'det', 'en', 'et', 'som', 'den', 'de', 'har', 'ikke', 'kan', 'skal', 'vil', 'å', 'om', 'fra', 'ved', 'var', 'blir', 'hvis', 'når', 'hvor', 'hvorfor', 'hvordan', 'hva', 'hvem'];
  
  const words = query.toLowerCase()
    .replace(/[^\wæøå\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word));
  
  return words;
}

async function fetchWebResults(query: string) {
  if (!SEARCH_API_KEY) {
    console.log('SEARCH_API_KEY not set, skipping web search');
    return [];
  }
  try {
    const url = `${SEARCH_API_URL}?q=${encodeURIComponent(query)}&count=3`;
    const res = await fetch(url, {
      headers: { 'Ocp-Apim-Subscription-Key': SEARCH_API_KEY }
    });
    if (!res.ok) {
      console.error('Web search error', await res.text());
      return [];
    }
    const data = await res.json();
    return data.webPages?.value?.map((item: WebSearchResult) => ({
      title: item.name,
      url: item.url,
      snippet: item.snippet
    })) ?? [];
  } catch (err) {
    console.error('Error performing web search:', err);
    return [];
  }
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

    // Create Supabase client with user token when provided, otherwise fall back
    // to service role for internal lookups
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SERVICE_ROLE_KEY')
    const authHeader = req.headers.get('Authorization')

    const supabaseClient = authHeader
      ? createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } })
      : createClient(supabaseUrl, serviceKey!)

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

    // Get weather data
    let weatherContext = "Værdata er for øyeblikket ikke tilgjengelig.";
    try {
      const weatherData = await fetchWeatherData();
      if (weatherData) {
        weatherContext = `
**Nåværende værforhold for ${weatherData.location}:**
- Temperatur: ${weatherData.current.temperature}°C
- Forhold: ${weatherData.current.condition}
- Fuktighet: ${weatherData.current.humidity}%
- Vind: ${weatherData.current.windSpeed} m/s fra ${weatherData.current.windDirection}
- Soloppgang: ${weatherData.sunrise ? new Date(weatherData.sunrise).toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }) : 'Ukjent'}
- Solnedgang: ${weatherData.sunset ? new Date(weatherData.sunset).toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }) : 'Ukjent'}

**Værprognose for de neste dagene:**
${weatherData.forecast.map(day => `
- **${day.day}** (${day.date}): ${day.temperature.min}°-${day.temperature.max}°C, ${day.condition}
  Nedbør: ${day.precipitation}mm, Vind: ${day.windSpeed} m/s
`).join('')}

*Værdata sist oppdatert: ${new Date(weatherData.lastUpdated).toLocaleString('no-NO')}*
        `.trim();
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
    }

    // Get the latest user message to search for relevant documents
    const latestUserMessage = history[history.length - 1];
    const userQuery = latestUserMessage?.content || '';

    // Optional web search for additional context
    let searchContext = '';
    try {
      const results = await fetchWebResults(userQuery);
      if (results.length > 0) {
        searchContext = `\n**Nettresultater:**\n${results.map(r => `- ${r.title} (${r.url})\n  ${r.snippet}`).join('\n')}`;
      }
    } catch (error) {
      console.error('Error fetching web results:', error);
    }

    // Enhanced document search with multiple strategies
    let documentContext = "Ingen relevante dokumenter funnet.";
    try {
      // Generate multiple search queries for better results
      const searchQueries = generateSearchQueries(userQuery, norskTid);
      let allRelevantDocs = [];

      // Search with each query
      for (const query of searchQueries) {
        const { data: docs, error: docsError } = await supabaseClient
          .rpc('search_cabin_documents', { search_query: query })
          .limit(5);

        if (!docsError && docs && docs.length > 0) {
          // Add unique documents to our collection
          for (const doc of docs) {
            if (!allRelevantDocs.find(d => d.id === doc.id)) {
              allRelevantDocs.push(doc);
            }
          }
        }
      }

      // If still no results, try broader searches with individual terms
      if (allRelevantDocs.length === 0) {
        // Try searching with just individual keywords
        const keywords = extractSearchTerms(userQuery);
        for (const keyword of keywords) {
          const { data: keywordDocs, error: keywordError } = await supabaseClient
            .from('cabin_documents')
            .select('*')
            .or(`title.ilike.%${keyword}%,content.ilike.%${keyword}%,summary.ilike.%${keyword}%,tags.cs.{${keyword}}`)
            .limit(3);

          if (!keywordError && keywordDocs) {
            for (const doc of keywordDocs) {
              if (!allRelevantDocs.find(d => d.id === doc.id)) {
                allRelevantDocs.push(doc);
              }
            }
          }
        }
      }

      // If still no results, try a more general search approach
      if (allRelevantDocs.length === 0) {
        const { data: generalDocs, error: generalError } = await supabaseClient
          .from('cabin_documents')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (!generalError && generalDocs) {
          // Filter by content relevance manually
          allRelevantDocs = generalDocs.filter(doc => {
            const searchTerms = extractSearchTerms(userQuery);
            const docText = `${doc.title} ${doc.category} ${doc.content || ''} ${doc.summary || ''} ${(doc.tags || []).join(' ')}`.toLowerCase();
            return searchTerms.some(term => docText.includes(term.toLowerCase()));
          });
        }
      }

      // Enrich documents with image descriptions
      for (const doc of allRelevantDocs) {
        const { data: images, error: imageError } = await supabaseClient
          .from('document_images')
          .select('description')
          .eq('document_id', doc.id)
          .not('description', 'is', null);

        if (!imageError && images && images.length > 0) {
          const imageDescriptions = images
            .filter(img => img.description)
            .map(img => img.description)
            .join('. ');
          
          if (imageDescriptions) {
            doc.image_descriptions = imageDescriptions;
          }
        }
      }

      if (allRelevantDocs.length > 0) {
        // Sort by relevance and take top 4
        const topDocs = allRelevantDocs.slice(0, 4);
        
        documentContext = `
**Relevante hytte-dokumenter:**
${topDocs.map(doc => {
  let docText = `**${doc.title}** (${doc.category})\n`;
  if (doc.summary) {
    docText += `Sammendrag: ${doc.summary}\n`;
  }
  if (doc.content) {
    // Limit content to first 2000 characters to avoid overwhelming the AI context
    const contentPreview = doc.content.length > 2000 
      ? doc.content.substring(0, 2000) + '...' 
      : doc.content;
    docText += `Innhold: ${contentPreview}\n`;
  }
  if (doc.image_descriptions) {
    docText += `Bildebeskrivelser: ${doc.image_descriptions}\n`;
  }
  if (doc.file_url) {
    docText += `[Se dokumentet](${doc.file_url})\n`;
  }
  return docText + '---';
}).join('\n')}
        `.trim();
      }
    } catch (error) {
      console.error('Error in document search:', error);
    }

    // Fetch comprehensive inventory data with images and family member info
    const { data: inventoryItems, error: inventoryError } = await supabaseClient
      .from('inventory_items')
      .select(`
        id,
        name,
        description,
        brand,
        color,
        location,
        shelf,
        size,
        owner,
        notes,
        category,
        subcategory,
        primary_location,
        created_at,
        family_member_id,
        item_images ( image_url ),
        family_members ( id, name, nickname )
      `)
      .order('created_at', { ascending: false })
      .limit(200);
      
    if (inventoryError) {
        console.error('Error fetching inventory for AI helper:', inventoryError);
    }

    // Categories and subcategories for AI context
    const categoryData = {
      'Klær': ['Skjørt', 'Kjole', 'Bukse', 'Shorts', 'Sokker', 'Undertøy', 'Topp', 'Genser', 'Jakke', 'Sko', 'Tilbehør'],
      'Sport': ['Langrennski', 'Langrennstaver', 'Alpint', 'Alpinstaver', 'Skisko', 'Bindinger', 'Hjelm', 'Briller', 'Hansker', 'Sportsbag', 'Annet sportsutstyr'],
      'Elektronikk': ['Telefon', 'Nettbrett', 'Laptop', 'Kamera', 'Høretelefoner', 'Ladere', 'Kabler', 'Annen elektronikk'],
      'Verktøy': ['Håndverktøy', 'Elektrisk verktøy', 'Måleverktøy', 'Hagearbeid', 'Annet verktøy'],
      'Bøker': ['Romaner', 'Fagbøker', 'Magasiner', 'Tegneserier', 'Annet lesestoff'],
      'Husstand': ['Kjøkkenutstyr', 'Rengjøring', 'Tekstiler', 'Dekorasjon', 'Annet husstand'],
      'Annet': []
    };

    let inventoryContext = "Inventarlisten er for øyeblikket ikke tilgjengelig.";
    if (inventoryItems && inventoryItems.length > 0) {
      // Group items by location for better organization
      const itemsByLocation = inventoryItems.reduce((acc, item) => {
        const location = item.primary_location || 'ukjent';
        if (!acc[location]) acc[location] = [];
        acc[location].push(item);
        return acc;
      }, {});

      inventoryContext = `
**Inventarliste (${inventoryItems.length} gjenstander):**

**Tilgjengelige kategorier og underkategorier:**
${Object.entries(categoryData).map(([cat, subcats]) => 
  `- ${cat}: ${subcats.join(', ')}`
).join('\n')}

**Inventar etter lokasjon:**
${Object.entries(itemsByLocation).map(([location, items]) => `
**${location.charAt(0).toUpperCase() + location.slice(1)} (${items.length} gjenstander):**
${items.map(item => {
  const owner = item.family_members?.name || item.owner || 'Ukjent';
  const subcategory = item.subcategory ? ` → ${item.subcategory}` : '';
  const images = item.item_images?.length > 0 ? ` [${item.item_images.length} bilde(r)]` : '';
  
  return `- **${item.name}**${images}
    Kategori: ${item.category || 'N/A'}${subcategory}
    Beskrivelse: ${item.description || 'N/A'}
    Merke: ${item.brand || 'N/A'} | Farge: ${item.color || 'N/A'} | Størrelse: ${item.size || 'N/A'}
    Plassering: ${item.location || 'N/A'}${item.shelf ? ` (${item.shelf})` : ''}
    Eier: ${owner}
    Notater: ${item.notes || 'N/A'}`;
}).join('\n')}
`).join('\n')}

**Inventar-søketips:** Du kan søke etter gjenstander basert på navn, kategori, merke, farge, størrelse, eier, eller notater.
      `.trim();
    }

    const systemPrompt = `
Du er "Hyttehjelperen", en intelligent og hjelpsom AI-assistent for Gaustablikk familiehytte.
Du har kunnskap om hytta, utstyr, håndteringer, værforhold og praktiske råd.
Vær alltid hyggelig, presis og bruk tilgjengelig informasjon effektivt.

**NÅVÆRENDE DATO OG TID:**
${norskTid} (Årstid: ${årstid}, Måned: ${månedsnavn})

${weatherContext}

${documentContext}

${inventoryContext}

${searchContext}

**SPESIALKUNNSKAP - Hytte på Gaustablikk:**
- **Lokasjon:** Vatnedalsvegen 27, Gaustablikk (1200 moh) - fantastisk utsikt mot Gaustatoppen
- **Rutiner:** 
  - Ankomst: Strøm/vann på → varmepumpe komfort → sjekk alt fungerer
  - Avreise: Varmepumpe økonomi → kraner lukket → vinduer/dører stengt → strøm av anneks
- **Sesongråd:** Tilpass aktiviteter og forberedelser til vær og årstid
- **Utstyr:** Bruk dokumenter og inventarliste for spesifikk informasjon

${image ? '**BILDEANALYSE:** Analyser bildet og gi relevant, praktisk hjelp basert på hva du ser.' : ''}

**SMART ASSISTANSEREGLER:**
1. **Konneksjoner:** Forstå sammenhenger mellom begreper (gressklipper = kantklipper, hageutstyr, etc.)
2. **Kontekst først:** Bruk ALLTID tilgjengelige dokumenter og inventar før generelle råd
3. **Værbaserte råd:** Kombiner nåværende vær med aktivitetsforslag og forberedelser
4. **Konkrete svar:** Gi spesifikke instruksjoner basert på faktisk tilgjengelig utstyr og informasjon
5. **Referanser:** Nevn eksplisitt hvor informasjonen kommer fra (dokumenter, inventar, etc.)

**INVENTAR-INTELLIGENS:**
6. **Klesforslag:** Kombiner værforhold med tilgjengelige klær i inventaret for praktiske anbefalinger
7. **Aktivitetsutstyr:** Koble aktiviteter med relevant utstyr fra inventaret (ski, sykler, fotballutstyr, etc.)
8. **Sesongtilpassning:** Foreslå sesongriktig utstyr basert på nåværende årstid og inventarliste
9. **Organisering:** Hjelp med å finne og organisere inventar basert på lokasjon (hjemme/hytta/reiser)
10. **Pakkelister:** Lag smarte pakkelister basert på aktiviteter og tilgjengelig inventar

**KRITISK REGEL:** Når du refererer til spesifikke inventargjenstander, bruk ALLTID dette formatet: [ITEM:{item_id}:{item_name}]
Eksempel: "Jeg anbefaler [ITEM:abc123:Rød vinterjakke] for dagens vær"

**FORBEDRET FORSTÅELSE:**
- "Gressklipper" inkluderer kantklippere, plenklipper, Ryobi-utstyr
- "Snømåking/snøfjerning" inkluderer snøfreser, snøskuffe, snøplog, vintermaskiner
- "Oppbevaring" = garasje, bod, lager, plassering av utstyr  
- "Vedlikehold" = service, reparasjon, skjøtsel av utstyr
- "Batteri/elektrisk" = lading, strøm, Ryobi-system
- "Vinter/snø" = snøutstyr, vintermaskiner, snørydding, frostbeskyttelse
- Tidsreferanser som "igår/nylig/sist" = søk bredere i dokumenter

**BILDEBESKRIVELSER:** Du har tilgang til AI-genererte beskrivelser av bilder i dokumentene som gir ytterligere kontekst og detaljer om utstyr, instruksjoner og forhold.

Analyser brukerens spørsmål grundig og gi det mest relevante, praktiske svaret basert på tilgjengelig informasjon.
    `;

    // Prepare messages with optional image
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map((msg: HistoryMessage) => {
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
