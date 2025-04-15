
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { GoogleCalendarState } from '@/types/googleCalendar.types';
import { 
  fetchCalendarEvents, 
  fetchCalendarList, 
  handleOAuthCallback as processOAuthCallback 
} from '@/services/googleCalendar.service';
import { supabase } from '@/integrations/supabase/client';

const initialState: GoogleCalendarState = {
  isGoogleConnected: false,
  googleTokens: null,
  isLoadingEvents: false,
  googleEvents: [],
  isConnecting: false,
  googleCalendars: [],
  connectionError: null,
  fetchError: null,
  lastRefresh: null,
};

export function useGoogleCalendar() {
  const [state, setState] = useState<GoogleCalendarState>(initialState);

  // Load tokens from localStorage on component mount
  useEffect(() => {
    console.log('Loading Google Calendar tokens from localStorage');
    const storedTokens = localStorage.getItem('googleCalendarTokens');
    if (storedTokens) {
      try {
        const tokens = JSON.parse(storedTokens);
        console.log('Found stored tokens, access_token exists:', !!tokens.access_token);
        setState(prev => ({
          ...prev,
          googleTokens: tokens,
          isGoogleConnected: true
        }));
        
        // If we have tokens, fetch events right away
        fetchGoogleEvents(tokens);
        fetchGoogleCalendars(tokens);
      } catch (e) {
        console.error('Error parsing stored tokens:', e);
        localStorage.removeItem('googleCalendarTokens');
        setState(prev => ({
          ...prev,
          connectionError: 'Kunne ikke koble til Google Calendar. Vennligst prøv igjen.'
        }));
      }
    } else {
      console.log('No Google Calendar tokens found in localStorage');
    }
  }, []);

  const fetchGoogleEvents = useCallback(async (tokensToUse = state.googleTokens) => {
    if (!tokensToUse) {
      console.warn('No tokens available for fetching events');
      return;
    }
    
    setState(prev => ({ ...prev, isLoadingEvents: true, fetchError: null, lastRefresh: new Date() }));

    try {
      const events = await fetchCalendarEvents(tokensToUse);
      setState(prev => ({ ...prev, googleEvents: events }));
    } catch (error: any) {
      console.error('Error fetching Google Calendar events:', error);
      toast.error('Kunne ikke hente Google Calendar-hendelser');
      setState(prev => ({ ...prev, fetchError: `Kunne ikke hente hendelser: ${error.message}` }));
      
      if (error.message?.includes('invalid_grant') || 
          error.message?.includes('invalid_token') ||
          error.message?.includes('utløpt') ||
          error.message?.includes('expired')) {
        disconnectGoogleCalendar();
        toast.error('Google Calendar-tilgangen er utløpt. Vennligst koble til på nytt.');
      }
    } finally {
      setState(prev => ({ ...prev, isLoadingEvents: false }));
    }
  }, [state.googleTokens]);

  const fetchGoogleCalendars = useCallback(async (tokensToUse = state.googleTokens) => {
    if (!tokensToUse) return;
    
    try {
      const calendars = await fetchCalendarList(tokensToUse);
      setState(prev => ({ ...prev, googleCalendars: calendars }));
    } catch (error) {
      console.error('Error fetching Google calendars:', error);
    }
  }, [state.googleTokens]);

  const connectGoogleCalendar = useCallback(async () => {
    if (state.isConnecting) return;
    
    setState(prev => ({ ...prev, isConnecting: true, connectionError: null }));
    
    try {
      console.log('Initiating Google Calendar connection...');
      toast.info('Kobler til Google Calendar...');
      
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        method: 'GET',
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      if (data?.url) {
        console.log('Received Google authorization URL, redirecting...', data.url);
        sessionStorage.setItem('calendarReturnUrl', window.location.href);
        window.location.href = data.url;
      } else {
        throw new Error('Ingen autoriseringslenke mottatt fra serveren');
      }
    } catch (error: any) {
      console.error('Error connecting to Google Calendar:', error);
      toast.error('Kunne ikke koble til Google Calendar. Prøv igjen senere.');
      setState(prev => ({
        ...prev,
        connectionError: 'Kunne ikke koble til Google Calendar. Prøv igjen senere.'
      }));
    } finally {
      setState(prev => ({ ...prev, isConnecting: false }));
    }
  }, [state.isConnecting]);

  const disconnectGoogleCalendar = useCallback(() => {
    console.log('Disconnecting from Google Calendar...');
    localStorage.removeItem('googleCalendarTokens');
    setState({
      ...initialState,
      googleTokens: null,
      isGoogleConnected: false,
      googleEvents: [],
      connectionError: null,
      fetchError: null
    });
    toast.success('Koblet fra Google Calendar');
  }, []);

  const handleOAuthCallback = useCallback(async (code: string) => {
    setState(prev => ({ ...prev, connectionError: null }));
    
    try {
      const tokens = await processOAuthCallback(code);
      localStorage.setItem('googleCalendarTokens', JSON.stringify(tokens));
      setState(prev => ({
        ...prev,
        googleTokens: tokens,
        isGoogleConnected: true
      }));
      toast.success('Koblet til Google Calendar!');
      
      // Fetch events and calendars after connecting
      await fetchGoogleEvents(tokens);
      await fetchGoogleCalendars(tokens);
      return true;
    } catch (error: any) {
      console.error('Error exchanging code for tokens:', error);
      toast.error('Kunne ikke fullføre Google Calendar-integrasjonen');
      setState(prev => ({
        ...prev,
        connectionError: 'Kunne ikke fullføre Google Calendar-integrasjonen. Prøv igjen senere.'
      }));
    }
    return false;
  }, [fetchGoogleEvents, fetchGoogleCalendars]);

  return {
    ...state,
    fetchGoogleEvents,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    handleOAuthCallback,
  };
}
