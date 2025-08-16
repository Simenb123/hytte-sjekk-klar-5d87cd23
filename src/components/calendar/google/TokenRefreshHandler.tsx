import { useEffect } from 'react';
import { useGoogleCalendar } from '@/contexts/GoogleCalendarContext';
import { storeGoogleTokens } from '@/utils/tokenStorage';

/**
 * Component that handles automatic token refresh and provides error recovery
 */
export const TokenRefreshHandler = () => {
  const { googleTokens, disconnectGoogleCalendar } = useGoogleCalendar();

  useEffect(() => {
    // Listen for token refresh events from other components
    const handleTokenRefresh = async (event: CustomEvent<any>) => {
      if (event.detail?.refreshedTokens) {
        console.log('🔄 Received token refresh event, updating storage');
        const success = await storeGoogleTokens(event.detail.refreshedTokens);
        if (!success) {
          console.error('❌ Failed to store refreshed tokens');
          disconnectGoogleCalendar();
        }
      }
    };

    // Listen for authentication errors that require re-authentication
    const handleAuthError = () => {
      console.log('🔓 Authentication error detected, disconnecting');
      disconnectGoogleCalendar();
    };

    window.addEventListener('google-tokens-refreshed', handleTokenRefresh as EventListener);
    window.addEventListener('google-auth-error', handleAuthError);

    return () => {
      window.removeEventListener('google-tokens-refreshed', handleTokenRefresh as EventListener);
      window.removeEventListener('google-auth-error', handleAuthError);
    };
  }, [disconnectGoogleCalendar]);

  // Check token expiry and trigger refresh if needed
  useEffect(() => {
    if (!googleTokens?.expiry_date) return;

    const checkTokenExpiry = () => {
      const now = Date.now();
      const expiryTime = googleTokens.expiry_date!;
      const timeUntilExpiry = expiryTime - now;
      
      // If token expires in less than 5 minutes, we should refresh it
      if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
        console.log('🔄 Token expires soon, triggering automatic refresh');
        window.dispatchEvent(new CustomEvent('google-token-refresh-needed'));
      }
    };

    // Check immediately
    checkTokenExpiry();

    // Check every minute
    const interval = setInterval(checkTokenExpiry, 60 * 1000);

    return () => clearInterval(interval);
  }, [googleTokens]);

  return null; // This component doesn't render anything
};