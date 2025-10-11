
import { supabase } from '@/integrations/supabase/client';
import { GoogleEvent, GoogleCalendar, GoogleOAuthTokens } from '@/types/googleCalendar.types';
import { toast } from 'sonner';
import { storeGoogleTokens } from '@/utils/tokenStorage';

/**
 * Henter kalender-hendelser fra Google Calendar via Edge Function
 */
export const fetchCalendarEvents = async (tokens: GoogleOAuthTokens, userId?: string): Promise<GoogleEvent[]> => {
  // Get filters from localStorage
  const filtersString = localStorage.getItem('googleCalendarFilters');
  const filters = filtersString ? JSON.parse(filtersString) : null;
  console.log('🔍 FRONTEND - Using calendar filters:', filters);
  
  // FRONTEND REGEX TESTING - Test week event filtering locally first
  if (filters?.filterWeekEvents) {
    console.log('🧪 FRONTEND REGEX TEST - Testing week patterns locally');
    const testEvents = ['Uke 34 i 2025', 'Normal meeting', 'Week 34', 'uke 35'];
    const weekPatterns = [
      /uke \d+( i \d+)?/i,
      /^uke \d+/i,
      /uke/i,
      /week \d+/i
    ];
    
    testEvents.forEach(testTitle => {
      const lowerTitle = testTitle.toLowerCase();
      const shouldFilter = weekPatterns.some(pattern => pattern.test(lowerTitle));
      console.log(`🧪 FRONTEND TEST - "${testTitle}" -> should filter: ${shouldFilter}`);
    });
  }

  try {
    console.log('🔍 DEBUG: Starting fetchCalendarEvents');
    console.log('🔍 DEBUG: Input tokens validation:', {
      tokens_exists: !!tokens,
      access_token_exists: !!tokens?.access_token,
      access_token_type: typeof tokens?.access_token,
      access_token_length: tokens?.access_token?.length || 0,
      refresh_token_exists: !!tokens?.refresh_token,
      token_type: tokens?.token_type,
      scope: tokens?.scope,
      expiry_date: tokens?.expiry_date
    });
    
    // Validate tokens before sending
    if (!tokens) {
      throw new Error('No tokens provided to fetchCalendarEvents');
    }
    
    if (!tokens.access_token || typeof tokens.access_token !== 'string') {
      throw new Error('Invalid or missing access_token in tokens');
    }
    
    const requestBody = { 
      action: 'list_events',
      tokens,
      filters
    };
    
    console.log('🔍 DEBUG: Request body structure:', {
      action: requestBody.action,
      tokens_included: !!requestBody.tokens,
      tokens_access_token_length: requestBody.tokens?.access_token?.length || 0
    });
    
    console.log('📡 Calling supabase.functions.invoke...');
    const { data, error } = await supabase.functions.invoke('google-calendar', {
      method: 'POST',
      body: requestBody
    });
    
    console.log('📡 Supabase response received:', {
      data_exists: !!data,
      error_exists: !!error,
      data_keys: data ? Object.keys(data) : 'NO_DATA',
      error_details: error
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw error;
    }

    if (data?.error) {
      console.error('Google Calendar API error:', data.error);
      throw new Error(data.error);
    }

    // Handle auth errors that require re-authentication
    if (data?.requiresReauth) {
      console.log('❌ Re-authentication required, clearing stored tokens');
      if (userId) {
        const { removeGoogleTokens } = await import('@/utils/tokenStorage');
        removeGoogleTokens(userId);
      }
      throw new Error('Autentisering utløpt. Vennligst koble til Google Calendar på nytt.');
    }

    if (data?.events) {
      console.log(`Successfully fetched ${data.events.length} events from Edge Function`);
      
      // FRONTEND BACKUP FILTERING - Apply additional filtering as safety net
      let finalEvents = data.events;
      if (filters?.filterWeekEvents) {
        console.log('🛡️ FRONTEND BACKUP - Applying frontend week event filtering as backup');
        const originalCount = finalEvents.length;
        
        finalEvents = finalEvents.filter((event: GoogleEvent) => {
          const title = event.summary?.toLowerCase() || '';
          const originalTitle = event.summary || '';
          
          const weekPatterns = [
            /uke \d+( i \d+)?/i,
            /^uke \d+/i,
            /uke/i,
            /week \d+/i,
            /ukenr/i
          ];
          
          const isWeekEvent = weekPatterns.some(pattern => pattern.test(title));
          
          if (isWeekEvent) {
            console.log(`🛡️ FRONTEND BACKUP - Filtering out: "${originalTitle}"`);
            return false;
          }
          
          return true;
        });
        
        console.log(`🛡️ FRONTEND BACKUP - Filtered ${originalCount} -> ${finalEvents.length} events`);
      }
      
      // Handle refreshed tokens if provided
      if (data.refreshedTokens && userId) {
        console.log('Received refreshed tokens from events fetch, updating storage');
        await storeGoogleTokens(userId, data.refreshedTokens);
        // Emit event for other components to know tokens were refreshed
        window.dispatchEvent(new CustomEvent('google-tokens-refreshed', { 
          detail: { refreshedTokens: data.refreshedTokens } 
        }));
      }
      
      return finalEvents;
    }

    return [];
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw error;
  }
};

/**
 * Henter kalenderliste fra Google via Edge Function
 */
export const fetchCalendarList = async (tokens: GoogleOAuthTokens, userId?: string): Promise<GoogleCalendar[]> => {
  try {
    console.log('🔍 DEBUG: Starting fetchCalendarList');
    console.log('🔍 DEBUG: Input tokens validation:', {
      tokens_exists: !!tokens,
      access_token_exists: !!tokens?.access_token,
      access_token_type: typeof tokens?.access_token,
      access_token_length: tokens?.access_token?.length || 0
    });
    
    // Validate tokens before sending
    if (!tokens || !tokens.access_token || typeof tokens.access_token !== 'string') {
      throw new Error('Invalid tokens provided to fetchCalendarList');
    }
    
    const requestBody = { 
      action: 'get_calendars',
      tokens
    };
    
    console.log('📡 Calling supabase.functions.invoke for calendars...');
    const { data, error } = await supabase.functions.invoke('google-calendar', {
      method: 'POST',
      body: requestBody
    });
    
    console.log('📡 Calendars response received:', {
      data_exists: !!data,
      error_exists: !!error,
      data_keys: data ? Object.keys(data) : 'NO_DATA'
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw error;
    }

    if (data?.error) {
      console.error('Google Calendar API error:', data.error);
      throw new Error(data.error);
    }

    // Handle auth errors that require re-authentication
    if (data?.requiresReauth) {
      console.log('❌ Re-authentication required, clearing stored tokens');
      if (userId) {
        const { removeGoogleTokens } = await import('@/utils/tokenStorage');
        removeGoogleTokens(userId);
      }
      throw new Error('Autentisering utløpt. Vennligst koble til Google Calendar på nytt.');
    }

    if (data?.calendars) {
      console.log(`Successfully fetched ${data.calendars.length} calendars`);
      
      // Handle refreshed tokens if provided
      if (data.refreshedTokens && userId) {
        console.log('Received refreshed tokens from calendars fetch, updating storage');
        await storeGoogleTokens(userId, data.refreshedTokens);
        // Emit event for other components to know tokens were refreshed
        window.dispatchEvent(new CustomEvent('google-tokens-refreshed', { 
          detail: { refreshedTokens: data.refreshedTokens } 
        }));
      }
      
      return data.calendars;
    }

    return [];
  } catch (error) {
    console.error('Error fetching calendar list:', error);
    throw error;
  }
};

/**
 * Håndterer OAuth-callback og utveksler autorisasjonskode for tokens
 */
export const handleOAuthCallback = async (code: string) => {
  try {
    console.log('Processing OAuth callback with code:', code.substring(0, 10) + '...');
    
    const { data, error } = await supabase.functions.invoke('google-calendar', {
      method: 'POST',
      body: { code }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw error;
    }

    if (data?.error) {
      console.error('Token exchange error:', data.error);
      throw new Error(data.error);
    }

    if (!data?.tokens) {
      throw new Error('Ingen tokens mottatt fra serveren');
    }

    return data.tokens;
  } catch (error) {
    console.error('Error in handleOAuthCallback:', error);
    throw error;
  }
};

/**
 * Oppretter en ny kalenderhendelse i Google Calendar
 */
export const createCalendarEvent = async (tokens: GoogleOAuthTokens, eventData: {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
}, useSharedCalendar: boolean = false) => {
  try {
    // Format dates for full-day Google Calendar events
    const formatDateForGoogleCalendar = (dateString: string): string => {
      const date = new Date(dateString);
      // Format as YYYY-MM-DD for full-day events
      return date.toISOString().split('T')[0];
    };

    const formattedEventData = {
      title: eventData.title,
      description: eventData.description,
      startDate: formatDateForGoogleCalendar(eventData.startDate),
      endDate: formatDateForGoogleCalendar(eventData.endDate)
    };
    
    console.log('Creating calendar event with formatted data:', formattedEventData);
    
    const { data, error } = await supabase.functions.invoke('google-calendar', {
      method: 'POST',
      body: { 
        action: 'create_event',
        tokens,
        event: formattedEventData,
        useSharedCalendar
      }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw error;
    }

    if (data?.error) {
      console.error('Google Calendar API error:', data.error);
      throw new Error(data.error);
    }

    console.log('Successfully created calendar event');
    return data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
};
