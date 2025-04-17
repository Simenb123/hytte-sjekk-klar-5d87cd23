
import React from 'react';
import { Button } from '@/components/ui/button';
import { Server, Wifi, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
          <Server className="h-5 w-5 mr-2 text-red-500" />
          <span>Tilkoblingsfeil til Google Calendar</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center p-6 border border-dashed rounded-lg">
          <div className="flex justify-center mb-4">
            <Server className="h-12 w-12 text-gray-400" />
            <Wifi className="h-12 w-12 text-gray-400 ml-2" />
          </div>
          <p className="text-gray-700 font-medium mb-2">
            Kunne ikke koble til Google Calendar
          </p>
          <p className="text-gray-500 mb-4">
            Det ser ut til å være et tilkoblingsproblem med Google Calendar API. Dette kan skyldes flere ting:
          </p>
          
          <ul className="text-left text-gray-500 mb-4 list-disc pl-8">
            <li>Edge Function for Google Calendar er ikke aktivert</li>
            <li>Supabase Edge Function er midlertidig utilgjengelig</li>
            <li>Nettverksproblemer eller brannmur blokkerer tilkoblingen</li>
            <li>Google API er midlertidig utilgjengelig</li>
          </ul>
          
          {showDetailedInfo && (
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-4 text-left">
              <h3 className="text-gray-800 font-medium mb-2">Teknisk informasjon:</h3>
              <ul className="text-sm text-gray-600 list-disc pl-4">
                <li>
                  Sjekk at Supabase Edge Function <code className="bg-gray-100 px-1 rounded">google-calendar</code> er aktivert og kjører
                </li>
                <li>
                  Verifiser at GOOGLE_CLIENT_ID og GOOGLE_CLIENT_SECRET er riktig konfigurert i Edge Function secrets
                </li>
                <li>
                  Sjekk at Google Cloud Console har riktig OAuth-konfigurasjon og at OAuth skjerm er konfigurert
                </li>
              </ul>
            </div>
          )}
          
          <Button 
            onClick={onRetry} 
            disabled={isRetrying}
            className="mt-2"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Prøver igjen...' : 'Prøv igjen'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
