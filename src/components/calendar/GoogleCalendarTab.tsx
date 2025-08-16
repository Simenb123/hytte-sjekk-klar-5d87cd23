
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GoogleEventsList } from './GoogleEventsList';
import { GoogleCalendarConnectView } from './GoogleCalendarConnectView';
import { ConnectionErrorView } from './google/ConnectionErrorView';
import { GoogleAuthErrorView } from './google/GoogleAuthErrorView';
import { isEdgeFunctionError, isAuthError } from './google/utils';
import { useConnectionRetry } from '@/hooks/google-calendar/useConnectionRetry';
import { GoogleCalendarDebugPanel } from './GoogleCalendarDebugPanel';
import { GoogleCalendarSettings } from './GoogleCalendarSettings';
import type { GoogleEvent } from '@/types/googleCalendar.types';

interface GoogleCalendarTabProps {
  isLoadingEvents: boolean;
  googleEvents: GoogleEvent[];
  fetchGoogleEvents: () => void;
  connectGoogleCalendar: () => void;
  fetchError: string | null;
  isGoogleConnected: boolean;
  isConnecting: boolean;
}

export const GoogleCalendarTab: React.FC<GoogleCalendarTabProps> = ({
  isLoadingEvents,
  googleEvents,
  fetchGoogleEvents,
  connectGoogleCalendar,
  fetchError,
  isGoogleConnected,
  isConnecting
}) => {
  // Improved error detection with dedicated check for third-party cookie issues
  const connectionFailed = isEdgeFunctionError(fetchError);
  const authFailed = isAuthError(fetchError);
  const isThirdPartyCookieBlocked = fetchError?.includes('avviste tilkoblingsforsøket') || 
                              fetchError?.includes('refused to connect') || 
                              fetchError?.includes('network error') ||
                              fetchError?.includes('tredjepartsinfokapsler');
  
  console.log('GoogleCalendarTab - Error state:', {
    fetchError: fetchError?.substring(0, 100),
    connectionFailed,
    authFailed,
    isThirdPartyCookieBlocked
  });
  
  const { isRetrying, handleRetry } = useConnectionRetry(
    async () => {
      try {
        // If it's an auth error or third-party cookie issue, we need to reconnect
        if (authFailed || isThirdPartyCookieBlocked) {
          console.log('Auth failed or third-party cookies blocked, trying to reconnect');
          connectGoogleCalendar();
        } else {
          console.log('Connection error but not auth failed, trying to fetch events');
          await fetchGoogleEvents();
        }
        return !connectionFailed && !authFailed && !isThirdPartyCookieBlocked;
      } catch (error) {
        console.error('Retry failed:', error);
        return false;
      }
    },
    3,  // max retries
    5   // initial backoff in seconds
  );

  // If we can't connect to Edge Function but it's not a cookie issue
  if (connectionFailed && !isThirdPartyCookieBlocked) {
    return (
      <ConnectionErrorView 
        onRetry={handleRetry} 
        isRetrying={isRetrying}
        showDetailedInfo={true}
      />
    );
  }
  
  // If we have auth issues with Google or third-party cookie issues
  if (authFailed || isThirdPartyCookieBlocked) {
    return (
      <GoogleAuthErrorView
        onRetry={handleRetry}
        isRetrying={isRetrying}
        connectionError={isThirdPartyCookieBlocked}
      />
    );
  }

  // If not connected to Google Calendar at all, show connect view
  if (!isGoogleConnected) {
    return (
      <GoogleCalendarConnectView
        onConnect={connectGoogleCalendar}
        isConnecting={isConnecting}
        connectionError={fetchError}
      />
    );
  }

  return (
    <div className="space-y-4">
      <GoogleCalendarDebugPanel />
      
      <GoogleCalendarSettings />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Google Calendar Hendelser</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <GoogleEventsList
            events={googleEvents}
            isLoading={isLoadingEvents}
            onRefresh={fetchGoogleEvents}
            error={fetchError}
          />
        </CardContent>
      </Card>
    </div>
  );
};
