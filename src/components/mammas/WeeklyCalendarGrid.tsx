import React, { useState } from 'react';
import { addDays, startOfDay, endOfDay } from 'date-fns';
import CalendarDayBox, { Event } from './CalendarDayBox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

interface WeeklyCalendarGridProps {
  events: Event[];
  currentDate: Date;
}

interface DayEvents {
  date: Date;
  events: Event[];
  isToday: boolean;
}

const WeeklyCalendarGrid: React.FC<WeeklyCalendarGridProps> = ({
  events,
  currentDate
}) => {
  const [selectedDay, setSelectedDay] = useState<DayEvents | null>(null);

  // Organize events by day for the next 6 days
  const organizeDays = (): DayEvents[] => {
    const days: DayEvents[] = [];
    const today = startOfDay(currentDate);

    for (let i = 0; i < 6; i++) {
      const date = addDays(today, i);
      const dayEvents = events.filter(event => {
        // Check if the entire day overlaps with the event
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        
        // Two intervals overlap if one starts before the other ends
        return eventStart <= dayEnd && eventEnd >= dayStart;
      });

      days.push({
        date,
        events: dayEvents,
        isToday: i === 0
      });
    }

    return days;
  };

  const days = organizeDays();

  const handleDayClick = (day: DayEvents) => {
    setSelectedDay(day);
  };

  const closeModal = () => {
    setSelectedDay(null);
  };

  return (
    <>
      {/* 3x2 Grid - Larger boxes */}
      <div className="grid grid-cols-2 grid-rows-3 gap-4 md:gap-6 h-full min-h-[600px]">
        {/* Today */}
        <CalendarDayBox
          date={days[0].date}
          events={days[0].events}
          isToday={true}
          dayLabel="I DAG"
          labelColor="text-green-400"
          className="min-h-[180px]"
          onClick={() => handleDayClick(days[0])}
        />

        {/* Tomorrow */}
        <CalendarDayBox
          date={days[1].date}
          events={days[1].events}
          isToday={false}
          dayLabel="I MORGEN"
          labelColor="text-blue-400"
          className="min-h-[180px]"
          onClick={() => handleDayClick(days[1])}
        />

        {/* Day 3 */}
        <CalendarDayBox
          date={days[2].date}
          events={days[2].events}
          isToday={false}
          className="min-h-[180px]"
          onClick={() => handleDayClick(days[2])}
        />

        {/* Day 4 */}
        <CalendarDayBox
          date={days[3].date}
          events={days[3].events}
          isToday={false}
          className="min-h-[180px]"
          onClick={() => handleDayClick(days[3])}
        />

        {/* Day 5 */}
        <CalendarDayBox
          date={days[4].date}
          events={days[4].events}
          isToday={false}
          className="min-h-[180px]"
          onClick={() => handleDayClick(days[4])}
        />

        {/* Day 6 */}
        <CalendarDayBox
          date={days[5].date}
          events={days[5].events}
          isToday={false}
          className="min-h-[180px]"
          onClick={() => handleDayClick(days[5])}
        />
      </div>

      {/* Detail Modal */}
      {selectedDay && (
        <Dialog open={true} onOpenChange={closeModal}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <DialogTitle className="text-lg font-bold">
                {format(selectedDay.date, 'EEEE d. MMMM', { locale: nb })}
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeModal}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogHeader>

            <div className="space-y-3">
              {selectedDay.events.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  Ingen avtaler denne dagen
                </div>
              ) : (
                selectedDay.events.map((event) => (
                  <div key={event.id} className="bg-gray-50 rounded-lg p-3 border">
                    <div className="font-medium text-gray-900 mb-1">
                      {event.title}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      {event.allDay ? (
                        'Hele dagen'
                      ) : (
                        `${format(new Date(event.start), 'HH:mm')} - ${format(new Date(event.end), 'HH:mm')}`
                      )}
                    </div>
                    {event.location && (
                      <div className="text-sm text-gray-500">
                        📍 {event.location}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default WeeklyCalendarGrid;