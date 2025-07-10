import { describe, it, expect } from 'vitest';
import { transformWeatherData, getWindDirection, getConditionFromSymbol, getÅrstid } from '../index';
import type { LocationForecast } from '@/types/weather.types';

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
              air_pressure_at_sea_level: 1012,
              wind_speed_of_gust: 7,
              ultraviolet_index_clear_sky: 3,
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
              air_pressure_at_sea_level: 1010,
              wind_speed_of_gust: 6,
              ultraviolet_index_clear_sky: 4,
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

describe('ai-helper helpers', () => {
  it('transforms weather data', () => {
    const result = transformWeatherData(sampleForecast, 2);
    expect(result.location).toBe('Gaustablikk, Tinn');
    expect(result.forecast.length).toBe(2);
    expect(result.current.temperature).toBe(10);
    expect(result.current.condition).toBe('Sol');
    expect(result.current.windDirection).toBe('Ø');
  });

  it('maps wind directions correctly', () => {
    expect(getWindDirection(0)).toBe('N');
    expect(getWindDirection(90)).toBe('Ø');
    expect(getWindDirection(180)).toBe('S');
    expect(getWindDirection(270)).toBe('V');
  });

  it('maps weather symbols', () => {
    expect(getConditionFromSymbol('rain')).toBe('Regn');
    expect(getConditionFromSymbol('unknown')).toBe('Ukjent');
  });

  it('returns correct season', () => {
    expect(getÅrstid(0)).toBe('Vinter');
    expect(getÅrstid(3)).toBe('Vår');
    expect(getÅrstid(6)).toBe('Sommer');
    expect(getÅrstid(9)).toBe('Høst');
  });
});
