
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
      // Sjekk at bruker er logget inn
      if (!user) {
        toast.error('Du må være logget inn for å lage en booking');
        return;
      }

      console.log('Creating booking with data:', data);
      
      // Lagre booking i databasen
      const { data: newBooking, error } = await supabase
        .from('bookings')
        .insert({
          title: data.title,
          description: data.description || '',
          start_date: data.startDate.toISOString(),
          end_date: data.endDate.toISOString(),
          user_id: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving booking:', error);
        throw error;
      }

      console.log('Booking created successfully:', newBooking);
      
      // Oppdater bookingdata og lukk dialog
      toast.success('Booking opprettet!');
      
      // Forbered data som skal sendes til onSuccess
      const bookingData = {
        ...data,
        id: newBooking.id,
        from: data.startDate,
        to: data.endDate,
        user: user.id
      };
      
      onSuccess(bookingData);
      onClose();
    } catch (error: any) {
      console.error('Error creating booking:', error);
      toast.error(`Kunne ikke opprette booking: ${error.message || 'Ukjent feil'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleSubmit,
    isSubmitting
  };
};
