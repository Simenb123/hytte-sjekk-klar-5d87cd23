import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchSunTimes } from '../sunrise.util';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('fetchSunTimes', () => {
  it('returns sunrise and sunset on success', async () => {
    const sample = {
      location: {
        time: [
          {
            sunrise: { time: '2024-01-01T07:00:00Z' },
            sunset: { time: '2024-01-01T16:00:00Z' },
          },
        ],
      },
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(sample),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchSunTimes(1, 2, '2024-01-01');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      sunrise: '2024-01-01T07:00:00Z',
      sunset: '2024-01-01T16:00:00Z',
    });
  });

  it('returns null when response is not ok', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    vi.stubGlobal('fetch', fetchMock);
    const result = await fetchSunTimes(1, 2, '2024-01-01');
    expect(result).toBeNull();
  });

  it('returns null when times are missing', async () => {
    const sample = { location: { time: [{}] } };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(sample),
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = await fetchSunTimes(1, 2, '2024-01-01');
    expect(result).toBeNull();
  });
});
