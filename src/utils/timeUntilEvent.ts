import { parseISO, differenceInMinutes, differenceInHours, differenceInDays, isAfter, isBefore, isWithinInterval } from 'date-fns';

export const formatTimeUntilEvent = (eventStart: string, eventEnd: string, currentTime: Date = new Date()): string | null => {
  const start = parseISO(eventStart);
  const end = parseISO(eventEnd);
  
  // Don't show countdown for past events
  if (isBefore(end, currentTime)) {
    return null;
  }
  
  // Check if event is currently happening
  if (isWithinInterval(currentTime, { start, end })) {
    return "Pågår nå";
  }
  
  const minutesUntil = differenceInMinutes(start, currentTime);
  const hoursUntil = differenceInHours(start, currentTime);
  const daysUntil = differenceInDays(start, currentTime);
  
  // Less than 1 hour
  if (minutesUntil < 60) {
    if (minutesUntil < 5) {
      return "Snart";
    }
    return `Om ${minutesUntil} minutter`;
  }
  
  // Less than 24 hours
  if (hoursUntil < 24) {
    return `Om ${hoursUntil} timer`;
  }
  
  // Less than 7 days - show days and hours
  if (daysUntil < 7) {
    const remainingHours = hoursUntil - (daysUntil * 24);
    if (remainingHours > 0 && daysUntil < 3) {
      return `Om ${daysUntil} dag${daysUntil !== 1 ? 'er' : ''} og ${remainingHours} timer`;
    }
    return `Om ${daysUntil} dag${daysUntil !== 1 ? 'er' : ''}`;
  }
  
  // More than a week - just show days
  return `Om ${daysUntil} dager`;
};