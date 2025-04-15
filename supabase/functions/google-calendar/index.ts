
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { google } from 'https://esm.sh/googleapis@129.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')
    const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')
    
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      console.error('Missing Google credentials in environment')
      return new Response(JSON.stringify({ 
        error: 'Server configuration error - missing Google credentials' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    // Get the actual hostname from the request headers for proper redirect URI
    const origin = req.headers.get('origin') || req.headers.get('host') || 'localhost:5173'
    const protocol = origin.includes('localhost') ? 'http' : 'https'
    
    // Handle both domain.com and domain.com/ formats
    let domain = origin.includes('://') ? new URL(origin).host : origin
    // Remove port if present
    domain = domain.split(':')[0]
    
    // Make sure to use the correct redirect path that matches what's configured in Google Cloud
    const REDIRECT_URI = `${protocol}://${domain}/auth/calendar`

    console.log(`Using redirect URI: ${REDIRECT_URI}`)
    console.log(`Authorization request from: ${origin}`)

    // Create oauth2Client
    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      REDIRECT_URI
    )

    // Generate auth URL
    if (req.method === 'GET') {
      console.log('Generating auth URL')
      const scopes = [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.settings.readonly'
      ]

      const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent', // Always show consent screen to get refresh token
        include_granted_scopes: true
      })

      console.log('Generated auth URL:', url)
      return new Response(JSON.stringify({ url }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Handle OAuth callback
    if (req.method === 'POST') {
      const requestData = await req.json()
      
      // Handle token exchange
      if (requestData.code) {
        console.log('Exchanging code for tokens')
        try {
          const { tokens } = await oauth2Client.getToken(requestData.code)
          oauth2Client.setCredentials(tokens)
          
          // Check that we have refresh token
          if (!tokens.refresh_token) {
            console.log('No refresh token received. User may have already authorized the app before.')
          } else {
            console.log('Successfully received refresh token')
          }
          
          console.log('Token exchange successful', JSON.stringify({
            access_token_exists: !!tokens.access_token,
            refresh_token_exists: !!tokens.refresh_token,
            expiry_date: tokens.expiry_date,
          }))
          
          return new Response(JSON.stringify({ tokens }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        } catch (error) {
          console.error('Token exchange error:', error)
          return new Response(JSON.stringify({ 
            error: 'Failed to exchange code for tokens',
            details: error.message,
            code: requestData.code
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      }
      
      // Handle calendar listing
      if (requestData.action === 'list_events' && requestData.tokens) {
        console.log('Listing calendar events')
        try {
          oauth2Client.setCredentials(requestData.tokens)
          
          const calendar = google.calendar({ 
            version: 'v3', 
            auth: oauth2Client
          })
          
          const now = new Date()
          const threeMonthsLater = new Date(now)
          threeMonthsLater.setMonth(now.getMonth() + 3)
          
          console.log('Fetching events from primary calendar')
          const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: now.toISOString(),
            timeMax: threeMonthsLater.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
            maxResults: 100
          })
          
          console.log(`Successfully fetched ${response.data.items?.length || 0} events`)
          
          return new Response(JSON.stringify({ events: response.data.items }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        } catch (error) {
          console.error('Error listing events:', error)
          
          // Check if it's an authorization error that needs refresh
          const authError = error.message?.includes('invalid_grant') || 
                            error.message?.includes('invalid_token') ||
                            error.message?.includes('expired');
          
          return new Response(JSON.stringify({ 
            error: 'Failed to list events',
            details: error.message,
            requiresReauth: authError,
            errorCode: error.code || 'UNKNOWN_ERROR'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      }
      
      // Handle creating events
      if (requestData.action === 'create_event' && requestData.tokens && requestData.event) {
        console.log('Creating calendar event:', requestData.event.title)
        try {
          oauth2Client.setCredentials(requestData.tokens)
          
          const calendar = google.calendar({ 
            version: 'v3', 
            auth: oauth2Client 
          })
          
          const event = requestData.event
          
          const response = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: {
              summary: event.title,
              description: event.description || '',
              start: {
                dateTime: new Date(event.startDate).toISOString(),
                timeZone: 'Europe/Oslo',
              },
              end: {
                dateTime: new Date(event.endDate).toISOString(),
                timeZone: 'Europe/Oslo',
              },
            },
          })
          
          console.log('Event created successfully', response.data.id)
          
          return new Response(JSON.stringify({ event: response.data }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        } catch (error) {
          console.error('Error creating event:', error)
          return new Response(JSON.stringify({ 
            error: 'Failed to create event',
            details: error.message,
            errorObject: JSON.stringify(error)
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      }
      
      // Handle getting calendar list
      if (requestData.action === 'get_calendars' && requestData.tokens) {
        console.log('Getting calendar list')
        try {
          oauth2Client.setCredentials(requestData.tokens)
          
          const calendar = google.calendar({ 
            version: 'v3', 
            auth: oauth2Client 
          })
          
          const response = await calendar.calendarList.list()
          
          console.log(`Successfully fetched ${response.data.items?.length || 0} calendars`)
          
          return new Response(JSON.stringify({ calendars: response.data.items }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        } catch (error) {
          console.error('Error getting calendar list:', error)
          return new Response(JSON.stringify({ 
            error: 'Failed to get calendar list',
            details: error.message,
            errorObject: JSON.stringify(error)
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      }
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      errorObject: JSON.stringify(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
