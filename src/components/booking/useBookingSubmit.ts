
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { BookingFormData } from './BookingForm';

type UseBookingSubmitProps = {
  onSuccess: (booking: any) => void;
  onClose: () => void;
};

export const useBookingSubmit = ({ onSuccess, onClose }: UseBookingSubmitProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: BookingFormData) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      if (!user) {
        toast.error('Du må være logget inn for å lage en booking');
        return;
      }

      // Save booking to database
      const { error } = await supabase
        .from('bookings')
        .insert({
          title: data.title,
          description: data.description,
          start_date: data.startDate.toISOString(),
          end_date: data.endDate.toISOString(),
          user_id: user.id
        });

      if (error) throw error;

      // Update booking data and close dialog
      toast.success('Booking opprettet!');
      
      // Prepare data to be sent to onSuccess
      const bookingData = {
        ...data
      };
      
      onSuccess(bookingData);
      onClose();
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Kunne ikke opprette booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleSubmit,
    isSubmitting
  };
};
