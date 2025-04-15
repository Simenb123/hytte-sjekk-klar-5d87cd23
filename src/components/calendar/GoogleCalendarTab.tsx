
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GoogleEventsList } from './GoogleEventsList';
import { ConnectionErrorView } from './google/ConnectionErrorView';
import { GoogleAuthErrorView } from './google/GoogleAuthErrorView';
import { isEdgeFunctionError, isAuthError } from './google/utils';
import { useConnectionRetry } from '@/hooks/google-calendar/useConnectionRetry';

interface GoogleCalendarTabProps {
  isLoadingEvents: boolean;
  googleEvents: any[];
  fetchGoogleEvents: () => void;
  connectGoogleCalendar: () => void;
  fetchError: string | null;
}

export const GoogleCalendarTab: React.FC<GoogleCalendarTabProps> = ({
  isLoadingEvents,
  googleEvents,
  fetchGoogleEvents,
  connectGoogleCalendar,
  fetchError
}) => {
  const connectionFailed = isEdgeFunctionError(fetchError);
  const authFailed = isAuthError(fetchError);
  
  const { isRetrying, handleRetry } = useConnectionRetry(
    async () => {
      try {
        // If it's an auth error, we need to reconnect, otherwise just fetch events
        if (authFailed) {
          connectGoogleCalendar();
        } else {
          await fetchGoogleEvents();
        }
        return !connectionFailed && !authFailed;
      } catch (error) {
        console.error('Retry failed:', error);
        return false;
      }
    },
    3,  // max retries
    5   // initial backoff in seconds
  );

  // If we can't connect to Edge Function
  if (connectionFailed) {
    return (
      <ConnectionErrorView 
        onRetry={handleRetry} 
        isRetrying={isRetrying}
        showDetailedInfo={true}
      />
    );
  }
  
  // If we have auth issues with Google
  if (authFailed) {
    return (
      <GoogleAuthErrorView
        onRetry={handleRetry}
        isRetrying={isRetrying}
      />
    );
  }

  return (
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
  );
};
