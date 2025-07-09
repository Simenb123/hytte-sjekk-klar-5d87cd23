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
              air_pressure_at_sea_level: 1000,
              cloud_area_fraction: 50,
              wind_speed_of_gust: 7,
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
              air_pressure_at_sea_level: 1005,
              cloud_area_fraction: 60,
              wind_speed_of_gust: 6,
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

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('WeatherService', () => {
  it('transforms weather data correctly', () => {
    const result = (WeatherService as any).transformWeatherData(sampleForecast, 1);
    expect(result.location).toBe(LOCATION_NAME);
    expect(result.forecast.length).toBe(1);
    expect(result.current.temperature).toBe(10);
  });

  it('caches results and uses cache', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(sampleForecast) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ location: { time: [{ sunrise: { time: '2024-01-01T08:00:00Z' }, sunset: { time: '2024-01-01T16:00:00Z' } }] } }) });
    vi.stubGlobal('fetch', fetchMock);

    const first = await WeatherService.getWeatherData(1, 1, 2);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const second = await WeatherService.getWeatherData(1, 1, 2);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(second).toEqual(first);
  });
});
