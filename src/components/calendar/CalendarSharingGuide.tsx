import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Users, Calendar, Share } from 'lucide-react';

interface CalendarSharingGuideProps {
  isGoogleConnected: boolean;
  eventCount: number;
}

export const CalendarSharingGuide: React.FC<CalendarSharingGuideProps> = ({ 
  isGoogleConnected, 
  eventCount 
}) => {
  if (!isGoogleConnected) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Kalenderdeling
        </CardTitle>
        <CardDescription>
          Slik deler du kalenderen med andre familiemedlemmer
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Users className="h-4 w-4" />
          <AlertDescription>
            <strong>Viktig:</strong> Hver bruker ser kun sine egne Google Calendar-avtaler. 
            For å dele avtaler med familie må du dele kalenderen din i Google Calendar.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 mt-0.5 text-blue-600" />
            <div>
              <p className="font-medium">Steg 1: Åpne Google Calendar</p>
              <p className="text-sm text-muted-foreground">
                Gå til calendar.google.com på din computer eller mobil
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Share className="h-5 w-5 mt-0.5 text-blue-600" />
            <div>
              <p className="font-medium">Steg 2: Del kalenderen</p>
              <p className="text-sm text-muted-foreground">
                Klikk på din kalender → Innstillinger og deling → Legg til personer → 
                Skriv inn e-postadresser til familiemedlemmer
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 mt-0.5 text-blue-600" />
            <div>
              <p className="font-medium">Steg 3: Familiemedlemmer kobler til</p>
              <p className="text-sm text-muted-foreground">
                Hver person må koble sin Google-konto til hytte-appen for å se de delte avtalene
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>Tips:</strong> Opprett en egen "Hytte Booking" kalender i Google Calendar 
            som alle familiemedlemmer kan dele og redigere.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};