
import { useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { handleOAuthCallback as processOAuthCallback } from '@/services/googleCalendar.service';

export function useGoogleAuth(setState: any) {
  const connectGoogleCalendar = useCallback(async () => {
    setState(prev => ({ ...prev, isConnecting: true, connectionError: null }));
    
    try {
      console.log('Initiating Google Calendar connection...');
      toast.info('Kobler til Google Calendar...');
      
      // Add explicit timeout for debugging purposes
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out after 10s')), 10000);
      });
      
      const fetchPromise = supabase.functions.invoke('google-calendar', {
        method: 'GET',
      });
      
      // Race between fetch and timeout
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }
      if (data?.error) {
        console.error('Google API error:', data.error);
        throw new Error(data.error);
      }
      
      if (data?.url) {
        console.log('Received Google authorization URL, redirecting...', data.url);
        sessionStorage.setItem('calendarReturnUrl', window.location.href);
        window.location.href = data.url;
      } else {
        throw new Error('Ingen autoriseringslenke mottatt fra serveren');
      }
    } catch (error: any) {
      console.error('Error connecting to Google Calendar:', error);
      
      // More detailed error reporting
      let errorMessage = 'Kunne ikke koble til Google Calendar.';
      
      if (error.message?.includes('timeout')) {
        errorMessage = 'Forespørselen tok for lang tid. Sjekk nettverkstilkoblingen din.';
      } else if (error.name === 'FunctionsFetchError') {
        errorMessage = 'Kunne ikke nå Edge Function. Sjekk at Supabase-funksjonen er aktiv.';
        
        // Check if it's a deeper error with context
        if (error.context?.name === 'TypeError' && error.context?.message === 'Failed to fetch') {
          errorMessage = 'Nettverksfeil ved tilkobling til Edge Function. Sjekk at alle miljøvariabler er riktig satt opp.';
        }
      }
      
      toast.error(errorMessage);
      setState(prev => ({
        ...prev,
        connectionError: errorMessage + ' Prøv igjen senere.' 
      }));
    } finally {
      setState(prev => ({ ...prev, isConnecting: false }));
    }
  }, [setState]);

  const disconnectGoogleCalendar = useCallback(() => {
    console.log('Disconnecting from Google Calendar...');
    localStorage.removeItem('googleCalendarTokens');
    setState(prev => ({
      ...prev,
      googleTokens: null,
      isGoogleConnected: false,
      googleEvents: [],
      connectionError: null,
      fetchError: null
    }));
    toast.success('Koblet fra Google Calendar');
  }, [setState]);

  const handleOAuthCallback = useCallback(async (code: string) => {
    setState(prev => ({ ...prev, connectionError: null }));
    
    try {
      console.log('Processing OAuth callback with code:', code.substring(0, 10) + '...');
      const tokens = await processOAuthCallback(code);
      
      if (!tokens) {
        throw new Error('Ingen tokens mottatt fra serveren');
      }
      
      localStorage.setItem('googleCalendarTokens', JSON.stringify(tokens));
      setState(prev => ({
        ...prev,
        googleTokens: tokens,
        isGoogleConnected: true
      }));
      toast.success('Koblet til Google Calendar!');
      return true;
    } catch (error: any) {
      console.error('Error exchanging code for tokens:', error);
      const errorMessage = error.message || 'Kunne ikke fullføre Google Calendar-integrasjonen';
      toast.error(errorMessage);
      setState(prev => ({
        ...prev,
        connectionError: errorMessage + '. Prøv igjen senere.'
      }));
    }
    return false;
  }, [setState]);

  return {
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    handleOAuthCallback
  };
}
