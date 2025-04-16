
import { corsHeaders, getRequiredEnv, getRedirectURI, generateAuthUrl, exchangeCodeForTokens } from './auth.ts';
import { fetchEvents, fetchCalendars, createEvent } from './calendar.ts';
import { GoogleAuthResponse, RequestData, GoogleCalendarEvent } from './types.ts';

Deno.serve(async (req) => {
  console.log(`[${new Date().toISOString()}] ${req.method} request received`);
  console.log('Request URL:', req.url);
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the origin, crucial for constructing the correct redirect URI
    const origin = req.headers.get('origin') || req.headers.get('referer')?.replace(/\/$/, '') || 'https://hytte-sjekk-klar.lovable.app';
    console.log('Request origin:', origin);

    if (req.method === 'GET') {
      try {
        const GOOGLE_CLIENT_ID = getRequiredEnv('GOOGLE_CLIENT_ID');
        console.log('GOOGLE_CLIENT_ID exists:', !!GOOGLE_CLIENT_ID);
        
        // Use the origin to get the correct redirect URI
        const REDIRECT_URI = getRedirectURI(origin);
        console.log(`Using redirect URI for auth URL: ${REDIRECT_URI}`);
        
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
          error: `Error generating auth URL: ${error.message}`,
          details: error.stack
        };
        return new Response(
          JSON.stringify(response),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (req.method === 'POST') {
      const requestData: RequestData = await req.json();
      console.log('POST request data keys:', Object.keys(requestData));
      
      // Handle OAuth code exchange
      if (requestData.code) {
        try {
          console.log('Processing OAuth code exchange');
          const GOOGLE_CLIENT_ID = getRequiredEnv('GOOGLE_CLIENT_ID');
          const GOOGLE_CLIENT_SECRET = getRequiredEnv('GOOGLE_CLIENT_SECRET');
          
          // Critical: Use the correct redirect URI, either from the request or from the origin
          const REDIRECT_URI = getRedirectURI(origin, requestData);
          console.log(`Using redirect URI for token exchange: ${REDIRECT_URI}`);
          
          const tokens = await exchangeCodeForTokens(
            requestData.code,
            GOOGLE_CLIENT_ID,
            GOOGLE_CLIENT_SECRET,
            REDIRECT_URI
          );
          
          console.log('Token exchange successful');
          const response: GoogleAuthResponse = { tokens };
          return new Response(
            JSON.stringify(response),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Error exchanging code for tokens:', error);
          
          // Enhanced error reporting
          const status = error.status || 400;
          const details = error.details || error.stack || '';
          
          const response: GoogleAuthResponse = { 
            error: error.message, 
            details: details,
            status: status
          };
          
          return new Response(
            JSON.stringify(response),
            { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Handle calendar operations
      if (requestData.action && requestData.tokens) {
        const { action, tokens } = requestData;
        
        if (!tokens.access_token) {
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
        } catch (error) {
          console.error(`Error in calendar operation ${action}:`, error);
          
          // Forbedret feilhåndtering for 403-feil og API-tilgangsfeil
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
              details: details || undefined
            }),
            { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      return new Response(
        JSON.stringify({ error: 'Invalid request: missing action, code, or tokens' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ 
        error: `Edge function error: ${error.message}`,
        details: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
