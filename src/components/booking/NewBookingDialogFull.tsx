
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { useAuth } from '@/hooks/useAuth';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { createCalendarEvent } from '@/services/googleCalendar.service';
import { retrieveGoogleTokens } from '@/utils/tokenStorage';

type BookingRow = Database['public']['Tables']['bookings']['Row'];

type NewBookingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (booking: BookingRow & { useSharedCalendar: boolean }) => void;
  googleIntegration?: boolean;
  sharedCalendarExists?: boolean;
};

const NewBookingDialog: React.FC<NewBookingDialogProps> = ({ 
  open, 
  onOpenChange,
  onSuccess,
  googleIntegration = false,
  sharedCalendarExists = false
}) => {
  const { user } = useAuth();
  const [useSharedCalendar, setUseSharedCalendar] = useState(sharedCalendarExists);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm({
    defaultValues: {
      title: '',
      description: '',
      startDate: new Date(),
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      addToGoogle: googleIntegration,
      useSharedCalendar: sharedCalendarExists
    }
  });

  // Update form state when props change
  useEffect(() => {
    form.setValue('addToGoogle', googleIntegration);
    form.setValue('useSharedCalendar', sharedCalendarExists);
    setUseSharedCalendar(sharedCalendarExists);
  }, [googleIntegration, sharedCalendarExists, form]);

  const onSubmit = async (data) => {
    if (!user) {
      toast.error('Du må være logget inn for å lage en booking');
      return;
    }

    setIsSubmitting(true);

    try {
      // Validate dates
      if (data.endDate <= data.startDate) {
        toast.error('Sluttdato må være etter startdato');
        return;
      }

      // Save booking in database
      const { data: bookingData, error } = await supabase
        .from('bookings')
        .insert({
          title: data.title,
          description: data.description,
          start_date: data.startDate.toISOString(),
          end_date: data.endDate.toISOString(),
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Add to Google Calendar if requested
      if (data.addToGoogle && googleIntegration && user?.id) {
        try {
          const tokens = retrieveGoogleTokens(user.id);
          if (tokens?.access_token) {
            await createCalendarEvent(tokens, {
              title: data.title,
              description: data.description,
              startDate: data.startDate.toISOString(),
              endDate: data.endDate.toISOString()
            }, useSharedCalendar);
            
            toast.success('Booking opprettet og lagt til i Google Calendar!');
          } else {
            toast.warning('Booking opprettet, men kunne ikke legge til i Google Calendar');
          }
        } catch (googleError) {
          console.error('Google Calendar error:', googleError);
          toast.warning('Booking opprettet, men kunne ikke legge til i Google Calendar');
        }
      } else {
        toast.success('Booking opprettet!');
      }

      // Reset form
      form.reset();
      
      // Call success callback
      onSuccess({
        ...bookingData,
        useSharedCalendar: useSharedCalendar 
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Kunne ikke opprette booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ny booking</DialogTitle>
          <DialogDescription>
            Fyll ut informasjonen under for å booke hytta.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              rules={{ required: 'Tittel er påkrevd' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tittel *</FormLabel>
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
                  <FormLabel>Beskrivelse</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Legg til mer informasjon om oppholdet..."
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fra dato *</FormLabel>
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
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
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
                    <FormLabel>Til dato *</FormLabel>
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
                          onSelect={field.onChange}
                          disabled={(date) => date <= form.getValues('startDate')}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {googleIntegration && (
              <>
                <FormField
                  control={form.control}
                  name="addToGoogle"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Legg til i Google Calendar</FormLabel>
                        <FormDescription>
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
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Bruk felles hytte-kalender</FormLabel>
                          <FormDescription>
                            Legg til i den delte hytte-kalenderen som alle familiemedlemmer har tilgang til
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              setUseSharedCalendar(checked);
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
              </>
            )}

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Avbryt
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Oppretter...
                  </>
                ) : (
                  'Opprett booking'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default NewBookingDialog;
