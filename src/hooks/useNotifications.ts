
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  relatedBookingId?: string;
  createdAt: Date;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  
  // Use refs to avoid dependency loops
  const userRef = useRef(user);
  const lastFetchRef = useRef<number>(0);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Update user ref when user changes
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const fetchNotifications = useCallback(async (forceRefresh = false) => {
    const currentUser = userRef.current;
    
    if (!currentUser) {
      console.log('useNotifications: No user, clearing notifications');
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    // Debouncing - avoid fetching too frequently (minimum 2 seconds between calls)
    const now = Date.now();
    if (!forceRefresh && now - lastFetchRef.current < 2000) {
      console.log('useNotifications: Skipping fetch due to debouncing');
      return;
    }
    
    lastFetchRef.current = now;
    console.log('useNotifications: Fetching notifications for user:', currentUser.id);

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedNotifications = data.map(notification => ({
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type as 'info' | 'warning' | 'error' | 'success',
          read: notification.read,
          relatedBookingId: notification.related_booking_id,
          createdAt: new Date(notification.created_at)
        }));

        setNotifications(formattedNotifications);
        setUnreadCount(formattedNotifications.filter(n => !n.read).length);
        console.log('useNotifications: Updated notifications count:', formattedNotifications.length);
      }
    } catch (error: unknown) {
      console.error('Error fetching notifications:', error);
      toast.error('Kunne ikke hente notifikasjoner');
    } finally {
      setIsLoading(false);
    }
  }, []); // Remove user from dependencies to avoid recreation

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error: unknown) {
      console.error('Error marking notification as read:', error);
      toast.error('Kunne ikke markere notifikasjon som lest');
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
      toast.success('Alle notifikasjoner markert som lest');
    } catch (error: unknown) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Kunne ikke markere alle notifikasjoner som lest');
    }
  };

  // Initial fetch - only trigger when user changes, not when fetchNotifications recreates
  useEffect(() => {
    if (user) {
      console.log('useNotifications: Initial fetch for user:', user.id);
      // Use timeout to avoid immediate rapid calls
      const timeoutId = setTimeout(() => {
        fetchNotifications(true); // Force refresh on initial load
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [user?.id]); // Only depend on user.id, not the entire user object

  // Set up real-time subscription with debounced callback
  useEffect(() => {
    if (!user) return;

    console.log('useNotifications: Setting up real-time subscription for user:', user.id);

    const debouncedFetch = () => {
      // Clear any existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      // Set new timeout for debounced fetch
      debounceTimeoutRef.current = setTimeout(() => {
        console.log('useNotifications: Real-time update triggered');
        fetchNotifications();
      }, 500); // 500ms debounce for real-time updates
    };

    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('useNotifications: Database change detected:', payload.eventType);
          debouncedFetch();
        }
      )
      .subscribe();

    return () => {
      console.log('useNotifications: Cleaning up real-time subscription');
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [user?.id]); // Only depend on user.id

  return {
    notifications,
    isLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    fetchNotifications
  };
};
