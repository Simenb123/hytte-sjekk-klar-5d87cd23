
// Follow HTTP and CORS best practices
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
    
    // Better validation of environment variables
    if (!GOOGLE_CLIENT_ID) {
      console.error('Missing GOOGLE_CLIENT_ID in environment')
      return new Response(JSON.stringify({ 
        error: 'Konfigurasjonsfeil: GOOGLE_CLIENT_ID mangler',
        technicalError: 'Missing GOOGLE_CLIENT_ID environment variable' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    if (!GOOGLE_CLIENT_SECRET) {
      console.error('Missing GOOGLE_CLIENT_SECRET in environment')
      return new Response(JSON.stringify({ 
        error: 'Konfigurasjonsfeil: GOOGLE_CLIENT_SECRET mangler',
        technicalError: 'Missing GOOGLE_CLIENT_SECRET environment variable' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    // Get the actual hostname from request headers
    const origin = req.headers.get('origin') || 'https://hytte-sjekk-klar.lovable.app'
    
    // For production always use https
    const protocol = 'https'
    
    // Extract domain properly
    let domain = origin.includes('://') ? new URL(origin).host : origin
    
    // Remove protocol if present in domain
    domain = domain.replace(/^https?:\/\//, '')
    
    // Remove port if present
    domain = domain.split(':')[0]
    
    // Make sure to use the correct redirect path
    const REDIRECT_URI = `${protocol}://${domain}/auth/calendar`

    console.log(`Using redirect URI: ${REDIRECT_URI}`)
    console.log(`Authorization request from: ${origin}`)

    // Create oauth2Client
    try {
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

        try {
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
        } catch (error) {
          console.error('Error generating auth URL:', error.message || 'Unknown error')
          return new Response(JSON.stringify({ 
            error: 'Kunne ikke generere Google-autentiseringslenke',
            technicalError: error.message || 'Unknown error',
            errorType: 'AUTH_URL_GENERATION_ERROR'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
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
            
            // Safely log token info
            console.log('Received tokens:', {
              access_token_exists: !!tokens.access_token,
              refresh_token_exists: !!tokens.refresh_token,
              expiry_date: tokens.expiry_date,
            })
            
            if (!tokens.refresh_token) {
              console.log('No refresh token received. User may have already authorized the app before.')
            }
            
            return new Response(JSON.stringify({ tokens }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          } catch (error) {
            console.error('Token exchange error:', error.message || 'Unknown error')
            return new Response(JSON.stringify({ 
              error: 'Kunne ikke utveksle kode for tokens',
              technicalError: error.message || 'Unknown error',
              errorType: 'TOKEN_EXCHANGE_ERROR'
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
            // Validate tokens
            if (typeof requestData.tokens !== 'object' || !requestData.tokens.access_token) {
              throw new Error('Invalid tokens format provided')
            }
            
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
            console.error('Error listing events:', error.message || 'Unknown error')
            
            // Check for authorization errors
            const isAuthError = error.message?.includes('invalid_grant') || 
                              error.message?.includes('invalid_token') ||
                              error.message?.includes('expired')
            
            return new Response(JSON.stringify({ 
              error: isAuthError ? 'Google Calendar-tilgangen har utløpt' : 'Kunne ikke hente hendelser',
              technicalError: error.message || 'Unknown error',
              requiresReauth: isAuthError,
              errorType: isAuthError ? 'AUTH_ERROR' : 'EVENT_LISTING_ERROR'
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
            // Validate tokens
            if (typeof requestData.tokens !== 'object' || !requestData.tokens.access_token) {
              throw new Error('Invalid tokens format provided')
            }
            
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
            console.error('Error creating event:', error.message || 'Unknown error')
            return new Response(JSON.stringify({ 
              error: 'Kunne ikke opprette hendelse',
              technicalError: error.message || 'Unknown error',
              errorType: 'EVENT_CREATION_ERROR'
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
            // Validate tokens
            if (typeof requestData.tokens !== 'object' || !requestData.tokens.access_token) {
              throw new Error('Invalid tokens format provided')
            }
            
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
            console.error('Error getting calendar list:', error.message || 'Unknown error')
            return new Response(JSON.stringify({ 
              error: 'Kunne ikke hente kalenderliste',
              technicalError: error.message || 'Unknown error',
              errorType: 'CALENDAR_LIST_ERROR'
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          }
        }
        
        // Handle unknown POST request
        return new Response(JSON.stringify({ 
          error: 'Ukjent forespørsel', 
          errorType: 'UNKNOWN_REQUEST' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    } catch (oauthError) {
      console.error('OAuth client error:', oauthError.message || 'Unknown error')
      return new Response(JSON.stringify({ 
        error: 'Feil ved oppretting av OAuth-klient',
        technicalError: oauthError.message || 'Unknown OAuth client error',
        errorType: 'OAUTH_CLIENT_ERROR'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ 
      error: 'Metode ikke tillatt',
      errorType: 'METHOD_NOT_ALLOWED'
    }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    // Safe error logging
    console.error('Edge function error:', error.message || 'Unknown error')
    return new Response(JSON.stringify({ 
      error: 'Serverfeil',
      technicalError: error.message || 'Unknown error',
      errorType: 'EDGE_FUNCTION_ERROR'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
