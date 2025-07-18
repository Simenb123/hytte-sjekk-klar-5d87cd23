import { useState, useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const requestPermissions = async () => {
    if (!Capacitor.isNativePlatform()) {
      console.log('Push notifications only available on native platforms');
      return false;
    }

    try {
      const result = await PushNotifications.requestPermissions();
      return result.receive === 'granted';
    } catch (error) {
      console.error('Error requesting push permissions:', error);
      return false;
    }
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

      await PushNotifications.register();
      setIsRegistered(true);
      toast.success('Push-varsler aktivert');
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
      // For now, just log the token - we'll implement proper storage later
      console.log('Push token received:', { token, platform, userId: user.id });
      // TODO: Implement proper push token storage once DB types are updated
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  };

  const setupPushListeners = () => {
    if (!Capacitor.isNativePlatform()) return;

    // Called when the app receives a push token
    PushNotifications.addListener('registration', (token) => {
      console.log('Push registration success, token: ' + token.value);
      const platform = Capacitor.getPlatform();
      savePushToken(token.value, platform);
    });

    // Called when registration fails
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Error on registration: ' + JSON.stringify(error));
      toast.error('Feil ved registrering av push-varsler');
    });

    // Called when the app receives a push notification
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received: ', notification);
      toast.info(notification.title || 'Nytt varsel', {
        description: notification.body,
      });
    });

    // Called when user taps on a push notification
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push notification action performed: ', notification);
      // Handle navigation or other actions based on notification data
    });
  };

  useEffect(() => {
    if (user && Capacitor.isNativePlatform()) {
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