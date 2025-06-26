
export interface WeatherData {
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
    temperature: {
      min: number;
      max: number;
    };
    condition: string;
    icon: string;
    precipitation: number;
    windSpeed: number;
  }>;
  lastUpdated: string;
}

import { WEATHER_LAT, WEATHER_LON, LOCATION_NAME, CONTACT_EMAIL } from '@/config';
import type { LocationForecast } from '@/types/weather.types';

export class WeatherService {
  private static readonly YR_API_BASE = 'https://api.met.no/weatherapi/locationforecast/2.0/compact';
  private static readonly CACHE_KEY_PREFIX = 'weatherData';
  private static readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  private static getCacheKey(lat: number, lon: number): string {
    return `${this.CACHE_KEY_PREFIX}-${lat}-${lon}`;
  }

  static clearCache(lat: number = WEATHER_LAT, lon: number = WEATHER_LON) {
    if (typeof window !== 'undefined') {
      const key = this.getCacheKey(lat, lon);
      localStorage.removeItem(key);
    }
  }

  static async getWeatherData(
    maxDays = 5,
    lat: number = WEATHER_LAT,
    lon: number = WEATHER_LON,
  ): Promise<WeatherData | null> {
    try {
      const cacheKey = this.getCacheKey(lat, lon);

      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const parsed: WeatherData = JSON.parse(cached);
            const age = Date.now() - new Date(parsed.lastUpdated).getTime();
            if (age < this.CACHE_DURATION) {
              return parsed;
            }
          } catch (e) {
            console.warn('[WeatherService] Failed to parse cached data', e);
          }
        }
      }

      const response = await fetch(
        `${this.YR_API_BASE}?lat=${lat}&lon=${lon}`,
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
      const transformed = this.transformWeatherData(data, maxDays);

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(cacheKey, JSON.stringify(transformed));
        } catch (e) {
          console.warn('[WeatherService] Failed to cache weather data', e);
        }
      }

      return transformed;
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return null;
    }
  }

  private static transformWeatherData(data: LocationForecast, maxDays = 5): WeatherData {
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
        condition: this.getConditionFromSymbol(item.data?.next_1_hours?.summary?.symbol_code || 'clearsky_day'),
        icon: item.data?.next_1_hours?.summary?.symbol_code || 'clearsky_day',
        precipitation: item.data?.next_1_hours?.details?.precipitation_amount || 0,
        windSpeed: Math.round(item.data.instant.details.wind_speed || 0),
      });
    }

    return {
      location: LOCATION_NAME,
      current: {
        temperature: Math.round(currentData.data.instant.details.air_temperature),
        condition: this.getConditionFromSymbol(currentData.data?.next_1_hours?.summary?.symbol_code || 'clearsky_day'),
        humidity: Math.round(currentData.data.instant.details.relative_humidity),
        windSpeed: Math.round(currentData.data.instant.details.wind_speed),
        windDirection: this.getWindDirection(currentData.data.instant.details.wind_from_direction),
        icon: currentData.data?.next_1_hours?.summary?.symbol_code || 'clearsky_day',
      },
      forecast,
      lastUpdated: now.toISOString(),
    };
  }

  private static getConditionFromSymbol(symbol: string): string {
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

  private static getWindDirection(degrees: number): string {
    const directions = ['N', 'NØ', 'Ø', 'SØ', 'S', 'SV', 'V', 'NV'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  }
}
