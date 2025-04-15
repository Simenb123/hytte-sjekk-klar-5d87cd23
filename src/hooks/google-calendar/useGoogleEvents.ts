
import { useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { fetchCalendarEvents, fetchCalendarList } from '@/services/googleCalendar.service';

export function useGoogleEvents(setState: any, disconnectGoogleCalendar: () => void) {
  const fetchGoogleEvents = useCallback(async (tokensToUse: any) => {
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
  }, [setState, disconnectGoogleCalendar]);

  const fetchGoogleCalendars = useCallback(async (tokensToUse: any) => {
    if (!tokensToUse) return;
    
    try {
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
