import { useState, useEffect, useCallback, useRef } from 'react';
import { useGoogleCalendar } from '@/contexts/GoogleCalendarContext';
import { retrieveGoogleTokens, hasValidTokens } from '@/utils/tokenStorage';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface HealthState {
  isHealthy: boolean;
  lastHealthCheck: Date | null;
  consecutiveFailures: number;
  isMonitoring: boolean;
  lastError: string | null;
}

const HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MAX_CONSECUTIVE_FAILURES = 3;
const RECOVERY_RETRY_DELAY = 30 * 1000; // 30 seconds

export function useGoogleCalendarHealth() {
  const { 
    isGoogleConnected, 
    connectionError, 
    fetchError,
    connectGoogleCalendar,
    fetchGoogleEvents,
    fetchGoogleCalendars
  } = useGoogleCalendar();
  
  const [healthState, setHealthState] = useState<HealthState>({
    isHealthy: false,
    lastHealthCheck: null,
    consecutiveFailures: 0,
    isMonitoring: false,
    lastError: null
  });

  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recoveryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Perform comprehensive health check
  const performHealthCheck = useCallback(async (): Promise<boolean> => {
    console.log('🏥 Performing Google Calendar health check...');
    
    try {
      // Check 1: Basic connection state
      if (!isGoogleConnected) {
        console.log('❌ Health check failed: Not connected to Google Calendar');
        return false;
      }

      // Check 2: Token validity
      const tokens = retrieveGoogleTokens();
      if (!tokens || !hasValidTokens()) {
        console.log('❌ Health check failed: No valid tokens found');
        return false;
      }

      // Check 3: API accessibility test
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        method: 'GET',
        body: { action: 'test' }
      });

      if (error || data?.error) {
        console.log('❌ Health check failed: API test failed', error || data?.error);
        return false;
      }

      console.log('✅ Health check passed: Google Calendar is healthy');
      return true;
    } catch (error) {
      console.error('❌ Health check failed with exception:', error);
      return false;
    }
  }, [isGoogleConnected]);

  // Automatic recovery attempt
  const attemptRecovery = useCallback(async () => {
    console.log('🔄 Attempting automatic Google Calendar recovery...');
    
    try {
      // Strategy 1: Try to reconnect with existing tokens
      const tokens = retrieveGoogleTokens();
      if (tokens) {
        console.log('🔄 Attempting to refresh events with existing tokens...');
        await fetchGoogleEvents();
        await fetchGoogleCalendars();
        
        // Test if recovery worked
        const isHealthy = await performHealthCheck();
        if (isHealthy) {
          console.log('✅ Recovery successful with existing tokens');
          toast.success('Google Calendar-tilkobling gjenopprettet automatisk');
          return true;
        }
      }

      // Strategy 2: Full reconnection
      console.log('🔄 Attempting full reconnection...');
      const success = await connectGoogleCalendar();
      
      if (success) {
        console.log('✅ Full reconnection successful');
        toast.success('Google Calendar koblet til på nytt');
        return true;
      }

      console.log('❌ Recovery failed');
      return false;
    } catch (error) {
      console.error('❌ Recovery attempt failed:', error);
      return false;
    }
  }, [fetchGoogleEvents, fetchGoogleCalendars, connectGoogleCalendar, performHealthCheck]);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    if (healthState.isMonitoring) return;

    console.log('🔍 Starting Google Calendar health monitoring...');
    setHealthState(prev => ({ ...prev, isMonitoring: true }));

    const runHealthCheck = async () => {
      const isHealthy = await performHealthCheck();
      const now = new Date();
      
      setHealthState(prev => {
        const newFailures = isHealthy ? 0 : prev.consecutiveFailures + 1;
        
        return {
          ...prev,
          isHealthy,
          lastHealthCheck: now,
          consecutiveFailures: newFailures,
          lastError: !isHealthy ? (connectionError || fetchError || 'Unknown error') : null
        };
      });

      // Trigger recovery if too many failures
      if (!isHealthy) {
        setHealthState(prev => {
          if (prev.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
            console.log(`⚠️ Too many consecutive failures (${prev.consecutiveFailures}), attempting recovery...`);
            
            // Schedule recovery attempt
            if (recoveryTimeoutRef.current) {
              clearTimeout(recoveryTimeoutRef.current);
            }
            
            recoveryTimeoutRef.current = setTimeout(async () => {
              await attemptRecovery();
            }, RECOVERY_RETRY_DELAY);
          }
          
          return prev;
        });
      }
    };

    // Initial health check
    runHealthCheck();

    // Schedule periodic health checks
    healthCheckIntervalRef.current = setInterval(runHealthCheck, HEALTH_CHECK_INTERVAL);
  }, [healthState.isMonitoring, performHealthCheck, connectionError, fetchError, attemptRecovery]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    console.log('🛑 Stopping Google Calendar health monitoring...');
    
    if (healthCheckIntervalRef.current) {
      clearInterval(healthCheckIntervalRef.current);
      healthCheckIntervalRef.current = null;
    }
    
    if (recoveryTimeoutRef.current) {
      clearTimeout(recoveryTimeoutRef.current);
      recoveryTimeoutRef.current = null;
    }
    
    setHealthState(prev => ({ ...prev, isMonitoring: false }));
  }, []);

  // Manual recovery trigger
  const triggerRecovery = useCallback(async () => {
    const success = await attemptRecovery();
    
    if (success) {
      // Reset failure count on successful recovery
      setHealthState(prev => ({
        ...prev,
        consecutiveFailures: 0,
        isHealthy: true,
        lastError: null
      }));
    }
    
    return success;
  }, [attemptRecovery]);

  // Auto-start monitoring when component mounts
  useEffect(() => {
    startMonitoring();
    
    return () => {
      stopMonitoring();
    };
  }, [startMonitoring, stopMonitoring]);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
      }
      if (recoveryTimeoutRef.current) {
        clearTimeout(recoveryTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...healthState,
    startMonitoring,
    stopMonitoring,
    performHealthCheck,
    triggerRecovery,
    isRecoveryNeeded: healthState.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES
  };
}