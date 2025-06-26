
import { WEATHER_LAT, WEATHER_LON, LOCATION_NAME, CONTACT_EMAIL } from '@/config';
import {
  WeatherData,
  transformWeatherData,
} from '@/lib/weather-utils';
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
      const transformed = transformWeatherData(data, maxDays, LOCATION_NAME);

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

  // Legacy private methods removed in favor of shared utilities
}
