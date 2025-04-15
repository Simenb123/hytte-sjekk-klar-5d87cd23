
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

export function useGoogleCalendar() {
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [googleTokens, setGoogleTokens] = useState<any>(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [googleEvents, setGoogleEvents] = useState<GoogleEvent[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const storedTokens = localStorage.getItem('googleCalendarTokens');
    if (storedTokens) {
      try {
        const tokens = JSON.parse(storedTokens);
        setGoogleTokens(tokens);
        setIsGoogleConnected(true);
      } catch (e) {
        localStorage.removeItem('googleCalendarTokens');
      }
    }
  }, []);

  const fetchGoogleEvents = async () => {
    if (!googleTokens) return;
    
    setIsLoadingEvents(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        method: 'POST',
        body: { 
          action: 'list_events',
          tokens: googleTokens
        }
      });

      if (error) throw error;
      
      if (data?.events) {
        setGoogleEvents(data.events);
        toast.success('Hentet Google Calendar-hendelser');
      }
    } catch (error) {
      console.error('Error fetching Google Calendar events:', error);
      toast.error('Kunne ikke hente Google Calendar-hendelser');
      
      // Token might be expired, try to disconnect
      if (error.message?.includes('invalid_grant')) {
        disconnectGoogleCalendar();
        toast.error('Google Calendar-tilgangen er utløpt. Vennligst koble til på nytt.');
      }
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const connectGoogleCalendar = async () => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        method: 'GET',
      });

      if (error) throw error;
      
      if (data?.url) {
        sessionStorage.setItem('calendarReturnUrl', window.location.href);
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
      toast.error('Kunne ikke koble til Google Calendar. Prøv igjen senere.');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectGoogleCalendar = () => {
    localStorage.removeItem('googleCalendarTokens');
    setGoogleTokens(null);
    setIsGoogleConnected(false);
    setGoogleEvents([]);
    toast.success('Koblet fra Google Calendar');
  };

  const handleOAuthCallback = async (code: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        method: 'POST',
        body: { code }
      });

      if (error) throw error;

      if (data?.tokens) {
        localStorage.setItem('googleCalendarTokens', JSON.stringify(data.tokens));
        setGoogleTokens(data.tokens);
        setIsGoogleConnected(true);
        toast.success('Koblet til Google Calendar!');
        return true;
      }
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      toast.error('Kunne ikke fullføre Google Calendar-integrasjonen');
    }
    return false;
  };

  return {
    isGoogleConnected,
    googleTokens,
    isLoadingEvents,
    googleEvents,
    fetchGoogleEvents,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    handleOAuthCallback,
    isConnecting
  };
}
