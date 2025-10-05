
import { GoogleCalendarEvent } from './types.ts';

export const fetchEvents = async (accessToken: string, filters?: {
  selectedCalendars?: string[];
  filterWeekEvents?: boolean;
  filterHolidays?: boolean;
}) => {
  const now = new Date();
  const threeMonthsLater = new Date(now);
  threeMonthsLater.setMonth(now.getMonth() + 3);

  // FORCED REDEPLOYMENT CHANGE v2.1 - Enhanced aggressive logging
  console.log('🚀 REDEPLOYED VERSION 2.1 - Starting fetchEvents with ULTRA DETAILED logging');
  console.log('🔍 ULTRA DEBUG - Raw filters object:', JSON.stringify(filters, null, 2));
  console.log('🔍 ULTRA DEBUG - filterWeekEvents:', filters?.filterWeekEvents, 'typeof:', typeof filters?.filterWeekEvents);
  console.log('🔍 ULTRA DEBUG - filterHolidays:', filters?.filterHolidays, 'typeof:', typeof filters?.filterHolidays);
  console.log('🔍 ULTRA DEBUG - selectedCalendars:', filters?.selectedCalendars, 'length:', filters?.selectedCalendars?.length);
  console.log('🔍 ULTRA DEBUG - Timestamp:', new Date().toISOString());
  
  // First get the calendar list
  const { items: calendars } = await fetchCalendars(accessToken);
  console.log(`Found ${calendars.length} calendars`);
  
  // Filter calendars based on selection
  const calendarsToFetch = filters?.selectedCalendars && filters.selectedCalendars.length > 0
    ? calendars.filter(cal => filters.selectedCalendars!.includes(cal.id))
    : calendars;
    
  console.log(`Fetching from ${calendarsToFetch.length} selected calendars`);
  
  let allEvents: any[] = [];
  
  // Fetch events from each selected calendar
  for (const calendar of calendarsToFetch) {
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
      
      // Add calendar info to each event and apply filtering
      let filteredEvents = events.map((event: any) => {
        event.calendarSummary = calendar.summary;
        event.calendarId = calendar.id;
        return event;
      });
      
      // Apply event filtering with detailed logging
      if (filters) {
        console.log(`🔍 FILTER DEBUG - Starting to filter ${filteredEvents.length} events from calendar ${calendar.summary}`);
        filteredEvents = filteredEvents.filter((event: any) => {
          const summary = event.summary?.toLowerCase() || '';
          const originalSummary = event.summary || '';
          
          console.log(`🔍 FILTER DEBUG - Processing event: "${originalSummary}" (lowercase: "${summary}")`);
          
          // ULTRA ENHANCED WEEK FILTERING v2.1
          if (filters.filterWeekEvents) {
            console.log(`🚀 ULTRA DEBUG - Week filtering ENABLED, analyzing: "${originalSummary}"`);
            console.log(`🚀 ULTRA DEBUG - Lowercase version: "${summary}"`);
            
            // Test exact text match first for "Uke 34 i 2025"
            const exactTestCase = summary === 'uke 34 i 2025';
            console.log(`🚀 ULTRA DEBUG - Exact match test for 'uke 34 i 2025': ${exactTestCase}`);
            
            // Enhanced regex patterns with ultra-detailed testing
            const weekPatterns = [
              { pattern: /uke \d+( i \d+)?/i, name: 'Norwegian Uke' },
              { pattern: /^uke \d+/i, name: 'Starts with Uke' },
              { pattern: /uke/i, name: 'Contains Uke' },
              { pattern: /week \d+/i, name: 'English Week' },
              { pattern: /ukenr/i, name: 'Week Number' },
              { pattern: /\d+\s*uke/i, name: 'Number Uke' }
            ];
            
            let isWeekEvent = false;
            
            // Test each pattern with ultra-detailed logging
            weekPatterns.forEach(({ pattern, name }, index) => {
              const matches = pattern.test(summary);
              const matchesOriginal = pattern.test(originalSummary);
              console.log(`🚀 ULTRA DEBUG - Pattern ${index} "${name}" (${pattern}):`);
              console.log(`   - Test on lowercase "${summary}": ${matches}`);
              console.log(`   - Test on original "${originalSummary}": ${matchesOriginal}`);
              if (matches || matchesOriginal) {
                isWeekEvent = true;
                console.log(`🚫 ULTRA DEBUG - WEEK PATTERN MATCHED! Pattern: ${name}`);
              }
            });
            
            // Additional string contains tests
            const stringTests = [
              { test: summary.includes('uke'), name: 'includes uke' },
              { test: summary.includes('week'), name: 'includes week' },
              { test: originalSummary.toLowerCase().includes('uke'), name: 'original includes uke' }
            ];
            
            stringTests.forEach(({ test, name }) => {
              console.log(`🚀 ULTRA DEBUG - String test "${name}": ${test}`);
              if (test) {
                isWeekEvent = true;
                console.log(`🚫 ULTRA DEBUG - STRING TEST MATCHED! Test: ${name}`);
              }
            });
            
            if (isWeekEvent) {
              console.log(`🚫🚫🚫 ULTRA DEBUG - FILTERING OUT WEEK EVENT: "${originalSummary}"`);
              console.log(`🚫🚫🚫 ULTRA DEBUG - Event will be REMOVED from results`);
              return false;
            } else {
              console.log(`✅✅✅ ULTRA DEBUG - NOT a week event, KEEPING: "${originalSummary}"`);
            }
          } else {
            console.log(`🔍 ULTRA DEBUG - Week filtering DISABLED for: "${originalSummary}"`);
          }
          
          // Filter holidays
          if (filters.filterHolidays) {
            console.log(`🔍 FILTER DEBUG - Holiday filtering is ENABLED for event: "${originalSummary}"`);
            const isHoliday = summary.includes('helligdag') ||
                summary.includes('holiday') ||
                summary.includes('ferie') ||
                summary.includes('vacation') ||
                summary.includes('jul') ||
                summary.includes('påske') ||
                summary.includes('pinse') ||
                summary.includes('christmas') ||
                summary.includes('easter');
            
            if (isHoliday) {
              console.log(`🚫 FILTER DEBUG - FILTERING OUT holiday event: "${originalSummary}"`);
              return false;
            }
          } else {
            console.log(`🔍 FILTER DEBUG - Holiday filtering is DISABLED for event: "${originalSummary}"`);
          }
          
          console.log(`✅ FILTER DEBUG - Event passed all filters: "${originalSummary}"`);
          return true;
        });
        
        console.log(`🔍 FILTER DEBUG - After filtering: ${filteredEvents.length} events remaining from calendar ${calendar.summary}`);
      } else {
        console.log(`🔍 FILTER DEBUG - No filters applied to calendar ${calendar.summary}`);
      }
      
      allEvents = allEvents.concat(filteredEvents);
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
      
      // Google Calendar uses exclusive end dates for all-day events
      // If event is on Oct 9, Google sends end.date = "2025-10-10" (exclusive)
      // We need to subtract 1 day to get the actual last day of the event
      const endDateObj = new Date(event.end.date);
      endDateObj.setDate(endDateObj.getDate() - 1);
      const endDate = new Date(endDateObj.toISOString().split('T')[0] + 'T23:59:59');
      
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

  console.log(`✅ FILTER DEBUG - Total events found across selected calendars after filtering: ${normalizedEvents.length}`);
  
  // Final debug summary
  normalizedEvents.forEach((event, index) => {
    console.log(`📋 FINAL EVENT ${index + 1}: "${event.summary}" from ${event.calendarSummary}`);
  });
  
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
