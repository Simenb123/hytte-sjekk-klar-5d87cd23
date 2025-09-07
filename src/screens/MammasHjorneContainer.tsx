import React from 'react';
import MammasHjorneScreen, {
  Event,
  WeatherSnapshot,
  HeartbeatPayload,
} from './MammasHjorneScreen';
import { supabase } from '@/integrations/supabase/client';
import { WEATHER_LAT, WEATHER_LON, LOCATION_NAME } from '@/config';
import { useGoogleCalendar } from '@/hooks/google-calendar';
import { useGoogleCalendarSync } from '@/hooks/useGoogleCalendarSync';


const MammasHjorneContainer: React.FC = () => {
  const { 
    googleEvents, 
    isGoogleConnected, 
    connectGoogleCalendar,
    fetchError,
    isLoadingEvents
  } = useGoogleCalendar();

  const {
    isLoading: isSyncing,
    lastSyncTime,
    error: syncError,
    manualRefresh,
    reconnect,
    performSync
  } = useGoogleCalendarSync();

  const fetchEvents = async (): Promise<Event[]> => {
    console.log('MammasHjorne fetchEvents called - State:', {
      isGoogleConnected,
      isLoadingEvents,
      googleEventsCount: googleEvents.length,
      fetchError
    });

    try {
      // If we're still loading events, wait a bit and return empty for now
      if (isLoadingEvents) {
        console.log('Google Calendar events still loading, returning empty array');
        return [];
      }

      // If connected and we have events, use them
      if (isGoogleConnected && googleEvents.length > 0) {
        console.log('Using Google Calendar events:', googleEvents.length);
        // Convert Google events to Event format with better debugging
        const convertedEvents = googleEvents.map(event => {
          console.log('Converting event:', event.summary, 'from calendar:', event.calendarSummary || 'primary');
          
          // Handle both timed and all-day events properly
          const startTime = event.start.dateTime || event.start.date;
          const endTime = event.end.dateTime || event.end.date;
          const isAllDay = event.allDay || !!event.start.date;
          
          if (!startTime || !endTime) {
            console.warn('Event missing start/end time:', event.summary, { start: event.start, end: event.end });
          }
          
          return {
            id: event.id,
            title: event.summary,
            start: startTime || new Date().toISOString(),
            end: endTime || new Date().toISOString(),
            location: event.location,
            attendees: undefined,
            allDay: isAllDay
          };
        });
        console.log('Converted events:', convertedEvents.length);
        return convertedEvents;
      }

      // If connected but no events, still return empty (not mock data)
      if (isGoogleConnected && googleEvents.length === 0) {
        console.log('Google Calendar connected but no events found');
        return [];
      }

      // Not connected - return empty array 
      console.log('Google Calendar not connected, returning empty array');
      return [];
    } catch (error) {
      console.error('Error fetching Google Calendar events:', error);
      return [];
    }
  };

  const fetchWeather = async (lat: number = WEATHER_LAT, lon: number = WEATHER_LON): Promise<WeatherSnapshot> => {
    console.log(`Fetching weather for coordinates: ${lat}, ${lon}`);
    const { data, error } = await supabase.functions.invoke('weather-proxy', {
      body: { lat, lon, days: 5 },
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
        humidity: data.current.humidity,
        windDirection: data.current.windDirection,
      },
      hourly: (data.hourly || []).map((h: any) => ({
        timeISO: h.timeISO,
        tempC: h.tempC,
        symbol: h.symbol,
        precipitation: h.precipitation,
        windSpeed: h.windSpeed,
      })),
      forecast: (data.forecast || []).map((day: any) => ({
        date: day.date,
        minTemp: day.temperature.min,
        maxTemp: day.temperature.max,
        symbol: day.icon,
        description: day.condition,
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
    <>
      <MammasHjorneScreen
        fetchEvents={fetchEvents}
        fetchWeather={fetchWeather}
        initRealtime={initRealtime}
        onHeartbeat={onHeartbeat}
        isGoogleConnected={isGoogleConnected}
        onConnectGoogle={connectGoogleCalendar}
        googleConnectionError={fetchError || syncError}
        onManualRefresh={manualRefresh}
        onReconnectGoogle={reconnect}
        isSyncing={isSyncing}
        lastSyncTime={lastSyncTime}
        performSync={performSync}
      />
    </>
  );
};

export default MammasHjorneContainer;