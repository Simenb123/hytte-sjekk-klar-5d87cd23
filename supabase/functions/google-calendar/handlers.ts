
import { corsHeaders } from './constants.ts';
import { getRequiredEnv, getRedirectURI } from './utils.ts';
import { generateAuthUrl, exchangeCodeForTokens } from './oauth.ts';
import { fetchEvents, fetchCalendars, createEvent } from './calendar.ts';
import { GoogleAuthResponse, RequestData, GoogleCalendarEvent } from './types.ts';

/**
 * Handle the OAuth authorization URL generation
 */
export const handleAuthUrlGeneration = async (req: Request, origin: string): Promise<Response> => {
  try {
    const GOOGLE_CLIENT_ID = getRequiredEnv('GOOGLE_CLIENT_ID');
    console.log(`Got GOOGLE_CLIENT_ID from env: ${GOOGLE_CLIENT_ID.substring(0, 10)}...`);
    
    const REDIRECT_URI = getRedirectURI(origin);
    
    console.log(`Generating auth URL with redirect URI: ${REDIRECT_URI}`);
    const authUrl = generateAuthUrl(GOOGLE_CLIENT_ID, REDIRECT_URI);
    console.log('Generated auth URL:', authUrl);
    
    const response: GoogleAuthResponse = { url: authUrl };
    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating auth URL:', error);
    const response: GoogleAuthResponse = { 
      error: `Error generating auth URL: ${error.message}` 
    };
    return new Response(
      JSON.stringify(response),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * Handle OAuth code exchange
 */
export const handleOAuthCodeExchange = async (requestData: RequestData, origin: string): Promise<Response> => {
  try {
    console.log('Processing OAuth code exchange');
    const GOOGLE_CLIENT_ID = getRequiredEnv('GOOGLE_CLIENT_ID');
    const GOOGLE_CLIENT_SECRET = getRequiredEnv('GOOGLE_CLIENT_SECRET');
    const REDIRECT_URI = getRedirectURI(origin, requestData);
    
    console.log(`Exchanging code for tokens using redirect URI: ${REDIRECT_URI}`);
    const tokens = await exchangeCodeForTokens(
      requestData.code!,
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      REDIRECT_URI
    );
    
    console.log('Successfully exchanged code for tokens');
    const response: GoogleAuthResponse = { tokens };
    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error exchanging code for tokens:', error);
    // Improved error handling for 403 errors
    let status = 400;
    let details = '';
    
    if (error.message?.includes('403') || error.toString().includes('403')) {
      status = 403;
      details = 'Google returnerte en 403 Forbidden feil. Dette betyr vanligvis at OAuth-konfigurasjonen ikke er riktig oppsatt, eller at redirect URI ikke stemmer med det som er konfigurert i Google Cloud Console.';
    }
    
    const response: GoogleAuthResponse = { 
      error: error.message, 
      details: details || undefined,
      status
    };
    
    return new Response(
      JSON.stringify(response),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * Handle calendar operations with tokens
 */
export const handleCalendarOperations = async (requestData: RequestData): Promise<Response> => {
  const { action, tokens } = requestData;
  
  if (!tokens?.access_token) {
    const response: GoogleAuthResponse = { error: 'No access token provided' };
    return new Response(
      JSON.stringify(response),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    let response;
    console.log(`Processing calendar operation: ${action}`);
    
    switch (action) {
      case 'list_events':
        response = await fetchEvents(tokens.access_token);
        return new Response(
          JSON.stringify({ events: response.items || [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
        
      case 'get_calendars':
        response = await fetchCalendars(tokens.access_token);
        return new Response(
          JSON.stringify({ calendars: response.items || [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
        
      case 'create_event':
        if (!requestData.event) {
          throw new Error('No event data provided');
        }
        const calendarEvent: GoogleCalendarEvent = {
          summary: requestData.event.title,
          description: requestData.event.description || '',
          start: {
            dateTime: new Date(requestData.event.startDate).toISOString(),
            timeZone: 'Europe/Oslo'
          },
          end: {
            dateTime: new Date(requestData.event.endDate).toISOString(),
            timeZone: 'Europe/Oslo'
          }
        };
        response = await createEvent(tokens.access_token, calendarEvent);
        return new Response(
          JSON.stringify({ event: response }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
        
      default:
        throw new Error('Invalid action requested');
    }
  } catch (error: any) {
    console.error(`Error in calendar operation ${action}:`, error);
    
    // Improved error handling for 403 errors and API access errors
    let status = 400;
    let requiresReauth = false;
    let details = '';
    
    if (error.message?.includes('403') || error.toString().includes('403')) {
      status = 403;
      requiresReauth = true;
      details = 'Google Calendar API returnerte en 403 Forbidden feil. Dette betyr vanligvis at du ikke har riktig tilgang til Calendar API, eller at tokens har utløpt.';
    } else if (error.message?.includes('401') || error.toString().includes('401')) {
      status = 401;
      requiresReauth = true;
      details = 'Google Calendar API returnerte en 401 Unauthorized feil. Dette betyr vanligvis at tokens har utløpt og du må autentisere på nytt.';
    }
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        requiresReauth,
        details: details || undefined,
        status
      }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};
