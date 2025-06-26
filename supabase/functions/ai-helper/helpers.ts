export interface WeatherData {
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

import type { LocationForecast } from './types.ts';

const WEATHER_LAT = parseFloat(Deno.env.get('WEATHER_LAT') ?? '59.8726');
const WEATHER_LON = parseFloat(Deno.env.get('WEATHER_LON') ?? '8.6475');
const LOCATION_NAME = Deno.env.get('LOCATION_NAME') ?? 'Gaustablikk, Tinn';
const CONTACT_EMAIL = Deno.env.get('CONTACT_EMAIL') ?? 'contact@gaustablikk.no';

export async function getWeatherContext(): Promise<string> {
  let weatherContext = 'V\u00e6rdata er for \u00f8yeblikket ikke tilgjengelig.';
  try {
    const weatherData = await fetchWeatherData();
    if (weatherData) {
      weatherContext = `
**N\u00e5v\u00e6rende v\u00e6rforhold for ${weatherData.location}:**
- Temperatur: ${weatherData.current.temperature}\u00b0C
- Forhold: ${weatherData.current.condition}
- Fuktighet: ${weatherData.current.humidity}%
- Vind: ${weatherData.current.windSpeed} m/s fra ${weatherData.current.windDirection}

**V\u00e6rprognose for de neste dagene:**
${weatherData.forecast.map(day => `
- **${day.day}** (${day.date}): ${day.temperature.min}\u00b0-${day.temperature.max}\u00b0C, ${day.condition}
  Nedb\u00f8r: ${day.precipitation}mm, Vind: ${day.windSpeed} m/s
`).join('')}

*V\u00e6rdata sist oppdatert: ${new Date(weatherData.lastUpdated).toLocaleString('no-NO')}*
      `.trim();
    }
  } catch (error) {
    console.error('Error fetching weather data:', error);
  }
  return weatherContext;
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
      },
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
  const forecast = [] as WeatherData['forecast'];
  const seenDates = new Set<string>();

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
    'snow': 'Sn\u00f8',
    'lightsnowshowers_day': 'Lette sn\u00f8byger',
    'lightsnowshowers_night': 'Lette sn\u00f8byger natt',
    'snowshowers_day': 'Sn\u00f8byger',
    'snowshowers_night': 'Sn\u00f8byger natt',
    'heavysnowshowers_day': 'Kraftige sn\u00f8byger',
    'heavysnowshowers_night': 'Kraftige sn\u00f8byger natt',
    'lightsnow': 'Lett sn\u00f8',
    'lightsnowandthunder': 'Lett sn\u00f8 og torden',
    'heavysnow': 'Kraftig sn\u00f8',
    'heavysnowandthunder': 'Kraftig sn\u00f8 og torden',
    'sleet': 'Sludd',
    'sleetshowers_day': 'Sluddbyger',
    'sleetshowers_night': 'Sluddbyger natt',
    'lightsleetshowers_day': 'Lette sluddbyger',
    'lightsleetshowers_night': 'Lette sluddbyger natt',
    'heavysleetshowers_day': 'Kraftige sluddbyger',
    'heavysleetshowers_night': 'Kraftige sluddbyger natt',
    'fog': 'T\u00e5ke',
  };
  return conditionMap[symbol] || 'Ukjent';
}

function getWindDirection(degrees: number): string {
  const directions = ['N', 'N\u00d8', '\u00d8', 'S\u00d8', 'S', 'SV', 'V', 'NV'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

export async function searchDocuments(client: any, query: string): Promise<string> {
  let documentContext = 'Ingen relevante dokumenter funnet.';
  try {
    const { data: relevantDocs, error } = await client
      .rpc('search_cabin_documents', { search_query: query })
      .limit(3);
    if (error) {
      console.error('Error searching cabin documents:', error);
    } else if (relevantDocs && relevantDocs.length > 0) {
      documentContext = `
**Relevante hytte-dokumenter:**
${relevantDocs.map((doc: any) => `
**${doc.title}** (${doc.category})
${doc.summary || ''}${doc.file_url ? ` [Se dokumentet](${doc.file_url})` : ''}
---
`).join('')}
      `.trim();
    }
  } catch (err) {
    console.error('Error in document search:', err);
  }
  return documentContext;
}

export async function fetchInventory(client: any): Promise<string> {
  let inventoryContext = 'Inventarlisten er for \u00f8yeblikket ikke tilgjengelig.';
  const { data: inventoryItems, error } = await client
    .from('inventory_items')
    .select('name, description, brand, color, size, location, shelf, owner, notes, category');
  if (error) {
    console.error('Error fetching inventory for AI helper:', error);
  }
  if (inventoryItems && inventoryItems.length > 0) {
    inventoryContext = `
**Inventarliste:**
${inventoryItems.map((item: any) => `
- **${item.name || 'N/A'}**
  Beskrivelse: ${item.description || 'N/A'}
  Kategori: ${item.category || 'N/A'}
  Merke: ${item.brand || 'N/A'}
  Farge: ${item.color || 'N/A'}
  St\u00f8rrelse: ${item.size || 'N/A'}
  Plassering: ${item.location || 'N/A'}${item.shelf ? ` (Hylle/Skuff: ${item.shelf})` : ''}
  Eier: ${item.owner || 'N/A'}
  Notater: ${item.notes || 'N/A'}
`).join('')}
    `.trim();
  }
  return inventoryContext;
}

export function prepareMessages(systemPrompt: string, history: any[], image?: string): any[] {
  return [
    { role: 'system', content: systemPrompt },
    ...history.map((msg: any, idx: number) => {
      if (msg.role === 'user' && image && idx === history.length - 1) {
        return {
          role: 'user',
          content: [
            { type: 'text', text: msg.content },
            { type: 'image_url', image_url: { url: image } },
          ],
        };
      }
      return msg;
    }),
  ];
}
