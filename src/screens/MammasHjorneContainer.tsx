import React from 'react';
import MammasHjorneScreen, {
  Event,
  WeatherSnapshot,
  HeartbeatPayload,
} from './MammasHjorneScreen';
import { supabase } from '@/integrations/supabase/client';
import { WEATHER_LAT, WEATHER_LON, LOCATION_NAME } from '@/config';

const MammasHjorneContainer: React.FC = () => {
  // Temporarily disabled Google Calendar to fix build issues
  const fetchEvents = async (): Promise<Event[]> => {
    console.log('Events temporarily disabled - returning empty array');
    return [];
  };

  const fetchWeather = async (lat: number = WEATHER_LAT, lon: number = WEATHER_LON): Promise<WeatherSnapshot> => {
    console.log(`Fetching weather for coordinates: ${lat}, ${lon}`);
    const { data, error } = await supabase.functions.invoke('weather-proxy', {
      body: { lat, lon, days: 1 },
    });
    if (error) {
      console.error('Weather fetch error:', error);
      throw error;
    }
    
    console.log('Weather data received:', data);
    
    return {
      updatedISO: data.lastUpdated,
      locationName: data.location || LOCATION_NAME,
      now: {
        tempC: data.current.temperature,
        symbol: data.current.icon,
        windMs: data.current.windSpeed,
      },
      hourly: (data.forecast || []).slice(0, 6).map((h: any) => ({
        timeISO: h.date,
        tempC: (h.temperature.min + h.temperature.max) / 2,
        symbol: h.icon,
      })),
    };
  };

  const initRealtime = (onChange: () => void) => {
    const channel = supabase
      .channel('mammas-hjorne-new')
      .on('broadcast', { event: 'refresh' }, onChange)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  };

  const onHeartbeat = (payload: HeartbeatPayload) => {
    console.log('MammasHjorne heartbeat (new)', payload);
  };

  return (
    <MammasHjorneScreen
      fetchEvents={fetchEvents}
      fetchWeather={fetchWeather}
      initRealtime={initRealtime}
      onHeartbeat={onHeartbeat}
    />
  );
};

export default MammasHjorneContainer;