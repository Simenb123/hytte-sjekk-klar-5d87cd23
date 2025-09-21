import React from 'react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

export interface Event {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  allDay?: boolean;
}

interface CalendarDayBoxProps {
  date: Date;
  events: Event[];
  isToday?: boolean;
  dayLabel?: string;
  labelColor?: string;
  className?: string;
  onClick?: () => void;
}

const CalendarDayBox: React.FC<CalendarDayBoxProps> = ({
  date,
  events,
  isToday = false,
  dayLabel,
  labelColor = 'text-green-400',
  className = '',
  onClick
}) => {
  const dayName = format(date, 'EEEE', { locale: nb });
  const dayNumber = format(date, 'd');
  const monthName = format(date, 'MMM', { locale: nb });

  const getEventColor = (index: number) => {
    const colors = ['bg-green-500', 'bg-blue-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
    return colors[index % colors.length];
  };

  const bgClass = isToday 
    ? 'bg-green-900/30 border-green-500/40 border-2' 
    : 'bg-gray-800/50 border-gray-600/30 border';

  return (
    <div 
      className={`${bgClass} rounded-2xl p-3 md:p-4 cursor-pointer hover:bg-opacity-70 transition-all duration-200 ${className}`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="mb-1">
        {dayLabel && (
          <div className={`text-xs font-bold mb-1 ${labelColor}`}>
            {dayLabel}
          </div>
        )}
        <div className="text-white text-base md:text-lg font-bold capitalize">
          {dayName} <span className="text-gray-300 text-xs font-normal">{dayNumber}. {monthName}</span>
        </div>
      </div>

      {/* Events */}
      <div className="space-y-2">
        {events.length === 0 ? (
          <div className="text-gray-400 text-sm">Ingen avtaler</div>
        ) : events.length <= 2 ? (
          // Show event titles directly for few events
          events.map((event, index) => (
            <div key={event.id} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getEventColor(index)}`} />
              <div className="text-white text-sm truncate">{event.title}</div>
            </div>
          ))
        ) : (
          // Show count and indicators for many events
          <>
            <div className="text-white text-sm font-medium">
              {events.length} avtaler
            </div>
            <div className="flex gap-1">
              {events.slice(0, 5).map((_, index) => (
                <div key={index} className={`w-2 h-2 rounded-full ${getEventColor(index)}`} />
              ))}
              {events.length > 5 && (
                <div className="text-gray-400 text-xs ml-1">+{events.length - 5}</div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Today time indicator */}
      {isToday && events.length > 0 && (
        <div className="mt-3 pt-2 border-t border-green-500/30">
          <div className="text-green-300 text-xs">
            Neste: {format(new Date(events[0].start), 'HH:mm')}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarDayBox;