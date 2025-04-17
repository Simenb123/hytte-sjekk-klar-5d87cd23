
import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { nb } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { addMonths, subMonths, format } from 'date-fns';

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
  const [month, setMonth] = useState<Date>(new Date());

  const nextMonth = () => {
    setMonth(addMonths(month, 1));
  };

  const prevMonth = () => {
    setMonth(subMonths(month, 1));
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={prevMonth}
          aria-label="Forrige måned"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <h2 className="text-lg font-medium">
          {format(month, 'MMMM yyyy', { locale: nb })}
        </h2>
        
        <Button 
          variant="outline" 
          size="icon" 
          onClick={nextMonth}
          aria-label="Neste måned"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <Calendar
        mode="single"
        selected={date}
        onSelect={onDateSelect}
        month={month}
        onMonthChange={setMonth}
        className="mx-auto"
        locale={nb}
        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
        modifiers={{ booked: bookedDays }}
        modifiersClassNames={{
          booked: 'bg-red-100 text-red-600 font-bold',
        }}
      />
    </div>
  );
};
