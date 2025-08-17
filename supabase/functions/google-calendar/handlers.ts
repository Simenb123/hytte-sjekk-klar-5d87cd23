
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
import { GoogleAuthResponse, RequestData, GoogleCalendarEvent, GoogleTokens } from './types.ts';
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
  try {
    console.log(`🗓️ Handling calendar operation: ${requestData.action}`);
    
    const { action, tokens } = requestData;
    
    if (!tokens || !tokens.access_token) {
      return new Response(
        JSON.stringify({ error: 'Valid access tokens are required' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log(`🔑 Token validation:`, {
      access_token_exists: !!tokens.access_token,
      refresh_token_exists: !!tokens.refresh_token,
      token_type: tokens.token_type,
      expiry_date: tokens.expiry_date
    });
    
    // Validate and refresh tokens if needed
    const clientId = getRequiredEnv('GOOGLE_CLIENT_ID');
    const clientSecret = getRequiredEnv('GOOGLE_CLIENT_SECRET');
    
    let validTokens: GoogleTokens;
    let refreshed = false;
    
    try {
      const result = await validateAndRefreshTokens(tokens, clientId, clientSecret);
      validTokens = result.tokens;
      refreshed = result.refreshed;
      
      if (refreshed) {
        console.log('🔄 Tokens were refreshed');
      }
    } catch (error) {
      console.error('❌ Token validation/refresh failed:', error);
      
      if (isAuthError(error)) {
        return new Response(
          JSON.stringify({ 
            error: 'Authentication failed. Please reconnect your Google Calendar.',
            requiresReauth: true
          }),
          { 
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      throw error;
    }
    
    // Handle specific actions
    try {
      switch (action) {
        case 'list_events':
          console.log('📅 Fetching calendar events');
          console.log('📦 Using filters from request:', requestData.filters);
          const events = await fetchEvents(validTokens.access_token, requestData.filters);
          console.log(`✅ Fetched ${events.length} events total`);
          
          return new Response(
            JSON.stringify({
              events,
              success: true,
              refreshedTokens: refreshed ? validTokens : undefined
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
          
        case 'get_calendars':
          console.log('📋 Fetching calendar list');
          const calendars = await fetchCalendars(validTokens.access_token);
          console.log(`✅ Fetched ${calendars.length} calendars`);
          
          return new Response(
            JSON.stringify({
              calendars,
              success: true,
              refreshedTokens: refreshed ? validTokens : undefined
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
          
        default:
          return await handleOtherCalendarOperations(requestData, validTokens, refreshed);
      }
    } catch (apiError) {
      console.error(`❌ Google API error for action ${action}:`, apiError);
      
      if (isAuthError(apiError)) {
        return new Response(
          JSON.stringify({ 
            error: 'Authentication failed. Please reconnect your Google Calendar.',
            requiresReauth: true
          }),
          { 
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      throw apiError;
    }
  } catch (error) {
    console.error('❌ Error in calendar operations:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Calendar operation failed',
        details: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

/**
 * Håndterer andre kalender-operasjoner som event creation og sharing
 */
const handleOtherCalendarOperations = async (
  requestData: RequestData,
  validTokens: GoogleTokens,
  refreshed: boolean
): Promise<Response> => {
  const { action, event, calendar, useSharedCalendar } = requestData;
  
  switch (action) {
    case 'create_event':
      if (!event) {
        return new Response(
          JSON.stringify({ error: 'Event data is required for creating events' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      console.log('📝 Creating calendar event:', event.title);
      
      let targetCalendarId = 'primary';
      
      if (useSharedCalendar && calendar?.name) {
        console.log(`🏡 Creating/finding shared calendar: ${calendar.name}`);
        const sharedCalendar = await createOrFindHyttaCalendar(validTokens.access_token, calendar.name);
        targetCalendarId = sharedCalendar.id;
        
        if (calendar.shareWith && calendar.shareWith.length > 0) {
          console.log(`👥 Sharing calendar with: ${calendar.shareWith.join(', ')}`);
          await shareCalendarWithFamily(validTokens.access_token, targetCalendarId, calendar.shareWith);
        }
      }
      
      // Create full-day event structure for cabin bookings
      const eventData = {
        summary: event.title,
        description: event.description,
        start: {
          date: event.startDate  // Use date format (YYYY-MM-DD) for full-day events
        },
        end: {
          date: event.endDate    // Use date format (YYYY-MM-DD) for full-day events
        }
      };
      
      const createdEvent = await createEvent(validTokens.access_token, eventData, targetCalendarId);
      console.log('✅ Event created successfully');
      
      return new Response(
        JSON.stringify({
          event: createdEvent,
          calendarId: targetCalendarId,
          success: true,
          refreshedTokens: refreshed ? validTokens : undefined
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      
    case 'get_calendar_sharing':
      if (!calendar?.id) {
        return new Response(
          JSON.stringify({ error: 'Calendar ID is required' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      console.log(`🔗 Getting sharing links for calendar: ${calendar.id}`);
      const sharingInfo = await getCalendarSharingLink(validTokens.access_token, calendar.id);
      
      return new Response(
        JSON.stringify({
          sharing: sharingInfo,
          success: true,
          refreshedTokens: refreshed ? validTokens : undefined
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      
    default:
      return new Response(
        JSON.stringify({ error: `Unknown action: ${action}` }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
  }
};
