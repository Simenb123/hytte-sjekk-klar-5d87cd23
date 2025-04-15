
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Google Calendar Hendelser</CardTitle>
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
