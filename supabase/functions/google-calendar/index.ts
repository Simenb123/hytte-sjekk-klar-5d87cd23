
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

// Helper for successful responses
const successResponse = (data: any) => {
  return new Response(
    JSON.stringify(data),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
};

// Helper function to get and validate required environment variables
const getRequiredEnv = (name: string): string => {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

/**
 * Helper to determine appropriate redirect URI based on request origin
 * This is crucial for OAuth flows to work correctly
 */
const getRedirectURI = (origin: string, requestData?: any): string => {
  // If explicit redirect URI is provided in request data, use it
  if (requestData?.redirectUri) {
    console.log('Using explicit redirect URI from request:', requestData.redirectUri);
    return requestData.redirectUri;
  }
  
  // For localhost development
  if (origin.includes('localhost')) {
    console.log('Using localhost redirect URI');
    return 'http://localhost:5173/auth/calendar';
  }
  
  // Check if it's a lovableproject.com domain (preview)
  if (origin.includes('lovableproject.com')) {
    // Extract the project ID from the origin
    const projectId = origin.split('//')[1].split('.')[0];
    console.log(`Using preview redirect URI for project: ${projectId}`);
    
    // Add this preview domain to Google Console's authorized redirect URIs!
    return `https://${projectId}.lovableproject.com/auth/calendar`;
  }
  
  // Default to production domain
  console.log('Using production redirect URI');
  return 'https://hytte-sjekk-klar.lovable.app/auth/calendar';
};

Deno.serve(async (req) => {
  // Enhanced logging
  console.log(`[${new Date().toISOString()}] ${req.method} request received`);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request origin for better redirect handling
    const origin = req.headers.get('origin') || 'https://hytte-sjekk-klar.lovable.app';
    console.log('Request origin:', origin);

    // Handle GET requests - Generate auth URL
    if (req.method === 'GET') {
      try {
        // Verify required environment variables
        const GOOGLE_CLIENT_ID = getRequiredEnv('GOOGLE_CLIENT_ID');
        
        console.log('Generating OAuth URL');
        
        // Get appropriate redirect URI
        const REDIRECT_URI = getRedirectURI(origin);
        
        console.log('Using redirect URI:', REDIRECT_URI);
        
        // Define OAuth scopes - using array for better readability and maintainability
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
        return successResponse({ url: authUrl.toString() });
      } catch (error) {
        console.error('Error generating auth URL:', error);
        return errorResponse(`Error generating auth URL: ${error.message}`, 500);
      }
    }

    // Handle POST requests for OAuth code exchange and API operations
    if (req.method === 'POST') {
      const requestData = await req.json();

      // Handle code exchange
      if (requestData.code) {
        try {
          const GOOGLE_CLIENT_ID = getRequiredEnv('GOOGLE_CLIENT_ID');
          const GOOGLE_CLIENT_SECRET = getRequiredEnv('GOOGLE_CLIENT_SECRET');
          
          console.log('Exchanging code for tokens');
          
          // Get appropriate redirect URI
          const REDIRECT_URI = getRedirectURI(origin, requestData);
          
          console.log('Redirect URI:', REDIRECT_URI);
          console.log('Client ID exists:', !!GOOGLE_CLIENT_ID);
          console.log('Client Secret exists:', !!GOOGLE_CLIENT_SECRET);
          console.log('Code fragment:', requestData.code.substring(0, 10) + '...');

          // Exchange code for tokens using fetch API
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
            const errorText = await tokenResponse.text();
            console.error('Token exchange error:', errorText);
            
            // Enhanced error logging
            console.error('Response status:', tokenResponse.status);
            console.error('Response status text:', tokenResponse.statusText);
            console.error('Request details:', {
              code_length: requestData.code.length,
              redirect_uri: REDIRECT_URI
            });
            
            return errorResponse(`Google token exchange failed: ${errorText}`, tokenResponse.status);
          }

          const tokens = await tokenResponse.json();
          console.log('Successfully exchanged code for tokens');
          console.log('Tokens received:', {
            access_token_exists: !!tokens.access_token,
            refresh_token_exists: !!tokens.refresh_token,
            expires_in: tokens.expires_in
          });
          
          return successResponse({ tokens });
        } catch (error) {
          console.error('Error exchanging code for tokens:', error);
          return errorResponse(`Error exchanging code: ${error.message}`, 500);
        }
      }

      // Handle calendar operations with existing tokens
      if (requestData.action && requestData.tokens) {
        const { action, tokens } = requestData;
        
        // Verify access token
        if (!tokens.access_token) {
          return errorResponse('No access token provided');
        }

        // Common headers for Google API requests
        const headers = {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json'
        };

        // List events
        if (action === 'list_events') {
          try {
            console.log('Fetching calendar events');
            
            const now = new Date();
            const threeMonthsLater = new Date(now);
            threeMonthsLater.setMonth(now.getMonth() + 3);

            const calendarResponse = await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now.toISOString()}&timeMax=${threeMonthsLater.toISOString()}&singleEvents=true&orderBy=startTime`,
              { headers }
            );

            if (!calendarResponse.ok) {
              const errorText = await calendarResponse.text();
              console.error('Calendar API error:', errorText);
              
              if (calendarResponse.status === 401) {
                return errorResponse('Google Calendar access has expired', 401);
              }
              
              return errorResponse(`Failed to fetch calendar events: ${errorText}`, calendarResponse.status);
            }

            const data = await calendarResponse.json();
            console.log(`Successfully fetched ${data.items?.length || 0} events`);
            return successResponse({ events: data.items || [] });
          } catch (error) {
            console.error('Error fetching calendar events:', error);
            return errorResponse(`Error fetching events: ${error.message}`, 500);
          }
        }

        // Create event
        if (action === 'create_event' && requestData.event) {
          try {
            console.log('Creating calendar event:', requestData.event);
            
            const { title, description, startDate, endDate } = requestData.event;
            
            if (!title || !startDate || !endDate) {
              return errorResponse('Missing required event fields (title, startDate, endDate)');
            }
            
            const calendarResponse = await fetch(
              'https://www.googleapis.com/calendar/v3/calendars/primary/events',
              {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  summary: title,
                  description: description || '',
                  start: {
                    dateTime: new Date(startDate).toISOString(),
                    timeZone: 'Europe/Oslo'
                  },
                  end: {
                    dateTime: new Date(endDate).toISOString(),
                    timeZone: 'Europe/Oslo'
                  }
                })
              }
            );

            if (!calendarResponse.ok) {
              const errorText = await calendarResponse.text();
              console.error('Calendar API error when creating event:', errorText);
              return errorResponse(`Failed to create calendar event: ${errorText}`, calendarResponse.status);
            }

            const data = await calendarResponse.json();
            console.log('Successfully created calendar event');
            return successResponse({ event: data });
          } catch (error) {
            console.error('Error creating calendar event:', error);
            return errorResponse(`Error creating event: ${error.message}`, 500);
          }
        }
        
        // Get list of calendars
        if (action === 'get_calendars') {
          try {
            console.log('Fetching user calendars');
            
            const calendarResponse = await fetch(
              'https://www.googleapis.com/calendar/v3/users/me/calendarList',
              { headers }
            );

            if (!calendarResponse.ok) {
              const errorText = await calendarResponse.text();
              console.error('Calendar API error when fetching calendars:', errorText);
              return errorResponse(`Failed to fetch calendars: ${errorText}`, calendarResponse.status);
            }

            const data = await calendarResponse.json();
            console.log(`Successfully fetched ${data.items?.length || 0} calendars`);
            return successResponse({ calendars: data.items || [] });
          } catch (error) {
            console.error('Error fetching calendars:', error);
            return errorResponse(`Error fetching calendars: ${error.message}`, 500);
          }
        }
      }

      return errorResponse('Invalid request: missing action, code, or tokens');
    }

    return errorResponse('Method not allowed', 405);
  } catch (error) {
    console.error('Edge function error:', error);
    return errorResponse(`Edge function error: ${error.message}`, 500);
  }
});
