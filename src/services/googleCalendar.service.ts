
import { supabase } from '@/integrations/supabase/client';
import { GoogleEvent, GoogleCalendar, GoogleOAuthTokens } from '@/types/googleCalendar.types';
import { toast } from 'sonner';

/**
 * Henter kalender-hendelser fra Google Calendar via Edge Function
 */
export const fetchCalendarEvents = async (tokens: GoogleOAuthTokens): Promise<GoogleEvent[]> => {
  try {
    console.log('Fetching calendar events with tokens:', 
      tokens ? { access_token_exists: !!tokens.access_token } : 'No tokens'
    );
    
    const { data, error } = await supabase.functions.invoke('google-calendar', {
      method: 'POST',
      body: { 
        action: 'list_events',
        tokens
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

    if (data?.events) {
      console.log(`Successfully fetched ${data.events.length} events`);
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
    const { data, error } = await supabase.functions.invoke('google-calendar', {
      method: 'POST',
      body: { 
        action: 'get_calendars',
        tokens
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

    if (data?.calendars) {
      console.log(`Successfully fetched ${data.calendars.length} calendars`);
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
