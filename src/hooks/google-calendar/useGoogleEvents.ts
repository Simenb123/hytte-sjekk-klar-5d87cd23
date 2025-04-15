
import { useCallback } from 'react';
import { toast } from 'sonner';
import { fetchCalendarEvents, fetchCalendarList } from '@/services/googleCalendar.service';

export function useGoogleEvents(setState: any, disconnectGoogleCalendar: () => void) {
  // Make sure the function signature clearly requires a tokens parameter
  const fetchGoogleEvents = useCallback(async (tokensToUse?: any) => {
    // Allow calling without tokens, but check internally if tokens are available
    const tokens = tokensToUse || setState(prev => prev.googleTokens);
    
    if (!tokens || !tokens.access_token) {
      console.warn('No valid tokens available for fetching events');
      toast.error('Ingen gyldige tokens tilgjengelig for å hente hendelser');
      return;
    }
    
    setState(prev => ({ ...prev, isLoadingEvents: true, fetchError: null, lastRefresh: new Date() }));

    try {
      console.log('Fetching Google Calendar events with tokens:', {
        access_token_exists: !!tokens.access_token,
        refresh_token_exists: !!tokens.refresh_token,
        expiry_date: tokens.expiry_date
      });
      
      const events = await fetchCalendarEvents(tokens);
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

  const fetchGoogleCalendars = useCallback(async (tokensToUse?: any) => {
    const tokens = tokensToUse || setState(prev => prev.googleTokens);
    
    if (!tokens || !tokens.access_token) {
      console.warn('No valid tokens available for fetching calendars');
      return;
    }
    
    try {
      console.log('Fetching Google Calendar list with tokens');
      const calendars = await fetchCalendarList(tokens);
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
