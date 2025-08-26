import { parseISO, isSameDay, isWithinInterval, addDays } from 'date-fns';

export type Event = {
  id: string;
  title: string;
  start: string; // ISO
  end: string;   // ISO
  location?: string;
  attendees?: string[];
  allDay?: boolean;
  isContinuing?: boolean; // Mark for continuing events
};

export type EventGroups = {
  evToday: Event[];
  evTomorrow: Event[];
  evThisWeek: Event[];
  evNextWeek: Event[];
};

const isEventOnDate = (event: Event, targetDate: Date): boolean => {
  const start = parseISO(event.start);
  const end = parseISO(event.end);
  
  // For multi-day events, check if the target date falls within the event period
  return isWithinInterval(targetDate, { start, end }) || 
         isSameDay(start, targetDate) || 
         isSameDay(end, targetDate);
};

const isWithinDays = (date: Date, referenceDate: Date, days: number): boolean => {
  const endDate = addDays(referenceDate, days);
  return isWithinInterval(date, { start: referenceDate, end: endDate });
};

export const groupEventsByDate = (events: Event[]): EventGroups => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = addDays(today, 1);
  
  const evToday: Event[] = [];
  const evTomorrow: Event[] = [];
  const evThisWeek: Event[] = [];
  const evNextWeek: Event[] = [];

  events.forEach((ev) => {
    const start = parseISO(ev.start);
    
    // Check if event starts today
    if (isSameDay(start, today)) {
      evToday.push(ev);
    }
    // Check if event starts tomorrow
    else if (isSameDay(start, tomorrow)) {
      evTomorrow.push(ev);
    }
    // Check if event starts within this week (but not today/tomorrow)
    else if (isWithinDays(start, today, 7)) {
      evThisWeek.push(ev);
    }
    // Check if event starts within next week
    else if (isWithinDays(start, today, 14)) {
      evNextWeek.push(ev);
    }
  });

  // Second pass: Add continuing events to tomorrow section
  events.forEach((ev) => {
    const start = parseISO(ev.start);
    
    // If event is active tomorrow but doesn't start tomorrow, add it as continuing
    if (!isSameDay(start, tomorrow) && isEventOnDate(ev, tomorrow)) {
      evTomorrow.push({
        ...ev,
        isContinuing: true
      });
    }
  });

  const sortByStart = (a: Event, b: Event) =>
    parseISO(a.start).getTime() - parseISO(b.start).getTime();

  evToday.sort(sortByStart);
  evTomorrow.sort(sortByStart);
  evThisWeek.sort(sortByStart);
  evNextWeek.sort(sortByStart);

  return { evToday, evTomorrow, evThisWeek, evNextWeek };
};