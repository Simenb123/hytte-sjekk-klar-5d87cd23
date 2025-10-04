
import { useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { fetchCalendarEvents, fetchCalendarList } from '@/services/googleCalendar.service';
import { googleCalendarCache } from '@/utils/googleCalendarCache';
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

    // Stale-while-revalidate: Check if we have fresh cached data
    if (!forceRefresh && googleCalendarCache.isValid()) {
      const cachedEvents = googleCalendarCache.getEvents();
      if (cachedEvents && cachedEvents.length > 0) {
        const cacheAge = googleCalendarCache.getCacheAge();
        console.log(`📦 Using fresh cached Google events (${cacheAge} minutes old)`);
        setState(prev => ({ 
          ...prev, 
          googleEvents: cachedEvents,
          isLoadingEvents: false,
          fetchError: null
        }));
        return;
      }
    }

    // If cache is stale but exists, show it immediately while fetching fresh data
    if (!forceRefresh && googleCalendarCache.hasStaleCache()) {
      const staleEvents = googleCalendarCache.getStaleEvents();
      if (staleEvents && staleEvents.length > 0) {
        const cacheAge = googleCalendarCache.getCacheAge();
        console.log(`📦 Using stale cached events (${cacheAge} minutes old) while revalidating`);
        setState(prev => ({
          ...prev,
          googleEvents: staleEvents,
          isLoadingEvents: true, // Keep loading state to show refresh is happening
          fetchError: null
        }));
        // Continue to fetch fresh data below (stale-while-revalidate pattern)
      }
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
      
      // Use cached events during rate limit
      const cachedEvents = googleCalendarCache.getEvents();
      if (cachedEvents && cachedEvents.length > 0) {
        console.log('📦 Using cached events during rate limit');
        const waitTime = Math.ceil((RATE_LIMIT_DELAY - timeSinceLastFetch) / 1000);
        setState(prev => ({ 
          ...prev, 
          googleEvents: cachedEvents,
          fetchError: `Rate limited (${waitTime}s). Showing cached events.` 
        }));
        return;
      }
      return;
    }

    // Check memory cache
    if (!forceRefresh && eventsCacheRef.current) {
      const cacheAge = now - eventsCacheRef.current.timestamp;
      if (cacheAge < CACHE_DURATION) {
        console.log('Using memory cached events data');
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
        
        // Cache successful result in both memory and persistent storage
        eventsCacheRef.current = { data: events, timestamp: now };
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
            console.log(`Rate limit hit, retrying in ${backoffDelay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
            
            // Use cached events during retry wait
            const cachedEvents = googleCalendarCache.getEvents();
            if (cachedEvents && cachedEvents.length > 0) {
              console.log('📦 Using cached events during rate limit retry');
              setState(prev => ({ 
                ...prev, 
                googleEvents: cachedEvents,
                fetchError: `Rate limited. Retrying in ${Math.ceil(backoffDelay / 1000)}s. Showing cached events.`
              }));
            }
            
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
            return executeWithRetry(retryCount + 1);
          } else {
            const errorMessage = 'Google Calendar API kvote overskredet. Prøv igjen om noen minutter.';
            
            // Use cached events as final fallback
            const cachedEvents = googleCalendarCache.getEvents();
            if (cachedEvents && cachedEvents.length > 0) {
              console.log('📦 Using cached events due to quota exceeded');
              setState(prev => ({ 
                ...prev, 
                googleEvents: cachedEvents,
                fetchError: `${errorMessage} Showing cached events.`
              }));
              return;
            }
            
            toast.warning(errorMessage);
            setState(prev => ({ ...prev, fetchError: errorMessage }));
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
          console.log('Authentication error detected, disconnecting Google Calendar');
          
          // Use cached events even with auth error
          const cachedEvents = googleCalendarCache.getEvents();
          if (cachedEvents && cachedEvents.length > 0) {
            console.log('📦 Using cached events due to auth error');
            setState(prev => ({ 
              ...prev, 
              googleEvents: cachedEvents,
              fetchError: 'Authentication failed. Showing cached events. Please reconnect.'
            }));
          }
          
          disconnectGoogleCalendar();
          toast.error('Google Calendar-tilgangen er utløpt. Vennligst koble til på nytt.');
          return;
        }

        // Handle other errors - use cache as fallback
        const cachedEvents = googleCalendarCache.getEvents();
        if (cachedEvents && cachedEvents.length > 0) {
          console.log('📦 Using cached events due to error:', err.message);
          setState(prev => ({ 
            ...prev, 
            googleEvents: cachedEvents,
            fetchError: `Network error. Showing cached events. (${err.message})`
          }));
          return;
        }

        // Handle other errors normally if no cache
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
      // Final error handling with cache fallback
      console.error('Final error in fetchGoogleEvents:', error);
      
      const cachedEvents = googleCalendarCache.getEvents();
      if (cachedEvents && cachedEvents.length > 0) {
        console.log('📦 Using cached events as final fallback');
        setState(prev => ({ 
          ...prev, 
          googleEvents: cachedEvents,
          fetchError: 'Service unavailable. Showing cached events.'
        }));
      }
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
