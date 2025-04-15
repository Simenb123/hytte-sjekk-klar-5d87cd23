
import { supabase } from '@/integrations/supabase/client';
import { GoogleEvent, GoogleCalendar } from '@/types/googleCalendar.types';
import { toast } from 'sonner';

export const fetchCalendarEvents = async (tokens: any): Promise<GoogleEvent[]> => {
  console.log('Calling edge function to fetch events');
  
  try {
    // Add additional logging
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
      
      // Provide a more detailed error message to help debugging
      let errorMessage = 'Edge function error';
      if (error.message && (error.message.includes('Failed to fetch') || 
                            error.name === 'FunctionsFetchError')) {
        errorMessage = 'Kunne ikke koble til Edge Function. Sjekk at Supabase-tjenesten er tilgjengelig.';
        console.log('Network error connecting to Edge Function:', error);
      } else {
        errorMessage = `Edge function error: ${error.message || 'Unknown error'}`;
      }
      
      throw new Error(errorMessage);
    }

    if (data?.error) {
      console.error('Google Calendar API error:', data.error, data.details);
      if (data.requiresReauth) {
        throw new Error('Google Calendar-tilgangen har utløpt. Vennligst koble til på nytt.');
      }
      throw new Error(data.error);
    }

    if (data?.events) {
      console.log(`Successfully fetched ${data.events.length} events from Google Calendar`);
      toast.success(`Hentet ${data.events.length} hendelser fra Google Calendar`);
      return data.events;
    }

    console.warn('No events returned from Google Calendar API');
    toast.info('Ingen hendelser funnet i Google Calendar');
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
      // Provide more context for the error
      let errorMessage = 'Edge function error';
      if (error.message && (error.message.includes('Failed to fetch') || 
                           error.name === 'FunctionsFetchError')) {
        errorMessage = 'Kunne ikke koble til Edge Function. Sjekk at Supabase-tjenesten er tilgjengelig.';
      } else {
        errorMessage = `Edge function error: ${error.message || 'Unknown error'}`;
      }
      throw new Error(errorMessage);
    }

    if (data?.error) {
      console.error('Google Calendar API error:', data.error, data.details);
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
  toast.info('Behandler Google Calendar-tilkobling...');

  try {
    // Get the current URL to determine what environment we're in
    const currentUrl = window.location.origin;
    console.log('Current URL for OAuth callback:', currentUrl);
    
    // Pass the redirectUri explicitly to ensure it matches what we used for auth
    const redirectUri = `${currentUrl}/auth/calendar`;
    console.log('Using redirect URI:', redirectUri);
    
    const { data, error } = await supabase.functions.invoke('google-calendar', {
      method: 'POST',
      body: { 
        code,
        redirectUri // Pass the correct redirect URI explicitly
      }
    });

    if (error) {
      console.error('Supabase function error:', error);
      // Provide more context for the error
      let errorMessage = 'Edge function error';
      if (error.message && (error.message.includes('Failed to fetch') || 
                           error.name === 'FunctionsFetchError')) {
        errorMessage = 'Kunne ikke koble til Edge Function. Sjekk at Supabase-tjenesten er tilgjengelig.';
      } else {
        errorMessage = `Edge function error: ${error.message || 'Unknown error'}`;
      }
      throw new Error(errorMessage);
    }

    if (data?.error) {
      console.error('Token exchange error:', data.error, data.details);
      throw new Error(data.error);
    }

    if (!data?.tokens) {
      throw new Error('Ingen tokens mottatt fra serveren');
    }

    console.log('Successfully received tokens from Google:', 
      `access_token exists: ${!!data.tokens.access_token},`,
      `refresh_token exists: ${!!data.tokens.refresh_token}`
    );

    return data.tokens;
  } catch (error) {
    console.error('Error in handleOAuthCallback:', error);
    throw error;
  }
};
