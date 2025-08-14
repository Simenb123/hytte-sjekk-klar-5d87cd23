import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Link } from 'lucide-react';

interface GoogleCalendarConnectViewProps {
  onConnect: () => void;
  isConnecting: boolean;
  connectionError?: string | null;
}

export const GoogleCalendarConnectView: React.FC<GoogleCalendarConnectViewProps> = ({
  onConnect,
  isConnecting,
  connectionError
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Koble til Google Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Link className="h-6 w-6 text-primary" />
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold">Integrer med Google Calendar</h3>
            <p className="text-muted-foreground text-sm">
              Koble til Google Calendar for å synkronisere bookinger og hendelser automatisk.
            </p>
          </div>

          <div className="space-y-3">
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Se alle dine Google Calendar-hendelser</li>
              <li>• Automatisk synkronisering med bookinger</li>
              <li>• Del kalender med andre brukere</li>
            </ul>
          </div>

          {connectionError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{connectionError}</p>
            </div>
          )}

          <Button 
            onClick={onConnect}
            disabled={isConnecting}
            className="w-full"
            size="lg"
          >
            {isConnecting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Kobler til...
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4 mr-2" />
                Koble til Google Calendar
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};