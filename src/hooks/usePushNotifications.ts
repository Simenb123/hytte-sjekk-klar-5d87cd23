import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const requestPermissions = async () => {
    // Web fallback - check if browser supports notifications
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      } catch (error) {
        console.error('Error requesting push permissions:', error);
        return false;
      }
    }
    console.log('Push notifications not supported in this environment');
    return false;
  };

  const registerForPushNotifications = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        toast.error('Push-varsler krever tillatelse');
        return;
      }

      // Web fallback - simulate registration
      setIsRegistered(true);
      toast.success('Push-varsler aktivert (web-modus)');
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      toast.error('Kunne ikke aktivere push-varsler');
    } finally {
      setIsLoading(false);
    }
  };

  const savePushToken = async (token: string, platform: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('push_tokens')
        .upsert({ 
          user_id: user.id,
          token, 
          platform 
        }, {
          onConflict: 'user_id,token'
        });

      if (error) {
        console.error('Error saving push token:', error);
        throw error;
      }
      
      console.log('Push token saved successfully');
    } catch (error) {
      console.error('Failed to save push token:', error);
      throw error;
    }
  };

  const setupPushListeners = () => {
    // Web fallback - no native listeners needed
    console.log('Push listeners setup (web-modus)');
  };

  useEffect(() => {
    if (user) {
      setupPushListeners();
    }
  }, [user]);

  return {
    isRegistered,
    isLoading,
    registerForPushNotifications,
    requestPermissions,
  };
};