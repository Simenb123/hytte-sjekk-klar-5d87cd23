
import { GoogleCalendarEvent } from './types.ts';

export const fetchEvents = async (accessToken: string) => {
  const now = new Date();
  const threeMonthsLater = new Date(now);
  threeMonthsLater.setMonth(now.getMonth() + 3);

  // Fetch events from all calendars the user has access to
  console.log('Fetching events from all accessible calendars');
  
  // First get the calendar list
  const { items: calendars } = await fetchCalendars(accessToken);
  console.log(`Found ${calendars.length} calendars`);
  
  let allEvents: any[] = [];
  
  // Fetch events from each calendar
  for (const calendar of calendars) {
    try {
      console.log(`Fetching events from calendar: ${calendar.summary} (${calendar.id})`);
      const calendarResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events?timeMin=${now.toISOString()}&timeMax=${threeMonthsLater.toISOString()}&singleEvents=true&orderBy=startTime`,
        { 
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!calendarResponse.ok) {
        console.error(`Failed to fetch events from calendar ${calendar.summary}:`, await calendarResponse.text());
        continue; // Skip this calendar but continue with others
      }

      const calendarData = await calendarResponse.json();
      const events = calendarData.items || [];
      console.log(`Found ${events.length} events in calendar ${calendar.summary}`);
      
      // Add calendar info to each event for debugging
      events.forEach((event: any) => {
        event.calendarSummary = calendar.summary;
        event.calendarId = calendar.id;
      });
      
      allEvents = allEvents.concat(events);
    } catch (error) {
      console.error(`Error fetching events from calendar ${calendar.summary}:`, error);
      continue; // Skip this calendar but continue with others
    }
  }

  // Normalize events and sort by start time
  const normalizedEvents = allEvents.map((event: any) => {
    // Handle both all-day and timed events
    const isAllDay = !!event.start?.date;
    
    // Convert all-day events to dateTime format for consistent handling
    if (isAllDay) {
      const startDate = new Date(event.start.date + 'T00:00:00');
      const endDate = new Date(event.end.date + 'T23:59:59');
      
      return {
        ...event,
        allDay: true,
        start: {
          dateTime: startDate.toISOString(),
          timeZone: 'Europe/Oslo'
        },
        end: {
          dateTime: endDate.toISOString(),
          timeZone: 'Europe/Oslo'
        }
      };
    } else {
      return {
        ...event,
        allDay: false
      };
    }
  });

  normalizedEvents.sort((a, b) => {
    const startA = new Date(a.start.dateTime).getTime();
    const startB = new Date(b.start.dateTime).getTime();
    return startA - startB;
  });

  console.log(`Total events found across all calendars: ${normalizedEvents.length}`);
  
  return {
    items: normalizedEvents,
    nextPageToken: null,
    summary: 'All accessible calendars'
  };
};

export const fetchCalendars = async (accessToken: string) => {
  const calendarResponse = await fetch(
    'https://www.googleapis.com/calendar/v3/users/me/calendarList',
    { 
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!calendarResponse.ok) {
    const errorText = await calendarResponse.text();
    console.error('Calendar API error when fetching calendars:', errorText);
    throw new Error(`Failed to fetch calendars: ${errorText}`);
  }

  return calendarResponse.json();
};

export const createEvent = async (accessToken: string, event: GoogleCalendarEvent, calendarId = 'primary') => {
  const calendarResponse = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    }
  );

  if (!calendarResponse.ok) {
    const errorText = await calendarResponse.text();
    console.error('Calendar API error when creating event:', errorText);
    throw new Error(`Failed to create calendar event: ${errorText}`);
  }

  return calendarResponse.json();
};

// Nye funksjoner for å håndtere felles kalender for hytta

export const createOrFindHyttaCalendar = async (accessToken: string, calendarName = 'Hytte Booking') => {
  console.log(`Looking for or creating a calendar named "${calendarName}"`);
  
  // Først sjekk om kalenderen allerede eksisterer
  const { items: calendars } = await fetchCalendars(accessToken);
  const existingCalendar = calendars.find(cal => cal.summary === calendarName);
  
  if (existingCalendar) {
    console.log(`Found existing calendar "${calendarName}" with ID: ${existingCalendar.id}`);
    return existingCalendar;
  }
  
  // Opprett ny kalender hvis den ikke finnes
  console.log(`Creating new calendar "${calendarName}"`);
  const createResponse = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        summary: calendarName,
        description: 'Felles bookingkalender for hytta',
        timeZone: 'Europe/Oslo'
      })
    }
  );

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    console.error('Calendar API error when creating new calendar:', errorText);
    throw new Error(`Failed to create new calendar: ${errorText}`);
  }

  const newCalendar = await createResponse.json();
  console.log(`Created new calendar with ID: ${newCalendar.id}`);
  return newCalendar;
};

export const shareCalendarWithFamily = async (accessToken: string, calendarId: string, emails: string[]) => {
  console.log(`Sharing calendar ${calendarId} with ${emails.length} family members`);
  
  const sharePromises = emails.map(async (email) => {
    const shareResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/acl`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: 'writer',  // Gi skrivetilgang så alle kan legge til/endre bookinger
          scope: {
            type: 'user',
            value: email
          }
        })
      }
    );

    if (!shareResponse.ok) {
      const errorText = await shareResponse.text();
      console.error(`Error sharing calendar with ${email}:`, errorText);
      return { email, success: false, error: errorText };
    }

    return { email, success: true };
  });

  return Promise.all(sharePromises);
};

export const getCalendarSharingLink = async (accessToken: string, calendarId: string) => {
  // Hent kalenderen for å få ID som trengs for URL
  const calendarResponse = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!calendarResponse.ok) {
    const errorText = await calendarResponse.text();
    console.error('Error getting calendar details:', errorText);
    throw new Error(`Failed to get calendar details: ${errorText}`);
  }

  const calendar = await calendarResponse.json();
  
  // Returner både standard Google Calendar URL og iCal URL for import i andre kalenderapps
  return {
    googleCalendarUrl: `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(calendar.id)}`,
    icalUrl: `https://calendar.google.com/calendar/ical/${encodeURIComponent(calendar.id)}/public/basic.ics`
  };
};
