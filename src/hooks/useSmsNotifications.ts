import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const useSmsNotifications = () => {
  const [isSending, setIsSending] = useState(false);
  const { user } = useAuth();

  const sendSms = async (to: string, message: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: { to, message }
      });

      if (error) {
        throw error;
      }

      console.log('SMS sent successfully:', data);
      toast.success('SMS sendt!');
      return data;
    } catch (error) {
      console.error('Error sending SMS:', error);
      toast.error('Kunne ikke sende SMS');
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  const sendNotificationSms = async (userId: string, title: string, body: string) => {
    try {
      // Get user's phone number from profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', userId)
        .single();

      if (profileError || !profile?.phone) {
        console.log('No phone number found for user');
        return;
      }

      // Check if user has SMS notifications enabled
      const { data: preferences, error: prefError } = await supabase
        .from('notification_preferences')
        .select('sms_enabled')
        .eq('user_id', userId)
        .single();

      if (prefError || !preferences?.sms_enabled) {
        console.log('SMS notifications disabled for user');
        return;
      }

      const message = `${title}\n\n${body}`;
      await sendSms(profile.phone, message);
    } catch (error) {
      console.error('Error sending notification SMS:', error);
    }
  };

  return {
    sendSms,
    sendNotificationSms,
    isSending
  };
};