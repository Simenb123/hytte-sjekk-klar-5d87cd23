import React from 'react';
import { parseISO, isSameDay, format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { formatTimeUntilEvent } from '@/utils/timeUntilEvent';

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

interface EventRowProps {
  ev: Event;
  currentDate?: Date;
  hideTimingForTomorrow?: boolean;
}

const fmtTime = (date: Date): string => {
  return format(date, 'HH:mm', { locale: nb });
};

const fmtDateFull = (date: Date): string => {
  return format(date, 'EEEE d. MMMM', { locale: nb });
};

const isMultiDay = (startISO: string, endISO: string): boolean => {
  const start = parseISO(startISO);
  const end = parseISO(endISO);
  return !isSameDay(start, end);
};

export const EnhancedEventRow: React.FC<EventRowProps> = ({ ev, currentDate, hideTimingForTomorrow = false }) => {
  const start = parseISO(ev.start);
  const end = parseISO(ev.end);
  const today = currentDate || new Date();
  
  const multiDay = isMultiDay(ev.start, ev.end);
  const showDate = !isSameDay(start, today);
  const timeUntil = formatTimeUntilEvent(ev.start, ev.end, today);
  
  // Hide timing for tomorrow events when it's shown in header (except for continuing events)
  const shouldShowTiming = timeUntil && timeUntil !== "Pågår nå" && !hideTimingForTomorrow;

  const formatDateTime = () => {
    // For tomorrow events (when hideTimingForTomorrow is true), show simplified format
    const isTomorrowEvent = hideTimingForTomorrow;
    
    if (ev.allDay) {
      if (multiDay) {
        return isTomorrowEvent 
          ? `${fmtDateFull(start)} - ${fmtDateFull(end)} (hele dagen)`
          : `${fmtDateFull(start)} - ${fmtDateFull(end)} (hele dagen)`;
      }
      if (showDate) {
        return isTomorrowEvent ? 'Hele dagen' : `${fmtDateFull(start)} (hele dagen)`;
      }
      return 'Hele dagen';
    }
    
    if (multiDay) {
      return `${fmtDateFull(start)} ${fmtTime(start)} - ${fmtDateFull(end)} ${fmtTime(end)}`;
    }
    
    if (showDate) {
      return isTomorrowEvent 
        ? `Klokken ${fmtTime(start)}–${fmtTime(end)}`
        : `${fmtDateFull(start)} klokken ${fmtTime(start)}–${fmtTime(end)}`;
    }
    
    return `Klokken ${fmtTime(start)}–${fmtTime(end)}`;
  };

  return (
    <div className="py-3 border-b border-gray-600/20 last:border-b-0">
      <div className="flex flex-col gap-1.5">
        <div className="text-white font-bold text-2xl leading-tight">
          {ev.title}{ev.isContinuing ? ' (fortsetter)' : ''}
        </div>
        <div className="text-gray-300 text-sm leading-tight">
          {formatDateTime()}
        </div>
        {shouldShowTiming && (
          <div className="text-blue-200 text-lg leading-tight font-semibold">
            🕒 {timeUntil}
          </div>
        )}
        {ev.location && (
          <div className="text-gray-400 text-sm leading-tight">
            📍 {ev.location.replace(', Norge', '')}
          </div>
        )}
      </div>
    </div>
  );
};