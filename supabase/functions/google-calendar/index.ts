
import { corsHeaders, getRequiredEnv, getRedirectURI, generateAuthUrl, exchangeCodeForTokens } from './auth.ts';
import { fetchEvents, fetchCalendars, createEvent } from './calendar.ts';

Deno.serve(async (req) => {
  console.log(`[${new Date().toISOString()}] ${req.method} request received`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const origin = req.headers.get('origin') || 'https://hytte-sjekk-klar.lovable.app';

    if (req.method === 'GET') {
      try {
        const GOOGLE_CLIENT_ID = getRequiredEnv('GOOGLE_CLIENT_ID');
        const REDIRECT_URI = getRedirectURI(origin);
        
        const authUrl = generateAuthUrl(GOOGLE_CLIENT_ID, REDIRECT_URI);
        console.log('Generated auth URL:', authUrl);
        
        return new Response(
          JSON.stringify({ url: authUrl }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Error generating auth URL:', error);
        return new Response(
          JSON.stringify({ error: `Error generating auth URL: ${error.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (req.method === 'POST') {
      const requestData = await req.json();
      
      // Handle OAuth code exchange
      if (requestData.code) {
        try {
          const GOOGLE_CLIENT_ID = getRequiredEnv('GOOGLE_CLIENT_ID');
          const GOOGLE_CLIENT_SECRET = getRequiredEnv('GOOGLE_CLIENT_SECRET');
          const REDIRECT_URI = getRedirectURI(origin, requestData);
          
          const tokens = await exchangeCodeForTokens(
            requestData.code,
            GOOGLE_CLIENT_ID,
            GOOGLE_CLIENT_SECRET,
            REDIRECT_URI
          );
          
          return new Response(
            JSON.stringify({ tokens }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Error exchanging code for tokens:', error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Handle calendar operations
      if (requestData.action && requestData.tokens) {
        const { action, tokens } = requestData;
        
        if (!tokens.access_token) {
          return new Response(
            JSON.stringify({ error: 'No access token provided' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        try {
          let response;
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
              response = await createEvent(tokens.access_token, {
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
              });
              return new Response(
                JSON.stringify({ event: response }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
              
            default:
              throw new Error('Invalid action requested');
          }
        } catch (error) {
          console.error(`Error in calendar operation ${action}:`, error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
      JSON.stringify({ error: `Edge function error: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

