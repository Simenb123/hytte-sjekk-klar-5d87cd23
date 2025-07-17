import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
}

// Helper function to get date range
function getDateRange(daysAhead: number, baseDate: Date = new Date()) {
  const target = new Date(baseDate)
  target.setDate(baseDate.getDate() + daysAhead)

  const start = new Date(target)
  start.setHours(0, 0, 0, 0)

  const end = new Date(target)
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

// Reminder types
interface ReminderType {
  key: string
  daysAhead: number
  title: string
  emoji: string
  type: 'info' | 'warning' | 'success'
  checkText: string
}

const REMINDER_TYPES: ReminderType[] = [
  {
    key: '1-day-arrival',
    daysAhead: 1,
    title: 'Hytteopphold i morgen',
    emoji: '🏠',
    type: 'warning',
    checkText: '%1 dag%'
  },
  {
    key: 'arrival-today',
    daysAhead: 0,
    title: 'Ankomst i dag',
    emoji: '🎯',
    type: 'info',
    checkText: '%ankomst i dag%'
  }
]

async function processBookingsForReminder(
  supabase: any,
  reminderType: ReminderType,
  baseDate: Date
) {
  const { start, end } = getDateRange(reminderType.daysAhead, baseDate)
  
  console.log(`Checking for ${reminderType.key} reminders - date range:`, {
    start: start.toISOString(),
    end: end.toISOString()
  })

  // Find bookings that start in the specified time range
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select(`
      id,
      title,
      start_date,
      end_date,
      user_id
    `)
    .gte('start_date', start.toISOString())
    .lt('start_date', end.toISOString())

  if (bookingsError) {
    console.error(`Error fetching bookings for ${reminderType.key}:`, bookingsError)
    throw bookingsError
  }

  console.log(`Found ${bookings?.length || 0} bookings for ${reminderType.key}`)

  if (!bookings || bookings.length === 0) {
    return 0
  }

  let notificationsCreated = 0

  for (const booking of bookings) {
    try {
      // Check if we've already sent this type of reminder for this booking
      const { data: existingNotification } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', booking.user_id)
        .eq('related_booking_id', booking.id)
        .eq('type', reminderType.type)
        .like('title', reminderType.checkText)
        .maybeSingle()

      if (existingNotification) {
        console.log(`${reminderType.key} reminder already sent for booking ${booking.id}`)
        continue
      }

      // Get user profile separately
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', booking.user_id)
        .maybeSingle()

      const userName = profile?.first_name || 'Bruker'
      const startDate = new Date(booking.start_date)
      
      const dateFormatter = new Intl.DateTimeFormat('nb-NO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })

      const timeFormatter = new Intl.DateTimeFormat('nb-NO', {
        hour: '2-digit',
        minute: '2-digit'
      })

      let title: string
      let message: string

      if (reminderType.key === '1-day-arrival') {
        title = `${reminderType.emoji} Påminnelse: ${reminderType.title}`
        message = `Hei ${userName}! Du har opphold "${booking.title}" som starter i morgen (${dateFormatter.format(startDate)}). Husk å pakke og sjekke værmeldingen!`
      } else if (reminderType.key === 'arrival-today') {
        title = `${reminderType.emoji} ${reminderType.title}!`
        message = `Hei ${userName}! I dag starter ditt opphold "${booking.title}". Ha en fantastisk tid på hytta! 🌲`
      } else {
        title = `${reminderType.emoji} ${reminderType.title}`
        message = `Hei ${userName}! Påminnelse om opphold "${booking.title}".`
      }

      // Create notification
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: booking.user_id,
          title,
          message,
          type: reminderType.type,
          related_booking_id: booking.id,
          read: false
        })

      if (notificationError) {
        console.error(`Error creating ${reminderType.key} notification for booking ${booking.id}:`, notificationError)
        continue
      }

      notificationsCreated++
      console.log(`Created ${reminderType.key} reminder for booking: ${booking.title} (${booking.id})`)

    } catch (error) {
      console.error(`Error processing booking ${booking.id} for ${reminderType.key}:`, error)
      continue
    }
  }

  return notificationsCreated
}

async function processDepartureReminders(supabase: any, baseDate: Date) {
  const { start, end } = getDateRange(0, baseDate) // Today
  
  console.log('Checking for departure reminders - date range:', {
    start: start.toISOString(),
    end: end.toISOString()
  })

  // Find bookings that end today
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select(`
      id,
      title,
      start_date,
      end_date,
      user_id
    `)
    .gte('end_date', start.toISOString())
    .lt('end_date', end.toISOString())

  if (bookingsError) {
    console.error('Error fetching bookings for departure reminders:', bookingsError)
    throw bookingsError
  }

  console.log(`Found ${bookings?.length || 0} bookings ending today`)

  if (!bookings || bookings.length === 0) {
    return 0
  }

  let notificationsCreated = 0

  for (const booking of bookings) {
    try {
      // Check if we've already sent a departure reminder for this booking
      const { data: existingNotification } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', booking.user_id)
        .eq('related_booking_id', booking.id)
        .eq('type', 'info')
        .like('title', '%avreise%')
        .maybeSingle()

      if (existingNotification) {
        console.log(`Departure reminder already sent for booking ${booking.id}`)
        continue
      }

      // Get user profile separately
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', booking.user_id)
        .maybeSingle()

      const userName = profile?.first_name || 'Bruker'
      const endDate = new Date(booking.end_date)
      
      const dateFormatter = new Intl.DateTimeFormat('nb-NO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })

      const title = '🏃‍♂️ Avreise i dag'
      const message = `Hei ${userName}! I dag slutter ditt opphold "${booking.title}". Husk å rydde og låse hytta før du drar. Takk for besøket! 👋`

      // Create notification
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: booking.user_id,
          title,
          message,
          type: 'info',
          related_booking_id: booking.id,
          read: false
        })

      if (notificationError) {
        console.error(`Error creating departure notification for booking ${booking.id}:`, notificationError)
        continue
      }

      notificationsCreated++
      console.log(`Created departure reminder for booking: ${booking.title} (${booking.id})`)

    } catch (error) {
      console.error(`Error processing departure for booking ${booking.id}:`, error)
      continue
    }
  }

  return notificationsCreated
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

    const now = new Date()
    console.log('Daily reminders running at:', now.toISOString())

    let totalNotificationsCreated = 0

    // Process arrival reminders
    for (const reminderType of REMINDER_TYPES) {
      const created = await processBookingsForReminder(supabase, reminderType, now)
      totalNotificationsCreated += created
    }

    // Process departure reminders
    const departureNotifications = await processDepartureReminders(supabase, now)
    totalNotificationsCreated += departureNotifications

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Daily reminders processing complete. Created ${totalNotificationsCreated} notifications.`,
        processed: totalNotificationsCreated,
        timestamp: now.toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in daily-reminders function:', error)
    
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