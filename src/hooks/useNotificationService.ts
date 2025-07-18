import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useNotificationPreferences } from './useNotificationPreferences';
import { toast } from 'sonner';

interface SendNotificationOptions {
  title: string;
  message: string;
  type: 'booking_reminder' | 'weather_update' | 'seasonal_info' | 'general';
  relatedBookingId?: string;
  userId?: string; // If not provided, uses current user
}

export const useNotificationService = () => {
  const { user } = useAuth();
  const { preferences } = useNotificationPreferences();

  const sendNotification = useCallback(async (options: SendNotificationOptions) => {
    const targetUserId = options.userId || user?.id;
    if (!targetUserId) {
      console.error('No user ID provided for notification');
      return;
    }

    try {
      // Always create in-app notification
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: targetUserId,
          title: options.title,
          message: options.message,
          type: options.type,
          related_booking_id: options.relatedBookingId,
        });

      if (notificationError) {
        console.error('Error creating in-app notification:', notificationError);
      }

      // Get user's notification preferences if sending to current user
      let userPreferences = preferences;
      if (targetUserId !== user?.id) {
        const { data: targetPrefs } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', targetUserId)
          .single();
        userPreferences = targetPrefs as any;
      }

      if (!userPreferences) {
        console.log('No notification preferences found, skipping external notifications');
        return;
      }

      // Get user's email for email notifications  
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', targetUserId)
        .single();

      const userEmail = (profile as any)?.email;

      // Send email notification if enabled
      if (userPreferences.email_enabled && userEmail) {
        try {
          const { error: emailError } = await supabase.functions.invoke('send-notification-email', {
            body: {
              to: userEmail,
              subject: `Hytte Sjekk: ${options.title}`,
              title: options.title,
              message: options.message,
              type: options.type,
              relatedBookingId: options.relatedBookingId,
            },
          });

          if (emailError) {
            console.error('Error sending email notification:', emailError);
          } else {
            console.log('Email notification sent successfully');
          }
        } catch (error) {
          console.error('Failed to send email notification:', error);
        }
      }

      // Send push notification if enabled
      if (userPreferences.push_enabled) {
        try {
          const { error: pushError } = await supabase.functions.invoke('send-push-notification', {
            body: {
              userId: targetUserId,
              title: options.title,
              body: options.message,
              data: {
                type: options.type,
                relatedBookingId: options.relatedBookingId,
              },
            },
          });

          if (pushError) {
            console.error('Error sending push notification:', pushError);
          } else {
            console.log('Push notification sent successfully');
          }
        } catch (error) {
          console.error('Failed to send push notification:', error);
        }
      }

      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Kunne ikke sende varsel');
      return false;
    }
  }, [user, preferences]);

  const sendBookingReminder = useCallback((bookingTitle: string, bookingId: string, reminderType: 'upcoming' | 'checklist' = 'upcoming') => {
    const messages = {
      upcoming: `Din booking "${bookingTitle}" starter snart. Husk å sjekke værmelding og forberede reisen.`,
      checklist: `Husk å fullføre sjekklisten for "${bookingTitle}" før du reiser.`,
    };

    return sendNotification({
      title: 'Booking-påminnelse',
      message: messages[reminderType],
      type: 'booking_reminder',
      relatedBookingId: bookingId,
    });
  }, [sendNotification]);

  const sendWeatherUpdate = useCallback((weatherInfo: string) => {
    return sendNotification({
      title: 'Værvarsel for hytten',
      message: weatherInfo,
      type: 'weather_update',
    });
  }, [sendNotification]);

  const sendSeasonalInfo = useCallback((seasonalMessage: string) => {
    return sendNotification({
      title: 'Sesong-informasjon',
      message: seasonalMessage,
      type: 'seasonal_info',
    });
  }, [sendNotification]);

  return {
    sendNotification,
    sendBookingReminder,
    sendWeatherUpdate,
    sendSeasonalInfo,
  };
};