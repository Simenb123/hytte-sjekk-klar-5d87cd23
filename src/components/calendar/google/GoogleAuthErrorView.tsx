
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Calendar, Lock, ExternalLink, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GoogleAuthErrorViewProps {
  onRetry: () => void;
  isRetrying?: boolean;
}

export const GoogleAuthErrorView: React.FC<GoogleAuthErrorViewProps> = ({
  onRetry,
  isRetrying = false
}) => {
  // Capture the current origin for the redirect URI
  const origin = window.location.origin;
  const redirectUri = `${origin}/auth/calendar`;

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
          <AlertTriangle className="h-4 w-4 mr-2" />
          <AlertDescription>
            403 Forbidden: Google har avvist autentiseringsforespørselen
          </AlertDescription>
        </Alert>
        
        <div className="text-center p-6 border border-dashed rounded-lg">
          <div className="flex justify-center mb-4">
            <Calendar className="h-12 w-12 text-blue-400" />
            <Lock className="h-8 w-8 text-amber-500 ml-1 -mt-1" />
          </div>
          
          <h3 className="text-gray-700 font-medium mb-3">
            Sjekk følgende i Google Cloud Console:
          </h3>
          
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-5">
            <h4 className="font-bold mb-2 text-amber-800 text-sm">Viktig: Riktig Redirect URI</h4>
            <div className="bg-white p-2 rounded border border-gray-200 font-mono text-xs break-all mb-2">
              {redirectUri}
            </div>
            <p className="text-xs text-amber-700">
              Dette er den nøyaktige redirect URI-en som må konfigureres i Google Cloud OAuth-innstillingene
            </p>
          </div>
          
          <ul className="text-left text-gray-600 mb-5 list-disc pl-8 space-y-3">
            <li>
              <span className="font-medium">OAuth 2.0 Client-konfigurering:</span>
              <ul className="list-circle ml-6 mt-1 text-sm text-gray-500">
                <li><strong>Authorized redirect URI</strong> må være nøyaktig: <code>{redirectUri}</code></li>
                <li><strong>Authorized JavaScript origins</strong> må inkludere: <code>{origin}</code></li>
              </ul>
            </li>
            <li>
              <span className="font-medium">API-tilganger:</span>
              <ul className="list-circle ml-6 mt-1 text-sm text-gray-500">
                <li>Google Calendar API må være aktivert</li>
              </ul>
            </li>
            <li>
              <span className="font-medium">OAuth Consent Screen:</span>
              <ul className="list-circle ml-6 mt-1 text-sm text-gray-500">
                <li>Sjekk at alle nødvendige scopes er lagt til og godkjent</li>
                <li>Hvis appen er i test-modus: Legg til din e-post som test-bruker</li>
              </ul>
            </li>
          </ul>
          
          <div className="flex flex-col space-y-3">
            <Button 
              onClick={onRetry} 
              disabled={isRetrying} 
              variant="default"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Kobler til...' : 'Prøv å koble til på nytt'}
            </Button>
            
            <a 
              href="https://console.cloud.google.com/apis/credentials" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 p-2 rounded transition-colors"
            >
              <ExternalLink className="h-4 w-4 mr-2" /> 
              Åpne Google Cloud Console - Credentials
            </a>
            
            <a 
              href="https://console.cloud.google.com/apis/api/calendar-json.googleapis.com/overview" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 p-2 rounded transition-colors"
            >
              <ExternalLink className="h-4 w-4 mr-2" /> 
              Åpne Google Calendar API Settings
            </a>
            
            <a 
              href="https://console.cloud.google.com/apis/credentials/consent" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 p-2 rounded transition-colors"
            >
              <ExternalLink className="h-4 w-4 mr-2" /> 
              Åpne OAuth Consent Screen
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
