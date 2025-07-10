import { describe, it, expect, vi, beforeEach } from 'vitest';

let mod: any;

const importModule = async (env: Record<string, string | undefined> = {}, fetchMock?: any) => {
  (globalThis as any).Deno = { env: { get: (name: string) => env[name] } };
  if (fetchMock) {
    (globalThis as any).fetch = fetchMock;
  }
  vi.resetModules();
  mod = await import('../index.ts');
};

describe('ai-helper utilities', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('transformWeatherData returns formatted data', async () => {
    await importModule();
    const sample = {
      properties: {
        timeseries: [
          {
            time: '2024-01-01T00:00:00Z',
            data: {
              instant: {
                details: {
                  air_temperature: 10,
                  relative_humidity: 50,
                  wind_speed: 3,
                  wind_from_direction: 90,
                  air_pressure_at_sea_level: 1010,
                  wind_speed_of_gust: 5,
                  ultraviolet_index_clear_sky: 4,
                },
              },
              next_1_hours: {
                summary: { symbol_code: 'clearsky_day' },
                details: { precipitation_amount: 0 },
              },
            },
          },
        ],
      },
    } as any;
    const result = mod.transformWeatherData(sample, 1);
    expect(result.location).toBeDefined();
    expect(result.current.temperature).toBe(10);
    expect(result.forecast.length).toBe(1);
  });

  it('fetchWebResults returns empty array without API key', async () => {
    await importModule({});
    const results = await mod.fetchWebResults('test');
    expect(results).toEqual([]);
  });

  it('fetchWebResults handles request errors', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, text: () => Promise.resolve('err') });
    await importModule({ SEARCH_API_KEY: 'key', SEARCH_API_URL: 'http://x' }, fetchMock);
    const results = await mod.fetchWebResults('a');
    expect(fetchMock).toHaveBeenCalled();
    expect(results).toEqual([]);
  });
});
