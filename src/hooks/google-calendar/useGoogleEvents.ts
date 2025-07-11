
import { useCallback } from 'react';
import { toast } from 'sonner';
import { fetchCalendarEvents, fetchCalendarList } from '@/services/googleCalendar.service';
import type { GoogleOAuthTokens, GoogleCalendarState } from '@/types/googleCalendar.types';

export function useGoogleEvents(
  getTokens: () => GoogleOAuthTokens | null,
  setState: React.Dispatch<React.SetStateAction<GoogleCalendarState>>,
  disconnectGoogleCalendar: () => void
) {
  // Make sure the function signature clearly requires a tokens parameter
  const fetchGoogleEvents = useCallback(async (tokensToUse?: GoogleOAuthTokens) => {
    // Allow calling without tokens, but check internally if tokens are available
    const tokens = tokensToUse || getTokens();
    
    if (!tokens || !tokens.access_token) {
      console.warn('No valid tokens available for fetching events');
      setState(prev => ({ ...prev, fetchError: 'Ingen gyldige tokens tilgjengelig' }));
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
    } catch (error: unknown) {
      console.error('Error fetching Google Calendar events:', error);
      const err = error as { message?: string };
      
      // Don't show toast for network errors since we handle them in the UI
      if (!err.message?.includes('Edge Function') &&
          !err.message?.includes('Failed to fetch') &&
          !err.message?.includes('Kunne ikke koble til')) {
        toast.error('Kunne ikke hente Google Calendar-hendelser');
      }

      const errorMessage = err.message || 'Ukjent feil ved henting av hendelser';
      setState(prev => ({ ...prev, fetchError: errorMessage }));
      
      if (err.message?.includes('invalid_grant') ||
          err.message?.includes('invalid_token') ||
          err.message?.includes('utløpt') ||
          err.message?.includes('expired')) {
        console.log('Authentication error detected, disconnecting Google Calendar');
        disconnectGoogleCalendar();
        toast.error('Google Calendar-tilgangen er utløpt. Vennligst koble til på nytt.');
      }
    } finally {
      setState(prev => ({ ...prev, isLoadingEvents: false }));
    }
  }, [getTokens, setState, disconnectGoogleCalendar]);

  const fetchGoogleCalendars = useCallback(async (tokensToUse?: GoogleOAuthTokens) => {
    const tokens = tokensToUse || getTokens();
    
    if (!tokens || !tokens.access_token) {
      console.warn('No valid tokens available for fetching calendars');
      return;
    }
    
    try {
      console.log('Fetching Google Calendar list with tokens');
      const calendars = await fetchCalendarList(tokens);
      setState(prev => ({ ...prev, googleCalendars: calendars }));
    } catch (error: unknown) {
      console.error('Error fetching Google calendars:', error);
      // Don't show toast for network errors since we handle them in the UI
    }
  }, [getTokens, setState]);

  return {
    fetchGoogleEvents,
    fetchGoogleCalendars
  };
}
