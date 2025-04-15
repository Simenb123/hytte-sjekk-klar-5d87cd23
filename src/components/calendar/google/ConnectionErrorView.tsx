
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Server, Wifi, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ConnectionErrorViewProps {
  onRetry: () => void;
  isRetrying?: boolean;
  showDetailedInfo?: boolean;
}

export const ConnectionErrorView: React.FC<ConnectionErrorViewProps> = ({
  onRetry,
  isRetrying = false,
  showDetailedInfo = false
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
          <span>Tilkoblingsproblem</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            Det er problemer med tilkobling til serveren. 
            Du kan fortsatt bruke booking-funksjonen, men Google Calendar-integrasjonen er 
            midlertidig utilgjengelig.
          </AlertDescription>
        </Alert>
        
        <div className="text-center mt-8 p-6 border border-dashed rounded-lg">
          <div className="flex justify-center mb-4">
            <Server className="h-12 w-12 text-gray-400" />
            <Wifi className="h-12 w-12 text-gray-400 ml-2 text-red-500" />
          </div>
          
          {showDetailedInfo && (
            <>
              <p className="text-gray-500 mb-4">
                Vi kunne ikke koble til Edge Function-tjenesten. Dette kan skyldes:
              </p>
              <ul className="text-left text-gray-500 mb-4 list-disc pl-8">
                <li>Midlertidige nettverksproblemer mellom nettleseren og serveren</li>
                <li>Edge Function er ikke aktivert eller under vedlikehold</li>
                <li>Miljøvariabler i Edge Function er ikke riktig konfigurert</li>
              </ul>
            </>
          )}
          
          {!showDetailedInfo && (
            <p className="text-gray-500 mb-4">
              Det ser ut til å være et midlertidig problem med nettverkstilkoblingen. 
              Du kan fortsatt bruke de lokale booking-funksjonene.
            </p>
          )}
          
          <Button 
            onClick={onRetry} 
            disabled={isRetrying} 
            className="mt-2"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Prøver igjen...' : 'Prøv tilkobling på nytt'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
