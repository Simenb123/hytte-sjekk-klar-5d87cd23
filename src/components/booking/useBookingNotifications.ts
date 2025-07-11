
import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { addDays, isBefore, startOfDay } from 'date-fns';
import { toast } from 'sonner';

interface BookingNotificationData {
  bookingId: string;
  title: string;
  startDate: Date;
  endDate: Date;
}

export const useBookingNotifications = () => {
  const { user } = useAuth();

  const createNotification = async (
    title: string,
    message: string,
    type: 'info' | 'warning' | 'error' | 'success' = 'info',
    relatedBookingId?: string
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title,
          message,
          type,
          related_booking_id: relatedBookingId
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  const sendBookingConfirmation = async (booking: BookingNotificationData) => {
    await createNotification(
      'Booking bekreftet',
      `Din booking "${booking.title}" er bekreftet og lagret.`,
      'success',
      booking.bookingId
    );
  };

  const sendBookingReminder = async (booking: BookingNotificationData) => {
    const daysUntil = Math.ceil(
      (booking.startDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    await createNotification(
      'Booking-påminnelse',
      `Din booking "${booking.title}" starter om ${daysUntil} dag${daysUntil !== 1 ? 'er' : ''}.`,
      'info',
      booking.bookingId
    );
  };

  const sendBookingExpiry = async (booking: BookingNotificationData) => {
    await createNotification(
      'Booking utløpt',
      `Din booking "${booking.title}" er nå avsluttet.`,
      'info',
      booking.bookingId
    );
  };

  const checkUpcomingBookings = useCallback(async () => {
    if (!user) return;

    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('id, title, start_date, end_date')
        .eq('user_id', user.id)
        .gte('start_date', new Date().toISOString());

      if (error) throw error;

      for (const booking of bookings || []) {
        const startDate = new Date(booking.start_date);
        const today = startOfDay(new Date());
        const reminderDate = addDays(today, 3); // Send reminder 3 days before

        // Check if we should send a reminder
        if (isBefore(startDate, reminderDate) && !isBefore(startDate, today)) {
          // Check if reminder has already been sent
          const { data: existingNotification } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', user.id)
            .eq('related_booking_id', booking.id)
            .eq('title', 'Booking-påminnelse')
            .single();

          if (!existingNotification) {
            await sendBookingReminder({
              bookingId: booking.id,
              title: booking.title,
              startDate,
              endDate: new Date(booking.end_date)
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking upcoming bookings:', error);
    }
  }, [user, sendBookingReminder]);

  // Check for upcoming bookings on component mount and user change
  useEffect(() => {
    checkUpcomingBookings();
  }, [checkUpcomingBookings]);

  return {
    createNotification,
    sendBookingConfirmation,
    sendBookingReminder,
    sendBookingExpiry,
    checkUpcomingBookings
  };
};
