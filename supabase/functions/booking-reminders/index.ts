
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get current date and calculate 3 days from now
    const now = new Date()
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(now.getDate() + 3)
    
    // Format dates for SQL comparison (start and end of the day)
    const startOfTargetDay = new Date(threeDaysFromNow)
    startOfTargetDay.setHours(0, 0, 0, 0)
    
    const endOfTargetDay = new Date(threeDaysFromNow)
    endOfTargetDay.setHours(23, 59, 59, 999)

    console.log('Checking for bookings starting on:', startOfTargetDay.toISOString())

    // Find bookings that start exactly 3 days from now
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        title,
        start_date,
        end_date,
        user_id,
        profiles!inner(first_name, last_name)
      `)
      .gte('start_date', startOfTargetDay.toISOString())
      .lt('start_date', endOfTargetDay.toISOString())

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError)
      throw bookingsError
    }

    console.log(`Found ${bookings?.length || 0} bookings starting in 3 days`)

    if (!bookings || bookings.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No bookings found for 3-day reminder',
          processed: 0 
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    let notificationsCreated = 0

    // Process each booking
    for (const booking of bookings) {
      try {
        // Check if we've already sent a 3-day reminder for this booking
        const { data: existingNotification } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', booking.user_id)
          .eq('related_booking_id', booking.id)
          .eq('type', 'warning')
          .like('title', '%3 dager%')
          .single()

        if (existingNotification) {
          console.log(`3-day reminder already sent for booking ${booking.id}`)
          continue
        }

        const userName = booking.profiles?.first_name || 'Bruker'
        const startDate = new Date(booking.start_date)
        const endDate = new Date(booking.end_date)
        
        const dateFormatter = new Intl.DateTimeFormat('nb-NO', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })

        const title = '📅 Påminnelse: Hytteopphold om 3 dager'
        const message = `Hei ${userName}! Du har et opphold "${booking.title}" som starter ${dateFormatter.format(startDate)}. Husk å forberede deg og sjekke værmeldingen!`

        // Create notification
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: booking.user_id,
            title,
            message,
            type: 'warning',
            related_booking_id: booking.id,
            read: false
          })

        if (notificationError) {
          console.error(`Error creating notification for booking ${booking.id}:`, notificationError)
          continue
        }

        notificationsCreated++
        console.log(`Created 3-day reminder for booking: ${booking.title} (${booking.id})`)

      } catch (error) {
        console.error(`Error processing booking ${booking.id}:`, error)
        continue
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processing complete. Created ${notificationsCreated} reminder notifications.`,
        processed: notificationsCreated,
        totalBookings: bookings.length
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in booking-reminders function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
