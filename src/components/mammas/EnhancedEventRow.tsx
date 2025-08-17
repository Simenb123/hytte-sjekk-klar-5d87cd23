import React from 'react';
import { parseISO, isSameDay, format } from 'date-fns';
import { nb } from 'date-fns/locale';

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
    <div className="py-4 border-b border-gray-700/50 last:border-b-0">
      <div className="flex flex-col gap-2">
        <div className="text-white font-semibold text-xl leading-relaxed">
          {ev.title}
        </div>
        <div className="text-gray-300 text-lg leading-relaxed">
          {formatDateTime()}
        </div>
        {ev.location && (
          <div className="text-gray-400 text-base leading-relaxed">
            📍 {ev.location}
          </div>
        )}
      </div>
    </div>
  );
};