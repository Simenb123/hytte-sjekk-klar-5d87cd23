
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GoogleEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
}

interface GoogleCalendar {
  id: string;
  summary: string;
  primary?: boolean;
  description?: string;
  accessRole: string;
}

export function useGoogleCalendar() {
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [googleTokens, setGoogleTokens] = useState<any>(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [googleEvents, setGoogleEvents] = useState<GoogleEvent[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [googleCalendars, setGoogleCalendars] = useState<GoogleCalendar[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    const storedTokens = localStorage.getItem('googleCalendarTokens');
    if (storedTokens) {
      try {
        const tokens = JSON.parse(storedTokens);
        setGoogleTokens(tokens);
        setIsGoogleConnected(true);
        
        // If we have tokens, fetch events right away
        fetchGoogleEvents(tokens);
        fetchGoogleCalendars(tokens);
      } catch (e) {
        console.error('Error parsing stored tokens:', e);
        localStorage.removeItem('googleCalendarTokens');
        setConnectionError('Kunne ikke koble til Google Calendar. Vennligst prøv igjen.');
      }
    }
  }, []);

  const fetchGoogleEvents = async (tokensToUse = googleTokens) => {
    if (!tokensToUse) return;
    
    setIsLoadingEvents(true);
    setConnectionError(null);

    try {
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        method: 'POST',
        body: { 
          action: 'list_events',
          tokens: tokensToUse
        }
      });

      if (error) throw error;
      
      if (data?.error) {
        throw new Error(data.error);
      }
      
      if (data?.events) {
        setGoogleEvents(data.events);
        toast.success('Hentet Google Calendar-hendelser');
      }
    } catch (error: any) {
      console.error('Error fetching Google Calendar events:', error);
      toast.error('Kunne ikke hente Google Calendar-hendelser');
      setConnectionError('Kunne ikke hente hendelser. Vennligst prøv igjen senere.');
      
      // Token might be expired, try to disconnect
      if (error.message?.includes('invalid_grant') || 
          error.message?.includes('invalid_token') ||
          error.message?.includes('expired')) {
        disconnectGoogleCalendar();
        toast.error('Google Calendar-tilgangen er utløpt. Vennligst koble til på nytt.');
      }
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const fetchGoogleCalendars = async (tokensToUse = googleTokens) => {
    if (!tokensToUse) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        method: 'POST',
        body: { 
          action: 'get_calendars',
          tokens: tokensToUse
        }
      });

      if (error) throw error;
      
      if (data?.calendars) {
        setGoogleCalendars(data.calendars);
      }
    } catch (error) {
      console.error('Error fetching Google calendars:', error);
    }
  };

  const connectGoogleCalendar = async () => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        method: 'GET',
      });

      if (error) throw error;
      
      if (data?.error) {
        throw new Error(data.error);
      }
      
      if (data?.url) {
        sessionStorage.setItem('calendarReturnUrl', window.location.href);
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Error connecting to Google Calendar:', error);
      toast.error('Kunne ikke koble til Google Calendar. Prøv igjen senere.');
      setConnectionError('Kunne ikke koble til Google Calendar. Prøv igjen senere.');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectGoogleCalendar = () => {
    localStorage.removeItem('googleCalendarTokens');
    setGoogleTokens(null);
    setIsGoogleConnected(false);
    setGoogleEvents([]);
    setConnectionError(null);
    toast.success('Koblet fra Google Calendar');
  };

  const handleOAuthCallback = async (code: string) => {
    setConnectionError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        method: 'POST',
        body: { code }
      });

      if (error) throw error;
      
      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.tokens) {
        localStorage.setItem('googleCalendarTokens', JSON.stringify(data.tokens));
        setGoogleTokens(data.tokens);
        setIsGoogleConnected(true);
        toast.success('Koblet til Google Calendar!');
        
        // Fetch events and calendars after connecting
        await fetchGoogleEvents(data.tokens);
        await fetchGoogleCalendars(data.tokens);
        return true;
      }
    } catch (error: any) {
      console.error('Error exchanging code for tokens:', error);
      toast.error('Kunne ikke fullføre Google Calendar-integrasjonen');
      setConnectionError('Kunne ikke fullføre Google Calendar-integrasjonen. Prøv igjen senere.');
    }
    return false;
  };

  return {
    isGoogleConnected,
    googleTokens,
    isLoadingEvents,
    googleEvents,
    googleCalendars,
    fetchGoogleEvents,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    handleOAuthCallback,
    isConnecting,
    connectionError
  };
}
