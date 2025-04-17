
import { corsHeaders, getRequiredEnv, getRedirectURI, generateAuthUrl, exchangeCodeForTokens } from './auth.ts';
import { fetchEvents, fetchCalendars, createEvent } from './calendar.ts';
import { GoogleAuthResponse, RequestData, GoogleCalendarEvent } from './types.ts';

Deno.serve(async (req) => {
  console.log(`[${new Date().toISOString()}] ${req.method} request received`);
  console.log(`Request URL: ${req.url}`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const origin = req.headers.get('origin') || 'https://hytte-sjekk-klar.lovable.app';
    console.log(`Origin header: ${origin}`);

    if (req.method === 'GET') {
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
    }

    if (req.method === 'POST') {
      const requestData: RequestData = await req.json();
      console.log('POST request data:', JSON.stringify({
        ...requestData,
        code: requestData.code ? `${requestData.code.substring(0, 10)}...` : undefined,
        tokens: requestData.tokens ? 'tokens-object-present' : undefined
      }));
      
      // Handle OAuth code exchange
      if (requestData.code) {
        try {
          console.log('Processing OAuth code exchange');
          const GOOGLE_CLIENT_ID = getRequiredEnv('GOOGLE_CLIENT_ID');
          const GOOGLE_CLIENT_SECRET = getRequiredEnv('GOOGLE_CLIENT_SECRET');
          const REDIRECT_URI = getRedirectURI(origin, requestData);
          
          console.log(`Exchanging code for tokens using redirect URI: ${REDIRECT_URI}`);
          const tokens = await exchangeCodeForTokens(
            requestData.code,
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
        } catch (error) {
          console.error('Error exchanging code for tokens:', error);
          // Forbedret feilhåndtering for 403-feil
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
              details: details || undefined,
              status
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
