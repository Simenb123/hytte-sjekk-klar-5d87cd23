import { useEffect } from 'react';
import { useGoogleCalendar } from '@/contexts/GoogleCalendarContext';
import { toast } from 'sonner';

/**
 * Component that handles automatic error recovery and retry logic
 */
export const ErrorRecoveryHandler = () => {
  const { 
    connectionError, 
    fetchError, 
    fetchGoogleEvents: refreshGoogleEvents, 
    fetchGoogleCalendars: refreshGoogleCalendars,
    disconnectGoogleCalendar,
    googleTokens 
  } = useGoogleCalendar();

  // Auto-retry logic for certain types of errors
  useEffect(() => {
    if (!connectionError && !fetchError) return;

    const error = connectionError || fetchError;
    const isTemporaryError = 
      error?.includes('429') || // Rate limit
      error?.includes('503') || // Service unavailable
      error?.includes('Network') || // Network error
      error?.includes('timeout'); // Timeout

    if (isTemporaryError && googleTokens) {
      console.log('🔄 Detected temporary error, scheduling retry in 5 seconds');
      const timeoutId = setTimeout(() => {
        console.log('🔄 Attempting automatic retry after temporary error');
        try {
          refreshGoogleEvents();
          refreshGoogleCalendars();
        } catch (error) {
          console.error('Retry failed:', error);
        }
      }, 5000);

      return () => clearTimeout(timeoutId);
    }

    // Handle permanent auth errors
    const isAuthError = 
      error?.includes('401') ||
      error?.includes('Authentication') ||
      error?.includes('Invalid Credentials') ||
      error?.includes('Autentisering utløpt');

    if (isAuthError) {
      console.log('🔓 Permanent authentication error detected');
      toast.error('Google Calendar-tilkoblingen må fornyes', {
        action: {
          label: 'Koble til på nytt',
          onClick: () => {
            disconnectGoogleCalendar();
            // Give a moment for disconnect to complete, then trigger reconnect
            setTimeout(() => {
              window.location.reload();
            }, 500);
          }
        }
      });
    }
  }, [connectionError, fetchError, googleTokens, refreshGoogleEvents, refreshGoogleCalendars, disconnectGoogleCalendar]);

  return null; // This component doesn't render anything
};