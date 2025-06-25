
import { useState, useEffect } from 'react';
import { WeatherData, WeatherService } from '@/services/weather.service';

export function useWeather() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await WeatherService.getWeatherData();
      setWeatherData(data);
    } catch (err: any) {
      console.error('Error fetching weather:', err);
      setError('Kunne ikke hente værdata');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    
    // Oppdater værdata hver 30. minutt
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    weatherData,
    loading,
    error,
    refresh: async () => {
      WeatherService.clearCache();
      await fetchWeather();
    },
  };
}
