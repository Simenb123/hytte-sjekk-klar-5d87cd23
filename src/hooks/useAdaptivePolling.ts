import { useEffect, useRef, useCallback } from 'react';
import { Event } from '@/screens/MammasHjorneScreen';

interface UseAdaptivePollingOptions {
  onPoll: () => Promise<void>;
  events: Event[];
  isNightMode: boolean;
  isConnected: boolean;
}

export function useAdaptivePolling({ onPoll, events, isNightMode, isConnected }: UseAdaptivePollingOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPollRef = useRef<number>(0);

  const getPollingInterval = useCallback(() => {
    // Don't poll if not connected
    if (!isConnected) return null;

    // Night mode: poll every 30 minutes
    if (isNightMode) return 30 * 60 * 1000;

    // Check if we have events starting soon (within 2 hours)
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    
    const hasUpcomingEvents = events.some(event => {
      const eventStart = new Date(event.start);
      return eventStart >= now && eventStart <= twoHoursFromNow;
    });

    // If events are starting soon, poll every 2 minutes
    if (hasUpcomingEvents) return 2 * 60 * 1000;

    // Day time: poll every 15 minutes
    return 15 * 60 * 1000;
  }, [isNightMode, events, isConnected]);

  const scheduleNextPoll = useCallback(() => {
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
    }

    const interval = getPollingInterval();
    if (interval === null) return;

    intervalRef.current = setTimeout(async () => {
      const now = Date.now();
      // Avoid polling too frequently (minimum 1 minute between polls)
      if (now - lastPollRef.current < 60 * 1000) {
        scheduleNextPoll();
        return;
      }

      lastPollRef.current = now;
      try {
        await onPoll();
      } catch (error) {
        console.error('Polling error:', error);
      }
      scheduleNextPoll();
    }, interval);
  }, [getPollingInterval, onPoll]);

  useEffect(() => {
    scheduleNextPoll();
    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [scheduleNextPoll]);

  // Force immediate poll when connection status changes
  useEffect(() => {
    if (isConnected) {
      onPoll().catch(console.error);
    }
  }, [isConnected, onPoll]);
}