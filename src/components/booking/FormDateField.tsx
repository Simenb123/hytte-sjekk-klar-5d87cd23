
import React from 'react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { UseFormReturn } from 'react-hook-form';
import { BookingFormData } from './types';

interface FormDateFieldProps {
  form: UseFormReturn<BookingFormData>;
  name: 'startDate' | 'endDate';
  label: string;
  minDate?: Date;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  onSelect?: (date: Date | undefined) => void;
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
  // Use hook values if provided, otherwise create local state
  const [localIsOpen, setLocalIsOpen] = React.useState(false);
  
  const dateOpen = isOpen !== undefined ? isOpen : localIsOpen;
  const setDateOpen = setIsOpen || setLocalIsOpen;
  
  const handleSelect = (date: Date | undefined) => {
    if (onSelect) {
      onSelect(date);
    } else {
      // Default behavior if no onSelect provided
      if (!date) return;
      form.setValue(name, date);
      setDateOpen(false);
    }
  };

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>{label}</FormLabel>
          <Popover open={dateOpen} onOpenChange={setDateOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full pl-3 text-left font-normal flex justify-between items-center",
                    !field.value && "text-muted-foreground"
                  )}
                  type="button"
                >
                  {field.value ? (
                    format(field.value, "PPP", { locale: nb })
                  ) : (
                    <span>Velg dato</span>
                  )}
                  <CalendarIcon className="h-4 w-4 opacity-50 ml-auto" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value}
                onSelect={handleSelect}
                locale={nb}
                disabled={(date) => minDate ? date < minDate : false}
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
