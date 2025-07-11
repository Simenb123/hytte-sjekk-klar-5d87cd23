
export interface WeatherData {
  location: string;
  current: {
    temperature: number;
    condition: string;
    humidity: number;
    windSpeed: number;
    windDirection: string;
    airPressure?: number;
    cloudCover?: number;
    icon: string;
    pressure?: number;
    windGust?: number;
    uvIndex?: number;
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
    airPressure?: number;
    cloudCover?: number;
    windGust?: number;
  }>;
  sunrise?: string;
  sunset?: string;
  lastUpdated: string;
}

import { WEATHER_LAT, WEATHER_LON, LOCATION_NAME, CONTACT_EMAIL, YR_API_BASE } from '@/config';
import type { LocationForecast } from '@/types/weather.types';
import { weatherConditions } from '@/shared/weatherConditions';
import { fetchSunTimes } from './sunrise.util';

export class WeatherService {
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
        `${YR_API_BASE}?lat=${lat}&lon=${lon}`,
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

      const sunTimes = await fetchSunTimes(lat, lon);
      if (sunTimes) {
        transformed.sunrise = sunTimes.sunrise;
        transformed.sunset = sunTimes.sunset;
      }

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
        condition: WeatherService.getConditionFromSymbol(
          item.data?.next_1_hours?.summary?.symbol_code || 'clearsky_day',
        ),
        icon: item.data?.next_1_hours?.summary?.symbol_code || 'clearsky_day',
        precipitation: item.data?.next_1_hours?.details?.precipitation_amount || 0,
        windSpeed: Math.round(item.data.instant.details.wind_speed || 0),
        airPressure: item.data.instant.details.air_pressure_at_sea_level,
        cloudCover: item.data.instant.details.cloud_area_fraction,
        windGust: item.data.instant.details.wind_speed_of_gust,
      });
    }

    return {
      location: LOCATION_NAME,
      current: {
        temperature: Math.round(currentData.data.instant.details.air_temperature),
        condition: WeatherService.getConditionFromSymbol(
          currentData.data?.next_1_hours?.summary?.symbol_code || 'clearsky_day',
        ),
        humidity: Math.round(currentData.data.instant.details.relative_humidity),
        windSpeed: Math.round(currentData.data.instant.details.wind_speed),
        windDirection: WeatherService.getWindDirection(
          currentData.data.instant.details.wind_from_direction,
        ),
        airPressure: currentData.data.instant.details.air_pressure_at_sea_level,
        cloudCover: currentData.data.instant.details.cloud_area_fraction,
        icon: currentData.data?.next_1_hours?.summary?.symbol_code || 'clearsky_day',
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

  private static getConditionFromSymbol(symbol: string): string {
    return weatherConditions[symbol] || 'Ukjent';
  }

  private static getWindDirection(degrees: number): string {
    const directions = ['N', 'NØ', 'Ø', 'SØ', 'S', 'SV', 'V', 'NV'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  }
}
