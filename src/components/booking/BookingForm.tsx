
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { format, addDays } from 'date-fns';
import { nb } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

export type BookingFormData = {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  addToGoogle: boolean;
  useSharedCalendar: boolean;
};

type BookingFormProps = {
  onSubmit: (data: BookingFormData) => void;
  googleIntegration: boolean;
  sharedCalendarExists: boolean;
};

const BookingForm: React.FC<BookingFormProps> = ({
  onSubmit,
  googleIntegration,
  sharedCalendarExists,
}) => {
  const today = new Date();
  const tomorrow = addDays(today, 1);
  
  const form = useForm<BookingFormData>({
    defaultValues: {
      title: '',
      description: '',
      startDate: today,
      endDate: tomorrow,
      addToGoogle: googleIntegration,
      useSharedCalendar: sharedCalendarExists
    }
  });

  // Update form when props change
  useEffect(() => {
    form.setValue('addToGoogle', googleIntegration);
    form.setValue('useSharedCalendar', sharedCalendarExists);
  }, [googleIntegration, sharedCalendarExists, form]);

  // Handle date changes to ensure end date is after start date
  const handleStartDateChange = (date: Date | undefined) => {
    if (!date) return;
    
    form.setValue('startDate', date);
    
    // If end date is before start date, update end date
    const currentEndDate = form.getValues('endDate');
    if (date > currentEndDate) {
      form.setValue('endDate', addDays(date, 1));
    }
  };

  const handleSubmit = (data: BookingFormData) => {
    // Ensure end date is not before start date
    if (data.endDate < data.startDate) {
      data.endDate = addDays(data.startDate, 1);
    }
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          rules={{ required: "Tittel er påkrevd" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tittel</FormLabel>
              <FormControl>
                <Input placeholder="F.eks. Påskeferie" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Beskrivelse (valgfritt)</FormLabel>
              <FormControl>
                <Input placeholder="Legg til mer informasjon" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Fra dato</FormLabel>
              <Popover>
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
                        format(field.value, "PPP", { locale: nb })
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
                    onSelect={(date) => handleStartDateChange(date)}
                    locale={nb}
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Til dato</FormLabel>
              <Popover>
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
                        format(field.value, "PPP", { locale: nb })
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
                    onSelect={field.onChange}
                    locale={nb}
                    disabled={(date) =>
                      date < form.getValues('startDate')
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {googleIntegration && (
          <>
            <FormField
              control={form.control}
              name="addToGoogle"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Legg til i Google Calendar</FormLabel>
                    <FormDescription className="text-xs">
                      Bookingen vil også bli lagt til i din Google Calendar
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {sharedCalendarExists && form.watch("addToGoogle") && (
              <FormField
                control={form.control}
                name="useSharedCalendar"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Bruk felles hytte-kalender</FormLabel>
                      <FormDescription className="text-xs">
                        Legg til i den delte hytte-kalenderen som alle familiemedlemmer har tilgang til
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
          </>
        )}

        <Button type="submit" className="w-full">Opprett booking</Button>
      </form>
    </Form>
  );
};

export default BookingForm;
