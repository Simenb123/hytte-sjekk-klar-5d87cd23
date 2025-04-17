
import { corsHeaders } from './constants.ts';
import { getRequiredEnv, getRedirectURI } from './utils.ts';
import { generateAuthUrl, exchangeCodeForTokens } from './oauth.ts';
import { 
  fetchEvents, 
  fetchCalendars, 
  createEvent, 
  createOrFindHyttaCalendar,
  shareCalendarWithFamily,
  getCalendarSharingLink
} from './calendar.ts';
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
    const REDIRECT_URI = getRedirectURI(origin);
    
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
    
    const response: GoogleAuthResponse = { 
      error: error.message
    };
    
    return new Response(
      JSON.stringify(response),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
        
        let calendarId = 'primary';
        let createdSharedCalendar = null;
        
        // Hvis useSharedCalendar er true, opprett eller finn hytte-kalenderen
        if (requestData.useSharedCalendar) {
          console.log('Creating/finding shared hytte calendar');
          const calendarName = requestData.calendar?.name || 'Hytte Booking';
          createdSharedCalendar = await createOrFindHyttaCalendar(tokens.access_token, calendarName);
          calendarId = createdSharedCalendar.id;
          console.log(`Using shared hytte calendar with ID: ${calendarId}`);
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
        
        response = await createEvent(tokens.access_token, calendarEvent, calendarId);
        
        return new Response(
          JSON.stringify({ 
            event: response,
            sharedCalendar: createdSharedCalendar 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      
      case 'setup_shared_calendar':
        console.log('Setting up shared hytte calendar');
        if (!requestData.calendar) {
          throw new Error('No calendar configuration provided');
        }
        
        const calendarName = requestData.calendar.name || 'Hytte Booking';
        const hyttaCalendar = await createOrFindHyttaCalendar(tokens.access_token, calendarName);
        
        let sharingResults = null;
        // Hvis e-poster er oppgitt, del kalenderen
        if (requestData.calendar.shareWith && requestData.calendar.shareWith.length > 0) {
          sharingResults = await shareCalendarWithFamily(
            tokens.access_token, 
            hyttaCalendar.id, 
            requestData.calendar.shareWith
          );
        }
        
        // Generer delings-lenker
        const sharingLinks = await getCalendarSharingLink(tokens.access_token, hyttaCalendar.id);
        
        return new Response(
          JSON.stringify({ 
            calendar: hyttaCalendar,
            sharingResults,
            sharingLinks
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
        
      default:
        throw new Error('Invalid action requested');
    }
  } catch (error: any) {
    console.error(`Error in calendar operation ${action}:`, error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};
