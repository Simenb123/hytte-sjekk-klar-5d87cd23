import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../common/cors.ts';

interface WeatherData {
  location: string;
  current: {
    temperature: number;
    condition: string;
    humidity: number;
    windSpeed: number;
    windDirection: string;
    icon: string;
  };
  forecast: Array<{
    date: string;
    day: string;
    temperature: { min: number; max: number };
    condition: string;
    icon: string;
    precipitation: number;
    windSpeed: number;
  }>;
  lastUpdated: string;
}

const cache = new Map<string, { data: WeatherData; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const lat = url.searchParams.get('lat') || '59.9139';
    const lon = url.searchParams.get('lon') || '10.7522';
    const days = parseInt(url.searchParams.get('days') || '5');

    const cacheKey = `${lat}-${lon}-${days}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('Returning cached weather data');
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Fetching weather data for lat: ${lat}, lon: ${lon}`);
    
    const weatherUrl = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`;
    
    const response = await fetch(weatherUrl, {
      headers: {
        'User-Agent': 'hytteapp/1.0 (contact@example.com)',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Weather API error:', response.status, response.statusText);
      throw new Error(`Weather API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const transformedData = transformWeatherData(data, days, lat, lon);
    
    // Cache the result
    cache.set(cacheKey, { data: transformedData, timestamp: Date.now() });
    
    return new Response(JSON.stringify(transformedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in weather-proxy function:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch weather data', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function transformWeatherData(data: any, maxDays: number, lat: string, lon: string): WeatherData {
  const timeseries = data.properties.timeseries;
  const current = timeseries[0];
  
  // Group by date for forecast
  const forecastByDate = new Map();
  
  timeseries.forEach((entry: any) => {
    const date = new Date(entry.time);
    const dateKey = date.toISOString().split('T')[0];
    
    if (!forecastByDate.has(dateKey)) {
      forecastByDate.set(dateKey, {
        date: dateKey,
        temperatures: [],
        conditions: [],
        precipitations: [],
        windSpeeds: [],
        entries: []
      });
    }
    
    const dayData = forecastByDate.get(dateKey);
    dayData.temperatures.push(entry.data.instant.details.air_temperature);
    dayData.windSpeeds.push(entry.data.instant.details.wind_speed);
    dayData.entries.push(entry);
    
    if (entry.data.next_6_hours) {
      dayData.conditions.push(entry.data.next_6_hours.summary?.symbol_code || 'unknown');
      dayData.precipitations.push(entry.data.next_6_hours.details?.precipitation_amount || 0);
    }
  });

  const forecast = Array.from(forecastByDate.values())
    .slice(0, maxDays)
    .map((dayData: any) => {
      const date = new Date(dayData.date);
      const minTemp = Math.min(...dayData.temperatures);
      const maxTemp = Math.max(...dayData.temperatures);
      const avgPrecipitation = dayData.precipitations.length > 0 
        ? dayData.precipitations.reduce((a: number, b: number) => a + b, 0) / dayData.precipitations.length 
        : 0;
      const avgWindSpeed = dayData.windSpeeds.reduce((a: number, b: number) => a + b, 0) / dayData.windSpeeds.length;
      const condition = dayData.conditions[0] || 'unknown';

      return {
        date: dayData.date,
        day: date.toLocaleDateString('nb-NO', { weekday: 'long' }),
        temperature: { min: Math.round(minTemp), max: Math.round(maxTemp) },
        condition: getConditionFromSymbol(condition),
        icon: condition,
        precipitation: Math.round(avgPrecipitation * 10) / 10,
        windSpeed: Math.round(avgWindSpeed * 10) / 10,
      };
    });

  return {
    location: `${lat}, ${lon}`,
    current: {
      temperature: Math.round(current.data.instant.details.air_temperature),
      condition: getConditionFromSymbol(current.data.next_1_hours?.summary?.symbol_code || 'unknown'),
      humidity: Math.round(current.data.instant.details.relative_humidity),
      windSpeed: Math.round(current.data.instant.details.wind_speed * 10) / 10,
      windDirection: getWindDirection(current.data.instant.details.wind_from_direction),
      icon: current.data.next_1_hours?.summary?.symbol_code || 'unknown',
    },
    forecast,
    lastUpdated: new Date().toISOString(),
  };
}

function getConditionFromSymbol(symbol: string): string {
  const conditionMap: { [key: string]: string } = {
    'clearsky': 'Klarvær',
    'fair': 'Lettskyet',
    'partlycloudy': 'Delvis skyet',
    'cloudy': 'Skyet',
    'rainshowers': 'Regnbyger',
    'rainshowersandthunder': 'Regnbyger og torden',
    'sleetshowers': 'Sluddbyger',
    'snowshowers': 'Snøbyger',
    'rain': 'Regn',
    'heavyrain': 'Kraftig regn',
    'heavyrainandthunder': 'Kraftig regn og torden',
    'sleet': 'Sludd',
    'snow': 'Snø',
    'snowandthunder': 'Snø og torden',
    'fog': 'Tåke',
    'sleetshowersandthunder': 'Sluddbyger og torden',
    'snowshowersandthunder': 'Snøbyger og torden',
    'rainandthunder': 'Regn og torden',
    'sleetandthunder': 'Sludd og torden',
  };

  // Handle day/night variants
  const baseSymbol = symbol.replace(/_day|_night|_polartwilight/g, '');
  return conditionMap[baseSymbol] || 'Ukjent';
}

function getWindDirection(degrees: number): string {
  const directions = ['N', 'NØ', 'Ø', 'SØ', 'S', 'SV', 'V', 'NV'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}