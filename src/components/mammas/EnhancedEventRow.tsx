import React from 'react';
import { parseISO, isSameDay, format, addDays } from 'date-fns';
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

const fmtTimeHM = (date: Date): string => {
  return format(date, 'HH:mm', { locale: nb });
};

const fmtDateShort = (date: Date): string => {
  return format(date, 'EEE d. MMM', { locale: nb });
};

const isNow = (startISO: string, endISO: string): boolean => {
  const now = new Date();
  const start = parseISO(startISO);
  const end = parseISO(endISO);
  return now >= start && now <= end;
};

const inNextHours = (startISO: string, hours: number): boolean => {
  const now = new Date();
  const start = parseISO(startISO);
  const diffMs = start.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours >= 0 && diffHours <= hours;
};

const getEventBadge = (startISO: string, endISO: string, currentDate?: Date) => {
  const today = currentDate || new Date();
  const tomorrow = addDays(today, 1);
  const start = parseISO(startISO);

  if (isNow(startISO, endISO)) {
    return { label: 'Nå', cssClass: 'bg-green-600' };
  }
  
  if (inNextHours(startISO, 3)) {
    return { label: 'Snart', cssClass: 'bg-orange-600' };
  }
  
  if (isSameDay(start, today)) {
    return { label: 'I dag', cssClass: 'bg-blue-600' };
  }
  
  if (isSameDay(start, tomorrow)) {
    return { label: 'I morgen', cssClass: 'bg-purple-600' };
  }
  
  return { label: 'Utover', cssClass: 'bg-gray-600' };
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
  
  const badge = getEventBadge(ev.start, ev.end, currentDate);
  const multiDay = isMultiDay(ev.start, ev.end);
  const showDate = !isSameDay(start, today);

  const formatTimeRange = () => {
    if (ev.allDay) {
      if (multiDay) {
        return `${fmtDateShort(start)} - ${fmtDateShort(end)} (hele dagen)`;
      }
      return 'Hele dagen';
    }
    
    if (multiDay) {
      return `${fmtDateShort(start)} ${fmtTimeHM(start)} - ${fmtDateShort(end)} ${fmtTimeHM(end)}`;
    }
    
    if (showDate) {
      return `${fmtDateShort(start)} · ${fmtTimeHM(start)}–${fmtTimeHM(end)}`;
    }
    
    return `${fmtTimeHM(start)}–${fmtTimeHM(end)}`;
  };

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-700 min-h-[70px]">
      <div className={`px-3 py-1.5 rounded-full text-xs text-white font-bold min-w-[75px] text-center ${badge.cssClass}`}>
        {badge.label}
      </div>
      
      {multiDay && (
        <div className="text-blue-400 text-lg">
          📅
        </div>
      )}
      
      <div className="flex-1">
        <div className="text-white font-semibold text-lg leading-6">{ev.title}</div>
        <div className="text-gray-400 text-base mt-1 leading-5">
          {formatTimeRange()}
          {ev.location && ` · ${ev.location}`}
        </div>
      </div>
    </div>
  );
};