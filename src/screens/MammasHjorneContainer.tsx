import React from 'react';
import MammasHjorneScreen, {
  Event,
  WeatherSnapshot,
  HeartbeatPayload,
} from './MammasHjorneScreen';
import { supabase } from '@/integrations/supabase/client';
import { WEATHER_LAT, WEATHER_LON } from '@/config';

const MammasHjorneContainer: React.FC = () => {
  const fetchEvents = async (): Promise<Event[]> => {
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        body: { action: 'list_events', calendar: 'mamma', days: 2 },
      });
      if (error) throw error;
      return (data?.events ?? []) as Event[];
    } catch (err) {
      console.error('Failed to fetch events', err);
      return [];
    }
  };

  const fetchWeather = async (): Promise<WeatherSnapshot> => {
    const { data, error } = await supabase.functions.invoke('weather-proxy', {
      body: { lat: WEATHER_LAT, lon: WEATHER_LON, days: 1 },
    });
    if (error) throw error;
    return {
      updatedISO: data.lastUpdated,
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
      .channel('mammas-hjorne')
      .on('broadcast', { event: 'refresh' }, onChange)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  };

  const onHeartbeat = (payload: HeartbeatPayload) => {
    console.log('MammasHjorne heartbeat', payload);
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
