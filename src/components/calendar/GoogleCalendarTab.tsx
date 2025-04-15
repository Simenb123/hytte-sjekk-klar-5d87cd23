
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GoogleEventsList } from './GoogleEventsList';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

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
                          fetchError?.includes('Failed to fetch') ||
                          fetchError?.includes('Kunne ikke koble til');

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
        {connectionFailed && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Det er problemer med tilkobling til serveren. Google Calendar-integrasjonen er 
              midlertidig utilgjengelig. Prøv igjen senere eller kontakt support hvis problemet vedvarer.
            </AlertDescription>
          </Alert>
        )}
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
