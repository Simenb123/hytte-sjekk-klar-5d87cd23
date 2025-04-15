
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GoogleEventsList } from './GoogleEventsList';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Wifi, Server, RefreshCw } from "lucide-react";
import { Button } from '@/components/ui/button';
import { isEdgeFunctionError } from './google/utils';

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
  const connectionFailed = isEdgeFunctionError(fetchError);

  const handleRetry = () => {
    fetchGoogleEvents();
  };

  if (connectionFailed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Google Calendar</span>
            <span className="text-sm text-red-500 font-normal flex items-center">
              <Wifi className="h-4 w-4 mr-1" />
              Tilkobling utilgjengelig
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Det er problemer med tilkobling til serveren. Google Calendar-integrasjonen er 
              midlertidig utilgjengelig.
            </AlertDescription>
          </Alert>
          
          <div className="text-center mt-8 p-6 border border-dashed rounded-lg">
            <div className="flex justify-center mb-4">
              <Server className="h-12 w-12 text-gray-400" />
              <Wifi className="h-12 w-12 text-gray-400 ml-2 text-red-500" />
            </div>
            <p className="text-gray-500 mb-4">
              Vi kunne ikke koble til Edge Function-tjenesten. Dette kan skje av flere grunner:
            </p>
            <ul className="text-left text-gray-500 mb-4 list-disc pl-8">
              <li>Edge Function er ikke aktivert</li>
              <li>Nettverksproblemer mellom klienten og serveren</li>
              <li>Miljøvariablene i Edge Function er ikke riktig satt opp</li>
            </ul>
            <Button onClick={handleRetry} className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Prøv tilkobling på nytt
            </Button>
          </div>
        </CardContent>
      </Card>
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
