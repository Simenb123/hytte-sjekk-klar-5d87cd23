
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
            const docText = `${doc.title} ${doc.category} ${doc.content || ''} ${doc.summary || ''}`.toLowerCase();
            return searchTerms.some(term => docText.includes(term.toLowerCase()));
          });
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
Din kunnskap er basert på informasjon om hytta, dens omgivelser, generelle hytterutiner, inventarliste, værdata og interne dokumenter/manualer.
Vær alltid hyggelig, konsis og hjelpsom.

**NÅVÆRENDE DATO OG TID:**
${norskTid}
Årstid: ${årstid}
Måned: ${månedsnavn}

${weatherContext}

${documentContext}

${inventoryContext}

${searchContext}

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

**VIKTIG OM TIDSREFERANSER:**
- Når brukere sier "i går", "igår", "nylig", "sist" eller liknende, forstå at de refererer til nylige hendelser eller dokumenter.
- Hvis du ikke finner spesifikke resultater for tidsbaserte søk, utvid søket til å inkludere relaterte emner.
- Dokumentene kan inneholde relevant informasjon selv om de ikke er datert til spesifikke dager.
- Prioriter nyere dokumenter (basert på created_at) når brukere spør om nylige ting.

**SØKESTRATEGI:**
- Hvis første søk ikke gir resultater, prøv alternative søkeord og bredere emner.
- For dokumentspørsmål, se alltid gjennom alle tilgjengelige dokumenter hvis spesifikk søk feiler.
- Kombiner informasjon fra flere kilder (dokumenter, vær, inventar) for fullstendige svar.

Når du svarer, hold deg til din rolle som hyttehjelper. Hvis du ikke vet svaret, si det og foreslå hvor brukeren kan finne informasjonen.
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
