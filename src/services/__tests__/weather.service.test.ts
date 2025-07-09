import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WeatherService } from '../weather.service';
import type { LocationForecast } from '@/types/weather.types';
import { LOCATION_NAME } from '@/config';

const sampleForecast: LocationForecast = {
  properties: {
    timeseries: [
      {
        time: '2024-01-01T00:00:00Z',
        data: {
          instant: {
            details: {
              air_temperature: 10,
              relative_humidity: 80,
              wind_speed: 5,
              wind_from_direction: 90,
            },
          },
          next_1_hours: {
            summary: { symbol_code: 'clearsky_day' },
            details: { precipitation_amount: 0 },
          },
        },
      },
      {
        time: '2024-01-02T00:00:00Z',
        data: {
          instant: {
            details: {
              air_temperature: 11,
              relative_humidity: 70,
              wind_speed: 4,
              wind_from_direction: 180,
            },
          },
          next_1_hours: {
            summary: { symbol_code: 'rain' },
            details: { precipitation_amount: 1 },
          },
        },
      },
    ],
  },
};

// Include extra fields present in the `complete` dataset to ensure parsing works
const completeForecast = {
  properties: {
    timeseries: [
      {
        time: '2024-01-01T00:00:00Z',
        data: {
          instant: {
            details: {
              air_temperature: 10,
              relative_humidity: 80,
              wind_speed: 5,
              wind_from_direction: 90,
            },
          },
          next_1_hours: {
            summary: { symbol_code: 'clearsky_day' },
            details: { precipitation_amount: 0 },
          },
          next_6_hours: {
            summary: { symbol_code: 'clearsky_day' },
            details: { precipitation_amount: 0 },
          },
          next_12_hours: {
            summary: { symbol_code: 'clearsky_day' },
          },
        },
      },
      {
        time: '2024-01-02T00:00:00Z',
        data: {
          instant: {
            details: {
              air_temperature: 11,
              relative_humidity: 70,
              wind_speed: 4,
              wind_from_direction: 180,
            },
          },
          next_1_hours: {
            summary: { symbol_code: 'rain' },
            details: { precipitation_amount: 1 },
          },
          next_6_hours: {
            summary: { symbol_code: 'rain' },
            details: { precipitation_amount: 2 },
          },
          next_12_hours: {
            summary: { symbol_code: 'rain' },
          },
        },
      },
    ],
  },
} as unknown as LocationForecast;

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('WeatherService', () => {
  it('transforms weather data correctly', () => {
    const result = (WeatherService as any).transformWeatherData(sampleForecast, 2);
    expect(result.location).toBe(LOCATION_NAME);
    expect(result.forecast.length).toBe(2);
    expect(result.current).toMatchObject({
      temperature: 10,
      condition: 'Sol',
      humidity: 80,
      windSpeed: 5,
      windDirection: 'Ø',
      icon: 'clearsky_day',
    });
    expect(result.forecast[0]).toMatchObject({
      date: '2024-01-01',
      temperature: { min: 8, max: 12 },
      precipitation: 0,
      windSpeed: 5,
      condition: 'Sol',
      icon: 'clearsky_day',
    });
  });

  it('handles complete dataset structure', () => {
    const result = (WeatherService as any).transformWeatherData(completeForecast, 2);
    expect(result.current.temperature).toBe(10);
    expect(result.forecast.length).toBe(2);
  });

  it('caches results and uses cache with complete data', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(completeForecast) });
    vi.stubGlobal('fetch', fetchMock);

    const first = await WeatherService.getWeatherData(2, 1, 2);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const cached = localStorage.getItem('weatherData-1-2');
    expect(cached).not.toBeNull();

    const second = await WeatherService.getWeatherData(2, 1, 2);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
  });
});
