import { parseISO, isSameDay, isWithinInterval, addDays } from 'date-fns';

export type Event = {
  id: string;
  title: string;
  start: string; // ISO
  end: string;   // ISO
  location?: string;
  attendees?: string[];
  allDay?: boolean;
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
    const end = parseISO(ev.end);
    
    // Check if event is active today (including multi-day events)
    if (isEventOnDate(ev, today)) {
      evToday.push(ev);
    }
    // Check if event is active tomorrow (including multi-day events)
    else if (isEventOnDate(ev, tomorrow)) {
      evTomorrow.push(ev);
    }
    // Check for events within this week (but not today/tomorrow)
    else if (isWithinDays(start, today, 7)) {
      evThisWeek.push(ev);
    }
    // Check for events within next week
    else if (isWithinDays(start, today, 14)) {
      evNextWeek.push(ev);
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