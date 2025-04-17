
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { BookingFormData } from './types';

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
        setIsSubmitting(false);
        return;
      }

      console.log('Creating booking with data:', data);
      
      if (!data.title) {
        toast.error('Booking må ha en tittel');
        setIsSubmitting(false);
        return;
      }

      if (!data.startDate || !data.endDate) {
        toast.error('Booking må ha start- og sluttdato');
        setIsSubmitting(false);
        return;
      }

      if (data.endDate < data.startDate) {
        toast.error('Sluttdato kan ikke være før startdato');
        setIsSubmitting(false);
        return;
      }
      
      // Ensure we have Date objects, not complex objects
      const startDate = data.startDate instanceof Date ? 
        data.startDate : 
        new Date(data.startDate);
        
      const endDate = data.endDate instanceof Date ? 
        data.endDate : 
        new Date(data.endDate);
      
      console.log('Processed dates:', { startDate, endDate });
      
      // Lagre booking i databasen
      const { data: newBooking, error } = await supabase
        .from('bookings')
        .insert({
          title: data.title,
          description: data.description || '',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
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
        from: startDate,
        to: endDate,
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
