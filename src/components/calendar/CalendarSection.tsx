import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { nb } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { addMonths, subMonths, format, isSameDay } from 'date-fns';
import { cn } from "@/lib/utils";

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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(date);

  useEffect(() => {
    setSelectedDate(date);
  }, [date]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    onDateSelect(date);
  };

  const nextMonth = () => {
    setMonth(addMonths(month, 1));
  };

  const prevMonth = () => {
    setMonth(subMonths(month, 1));
  };

  const isDateBooked = (date: Date) => {
    return bookedDays.some(bookedDate => 
      isSameDay(new Date(bookedDate), date)
    );
  };

  const getDayClassNames = (date: Date, isSelected: boolean) => {
    if (isDateBooked(date)) {
      return "bg-red-100 text-red-600 font-bold hover:bg-red-200";
    }
    return undefined;
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
        selected={selectedDate}
        onSelect={handleDateSelect}
        month={month}
        onMonthChange={setMonth}
        className="mx-auto"
        locale={nb}
        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
        modifiers={{ booked: bookedDays }}
        modifiersClassNames={{
          booked: "bg-red-100 text-red-600 font-bold"
        }}
        components={{
          DayContent: (props) => (
            <div 
              className={cn(
                "w-full h-full flex items-center justify-center",
                isDateBooked(props.date) && "font-bold text-red-600"
              )}
            >
              {props.date.getDate()}
            </div>
          )
        }}
      />
      
      {selectedDate && (
        <div className="mt-4 text-center">
          <p className="text-sm font-medium">
            Valgt dato: {format(selectedDate, 'PPP', { locale: nb })}
          </p>
          {isDateBooked(selectedDate) && (
            <p className="text-xs text-red-600 mt-1">
              Denne datoen er allerede booket
            </p>
          )}
        </div>
      )}
    </div>
  );
};
