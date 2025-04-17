
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Calendar, Lock, ExternalLink, AlertTriangle, Users, WifiOff, Settings, Cookie } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface GoogleAuthErrorViewProps {
  onRetry: () => void;
  isRetrying?: boolean;
  connectionError?: boolean;
}

export const GoogleAuthErrorView: React.FC<GoogleAuthErrorViewProps> = ({
  onRetry,
  isRetrying = false,
  connectionError = false
}) => {
  const currentUrl = window.location.origin;
  const redirectUri = `${currentUrl}/auth/calendar`;
  
  // Get browser info to help with troubleshooting
  const isChrome = navigator.userAgent.indexOf("Chrome") > -1;
  const isFirefox = navigator.userAgent.indexOf("Firefox") > -1;
  const isSafari = navigator.userAgent.indexOf("Safari") > -1 && navigator.userAgent.indexOf("Chrome") === -1;
  const isEdge = navigator.userAgent.indexOf("Edg") > -1;
  
  // Check if we're in a preview environment
  const isPreviewEnvironment = currentUrl.includes('lovableproject.com');
  
  // Get debug info
  const debugInfo = {
    browser: isChrome ? 'Chrome' : isFirefox ? 'Firefox' : isSafari ? 'Safari' : isEdge ? 'Edge' : 'Other',
    cookiesEnabled: navigator.cookieEnabled,
    isPreviewEnvironment,
    redirectUri,
    userAgent: navigator.userAgent.substring(0, 100) + '...',
    online: navigator.onLine
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          {connectionError ? (
            <>
              <WifiOff className="h-5 w-5 mr-2 text-red-500" />
              <span>Tilkoblingsfeil til Google</span>
            </>
          ) : (
            <>
              <Lock className="h-5 w-5 mr-2 text-amber-500" />
              <span>Google Calendar-tilkobling mislyktes</span>
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {connectionError ? (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Tilkoblingsfeil</AlertTitle>
            <AlertDescription>
              "accounts.google.com avviste tilkoblingsforsøket." Dette skyldes sannsynligvis blokkering av tredjepartsinfokapsler i nettleseren.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>OAuth Test Mode Restriction</AlertTitle>
            <AlertDescription>
              Google-prosjektet er i "Testing" modus. I denne modusen må e-postadressen din være lagt til som testbruker
              i Google Cloud Console for å kunne logge inn.
            </AlertDescription>
          </Alert>
        )}

        <div className="text-center p-6 border border-dashed rounded-lg">
          <div className="flex justify-center mb-4">
            {connectionError ? (
              <WifiOff className="h-12 w-12 text-red-500" />
            ) : (
              <>
                <Calendar className="h-12 w-12 text-blue-400" />
                <Lock className="h-8 w-8 text-amber-500 ml-1 -mt-1" />
              </>
            )}
          </div>
          
          {connectionError ? (
            <p className="text-gray-700 font-medium mb-2">
              Tilkoblingsproblem med Google-tjeneste
            </p>
          ) : (
            <p className="text-gray-700 font-medium mb-2">
              403 Forbidden: Ingen tilgang til Google Calendar
            </p>
          )}
          
          {connectionError ? (
            <div>
              <p className="text-gray-500 mb-4">
                Nettleseren kunne ikke koble til Google-tjenesten. Dette skyldes mest sannsynlig:
              </p>
              
              <ul className="text-left text-gray-500 mb-4 list-disc pl-8">
                <li className="font-medium text-red-600">Blokkering av tredjepartsinfokapsler i nettleseren (mest vanlig årsak)</li>
                <li>Nettverksproblemer (VPN, proxy, brannmur)</li>
                <li>Google-tjenesten er midlertidig utilgjengelig</li>
                <li>Konfigurasjonsproblemer med API-et</li>
              </ul>
              
              <div className="bg-amber-50 p-4 rounded-md border border-amber-200 mb-4">
                <h3 className="flex items-center text-amber-800 font-medium mb-2">
                  <Cookie className="h-4 w-4 mr-2" />
                  Viktig: Aktiver tredjepartsinfokapsler
                </h3>
                
                {isChrome && (
                  <ol className="text-left text-amber-700 text-sm list-decimal pl-6">
                    <li>Åpne Chrome-innstillinger (⋮ &gt; Innstillinger)</li>
                    <li>Gå til Personvern og sikkerhet &gt; Informasjonskapsler og andre nettsidedata</li>
                    <li>Velg "Tillat alle informasjonskapsler" eller legg til denne nettsiden som unntak</li>
                    <li>Last nettsiden på nytt og prøv igjen</li>
                  </ol>
                )}
                
                {isFirefox && (
                  <ol className="text-left text-amber-700 text-sm list-decimal pl-6">
                    <li>Åpne Firefox-innstillinger (≡ &gt; Innstillinger)</li>
                    <li>Gå til Personvern og sikkerhet &gt; Utvidet sporing og beskyttelse</li>
                    <li>Velg "Standard" i stedet for "Streng"</li>
                    <li>Last nettsiden på nytt og prøv igjen</li>
                  </ol>
                )}
                
                {isSafari && (
                  <ol className="text-left text-amber-700 text-sm list-decimal pl-6">
                    <li>Åpne Safari-innstillinger</li> 
                    <li>Gå til Personvern &gt; Nettstedsinnstillinger</li>
                    <li>Deaktiver "Hindre krysssporsporing" eller legg til denne nettsiden som unntak</li>
                    <li>Last nettsiden på nytt og prøv igjen</li>
                  </ol>
                )}
                
                {!isChrome && !isFirefox && !isSafari && (
                  <p className="text-amber-700 text-sm">
                    Sjekk nettleserens innstillinger for informasjonskapsler og personvern. Sørg for at tredjepartsinfokapsler er tillatt for denne nettsiden.
                  </p>
                )}
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-4">
                <h3 className="flex items-center text-gray-800 font-medium mb-2">
                  <Settings className="h-4 w-4 mr-2" />
                  Andre feilsøkingsforslag
                </h3>
                <ol className="text-left text-gray-700 text-sm list-decimal pl-6">
                  <li>Prøv å slå av VPN eller proxy hvis du bruker det</li>
                  <li>Prøv en annen nettleser</li>
                  <li>Sjekk at datoen og klokkeslettet på enheten din er riktig</li>
                  <li>Prøv å åpne en privat/inkognito-fane</li>
                </ol>
              </div>
              
              {isPreviewEnvironment && (
                <div className="bg-blue-50 p-4 rounded-md border border-blue-200 mb-4">
                  <h3 className="flex items-center text-blue-800 font-medium mb-2">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Preview-miljø oppdaget
                  </h3>
                  <p className="text-blue-700 text-sm mb-2">
                    Du bruker et Lovable preview-miljø: <code className="bg-blue-100 px-1 rounded">{currentUrl}</code>
                  </p>
                  <p className="text-blue-700 text-sm">
                    Preview-miljøer kan ha ytterligere begrensninger. Hvis problemet vedvarer etter å ha aktivert tredjepartsinfokapsler, prøv den publiserte versjonen av applikasjonen i stedet.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <>
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
            </>
          )}
          
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
          
          {/* Debug info accordion */}
          <details className="mt-4 text-left text-xs text-gray-500">
            <summary className="cursor-pointer">Vis teknisk informasjon (for feilsøking)</summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto text-gray-700">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </details>
        </div>
      </CardContent>
    </Card>
  );
};
