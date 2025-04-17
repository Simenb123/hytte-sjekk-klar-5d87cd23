
import { supabase } from '@/integrations/supabase/client';
import { GoogleEvent, GoogleCalendar } from '@/types/googleCalendar.types';
import { toast } from 'sonner';

export const fetchCalendarEvents = async (tokens: any): Promise<GoogleEvent[]> => {
  console.log('Calling edge function to fetch events');
  
  try {
    console.log('Starting fetchCalendarEvents with tokens:', 
      tokens ? {
        access_token_exists: !!tokens.access_token,
        refresh_token_exists: !!tokens.refresh_token
      } : 'No tokens provided'
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
      console.log(`Successfully fetched ${data.events.length} events from Google Calendar`);
      return data.events;
    }

    console.warn('No events returned from Google Calendar API');
    return [];
  } catch (error: any) {
    console.error('Error in fetchCalendarEvents:', error);
    throw error;
  }
};

export const fetchCalendarList = async (tokens: any): Promise<GoogleCalendar[]> => {
  console.log('Calling edge function to fetch calendars');
  
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
      console.log(`Successfully fetched ${data.calendars.length} calendars from Google`);
      return data.calendars;
    }

    console.warn('No calendars returned from Google Calendar API');
    return [];
  } catch (error) {
    console.error('Error in fetchCalendarList:', error);
    throw error;
  }
};

export const handleOAuthCallback = async (code: string) => {
  console.log('Processing OAuth callback with code:', code.substring(0, 10) + '...');

  try {
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

    console.log('Successfully received tokens from Google');
    return data.tokens;
  } catch (error) {
    console.error('Error in handleOAuthCallback:', error);
    throw error;
  }
};
