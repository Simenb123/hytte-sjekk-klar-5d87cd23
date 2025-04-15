
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Calendar, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GoogleAuthErrorViewProps {
  onRetry: () => void;
  isRetrying?: boolean;
}

export const GoogleAuthErrorView: React.FC<GoogleAuthErrorViewProps> = ({
  onRetry,
  isRetrying = false
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Lock className="h-5 w-5 mr-2 text-amber-500" />
          <span>Google Calendar-tilkobling mislyktes</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
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
            <li>Problemer med OAuth-konfigurasjonen</li>
          </ul>
          
          <Button 
            onClick={onRetry} 
            disabled={isRetrying} 
            className="mt-2"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Kobler til...' : 'Prøv å koble til på nytt'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
