
import 'https://deno.land/x/xhr@0.1.0/mod.ts'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import OpenAI from 'npm:openai';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { LocationForecast } from '../../../src/types/weather.types';
import { weatherConditions } from '../../../src/shared/weatherConditions.ts';
import { corsHeaders } from '../common/cors.ts';

const WEATHER_LAT = parseFloat(Deno.env.get('WEATHER_LAT') ?? '59.8726')
const WEATHER_LON = parseFloat(Deno.env.get('WEATHER_LON') ?? '8.6475')
const WEATHER_DATASET = Deno.env.get('WEATHER_DATASET') ?? 'compact'
const LOCATION_NAME = Deno.env.get('LOCATION_NAME') ?? 'Gaustablikk, Tinn'
const CONTACT_EMAIL = Deno.env.get('CONTACT_EMAIL') ?? 'contact@gaustablikk.no'
const SEARCH_API_KEY = Deno.env.get('SEARCH_API_KEY')
const SEARCH_API_URL = Deno.env.get('SEARCH_API_URL') ?? 'https://api.bing.microsoft.com/v7.0/search'


interface WeatherData {
  location: string;
  current: {
    temperature: number;
    condition: string;
    humidity: number;
    windSpeed: number;
    windDirection: string;
    pressure?: number;
    windGust?: number;
    uvIndex?: number;
  };
  forecast: Array<{
    date: string;
    day: string;
    temperature: { min: number; max: number };
    condition: string;
    precipitation: number;
    windSpeed: number;
  }>;
  sunrise?: string;
  sunset?: string;
  lastUpdated: string;
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
    const YR_API_BASE = 'https://api.met.no/weatherapi/locationforecast/2.0/complete';


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

    return transformed;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
}

export function transformWeatherData(
  data: LocationForecast,
  maxDays = 5,
): WeatherData {
  const now = new Date();
  const currentData = data.properties.timeseries[0];
  
  // Get forecast for the next "maxDays" days
  const forecast = [];
  const seenDates = new Set();
  
  for (const item of data.properties.timeseries) {
    const itemDate = new Date(item.time);
    const dateStr = itemDate.toISOString().split('T')[0];
    
    if (seenDates.has(dateStr) || forecast.length >= maxDays) continue;
    
    seenDates.add(dateStr);
    forecast.push({
      date: dateStr,
      day: itemDate.toLocaleDateString('no-NO', { weekday: 'long' }),
      temperature: {
        min: Math.round(item.data.instant.details.air_temperature - 2),
        max: Math.round(item.data.instant.details.air_temperature + 2),
      },
      condition: getConditionFromSymbol(item.data?.next_1_hours?.summary?.symbol_code || 'clearsky_day'),
      precipitation: item.data?.next_1_hours?.details?.precipitation_amount || 0,
      windSpeed: Math.round(item.data.instant.details.wind_speed || 0),
    });
  }

  return {
    location: LOCATION_NAME,
    current: {
      temperature: Math.round(currentData.data.instant.details.air_temperature),
      condition: getConditionFromSymbol(currentData.data?.next_1_hours?.summary?.symbol_code || 'clearsky_day'),
      humidity: Math.round(currentData.data.instant.details.relative_humidity),
      windSpeed: Math.round(currentData.data.instant.details.wind_speed),
      windDirection: getWindDirection(currentData.data.instant.details.wind_from_direction),
      pressure: Math.round(currentData.data.instant.details.air_pressure_at_sea_level || 0),
      windGust: Math.round(currentData.data.instant.details.wind_speed_of_gust || 0),
      uvIndex: Math.round(currentData.data.instant.details.ultraviolet_index_clear_sky ?? 0),
    },
    forecast,
    sunrise: undefined,
    sunset: undefined,
    lastUpdated: now.toISOString(),
  };
}

export function getConditionFromSymbol(symbol: string): string {
  return weatherConditions[symbol] || 'Ukjent';
}

export function getWindDirection(degrees: number): string {
  const directions = ['N', 'NØ', 'Ø', 'SØ', 'S', 'SV', 'V', 'NV'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
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
    return data.webPages?.value?.map((item: any) => ({
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
${doc.summary || ''}${doc.file_url ? ` [Se dokumentet](${doc.file_url})` : ''}
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

export function getÅrstid(måned: number): string {
  if (måned >= 2 && måned <= 4) return 'Vår';
  if (måned >= 5 && måned <= 7) return 'Sommer';
  if (måned >= 8 && måned <= 10) return 'Høst';
  return 'Vinter';
}
