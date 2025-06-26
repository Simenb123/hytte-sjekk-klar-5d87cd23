
import { WEATHER_LAT, WEATHER_LON, LOCATION_NAME, CONTACT_EMAIL } from '@/config';
import {
  WeatherData,
  transformWeatherData,
} from '@/lib/weather-utils';

export class WeatherService {
  private static readonly YR_API_BASE = 'https://api.met.no/weatherapi/locationforecast/2.0/compact';
  private static readonly CACHE_KEY = 'weatherData';
  private static readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  static clearCache() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.CACHE_KEY);
    }
  }

  static async getWeatherData(
    maxDays = 5,
    lat: number = WEATHER_LAT,
    lon: number = WEATHER_LON,
  ): Promise<WeatherData | null> {
    try {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(this.CACHE_KEY);
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

      const data = await response.json();
      const transformed = transformWeatherData(data, maxDays, LOCATION_NAME);

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(this.CACHE_KEY, JSON.stringify(transformed));
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
