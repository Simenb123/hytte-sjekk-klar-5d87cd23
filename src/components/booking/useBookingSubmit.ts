
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/state/auth';
import { toast } from 'sonner';
import { BookingFormData } from './types';
import { useBookingNotifications } from './useBookingNotifications';

interface UseBookingSubmitProps {
  onSuccess?: () => void;
  onBookingCreated?: () => void;
}

export const useBookingSubmit = ({ onSuccess, onBookingCreated }: UseBookingSubmitProps = {}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { sendBookingConfirmation } = useBookingNotifications();

  const submitBooking = async (data: BookingFormData) => {
    if (!user) {
      toast.error('Du må være logget inn for å opprette en booking');
      return;
    }

    setIsSubmitting(true);
    console.log('Submitting booking:', data);

    try {
      // Insert booking into database
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          title: data.title,
          description: data.description || null,
          start_date: data.startDate.toISOString(),
          end_date: data.endDate.toISOString(),
        })
        .select()
        .single();

      if (bookingError) {
        console.error('Error creating booking:', bookingError);
        throw bookingError;
      }

      console.log('Booking created:', booking);

      // Insert family member associations if any
      if (data.familyMemberIds && data.familyMemberIds.length > 0) {
        const familyMemberInserts = data.familyMemberIds.map(familyMemberId => ({
          booking_id: booking.id,
          family_member_id: familyMemberId
        }));

        const { error: familyMemberError } = await supabase
          .from('booking_family_members')
          .insert(familyMemberInserts);

        if (familyMemberError) {
          console.error('Error associating family members:', familyMemberError);
          // Don't throw here as the booking was already created
          toast.error('Booking opprettet, men kunne ikke knytte familiemedlemmer');
        }
      }

      // Send confirmation notification
      await sendBookingConfirmation({
        bookingId: booking.id,
        title: data.title,
        startDate: data.startDate,
        endDate: data.endDate
      });

      toast.success('Booking opprettet!');
      onSuccess?.();
      onBookingCreated?.();
    } catch (error: any) {
      console.error('Error creating booking:', error);
      toast.error(error.message || 'Kunne ikke opprette booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateBooking = async (id: string, data: BookingFormData) => {
    if (!user) {
      toast.error('Du må være logget inn for å oppdatere en booking');
      return;
    }

    setIsSubmitting(true);
    console.log('Updating booking:', id, data);

    try {
      // Update booking in database
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({
          title: data.title,
          description: data.description || null,
          start_date: data.startDate.toISOString(),
          end_date: data.endDate.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (bookingError) {
        console.error('Error updating booking:', bookingError);
        throw bookingError;
      }

      // Delete existing family member associations
      const { error: deleteError } = await supabase
        .from('booking_family_members')
        .delete()
        .eq('booking_id', id);

      if (deleteError) {
        console.error('Error deleting family member associations:', deleteError);
        throw deleteError;
      }

      // Insert new family member associations if any
      if (data.familyMemberIds && data.familyMemberIds.length > 0) {
        const familyMemberInserts = data.familyMemberIds.map(familyMemberId => ({
          booking_id: id,
          family_member_id: familyMemberId
        }));

        const { error: familyMemberError } = await supabase
          .from('booking_family_members')
          .insert(familyMemberInserts);

        if (familyMemberError) {
          console.error('Error associating family members:', familyMemberError);
          // Don't throw here as the booking was already updated
          toast.error('Booking oppdatert, men kunne ikke knytte familiemedlemmer');
        }
      }

      toast.success('Booking oppdatert!');
      onSuccess?.();
    } catch (error: any) {
      console.error('Error updating booking:', error);
      toast.error(error.message || 'Kunne ikke oppdatere booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitBooking,
    updateBooking,
    isSubmitting
  };
};
