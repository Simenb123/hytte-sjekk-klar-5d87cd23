import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

console.log("🚀 Google Calendar Edge Function starting up...");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Utility function to get required env variables
const getRequiredEnv = (name: string): string => {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

// Generate redirect URI based on origin
const getRedirectURI = (origin: string): string => {
  console.log(`Getting redirect URI based on origin: ${origin}`);
  
  // If origin is lovableproject.com or lovable.app, use special redirect URL
  if (origin.includes('lovableproject.com') || origin.includes('lovable.app')) {
    console.log('In Lovable preview environment, using special redirect URL');
    return `${origin}/auth/calendar`;
  }
  
  // Otherwise use the actual website (production)
  const redirectUri = `${origin}/auth/calendar`;
  console.log(`Generated redirect URI: ${redirectUri}`);
  return redirectUri;
};

// Generate Google OAuth URL
const generateAuthUrl = (clientId: string, redirectUri: string): string => {
  const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events');
  return `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${scope}&` +
    `access_type=offline&` +
    `prompt=consent`;
};

// Exchange code for tokens
const exchangeCodeForTokens = async (code: string, clientId: string, clientSecret: string, redirectUri: string) => {
  console.log('🔄 Exchanging authorization code for tokens...');
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Token exchange failed:', errorText);
    throw new Error(`Failed to exchange code for tokens: ${errorText}`);
  }

  const tokens = await response.json();
  console.log('✅ Token exchange successful');
  return tokens;
};

// Refresh access token
const refreshAccessToken = async (refreshToken: string, clientId: string, clientSecret: string) => {
  console.log('🔄 Refreshing access token...');
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Token refresh failed:', errorText);
    throw new Error(`Failed to refresh token: ${errorText}`);
  }

  const tokens = await response.json();
  console.log('✅ Token refresh successful');
  return tokens;
};

// Fetch Google Calendar events
const fetchEvents = async (accessToken: string) => {
  console.log('📅 Fetching calendar events');
  
  // First get list of calendars
  const calendarsResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (!calendarsResponse.ok) {
    const errorText = await calendarsResponse.text();
    console.error('Calendar API error when fetching calendars:', errorText);
    throw new Error(`Failed to fetch calendars: ${errorText}`);
  }

  const calendarsData = await calendarsResponse.json();
  const calendars = calendarsData.items || [];
  console.log(`Found ${calendars.length} calendars`);

  // Fetch events from all calendars
  const now = new Date();
  const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  const allEvents = [];
  
  for (const calendar of calendars) {
    try {
      const eventsResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events?` +
        `timeMin=${now.toISOString()}&` +
        `timeMax=${oneMonthLater.toISOString()}&` +
        `singleEvents=true&` +
        `orderBy=startTime&` +
        `maxResults=50`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );

      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        const events = (eventsData.items || []).map((event: any) => ({
          ...event,
          calendarSummary: calendar.summary,
          calendarId: calendar.id
        }));
        allEvents.push(...events);
      }
    } catch (error) {
      console.warn(`Failed to fetch events from calendar ${calendar.summary}:`, error);
    }
  }

  console.log(`✅ Fetched ${allEvents.length} events total`);
  return allEvents;
};

// Fetch Google Calendars
const fetchCalendars = async (accessToken: string) => {
  console.log('📋 Fetching calendar list');
  
  const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Calendar API error when fetching calendars:', errorText);
    throw new Error(`Failed to fetch calendars: ${errorText}`);
  }

  const data = await response.json();
  console.log(`✅ Fetched ${data.items?.length || 0} calendars`);
  return data.items || [];
};

serve(async (req) => {
  console.log(`\n🔵 === NEW REQUEST === ${new Date().toISOString()} ===`);
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('⚙️ CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const origin = req.headers.get('origin') || 'http://localhost:3000';
    
    // DEBUG ENDPOINT: Check environment variables
    if (url.pathname.includes('/debug')) {
      console.log('🧪 DEBUG: Checking environment variables...');
      
      const envCheck = {
        timestamp: new Date().toISOString(),
        available_env_vars: Object.keys(Deno.env.toObject()).sort(),
        google_client_id_exists: !!Deno.env.get('GOOGLE_CLIENT_ID'),
        google_client_secret_exists: !!Deno.env.get('GOOGLE_CLIENT_SECRET'),
        google_client_id_length: Deno.env.get('GOOGLE_CLIENT_ID')?.length || 0,
        google_client_secret_length: Deno.env.get('GOOGLE_CLIENT_SECRET')?.length || 0,
      };
      
      console.log('🔍 Environment check result:', envCheck);
      
      return new Response(JSON.stringify(envCheck, null, 2), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // SIMPLE TEST ENDPOINT: Basic functionality
    if (url.pathname.includes('/test')) {
      console.log('✅ TEST: Basic connectivity test');
      
      const testResult = {
        status: 'success',
        message: 'Google Calendar Edge Function is running!',
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url
      };
      
      return new Response(JSON.stringify(testResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check environment variables for actual functionality
    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    
    if (!googleClientId || !googleClientSecret) {
      console.error('❌ Missing Google credentials:', {
        clientIdExists: !!googleClientId,
        clientSecretExists: !!googleClientSecret
      });
      
      return new Response(JSON.stringify({ 
        error: 'Missing Google credentials',
        debug: {
          clientIdExists: !!googleClientId,
          clientSecretExists: !!googleClientSecret,
          availableEnvVars: Object.keys(Deno.env.toObject()).filter(key => key.includes('GOOGLE'))
        }
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log('✅ Environment variables validated');

    // Handle GET requests - OAuth URL generation
    if (req.method === 'GET') {
      console.log('🔗 Generating OAuth URL...');
      
      const redirectUri = getRedirectURI(origin);
      console.log(`Generating auth URL with redirect URI: ${redirectUri}`);
      
      const authUrl = generateAuthUrl(googleClientId, redirectUri);
      console.log(`Generated auth URL: ${authUrl}`);
      
      return new Response(JSON.stringify({ url: authUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Handle POST requests - OAuth code exchange and calendar operations
    if (req.method === 'POST') {
      const bodyText = await req.text();
      console.log(`📦 Request body: ${bodyText.substring(0, 200)}...`);
      
      const requestData = JSON.parse(bodyText);
      console.log(`📦 Request action: ${requestData.action || 'code_exchange'}`);
      
      // Handle OAuth code exchange (when user returns from Google)
      if (requestData.code && !requestData.action) {
        console.log('🔄 Handling OAuth code exchange...');
        
        const redirectUri = getRedirectURI(origin);
        const tokens = await exchangeCodeForTokens(
          requestData.code, 
          googleClientId, 
          googleClientSecret, 
          redirectUri
        );
        
        return new Response(JSON.stringify({ 
          success: true,
          tokens: tokens
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Handle calendar operations (list_events, get_calendars, etc.)
      if (requestData.action) {
        console.log(`📅 Handling calendar action: ${requestData.action}`);
        
        const { tokens } = requestData;
        if (!tokens || !tokens.access_token) {
          return new Response(JSON.stringify({ 
            error: 'Missing access token' 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        let accessToken = tokens.access_token;

        // Check if token needs refresh
        if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
          console.log('🔄 Access token expired, refreshing...');
          if (tokens.refresh_token) {
            const refreshedTokens = await refreshAccessToken(
              tokens.refresh_token, 
              googleClientId, 
              googleClientSecret
            );
            accessToken = refreshedTokens.access_token;
            // Return refreshed tokens to client
            return new Response(JSON.stringify({
              success: true,
              refreshedTokens: {
                ...tokens,
                access_token: refreshedTokens.access_token,
                expiry_date: Date.now() + (refreshedTokens.expires_in * 1000)
              }
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          } else {
            return new Response(JSON.stringify({ 
              error: 'Token expired and no refresh token available',
              requiresReauth: true
            }), {
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        }

        try {
          if (requestData.action === 'list_events') {
            const events = await fetchEvents(accessToken);
            return new Response(JSON.stringify({ 
              success: true,
              events: events
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          
          if (requestData.action === 'get_calendars') {
            const calendars = await fetchCalendars(accessToken);
            return new Response(JSON.stringify({ 
              success: true,
              calendars: calendars
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          
          return new Response(JSON.stringify({ 
            error: `Unsupported action: ${requestData.action}` 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });

        } catch (error) {
          console.error(`❌ Google API error for action ${requestData.action}:`, error);
          
          // Check if it's an auth error
          if (error.message.includes('401') || error.message.includes('Invalid Credentials')) {
            return new Response(JSON.stringify({ 
              error: 'Authentication failed',
              details: error.message,
              requiresReauth: true
            }), {
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          
          return new Response(JSON.stringify({ 
            error: 'Google API error',
            details: error.message
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
      
      return new Response(JSON.stringify({ 
        error: 'Invalid request format',
        message: 'Request must include either code for OAuth exchange or action for calendar operations'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(
      JSON.stringify({ error: `Method ${req.method} not allowed` }),
      { 
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('💥 Unhandled error in edge function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        stack: error.stack 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
