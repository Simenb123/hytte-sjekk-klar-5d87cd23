
import React from 'react';
import { Calendar } from '@/components/ui/calendar';

interface CalendarSectionProps {
  date: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  bookedDays: Date[];
}

export const CalendarSection: React.FC<CalendarSectionProps> = ({
  date,
  onDateSelect,
  bookedDays
}) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-4 mb-6">
      <Calendar
        mode="single"
        selected={date}
        onSelect={onDateSelect}
        className="mx-auto"
        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
        modifiers={{ booked: bookedDays }}
        modifiersClassNames={{
          booked: 'bg-red-100 text-red-600 font-bold',
        }}
      />
    </div>
  );
};
