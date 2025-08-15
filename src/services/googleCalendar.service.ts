
import { supabase } from '@/integrations/supabase/client';
import { GoogleEvent, GoogleCalendar, GoogleOAuthTokens } from '@/types/googleCalendar.types';
import { toast } from 'sonner';
import { storeGoogleTokens } from '@/utils/tokenStorage';

/**
 * Henter kalender-hendelser fra Google Calendar via Edge Function
 */
export const fetchCalendarEvents = async (tokens: GoogleOAuthTokens): Promise<GoogleEvent[]> => {
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
      tokens
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

    if (data?.events) {
      console.log(`Successfully fetched ${data.events.length} events`);
      
      // Handle refreshed tokens if provided
      if (data.refreshedTokens) {
        console.log('Received refreshed tokens from events fetch, updating storage');
        await storeGoogleTokens(data.refreshedTokens);
      }
      
      return data.events;
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
export const fetchCalendarList = async (tokens: GoogleOAuthTokens): Promise<GoogleCalendar[]> => {
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

    if (data?.calendars) {
      console.log(`Successfully fetched ${data.calendars.length} calendars`);
      
      // Handle refreshed tokens if provided
      if (data.refreshedTokens) {
        console.log('Received refreshed tokens from calendars fetch, updating storage');
        await storeGoogleTokens(data.refreshedTokens);
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
    console.log('Creating calendar event with data:', eventData);
    
    const { data, error } = await supabase.functions.invoke('google-calendar', {
      method: 'POST',
      body: { 
        action: 'create_event',
        tokens,
        event: eventData,
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
