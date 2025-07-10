import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWeather } from '../useWeather';

const getWeatherDataMock = vi.fn();
const clearCacheMock = vi.fn();

vi.mock('@/services/weather.service', () => ({
  WeatherService: {
    getWeatherData: getWeatherDataMock,
    clearCache: clearCacheMock,
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const client = new QueryClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useWeather', () => {
  it('fetches weather on mount', async () => {
    const data = { current: { temperature: 1 }, forecast: [], lastUpdated: new Date().toISOString(), location: 'loc' };
    getWeatherDataMock.mockResolvedValueOnce(data);

    const { result } = renderHook(() => useWeather(), { wrapper });
    await waitFor(() => result.current.weatherData !== null);
    expect(result.current.weatherData).toEqual(data);
    expect(result.current.error).toBeNull();
  });

  it('handles errors', async () => {
    getWeatherDataMock.mockRejectedValueOnce(new Error('fail'));

    const { result } = renderHook(() => useWeather(), { wrapper });
    await waitFor(() => result.current.error !== null);
    expect(result.current.error).toBe('Kunne ikke hente værdata');
  });

  it('refresh clears cache and refetches', async () => {
    const first = { current: { temperature: 1 }, forecast: [], lastUpdated: new Date().toISOString(), location: 'loc' };
    const second = { current: { temperature: 2 }, forecast: [], lastUpdated: new Date().toISOString(), location: 'loc' };
    getWeatherDataMock.mockResolvedValueOnce(first).mockResolvedValueOnce(second);

    const { result } = renderHook(() => useWeather(), { wrapper });
    await waitFor(() => result.current.weatherData !== null);

    await result.current.refresh();
    await waitFor(() => result.current.weatherData?.current.temperature === 2);

    expect(clearCacheMock).toHaveBeenCalled();
    expect(getWeatherDataMock).toHaveBeenCalledTimes(2);
    expect(result.current.weatherData).toEqual(second);
  });
});
