
import { useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { fetchCalendarEvents, fetchCalendarList } from '@/services/googleCalendar.service';
import type { GoogleOAuthTokens, GoogleCalendarState } from '@/types/googleCalendar.types';

// Rate limiting and caching utilities
const RATE_LIMIT_DELAY = 2000; // 2 seconds between API calls
const CACHE_DURATION = 30000; // 30 seconds cache
const MAX_RETRIES = 3;
const INITIAL_BACKOFF = 1000; // 1 second

export function useGoogleEvents(
  getTokens: () => GoogleOAuthTokens | null,
  setState: React.Dispatch<React.SetStateAction<GoogleCalendarState>>,
  disconnectGoogleCalendar: () => void
) {
  const lastEventsFetchRef = useRef<number>(0);
  const lastCalendarsFetchRef = useRef<number>(0);
  const eventsCacheRef = useRef<{ data: any; timestamp: number } | null>(null);
  const calendarsCacheRef = useRef<{ data: any; timestamp: number } | null>(null);
  const retryCountRef = useRef<{ events: number; calendars: number }>({ events: 0, calendars: 0 });
  const isLoadingRef = useRef<{ events: boolean; calendars: boolean }>({ events: false, calendars: false });
  const fetchGoogleEvents = useCallback(async (tokensToUse?: GoogleOAuthTokens, forceRefresh = false) => {
    const tokens = tokensToUse || getTokens();
    
    if (!tokens || !tokens.access_token) {
      console.warn('No valid tokens available for fetching events');
      setState(prev => ({ ...prev, fetchError: 'Ingen gyldige tokens tilgjengelig' }));
      return;
    }

    // Prevent concurrent calls
    if (isLoadingRef.current.events && !forceRefresh) {
      console.log('Events fetch already in progress, skipping...');
      return;
    }

    // Rate limiting check
    const now = Date.now();
    const timeSinceLastFetch = now - lastEventsFetchRef.current;
    if (timeSinceLastFetch < RATE_LIMIT_DELAY && !forceRefresh) {
      console.log(`Rate limited: ${RATE_LIMIT_DELAY - timeSinceLastFetch}ms remaining`);
      return;
    }

    // Check cache first
    if (!forceRefresh && eventsCacheRef.current) {
      const cacheAge = now - eventsCacheRef.current.timestamp;
      if (cacheAge < CACHE_DURATION) {
        console.log('Using cached events data');
        setState(prev => ({ ...prev, googleEvents: eventsCacheRef.current?.data || [] }));
        return;
      }
    }

    isLoadingRef.current.events = true;
    lastEventsFetchRef.current = now;
    setState(prev => ({ ...prev, isLoadingEvents: true, fetchError: null, lastRefresh: new Date() }));

    const executeWithRetry = async (retryCount = 0): Promise<any> => {
      try {
        console.log('Fetching Google Calendar events with tokens:', {
          access_token_exists: !!tokens.access_token,
          refresh_token_exists: !!tokens.refresh_token,
          expiry_date: tokens.expiry_date,
          retryCount
        });
        
        const events = await fetchCalendarEvents(tokens);
        
        // Cache successful result
        eventsCacheRef.current = { data: events, timestamp: now };
        retryCountRef.current.events = 0;
        
        setState(prev => ({ ...prev, googleEvents: events }));
        return events;
      } catch (error: unknown) {
        const err = error as { message?: string };
        console.error(`Error fetching Google Calendar events (attempt ${retryCount + 1}):`, error);
        
        // Handle quota/rate limit errors with exponential backoff
        if (err.message?.includes('quotaExceeded') || 
            err.message?.includes('rateLimitExceeded') ||
            err.message?.includes('Quota exceeded')) {
          
          if (retryCount < MAX_RETRIES) {
            const backoffDelay = INITIAL_BACKOFF * Math.pow(2, retryCount);
            console.log(`Rate limit hit, retrying in ${backoffDelay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
            
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
            return executeWithRetry(retryCount + 1);
          } else {
            const errorMessage = 'Google Calendar API kvote overskredet. Prøv igjen om noen minutter.';
            toast.warning(errorMessage);
            setState(prev => ({ ...prev, fetchError: errorMessage }));
            return;
          }
        }
        
        // Handle authentication errors
        if (err.message?.includes('invalid_grant') ||
            err.message?.includes('invalid_token') ||
            err.message?.includes('utløpt') ||
            err.message?.includes('expired')) {
          console.log('Authentication error detected, disconnecting Google Calendar');
          disconnectGoogleCalendar();
          toast.error('Google Calendar-tilgangen er utløpt. Vennligst koble til på nytt.');
          return;
        }

        // Handle other errors
        if (!err.message?.includes('Edge Function') &&
            !err.message?.includes('Failed to fetch') &&
            !err.message?.includes('Kunne ikke koble til')) {
          toast.error('Kunne ikke hente Google Calendar-hendelser');
        }

        const errorMessage = err.message || 'Ukjent feil ved henting av hendelser';
        setState(prev => ({ ...prev, fetchError: errorMessage }));
        throw error;
      }
    };

    try {
      await executeWithRetry();
    } catch (error) {
      // Final error handling
      console.error('Final error in fetchGoogleEvents:', error);
    } finally {
      isLoadingRef.current.events = false;
      setState(prev => ({ ...prev, isLoadingEvents: false }));
    }
  }, [getTokens, setState, disconnectGoogleCalendar]);

  const fetchGoogleCalendars = useCallback(async (tokensToUse?: GoogleOAuthTokens, forceRefresh = false) => {
    const tokens = tokensToUse || getTokens();
    
    if (!tokens || !tokens.access_token) {
      console.warn('No valid tokens available for fetching calendars');
      return;
    }

    // Prevent concurrent calls
    if (isLoadingRef.current.calendars && !forceRefresh) {
      console.log('Calendars fetch already in progress, skipping...');
      return;
    }

    // Rate limiting check
    const now = Date.now();
    const timeSinceLastFetch = now - lastCalendarsFetchRef.current;
    if (timeSinceLastFetch < RATE_LIMIT_DELAY && !forceRefresh) {
      console.log(`Calendars rate limited: ${RATE_LIMIT_DELAY - timeSinceLastFetch}ms remaining`);
      return;
    }

    // Check cache first
    if (!forceRefresh && calendarsCacheRef.current) {
      const cacheAge = now - calendarsCacheRef.current.timestamp;
      if (cacheAge < CACHE_DURATION) {
        console.log('Using cached calendars data');
        setState(prev => ({ ...prev, googleCalendars: calendarsCacheRef.current?.data || [] }));
        return;
      }
    }

    isLoadingRef.current.calendars = true;
    lastCalendarsFetchRef.current = now;

    const executeWithRetry = async (retryCount = 0): Promise<any> => {
      try {
        console.log('Fetching Google Calendar list with tokens', { retryCount });
        const calendars = await fetchCalendarList(tokens);
        
        // Cache successful result
        calendarsCacheRef.current = { data: calendars, timestamp: now };
        retryCountRef.current.calendars = 0;
        
        setState(prev => ({ ...prev, googleCalendars: calendars }));
        return calendars;
      } catch (error: unknown) {
        const err = error as { message?: string };
        console.error(`Error fetching Google calendars (attempt ${retryCount + 1}):`, error);
        
        // Handle quota/rate limit errors with exponential backoff
        if (err.message?.includes('quotaExceeded') || 
            err.message?.includes('rateLimitExceeded') ||
            err.message?.includes('Quota exceeded')) {
          
          if (retryCount < MAX_RETRIES) {
            const backoffDelay = INITIAL_BACKOFF * Math.pow(2, retryCount);
            console.log(`Calendars rate limit hit, retrying in ${backoffDelay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
            
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
            return executeWithRetry(retryCount + 1);
          } else {
            toast.warning('Google Calendar API kvote overskredet for kalenderliste. Prøv igjen om noen minutter.');
            return;
          }
        }
        
        throw error;
      }
    };

    try {
      await executeWithRetry();
    } catch (error) {
      console.error('Final error in fetchGoogleCalendars:', error);
    } finally {
      isLoadingRef.current.calendars = false;
    }
  }, [getTokens, setState]);

  return {
    fetchGoogleEvents,
    fetchGoogleCalendars
  };
}
