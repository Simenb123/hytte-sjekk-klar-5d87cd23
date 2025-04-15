
import { useState, useEffect, useCallback } from 'react';
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
  htmlLink?: string;
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
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Load tokens from localStorage on component mount
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

  const fetchGoogleEvents = useCallback(async (tokensToUse = googleTokens) => {
    if (!tokensToUse) {
      console.warn('No tokens available for fetching events');
      return;
    }
    
    setIsLoadingEvents(true);
    setFetchError(null);
    setLastRefresh(new Date());

    try {
      console.log('Calling Google Calendar Edge Function to fetch events...');
      
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        method: 'POST',
        body: { 
          action: 'list_events',
          tokens: tokensToUse
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Edge function error: ${error.message}`);
      }
      
      if (data?.error) {
        console.error('Google Calendar API error:', data.error, data.details);
        
        // Check if we need to reauthenticate
        if (data.requiresReauth) {
          disconnectGoogleCalendar();
          throw new Error('Google Calendar-tilgangen har utløpt. Vennligst koble til på nytt.');
        }
        
        throw new Error(data.error);
      }
      
      if (data?.events) {
        console.log(`Successfully fetched ${data.events.length} events from Google Calendar`);
        setGoogleEvents(data.events);
        toast.success('Hentet Google Calendar-hendelser');
      } else {
        console.warn('No events returned from Google Calendar API');
        setGoogleEvents([]);
      }
    } catch (error: any) {
      console.error('Error fetching Google Calendar events:', error);
      toast.error('Kunne ikke hente Google Calendar-hendelser');
      setFetchError(`Kunne ikke hente hendelser: ${error.message}`);
      
      // Token might be expired, try to disconnect
      if (error.message?.includes('invalid_grant') || 
          error.message?.includes('invalid_token') ||
          error.message?.includes('utløpt') ||
          error.message?.includes('expired')) {
        disconnectGoogleCalendar();
        toast.error('Google Calendar-tilgangen er utløpt. Vennligst koble til på nytt.');
      }
    } finally {
      setIsLoadingEvents(false);
    }
  }, [googleTokens]);

  const fetchGoogleCalendars = useCallback(async (tokensToUse = googleTokens) => {
    if (!tokensToUse) return;
    
    try {
      console.log('Calling Google Calendar Edge Function to fetch calendars...');
      
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        method: 'POST',
        body: { 
          action: 'get_calendars',
          tokens: tokensToUse
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }
      
      if (data?.error) {
        console.error('Google Calendar API error:', data.error, data.details);
        throw new Error(data.error);
      }
      
      if (data?.calendars) {
        console.log(`Successfully fetched ${data.calendars.length} calendars from Google`);
        setGoogleCalendars(data.calendars);
      } else {
        console.warn('No calendars returned from Google Calendar API');
        setGoogleCalendars([]);
      }
    } catch (error) {
      console.error('Error fetching Google calendars:', error);
      // Not showing a toast here since it's not critical
    }
  }, [googleTokens]);

  const connectGoogleCalendar = useCallback(async () => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      console.log('Initiating Google Calendar connection...');
      toast.info('Kobler til Google Calendar...');
      
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        method: 'GET',
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }
      
      if (data?.error) {
        console.error('Google Calendar API error:', data.error);
        throw new Error(data.error);
      }
      
      if (data?.url) {
        console.log('Received Google authorization URL, redirecting...');
        // Store the current URL to return to after authentication
        sessionStorage.setItem('calendarReturnUrl', window.location.href);
        // Redirect to Google OAuth consent screen
        window.location.href = data.url;
      } else {
        throw new Error('Ingen autoriseringslenke mottatt fra serveren');
      }
    } catch (error: any) {
      console.error('Error connecting to Google Calendar:', error);
      toast.error('Kunne ikke koble til Google Calendar. Prøv igjen senere.');
      setConnectionError('Kunne ikke koble til Google Calendar. Prøv igjen senere.');
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting]);

  const disconnectGoogleCalendar = useCallback(() => {
    console.log('Disconnecting from Google Calendar...');
    localStorage.removeItem('googleCalendarTokens');
    setGoogleTokens(null);
    setIsGoogleConnected(false);
    setGoogleEvents([]);
    setConnectionError(null);
    setFetchError(null);
    toast.success('Koblet fra Google Calendar');
  }, []);

  const handleOAuthCallback = useCallback(async (code: string) => {
    setConnectionError(null);
    console.log('Processing OAuth callback...');
    toast.info('Behandler Google Calendar-tilkobling...');
    
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        method: 'POST',
        body: { code }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }
      
      if (data?.error) {
        console.error('Token exchange error:', data.error, data.details);
        throw new Error(data.error);
      }

      if (data?.tokens) {
        console.log('Successfully received tokens from Google:', 
                   `access_token exists: ${!!data.tokens.access_token},`, 
                   `refresh_token exists: ${!!data.tokens.refresh_token}`);
        
        localStorage.setItem('googleCalendarTokens', JSON.stringify(data.tokens));
        setGoogleTokens(data.tokens);
        setIsGoogleConnected(true);
        toast.success('Koblet til Google Calendar!');
        
        // Fetch events and calendars after connecting
        await fetchGoogleEvents(data.tokens);
        await fetchGoogleCalendars(data.tokens);
        return true;
      } else {
        throw new Error('Ingen tokens mottatt fra serveren');
      }
    } catch (error: any) {
      console.error('Error exchanging code for tokens:', error);
      toast.error('Kunne ikke fullføre Google Calendar-integrasjonen');
      setConnectionError('Kunne ikke fullføre Google Calendar-integrasjonen. Prøv igjen senere.');
    }
    return false;
  }, [fetchGoogleEvents, fetchGoogleCalendars]);

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
    connectionError,
    fetchError,
    lastRefresh
  };
}
