
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { BookingFormData } from './types';

interface FormDateFieldProps {
  form: UseFormReturn<BookingFormData>;
  name: 'startDate' | 'endDate';
  label: string;
  minDate?: Date;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSelect: (date: Date | undefined) => void;
}

const FormDateField: React.FC<FormDateFieldProps> = ({
  form,
  name,
  label,
  minDate,
  isOpen,
  setIsOpen,
  onSelect
}) => {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>{label} *</FormLabel>
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full pl-3 text-left font-normal",
                    !field.value && "text-muted-foreground"
                  )}
                >
                  {field.value ? (
                    format(field.value, "dd.MM.yyyy")
                  ) : (
                    <span>Velg dato</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value}
                onSelect={onSelect}
                disabled={(date) => {
                  if (minDate && date < minDate) return true;
                  if (name === 'startDate' && date < new Date()) return true;
                  return false;
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default FormDateField;
