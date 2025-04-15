
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
    
    // Improved environment variable validation
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      console.error('Missing required Google credentials:', {
        hasClientId: !!GOOGLE_CLIENT_ID,
        hasClientSecret: !!GOOGLE_CLIENT_SECRET
      })
      throw new Error('Konfigurasjonsfeil: Manglende Google-innstillinger')
    }
    
    // Get the actual hostname from request headers for better redirect handling
    const origin = req.headers.get('origin') || 'https://hytte-sjekk-klar.lovable.app'
    console.log('Request origin:', origin)
    
    const protocol = origin.startsWith('http://localhost') ? 'http' : 'https'
    let domain = origin.includes('://') ? new URL(origin).host : origin
    domain = domain.replace(/^https?:\/\//, '').split(':')[0]
    
    const REDIRECT_URI = `${protocol}://${domain}/auth/calendar`
    console.log('Using redirect URI:', REDIRECT_URI)

    // Create oauth2Client with better error handling
    try {
      const oauth2Client = new google.auth.OAuth2(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        REDIRECT_URI
      )
      console.log('Successfully created OAuth2 client')

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

          console.log('Generated auth URL successfully:', url)
          return new Response(JSON.stringify({ url }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        } catch (error) {
          console.error('Error generating auth URL:', error)
          return new Response(JSON.stringify({ 
            error: 'Kunne ikke generere Google-autentiseringslenke',
            technicalError: error.message,
            errorType: 'AUTH_URL_GENERATION_ERROR'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      }

      // Handle POST requests (token exchange, calendar operations)
      if (req.method === 'POST') {
        const requestData = await req.json()
        
        // Handle token exchange
        if (requestData.code) {
          console.log('Exchanging code for tokens, code starts with:', requestData.code.substring(0, 10))
          try {
            const { tokens } = await oauth2Client.getToken(requestData.code)
            oauth2Client.setCredentials(tokens)
            
            // Log token info (safely)
            console.log('Received tokens:', {
              access_token_exists: !!tokens.access_token,
              refresh_token_exists: !!tokens.refresh_token,
              expiry_date: tokens.expiry_date,
            })
            
            return new Response(JSON.stringify({ tokens }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          } catch (error) {
            console.error('Token exchange error details:', error)
            
            // Check for specific error types for better error reporting
            let errorMessage = 'Kunne ikke utveksle kode for tokens';
            if (error.message?.includes('invalid_grant')) {
              errorMessage = 'Ugyldig eller utløpt autentiseringskode. Prøv å koble til Google Calendar på nytt.';
            }
            
            return new Response(JSON.stringify({ 
              error: errorMessage,
              technicalError: error.message,
              errorType: 'TOKEN_EXCHANGE_ERROR'
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          }
        }
        
        // Handle calendar operations with token refresh
        if (requestData.action && requestData.tokens) {
          try {
            oauth2Client.setCredentials(requestData.tokens)
            
            // Set up token refresh callback
            oauth2Client.on('tokens', (tokens) => {
              console.log('Tokens refreshed:', {
                access_token_exists: !!tokens.access_token,
                refresh_token_exists: !!tokens.refresh_token,
                expiry_date: tokens.expiry_date,
              })
              
              if (tokens.refresh_token) {
                // Store the new refresh token
                requestData.tokens.refresh_token = tokens.refresh_token
              }
              // Update the access token
              requestData.tokens.access_token = tokens.access_token
            })

            const calendar = google.calendar({ 
              version: 'v3', 
              auth: oauth2Client 
            })

            // List events
            if (requestData.action === 'list_events') {
              console.log('Fetching calendar events with token that expires at:', requestData.tokens.expiry_date)
              const now = new Date()
              const threeMonthsLater = new Date(now)
              threeMonthsLater.setMonth(now.getMonth() + 3)
              
              try {
                const response = await calendar.events.list({
                  calendarId: 'primary',
                  timeMin: now.toISOString(),
                  timeMax: threeMonthsLater.toISOString(),
                  singleEvents: true,
                  orderBy: 'startTime',
                  maxResults: 100
                })
                
                console.log(`Successfully fetched ${response.data.items?.length || 0} events`)
                
                // Check if tokens were refreshed and return them
                const refreshedTokens = oauth2Client.credentials;
                const tokensChanged = JSON.stringify(refreshedTokens) !== JSON.stringify(requestData.tokens);
                
                return new Response(JSON.stringify({ 
                  events: response.data.items,
                  ...(tokensChanged ? { refreshedTokens } : {})
                }), {
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
              } catch (apiError) {
                console.error('Google Calendar API error:', apiError)
                
                // Check for auth errors to prompt re-authentication
                const isAuthError = apiError.message?.includes('invalid_grant') || 
                                  apiError.message?.includes('invalid_token') ||
                                  apiError.message?.includes('expired');
                
                return new Response(JSON.stringify({ 
                  error: isAuthError ? 'Google Calendar-tilgangen har utløpt' : 'Kunne ikke hente kalenderhendelser',
                  technicalError: apiError.message,
                  requiresReauth: isAuthError,
                  errorType: isAuthError ? 'AUTH_ERROR' : 'API_ERROR'
                }), {
                  status: 400,
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
              }
            }

            // Get calendar list
            if (requestData.action === 'get_calendars') {
              console.log('Fetching calendar list')
              try {
                const response = await calendar.calendarList.list()
                console.log(`Successfully fetched ${response.data.items?.length || 0} calendars`)
                
                // Check if tokens were refreshed
                const refreshedTokens = oauth2Client.credentials;
                const tokensChanged = JSON.stringify(refreshedTokens) !== JSON.stringify(requestData.tokens);
                
                return new Response(JSON.stringify({ 
                  calendars: response.data.items,
                  ...(tokensChanged ? { refreshedTokens } : {})
                }), {
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
              } catch (apiError) {
                console.error('Google Calendar API error:', apiError)
                
                // Check for auth errors
                const isAuthError = apiError.message?.includes('invalid_grant') || 
                                  apiError.message?.includes('invalid_token') ||
                                  apiError.message?.includes('expired');
                
                return new Response(JSON.stringify({ 
                  error: isAuthError ? 'Google Calendar-tilgangen har utløpt' : 'Kunne ikke hente kalenderliste',
                  technicalError: apiError.message,
                  requiresReauth: isAuthError,
                  errorType: isAuthError ? 'AUTH_ERROR' : 'API_ERROR'
                }), {
                  status: 400,
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
              }
            }

            // Create event
            if (requestData.action === 'create_event' && requestData.event) {
              console.log('Creating calendar event:', requestData.event.title)
              try {
                const response = await calendar.events.insert({
                  calendarId: 'primary',
                  requestBody: {
                    summary: requestData.event.title,
                    description: requestData.event.description || '',
                    start: {
                      dateTime: new Date(requestData.event.startDate).toISOString(),
                      timeZone: 'Europe/Oslo',
                    },
                    end: {
                      dateTime: new Date(requestData.event.endDate).toISOString(),
                      timeZone: 'Europe/Oslo',
                    },
                  },
                })
                
                console.log('Event created successfully:', response.data.id)
                
                // Check if tokens were refreshed
                const refreshedTokens = oauth2Client.credentials;
                const tokensChanged = JSON.stringify(refreshedTokens) !== JSON.stringify(requestData.tokens);
                
                return new Response(JSON.stringify({ 
                  event: response.data,
                  ...(tokensChanged ? { refreshedTokens } : {})
                }), {
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
              } catch (apiError) {
                console.error('Google Calendar API error:', apiError)
                
                // Check for auth errors
                const isAuthError = apiError.message?.includes('invalid_grant') || 
                                  apiError.message?.includes('invalid_token') ||
                                  apiError.message?.includes('expired');
                
                return new Response(JSON.stringify({ 
                  error: isAuthError ? 'Google Calendar-tilgangen har utløpt' : 'Kunne ikke opprette kalenderhendelse',
                  technicalError: apiError.message,
                  requiresReauth: isAuthError,
                  errorType: isAuthError ? 'AUTH_ERROR' : 'API_ERROR'
                }), {
                  status: 400,
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
              }
            }
            
            // If no valid action was specified
            return new Response(JSON.stringify({ 
              error: 'Ugyldig kalenderoperasjon',
              errorType: 'INVALID_ACTION'
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          } catch (error) {
            console.error('Calendar operation error:', error)
            
            // Check for specific error types
            const isAuthError = error.message?.includes('invalid_grant') || 
                              error.message?.includes('invalid_token') ||
                              error.message?.includes('expired')
            
            return new Response(JSON.stringify({ 
              error: isAuthError ? 
                'Google Calendar-tilgangen har utløpt' : 
                'Kunne ikke utføre kalenderoperasjonen',
              technicalError: error.message,
              requiresReauth: isAuthError,
              errorType: isAuthError ? 'AUTH_ERROR' : 'CALENDAR_OPERATION_ERROR'
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          }
        }
        
        // If the request doesn't contain required data
        return new Response(JSON.stringify({ 
          error: 'Mangler påkrevde data for denne operasjonen',
          errorType: 'MISSING_DATA'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Handle unknown request method
      return new Response(JSON.stringify({ 
        error: 'Ukjent forespørsel eller metode',
        errorType: 'UNKNOWN_REQUEST'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })

    } catch (oauthError) {
      console.error('OAuth client error:', oauthError)
      return new Response(JSON.stringify({ 
        error: 'Feil ved oppretting av OAuth-klient',
        technicalError: oauthError.message,
        errorType: 'OAUTH_CLIENT_ERROR'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(JSON.stringify({ 
      error: 'Serverfeil',
      technicalError: error.message,
      errorType: 'EDGE_FUNCTION_ERROR'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
