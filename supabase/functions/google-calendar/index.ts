
// Simple CORS headers setup
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper for error responses
const errorResponse = (message: string, status = 400) => {
  console.error(`Error: ${message}`);
  return new Response(
    JSON.stringify({ 
      error: message, 
      errorType: 'EDGE_FUNCTION_ERROR' 
    }),
    { 
      status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify required environment variables
    const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
    const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return errorResponse('Missing required Google credentials');
    }

    // Get request origin for better redirect handling
    const origin = req.headers.get('origin') || 'https://hytte-sjekk-klar.lovable.app';
    console.log('Request origin:', origin);
    
    const protocol = origin.startsWith('http://localhost') ? 'http' : 'https';
    const domain = origin.includes('://') ? new URL(origin).host : origin;
    const REDIRECT_URI = `${protocol}://${domain}/auth/calendar`;
    console.log('Using redirect URI:', REDIRECT_URI);

    // Handle GET requests - Generate auth URL
    if (req.method === 'GET') {
      const scopes = [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events'
      ];

      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID);
      authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('scope', scopes.join(' '));
      authUrl.searchParams.append('access_type', 'offline');
      authUrl.searchParams.append('prompt', 'consent');

      console.log('Generated auth URL:', authUrl.toString());
      return new Response(
        JSON.stringify({ url: authUrl.toString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle POST requests
    if (req.method === 'POST') {
      const requestData = await req.json();

      // Handle code exchange
      if (requestData.code) {
        console.log('Exchanging code for tokens');
        
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code: requestData.code,
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            grant_type: 'authorization_code'
          })
        });

        if (!tokenResponse.ok) {
          const error = await tokenResponse.text();
          console.error('Token exchange error:', error);
          return errorResponse('Failed to exchange code for tokens');
        }

        const tokens = await tokenResponse.json();
        return new Response(
          JSON.stringify({ tokens }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Handle calendar operations with existing tokens
      if (requestData.action && requestData.tokens) {
        const { action, tokens } = requestData;
        
        // Verify access token
        if (!tokens.access_token) {
          return errorResponse('No access token provided');
        }

        const headers = {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json'
        };

        // List events
        if (action === 'list_events') {
          console.log('Fetching calendar events');
          
          const now = new Date();
          const threeMonthsLater = new Date(now);
          threeMonthsLater.setMonth(now.getMonth() + 3);

          const calendarResponse = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now.toISOString()}&timeMax=${threeMonthsLater.toISOString()}&singleEvents=true&orderBy=startTime`,
            { headers }
          );

          if (!calendarResponse.ok) {
            const error = await calendarResponse.text();
            console.error('Calendar API error:', error);
            
            if (calendarResponse.status === 401) {
              return errorResponse('Google Calendar access has expired', 401);
            }
            
            return errorResponse('Failed to fetch calendar events');
          }

          const data = await calendarResponse.json();
          return new Response(
            JSON.stringify({ events: data.items }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Create event
        if (action === 'create_event' && requestData.event) {
          console.log('Creating calendar event:', requestData.event);
          
          const calendarResponse = await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events',
            {
              method: 'POST',
              headers,
              body: JSON.stringify({
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
              })
            }
          );

          if (!calendarResponse.ok) {
            const error = await calendarResponse.text();
            console.error('Calendar API error:', error);
            return errorResponse('Failed to create calendar event');
          }

          const data = await calendarResponse.json();
          return new Response(
            JSON.stringify({ event: data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      return errorResponse('Invalid request');
    }

    return errorResponse('Method not allowed', 405);
  } catch (error) {
    console.error('Edge function error:', error);
    return errorResponse(`Edge function error: ${error.message}`, 500);
  }
});
