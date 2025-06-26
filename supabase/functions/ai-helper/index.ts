
import 'https://deno.land/x/xhr@0.1.0/mod.ts'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import OpenAI from 'npm:openai';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { LocationForecast } from './types.ts';

const WEATHER_LAT = parseFloat(Deno.env.get('WEATHER_LAT') ?? '59.8726')
const WEATHER_LON = parseFloat(Deno.env.get('WEATHER_LON') ?? '8.6475')
const LOCATION_NAME = Deno.env.get('LOCATION_NAME') ?? 'Gaustablikk, Tinn'
const CONTACT_EMAIL = Deno.env.get('CONTACT_EMAIL') ?? 'contact@gaustablikk.no'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WeatherData {
  location: string;
  current: {
    temperature: number;
    condition: string;
    humidity: number;
    windSpeed: number;
    windDirection: string;
  };
  forecast: Array<{
    date: string;
    day: string;
    temperature: { min: number; max: number };
    condition: string;
    precipitation: number;
    windSpeed: number;
  }>;
  lastUpdated: string;
}

async function fetchWeatherData(): Promise<WeatherData | null> {
  try {
    const YR_API_BASE = 'https://api.met.no/weatherapi/locationforecast/2.0/compact';

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
    return transformWeatherData(data);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
}

function transformWeatherData(data: LocationForecast, maxDays = 5): WeatherData {
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
    },
    forecast,
    lastUpdated: now.toISOString(),
  };
}

function getConditionFromSymbol(symbol: string): string {
  const conditionMap: Record<string, string> = {
    'clearsky_day': 'Sol',
    'clearsky_night': 'Klar natt',
    'fair_day': 'Lettskyet',
    'fair_night': 'Lettskyet natt',
    'partlycloudy_day': 'Delvis skyet',
    'partlycloudy_night': 'Delvis skyet natt',
    'cloudy': 'Overskyet',
    'rain': 'Regn',
    'lightrainshowers_day': 'Lette regnbyger',
    'lightrainshowers_night': 'Lette regnbyger natt',
    'rainshowers_day': 'Regnbyger',
    'rainshowers_night': 'Regnbyger natt',
    'heavyrainshowers_day': 'Kraftige regnbyger',
    'heavyrainshowers_night': 'Kraftige regnbyger natt',
    'lightrain': 'Lett regn',
    'lightrainandthunder': 'Lett regn og torden',
    'heavyrain': 'Kraftig regn',
    'heavyrainandthunder': 'Kraftig regn og torden',
    'snow': 'Snø',
    'lightsnowshowers_day': 'Lette snøbyger',
    'lightsnowshowers_night': 'Lette snøbyger natt',
    'snowshowers_day': 'Snøbyger',
    'snowshowers_night': 'Snøbyger natt',
    'heavysnowshowers_day': 'Kraftige snøbyger',
    'heavysnowshowers_night': 'Kraftige snøbyger natt',
    'lightsnow': 'Lett snø',
    'lightsnowandthunder': 'Lett snø og torden',
    'heavysnow': 'Kraftig snø',
    'heavysnowandthunder': 'Kraftig snø og torden',
    'sleet': 'Sludd',
    'sleetshowers_day': 'Sluddbyger',
    'sleetshowers_night': 'Sluddbyger natt',
    'lightsleetshowers_day': 'Lette sluddbyger',
    'lightsleetshowers_night': 'Lette sluddbyger natt',
    'heavysleetshowers_day': 'Kraftige sluddbyger',
    'heavysleetshowers_night': 'Kraftige sluddbyger natt',
    'fog': 'Tåke',
  };
  
  return conditionMap[symbol] || 'Ukjent';
}

function getWindDirection(degrees: number): string {
  const directions = ['N', 'NØ', 'Ø', 'SØ', 'S', 'SV', 'V', 'NV'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
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

function getÅrstid(måned: number): string {
  if (måned >= 2 && måned <= 4) return 'Vår';
  if (måned >= 5 && måned <= 7) return 'Sommer';
  if (måned >= 8 && måned <= 10) return 'Høst';
  return 'Vinter';
}
