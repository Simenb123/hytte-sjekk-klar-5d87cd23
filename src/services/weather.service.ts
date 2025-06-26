
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
import {
  loadFromStorage,
  saveToStorage,
  removeFromStorage,
} from '@/utils/storage.utils';

export class WeatherService {
  private static readonly YR_API_BASE = 'https://api.met.no/weatherapi/locationforecast/2.0/compact';
  private static readonly CACHE_KEY = 'weatherData';
  private static readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  static clearCache() {
    if (typeof window !== 'undefined') {
      removeFromStorage(this.CACHE_KEY);
    }
  }
  static async getWeatherData(
    maxDays = 5,
    lat: number = WEATHER_LAT,
    lon: number = WEATHER_LON,
  ): Promise<WeatherData | null> {
    try {
      if (typeof window !== 'undefined') {
        const cached = loadFromStorage<WeatherData | null>(
          this.CACHE_KEY,
          null,
        );
        if (cached) {
          const age = Date.now() - new Date(cached.lastUpdated).getTime();
          if (age < this.CACHE_DURATION) {
            return cached;
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

      const data = await response.json();
      const transformed = this.transformWeatherData(data, maxDays);

      if (typeof window !== 'undefined') {
        saveToStorage(this.CACHE_KEY, transformed);
      }

      return transformed;
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return null;
    }
  }

  private static transformWeatherData(data: any, maxDays = 5): WeatherData {
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
      'partlycloudy_day': 'Delvis skyet',
      'partlycloudy_night': 'Delvis skyet natt',
      'cloudy': 'Overskyet',
      'rain': 'Regn',
      'lightrain': 'Lett regn',
      'heavyrain': 'Kraftig regn',
      'snow': 'Snø',
      'lightsnow': 'Lett snø',
      'heavysnow': 'Kraftig snø',
      'sleet': 'Sludd',
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
