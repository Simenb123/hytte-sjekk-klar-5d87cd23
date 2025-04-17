
import { GoogleCalendarEvent } from './types.ts';

export const fetchEvents = async (accessToken: string) => {
  const now = new Date();
  const threeMonthsLater = new Date(now);
  threeMonthsLater.setMonth(now.getMonth() + 3);

  const calendarResponse = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now.toISOString()}&timeMax=${threeMonthsLater.toISOString()}&singleEvents=true&orderBy=startTime`,
    { 
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!calendarResponse.ok) {
    const errorText = await calendarResponse.text();
    console.error('Calendar API error:', errorText);
    throw new Error(`Failed to fetch calendar events: ${errorText}`);
  }

  return calendarResponse.json();
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
