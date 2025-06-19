
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { createCalendarEvent } from '@/services/googleCalendar.service';
import { BookingFormData } from './types';

interface UseBookingSubmitProps {
  onSuccess: (booking: any) => void;
  onClose: () => void;
}

export const useBookingSubmit = ({ onSuccess, onClose }: UseBookingSubmitProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (data: BookingFormData) => {
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

      console.log('Creating booking with data:', data);

      // Save booking in database
      const { data: bookingData, error } = await supabase
        .from('bookings')
        .insert({
          title: data.title,
          description: data.description || null,
          start_date: data.startDate.toISOString(),
          end_date: data.endDate.toISOString(),
          user_id: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Booking created in database:', bookingData);

      // Save family member associations if any are selected
      if (data.familyMemberIds && data.familyMemberIds.length > 0) {
        const familyMemberInserts = data.familyMemberIds.map(familyMemberId => ({
          booking_id: bookingData.id,
          family_member_id: familyMemberId
        }));

        const { error: familyMemberError } = await supabase
          .from('booking_family_members')
          .insert(familyMemberInserts);

        if (familyMemberError) {
          console.error('Error saving family members:', familyMemberError);
          // Don't fail the entire booking creation for this
          toast.warning('Booking opprettet, men kunne ikke lagre familiemedlemmer');
        } else {
          console.log('Family members saved successfully');
        }
      }

      // Add to Google Calendar if requested
      if (data.addToGoogle) {
        try {
          const tokens = JSON.parse(localStorage.getItem('googleCalendarTokens') || '{}');
          if (tokens.access_token) {
            console.log('Adding booking to Google Calendar');
            await createCalendarEvent(tokens, {
              title: data.title,
              description: data.description,
              startDate: data.startDate.toISOString(),
              endDate: data.endDate.toISOString()
            }, data.useSharedCalendar);
            
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

      // Call success callback with formatted booking data
      onSuccess({
        ...bookingData,
        from: new Date(bookingData.start_date),
        to: new Date(bookingData.end_date),
        user: user.id
      });
      
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
