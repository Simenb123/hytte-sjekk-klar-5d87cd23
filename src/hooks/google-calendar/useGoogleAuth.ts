
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
      const tokens = await processOAuthCallback(code);
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
      toast.error('Kunne ikke fullføre Google Calendar-integrasjonen');
      setState(prev => ({
        ...prev,
        connectionError: 'Kunne ikke fullføre Google Calendar-integrasjonen. Prøv igjen senere.'
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
