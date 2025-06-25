import { describe, it, expect, vi, afterEach } from 'vitest';
import { WeatherService } from '../weather.service';

const sampleApiResponse = {
  properties: {
    timeseries: [
      {
        time: '2024-06-01T00:00:00Z',
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
            summary: { symbol_code: 'partlycloudy_day' },
            details: { precipitation_amount: 0.5 },
          },
        },
      },
      {
        time: '2024-06-01T06:00:00Z',
        data: {
          instant: {
            details: {
              air_temperature: 12,
              relative_humidity: 70,
              wind_speed: 4,
              wind_from_direction: 100,
            },
          },
          next_1_hours: {
            summary: { symbol_code: 'clearsky_day' },
            details: { precipitation_amount: 0 },
          },
        },
      },
      {
        time: '2024-06-02T00:00:00Z',
        data: {
          instant: {
            details: {
              air_temperature: 8,
              relative_humidity: 90,
              wind_speed: 3,
              wind_from_direction: 180,
            },
          },
          next_1_hours: {
            summary: { symbol_code: 'rain' },
            details: { precipitation_amount: 2 },
          },
        },
      },
    ],
  },
};

const transform = (WeatherService as any).transformWeatherData.bind(WeatherService);

afterEach(() => {
  vi.restoreAllMocks();
  (WeatherService as any).cache = null;
});

describe('transformWeatherData', () => {
  it('converts YR API response correctly', () => {
    const result = transform(sampleApiResponse);

    expect(result.location).toBe('Gaustablikk, Tinn');
    expect(result.current.temperature).toBe(10);
    expect(result.current.condition).toBe('Delvis skyet');
    expect(result.current.humidity).toBe(80);
    expect(result.current.windSpeed).toBe(5);
    expect(result.current.windDirection).toBe('Ø');
    expect(result.forecast.length).toBe(2);
    expect(result.forecast[0].temperature.min).toBe(8);
    expect(result.forecast[0].temperature.max).toBe(12);
  });
});

describe('getWeatherData', () => {
  it('returns null when fetch fails', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('fail'));
    const data = await WeatherService.getWeatherData();
    expect(data).toBeNull();
  });

  it('caches data between calls', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(sampleApiResponse),
    });
    global.fetch = fetchMock as any;

    const first = await WeatherService.getWeatherData();
    const second = await WeatherService.getWeatherData();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first).toEqual(second);
  });
});
