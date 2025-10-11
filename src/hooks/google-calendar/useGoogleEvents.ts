
import { useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { fetchCalendarEvents, fetchCalendarList } from '@/services/googleCalendar.service';
import { googleCalendarCache } from '@/utils/googleCalendarCache';
import type { GoogleOAuthTokens, GoogleCalendarState } from '@/types/googleCalendar.types';

// Rate limiting and caching utilities
const RATE_LIMIT_DELAY = 5000; // 5 seconds between API calls (reduced frequency)
const MAX_RETRIES = 3;
const INITIAL_BACKOFF = 1000; // 1 second

export function useGoogleEvents(
  getTokens: () => GoogleOAuthTokens | null,
  setState: React.Dispatch<React.SetStateAction<GoogleCalendarState>>,
  disconnectGoogleCalendar: () => void,
  userId: string | undefined
) {
  const lastEventsFetchRef = useRef<number>(0);
  const lastCalendarsFetchRef = useRef<number>(0);
  const retryCountRef = useRef<{ events: number; calendars: number }>({ events: 0, calendars: 0 });
  const isLoadingRef = useRef<{ events: boolean; calendars: boolean }>({ events: false, calendars: false });
  const fetchGoogleEvents = useCallback(async (tokensToUse?: GoogleOAuthTokens, forceRefresh = false) => {
    const tokens = tokensToUse || getTokens();
    
    if (!tokens || !tokens.access_token) {
      console.warn('No valid tokens available for fetching events');
      
      // Try to use cached events as fallback
      const cachedEvents = googleCalendarCache.getEvents();
      if (cachedEvents && cachedEvents.length > 0) {
        console.log('🔄 Using cached events as fallback (no tokens)');
        setState(prev => ({ 
          ...prev, 
          googleEvents: cachedEvents,
          fetchError: 'Offline mode: Using cached events. Reconnect for latest data.' 
        }));
        return;
      }
      
      setState(prev => ({ ...prev, fetchError: 'Ingen gyldige tokens tilgjengelig' }));
      return;
    }

    // Check cache first - use it if valid
    if (!forceRefresh && googleCalendarCache.isValid()) {
      const cachedEvents = googleCalendarCache.getEvents();
      if (cachedEvents && cachedEvents.length > 0) {
        setState(prev => ({ 
          ...prev, 
          googleEvents: cachedEvents,
          isLoadingEvents: false,
          fetchError: null
        }));
        return;
      }
    }

    // Stale-while-revalidate: show stale data immediately while fetching
    const staleEvents = googleCalendarCache.getStaleEvents();
    if (!forceRefresh && staleEvents && staleEvents.length > 0) {
      setState(prev => ({
        ...prev,
        googleEvents: staleEvents,
        isLoadingEvents: true,
        fetchError: null
      }));
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
      const cachedEvents = googleCalendarCache.getEvents();
      if (cachedEvents && cachedEvents.length > 0) {
        setState(prev => ({ 
          ...prev, 
          googleEvents: cachedEvents,
          fetchError: null
        }));
      }
      return;
    }

    isLoadingRef.current.events = true;
    lastEventsFetchRef.current = now;
    setState(prev => ({ ...prev, isLoadingEvents: true, fetchError: null, lastRefresh: new Date() }));

    const executeWithRetry = async (retryCount = 0): Promise<any> => {
      try {
        const events = await fetchCalendarEvents(tokens, userId);
        
        // Cache successful result
        googleCalendarCache.storeEvents(events);
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
            
            const cachedEvents = googleCalendarCache.getEvents();
            if (cachedEvents && cachedEvents.length > 0) {
              setState(prev => ({ 
                ...prev, 
                googleEvents: cachedEvents,
                fetchError: null
              }));
            }
            
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
            return executeWithRetry(retryCount + 1);
          } else {
            const errorMessage = 'Google Calendar API kvote overskredet. Prøv igjen om noen minutter.';
            
            const cachedEvents = googleCalendarCache.getEvents();
            if (cachedEvents && cachedEvents.length > 0) {
              setState(prev => ({ 
                ...prev, 
                googleEvents: cachedEvents,
                fetchError: null
              }));
            } else {
              toast.warning(errorMessage);
              setState(prev => ({ ...prev, fetchError: errorMessage }));
            }
            return;
          }
        }
        
        // Handle authentication errors
        if (err.message?.includes('invalid_grant') ||
            err.message?.includes('invalid_token') ||
            err.message?.includes('utløpt') ||
            err.message?.includes('expired') ||
            err.message?.includes('requiresReauth') ||
            err.message?.includes('Authentication failed')) {
          
          const cachedEvents = googleCalendarCache.getEvents();
          if (cachedEvents && cachedEvents.length > 0) {
            setState(prev => ({ 
              ...prev, 
              googleEvents: cachedEvents,
              fetchError: null
            }));
          }
          
          disconnectGoogleCalendar();
          toast.error('Google Calendar-tilgangen er utløpt. Vennligst koble til på nytt.');
          return;
        }

        // Handle other errors - use cache as fallback
        const cachedEvents = googleCalendarCache.getEvents();
        if (cachedEvents && cachedEvents.length > 0) {
          setState(prev => ({ 
            ...prev, 
            googleEvents: cachedEvents,
            fetchError: null
          }));
          return;
        }

        // No cache available
        if (!err.message?.includes('Edge Function') &&
            !err.message?.includes('Failed to fetch')) {
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
      const cachedEvents = googleCalendarCache.getEvents();
      if (cachedEvents && cachedEvents.length > 0) {
        setState(prev => ({ 
          ...prev, 
          googleEvents: cachedEvents,
          fetchError: null
        }));
      }
    } finally {
      isLoadingRef.current.events = false;
      setState(prev => ({ ...prev, isLoadingEvents: false }));
    }
  }, [getTokens, setState, disconnectGoogleCalendar, userId]);

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


    isLoadingRef.current.calendars = true;
    lastCalendarsFetchRef.current = now;

    const executeWithRetry = async (retryCount = 0): Promise<any> => {
      try {
        const calendars = await fetchCalendarList(tokens, userId);
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
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
            return executeWithRetry(retryCount + 1);
          }
          return;
        }
        
        throw error;
      }
    };

    try {
      await executeWithRetry();
    } finally {
      isLoadingRef.current.calendars = false;
    }
  }, [getTokens, setState, userId]);

  return {
    fetchGoogleEvents,
    fetchGoogleCalendars
  };
}
