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
};

interface EventRowProps {
  ev: Event;
  currentDate?: Date;
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

export const EnhancedEventRow: React.FC<EventRowProps> = ({ ev, currentDate }) => {
  const start = parseISO(ev.start);
  const end = parseISO(ev.end);
  const today = currentDate || new Date();
  
  const multiDay = isMultiDay(ev.start, ev.end);
  const showDate = !isSameDay(start, today);
  const timeUntil = formatTimeUntilEvent(ev.start, ev.end, today);

  const formatDateTime = () => {
    if (ev.allDay) {
      if (multiDay) {
        return `${fmtDateFull(start)} - ${fmtDateFull(end)} (hele dagen)`;
      }
      if (showDate) {
        return `${fmtDateFull(start)} (hele dagen)`;
      }
      return 'Hele dagen';
    }
    
    if (multiDay) {
      return `${fmtDateFull(start)} ${fmtTime(start)} - ${fmtDateFull(end)} ${fmtTime(end)}`;
    }
    
    if (showDate) {
      return `${fmtDateFull(start)} klokken ${fmtTime(start)}–${fmtTime(end)}`;
    }
    
    return `Klokken ${fmtTime(start)}–${fmtTime(end)}`;
  };

  return (
    <div className="py-2 border-b border-gray-600/30 last:border-b-0">
      <div className="flex flex-col gap-2">
        <div className="text-white font-bold text-xl leading-tight">
          {ev.title}
        </div>
        <div className="text-gray-200 text-lg leading-tight font-medium">
          {formatDateTime()}
        </div>
        {timeUntil && timeUntil !== "Pågår nå" && (
          <div className="text-gray-300 text-xl leading-tight font-bold">
            🕒 {timeUntil}
          </div>
        )}
        {ev.location && (
          <div className="text-gray-300 text-lg leading-tight">
            📍 {ev.location}
          </div>
        )}
      </div>
    </div>
  );
};