import { useState, useCallback, useRef } from 'react';
import { useGoogleCalendar } from '@/contexts/GoogleCalendarContext';

interface SyncState {
  isLoading: boolean;
  lastSyncTime?: string;
  error?: string | null;
  retryCount: number;
}

export function useGoogleCalendarSync() {
  const { 
    isGoogleConnected, 
    fetchGoogleEvents, 
    fetchGoogleCalendars, 
    connectGoogleCalendar,
    fetchError 
  } = useGoogleCalendar();
  
  const [syncState, setSyncState] = useState<SyncState>({
    isLoading: false,
    retryCount: 0
  });
  
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncRef = useRef<string | undefined>();

  const performSync = useCallback(async (forceRefresh = false) => {
    // Allow background refresh even if already loading
    if (syncState.isLoading && !forceRefresh) {
      console.log('Sync already in progress, skipping');
      return;
    }

    // Don't show loading spinner for background refreshes
    const isBackgroundRefresh = !forceRefresh && syncState.lastSyncTime;
    
    setSyncState(prev => ({ 
      ...prev, 
      isLoading: forceRefresh || !isBackgroundRefresh, 
      error: null 
    }));

    try {
      if (!isGoogleConnected) {
        throw new Error('Google Calendar not connected');
      }

      await Promise.all([
        fetchGoogleEvents(),
        fetchGoogleCalendars()
      ]);

      const now = new Date().toISOString();
      lastSyncRef.current = now;
      
      setSyncState(prev => ({
        ...prev,
        isLoading: false,
        lastSyncTime: now,
        error: null,
        retryCount: 0
      }));

      console.log('✅ Calendar sync successful');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Sync error:', errorMessage);
      
      // Don't show error for background refreshes, just log it
      if (!isBackgroundRefresh) {
        setSyncState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
          retryCount: prev.retryCount + 1
        }));
      } else {
        console.log('Background sync failed silently, will retry later');
        setSyncState(prev => ({ ...prev, isLoading: false }));
      }

      // Auto-retry with exponential backoff (max 3 retries) only for foreground syncs
      if (!isBackgroundRefresh && syncState.retryCount < 3) {
        const retryDelay = Math.min(1000 * Math.pow(2, syncState.retryCount), 30000);
        console.log(`Retrying sync in ${retryDelay}ms (attempt ${syncState.retryCount + 1})`);
        
        retryTimeoutRef.current = setTimeout(() => {
          performSync(forceRefresh);
        }, retryDelay);
      }
    }
  }, [isGoogleConnected, fetchGoogleEvents, fetchGoogleCalendars, syncState.isLoading, syncState.retryCount, syncState.lastSyncTime]);

  const manualRefresh = useCallback(async () => {
    // Clear any pending retries
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    // Reset retry count for manual refresh
    setSyncState(prev => ({ ...prev, retryCount: 0 }));
    
    await performSync(true);
  }, [performSync]);

  const reconnect = useCallback(async () => {
    try {
      setSyncState(prev => ({ ...prev, isLoading: true, error: null }));
      const success = await connectGoogleCalendar();
      if (success) {
        await performSync(true);
      }
    } catch (error) {
      console.error('Reconnect error:', error);
      setSyncState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Failed to reconnect' 
      }));
    }
  }, [connectGoogleCalendar, performSync]);

  return {
    isLoading: syncState.isLoading,
    lastSyncTime: syncState.lastSyncTime,
    error: syncState.error || fetchError,
    retryCount: syncState.retryCount,
    performSync,
    manualRefresh,
    reconnect,
    isConnected: isGoogleConnected
  };
}