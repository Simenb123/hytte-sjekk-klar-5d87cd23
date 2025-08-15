
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
import { validateAndRefreshTokens, isAuthError } from './token-refresh.ts';

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
  } catch (error: unknown) {
    console.error('Error exchanging code for tokens:', error);

    const message = error instanceof Error ? error.message : String(error);
    const response: GoogleAuthResponse = {
      error: message
    };
    
    return new Response(
      JSON.stringify(response),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * Handle calendar operations with tokens and automatic refresh
 */
export const handleCalendarOperations = async (requestData: RequestData): Promise<Response> => {
  const { action, tokens } = requestData;
  
  if (!tokens?.access_token) {
    const response: GoogleAuthResponse = { 
      error: 'No access token provided',
      status: 401 
    };
    return new Response(
      JSON.stringify(response),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Get environment variables for token refresh
  const GOOGLE_CLIENT_ID = getRequiredEnv('GOOGLE_CLIENT_ID');
  const GOOGLE_CLIENT_SECRET = getRequiredEnv('GOOGLE_CLIENT_SECRET');

  try {
    // Validate and refresh tokens if needed
    let { tokens: validTokens, refreshed } = await validateAndRefreshTokens(
      tokens,
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET
    );

    let response;
    console.log(`Processing calendar operation: ${action}`);
    
    // Execute the operation with retry logic for auth errors
    try {
      switch (action) {
        case 'list_events':
          response = await fetchEvents(validTokens.access_token);
          break;
          
        case 'get_calendars':
          response = await fetchCalendars(validTokens.access_token);
          break;
          
        default:
          // Handle other actions without retry for now
          return await handleOtherCalendarOperations(action, requestData, validTokens.access_token);
      }
    } catch (error) {
      // If we get an auth error and haven't already refreshed, try once more
      if (isAuthError(error) && !refreshed && tokens.refresh_token) {
        console.log('Auth error detected, attempting token refresh and retry');
        try {
          const refreshResult = await validateAndRefreshTokens(
            tokens,
            GOOGLE_CLIENT_ID,
            GOOGLE_CLIENT_SECRET
          );
          validTokens = refreshResult.tokens;
          
          // Retry the operation
          switch (action) {
            case 'list_events':
              response = await fetchEvents(validTokens.access_token);
              break;
              
            case 'get_calendars':
              response = await fetchCalendars(validTokens.access_token);
              break;
          }
        } catch (retryError) {
          console.error('Retry after token refresh failed:', retryError);
          return new Response(
            JSON.stringify({
              error: 'Authentication failed. Please reconnect your Google Calendar.',
              details: 'Token refresh failed',
              status: 401,
              requiresReauth: true
            }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        throw error; // Re-throw if not an auth error or already tried refresh
      }
    }

    // Return success response with refreshed tokens if applicable
    const successResponse: any = {};
    
    if (action === 'list_events') {
      successResponse.events = response.items || [];
    } else if (action === 'get_calendars') {
      successResponse.calendars = response.items || [];
    }
    
    // Include refreshed tokens in response if they were updated
    if (refreshed) {
      successResponse.refreshedTokens = validTokens;
    }
    
    return new Response(
      JSON.stringify(successResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error(`Error in calendar operation ${action}:`, error);

    const message = error instanceof Error ? error.message : String(error);
    
    // Check if it's an authentication error
    if (isAuthError(error)) {
      return new Response(
        JSON.stringify({
          error: 'Authentication failed. Please reconnect your Google Calendar.',
          details: message,
          status: 401,
          requiresReauth: true
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({
        error: message,
        status: 400
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * Handle other calendar operations (create_event, setup_shared_calendar)
 */
const handleOtherCalendarOperations = async (
  action: string,
  requestData: RequestData,
  accessToken: string
): Promise<Response> => {
  switch (action) {
    case 'create_event': {
      if (!requestData.event) {
        throw new Error('No event data provided');
      }

      let calendarId = 'primary';
      let createdSharedCalendar = null;

      // Hvis useSharedCalendar er true, opprett eller finn hytte-kalenderen
      if (requestData.useSharedCalendar) {
        console.log('Creating/finding shared hytte calendar');
        const calendarName = requestData.calendar?.name || 'Hytte Booking';
        createdSharedCalendar = await createOrFindHyttaCalendar(accessToken, calendarName);
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

      const response = await createEvent(accessToken, calendarEvent, calendarId);

      return new Response(
        JSON.stringify({
          event: response,
          sharedCalendar: createdSharedCalendar
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    case 'setup_shared_calendar': {
      console.log('Setting up shared hytte calendar');
      // Angi standardnavn hvis ikke angitt
      const calendarName = requestData.calendar?.name || 'Hytte Booking';

      // Opprett eller finn hytte-kalenderen
      const hyttaCalendar = await createOrFindHyttaCalendar(accessToken, calendarName);

      let sharingResults = null;
      // Hvis e-poster er oppgitt, del kalenderen
      if (requestData.calendar?.shareWith && requestData.calendar.shareWith.length > 0) {
        sharingResults = await shareCalendarWithFamily(
          accessToken,
          hyttaCalendar.id,
          requestData.calendar.shareWith
        );
      }

      // Generer delings-lenker
      const sharingLinks = await getCalendarSharingLink(accessToken, hyttaCalendar.id);

      return new Response(
        JSON.stringify({
          calendar: hyttaCalendar,
          sharingResults,
          sharingLinks
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
      
    default:
      throw new Error('Invalid action requested');
  }
};
