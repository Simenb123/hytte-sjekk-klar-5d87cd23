
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Share2, Users } from "lucide-react";

interface CalendarInfoProps {
  isGoogleConnected: boolean;
}

export const CalendarInfo: React.FC<CalendarInfoProps> = ({ isGoogleConnected }) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Kalender og booking
        </CardTitle>
        <CardDescription>
          Her kan du håndtere booking av hytta og synkronisere med Google Calendar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Om bookingsystemet:</h3>
          <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-5">
            <li>Velg datoer i kalenderen og opprett booking ved å klikke på "Ny booking"</li>
            <li>Alle bookinger vises i kalenderen med rød farge</li>
            <li>Du kan navigere mellom måneder med pilene over kalenderen</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Google Calendar-integrasjon:
          </h3>
          <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-5">
            {isGoogleConnected ? (
              <>
                <li>Du er koblet til Google Calendar</li>
                <li>Du kan se alle dine Google Calendar-hendelser i "Google Calendar"-fanen</li>
                <li>Du kan legge til nye bookinger i Google Calendar ved å aktivere valget i booking-skjemaet</li>
                <li>Du kan også opprette en felles hytte-kalender som kan deles med andre familiemedlemmer</li>
              </>
            ) : (
              <>
                <li>Koble til Google Calendar for å synkronisere bookinger</li>
                <li>Du vil kunne legge til bookinger i din Google-kalender og se dine kalenderavtaler i appen</li>
                <li>Du kan opprette en delt hytte-kalender for hele familien</li>
                <li>Klikk på "Koble til Google Calendar" for å komme i gang</li>
              </>
            )}
          </ul>
        </div>

        {isGoogleConnected && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Del med familien:
            </h3>
            <p className="text-sm text-muted-foreground">
              Du kan opprette en felles hytte-kalender og dele den med andre familiemedlemmer 
              via "Del kalender"-knappen i bookingsoversikten.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
