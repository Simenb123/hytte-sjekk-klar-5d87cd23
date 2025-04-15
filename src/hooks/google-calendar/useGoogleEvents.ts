
import { useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { fetchCalendarEvents, fetchCalendarList } from '@/services/googleCalendar.service';

export function useGoogleEvents(setState: any, disconnectGoogleCalendar: () => void) {
  // Make sure the function signature clearly requires a tokens parameter
  const fetchGoogleEvents = useCallback(async (tokensToUse: any) => {
    if (!tokensToUse) {
      console.warn('No tokens available for fetching events');
      toast.error('Ingen tokens tilgjengelig for å hente hendelser');
      return;
    }
    
    setState(prev => ({ ...prev, isLoadingEvents: true, fetchError: null, lastRefresh: new Date() }));

    try {
      console.log('Fetching Google Calendar events with tokens:', {
        access_token_exists: !!tokensToUse.access_token,
        refresh_token_exists: !!tokensToUse.refresh_token,
        expiry_date: tokensToUse.expiry_date
      });
      
      const events = await fetchCalendarEvents(tokensToUse);
      setState(prev => ({ ...prev, googleEvents: events }));
    } catch (error: any) {
      console.error('Error fetching Google Calendar events:', error);
      toast.error('Kunne ikke hente Google Calendar-hendelser');
      
      const errorMessage = error.message || 'Ukjent feil ved henting av hendelser';
      setState(prev => ({ ...prev, fetchError: `Kunne ikke hente hendelser: ${errorMessage}` }));
      
      if (error.message?.includes('invalid_grant') || 
          error.message?.includes('invalid_token') ||
          error.message?.includes('utløpt') ||
          error.message?.includes('expired')) {
        console.log('Authentication error detected, disconnecting Google Calendar');
        disconnectGoogleCalendar();
        toast.error('Google Calendar-tilgangen er utløpt. Vennligst koble til på nytt.');
      }
    } finally {
      setState(prev => ({ ...prev, isLoadingEvents: false }));
    }
  }, [setState, disconnectGoogleCalendar]);

  const fetchGoogleCalendars = useCallback(async (tokensToUse: any) => {
    if (!tokensToUse) {
      console.warn('No tokens available for fetching calendars');
      return;
    }
    
    try {
      console.log('Fetching Google Calendar list with tokens');
      const calendars = await fetchCalendarList(tokensToUse);
      setState(prev => ({ ...prev, googleCalendars: calendars }));
    } catch (error) {
      console.error('Error fetching Google calendars:', error);
    }
  }, [setState]);

  return {
    fetchGoogleEvents,
    fetchGoogleCalendars
  };
}
