import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  booking_reminders: boolean;
  weather_updates: boolean;
  seasonal_info: boolean;
  created_at: string;
  updated_at: string;
}

export const useNotificationPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchPreferences = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPreferences(data as NotificationPreferences);
      } else {
        // Create default preferences if none exist
        const { data: newPrefs, error: insertError } = await supabase
          .from('notification_preferences')
          .insert({
            user_id: user.id,
            email_enabled: true,
            push_enabled: true,
            sms_enabled: false,
            booking_reminders: true,
            weather_updates: true,
            seasonal_info: true,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setPreferences(newPrefs as NotificationPreferences);
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      toast.error('Kunne ikke hente varselinnstillinger');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    if (!user || !preferences) return;

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setPreferences(data as NotificationPreferences);
      toast.success('Varselinnstillinger oppdatert');
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      toast.error('Kunne ikke oppdatere varselinnstillinger');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, [user]);

  return {
    preferences,
    isLoading,
    isSaving,
    updatePreferences,
    refetch: fetchPreferences,
  };
};