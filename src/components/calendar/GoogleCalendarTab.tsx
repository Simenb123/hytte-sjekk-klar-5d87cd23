
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GoogleEventsList } from './GoogleEventsList';

interface GoogleCalendarTabProps {
  isLoadingEvents: boolean;
  googleEvents: any[];
  fetchGoogleEvents: () => void;
  fetchError: string | null;
}

export const GoogleCalendarTab: React.FC<GoogleCalendarTabProps> = ({
  isLoadingEvents,
  googleEvents,
  fetchGoogleEvents,
  fetchError
}) => {
  const connectionFailed = fetchError?.includes('Edge Function') || 
                          fetchError?.includes('Failed to fetch');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Google Calendar Hendelser</span>
          {connectionFailed && (
            <span className="text-sm text-red-500 font-normal">
              Tilkobling midlertidig utilgjengelig
            </span>
          )}
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
