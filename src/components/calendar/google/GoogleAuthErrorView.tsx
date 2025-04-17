
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Calendar, Lock, ExternalLink, AlertTriangle, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface GoogleAuthErrorViewProps {
  onRetry: () => void;
  isRetrying?: boolean;
}

export const GoogleAuthErrorView: React.FC<GoogleAuthErrorViewProps> = ({
  onRetry,
  isRetrying = false
}) => {
  const currentUrl = window.location.origin;
  const redirectUri = `${currentUrl}/auth/calendar`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Lock className="h-5 w-5 mr-2 text-amber-500" />
          <span>Google Calendar-tilkobling mislyktes</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>OAuth Test Mode Restriction</AlertTitle>
          <AlertDescription>
            Google-prosjektet er i "Testing" modus. I denne modusen må e-postadressen din være lagt til som testbruker
            i Google Cloud Console for å kunne logge inn.
          </AlertDescription>
        </Alert>

        <div className="text-center p-6 border border-dashed rounded-lg">
          <div className="flex justify-center mb-4">
            <Calendar className="h-12 w-12 text-blue-400" />
            <Lock className="h-8 w-8 text-amber-500 ml-1 -mt-1" />
          </div>
          
          <p className="text-gray-700 font-medium mb-2">
            403 Forbidden: Ingen tilgang til Google Calendar
          </p>
          
          <p className="text-gray-500 mb-4">
            Google Calendar-integrasjonen kunne ikke fullføres på grunn av en tilgangsfeil.
            Dette kan skyldes:
          </p>
          
          <ul className="text-left text-gray-500 mb-4 list-disc pl-8">
            <li>Autorisasjonen har utløpt eller er ugyldig</li>
            <li>Appen har ikke riktig tillatelse til Google Calendar</li>
            <li className="font-medium text-amber-600">Din e-postadresse er ikke lagt til som testbruker</li>
            <li>Problemer med OAuth-konfigurasjonen</li>
          </ul>
          
          <div className="bg-amber-50 p-4 rounded-md border border-amber-200 mb-4">
            <h3 className="flex items-center text-amber-800 font-medium mb-2">
              <Users className="h-4 w-4 mr-2" />
              Test bruker krav
            </h3>
            <p className="text-amber-700 text-sm mb-2">
              Siden Google-prosjektet er i test modus, må du legge til din e-postadresse som testbruker i Google Cloud Console:
            </p>
            <ol className="text-left text-amber-700 text-sm list-decimal pl-6">
              <li>Gå til "OAuth consent screen" i Google Cloud Console</li>
              <li>Scroll ned til "Test users" seksjonen</li>
              <li>Klikk på "Add users" og legg til din e-postadresse</li>
              <li>Lagre endringene og prøv å koble til på nytt</li>
            </ol>
          </div>
          
          <p className="text-gray-500 mb-4">
            Sjekk også følgende i Google Cloud Console:
          </p>
          
          <ul className="text-left text-gray-500 mb-4 list-disc pl-8">
            <li>At redirect URI er nøyaktig angitt i OAuth-konfigurasjonen: <code className="bg-gray-100 px-1 rounded">{redirectUri}</code></li>
            <li>At du har aktivert riktige API-tilganger (Google Calendar API)</li>
            <li>At OAuth-consent screen er konfigurert riktig</li>
          </ul>
          
          <Button 
            onClick={onRetry} 
            disabled={isRetrying} 
            className="mt-2"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Kobler til...' : 'Prøv å koble til på nytt'}
          </Button>
          
          <div className="mt-4 flex justify-center space-x-4">
            <a 
              href="https://console.cloud.google.com/apis/credentials" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 flex items-center hover:underline"
            >
              <ExternalLink className="h-3 w-3 mr-1" /> 
              Credentials
            </a>
            <a 
              href="https://console.cloud.google.com/apis/credentials/consent" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 flex items-center hover:underline"
            >
              <Users className="h-3 w-3 mr-1" /> 
              Test Users
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
