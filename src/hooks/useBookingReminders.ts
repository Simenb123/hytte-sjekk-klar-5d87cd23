
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useBookingReminders = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const triggerReminderCheck = async () => {
    setIsProcessing(true);
    
    try {
      console.log('Triggering booking reminder check...');
      
      const { data, error } = await supabase.functions.invoke('booking-reminders', {
        method: 'POST'
      });

      if (error) {
        console.error('Error calling booking-reminders function:', error);
        throw error;
      }

      console.log('Booking reminders response:', data);
      
      if (data?.success) {
        toast.success(`Påminnelser sjekket! ${data.processed} nye påminnelser sendt.`);
      } else {
        toast.error('Kunne ikke sjekke påminnelser');
      }

      return data;
    } catch (error: any) {
      console.error('Error triggering reminder check:', error);
      toast.error(`Feil ved sjekking av påminnelser: ${error.message}`);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    triggerReminderCheck,
    isProcessing
  };
};
