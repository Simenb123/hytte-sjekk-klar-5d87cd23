
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
    const REDIRECT_URI = 'http://localhost:5173/calendar'  // Update this for production

    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      REDIRECT_URI
    )

    // Generate auth URL
    if (req.method === 'GET') {
      const scopes = [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events'
      ]

      const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
      })

      return new Response(JSON.stringify({ url }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Handle OAuth callback
    if (req.method === 'POST') {
      const requestData = await req.json()
      
      // Handle token exchange
      if (requestData.code) {
        const { tokens } = await oauth2Client.getToken(requestData.code)
        oauth2Client.setCredentials(tokens)
        
        return new Response(JSON.stringify({ tokens }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      
      // Handle calendar listing
      if (requestData.action === 'list_events' && requestData.tokens) {
        oauth2Client.setCredentials(requestData.tokens)
        
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
        const now = new Date()
        const threeMonthsLater = new Date(now)
        threeMonthsLater.setMonth(now.getMonth() + 3)
        
        const response = await calendar.events.list({
          calendarId: 'primary',
          timeMin: now.toISOString(),
          timeMax: threeMonthsLater.toISOString(),
          singleEvents: true,
          orderBy: 'startTime',
        })
        
        return new Response(JSON.stringify({ events: response.data.items }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      
      // Handle creating events
      if (requestData.action === 'create_event' && requestData.tokens && requestData.event) {
        oauth2Client.setCredentials(requestData.tokens)
        
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
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
        
        return new Response(JSON.stringify({ event: response.data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
