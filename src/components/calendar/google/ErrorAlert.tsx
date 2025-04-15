
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Server, Wifi, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorAlertProps {
  error: string;
  onRetry: () => void;
  isEdgeFunctionIssue?: boolean;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ 
  error, 
  onRetry,
  isEdgeFunctionIssue 
}) => {
  if (isEdgeFunctionIssue) {
    return (
      <div>
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Nettverksfeil ved tilkobling til Edge Function. Sjekk at Edge Function er aktiv og at alle miljøvariabler er riktig satt opp.
            <Button 
              variant="link" 
              className="p-0 ml-2 text-xs underline" 
              onClick={onRetry}
            >
              Prøv igjen
            </Button>
          </AlertDescription>
        </Alert>
        
        <div className="text-center mt-8 p-6 border border-dashed rounded-lg">
          <div className="flex justify-center mb-4">
            <Server className="h-12 w-12 text-gray-400" />
            <Wifi className="h-12 w-12 text-gray-400 ml-2" />
          </div>
          <p className="text-gray-500 mb-4">
            Google Calendar-integrasjonen er midlertidig utilgjengelig på grunn av nettverksproblemer. 
            Du kan fortsatt bruke booking-funksjonene, og prøve tilkoblingen igjen senere.
          </p>
          <Button onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Prøv tilkobling på nytt
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="text-sm">
        {error}
        <Button 
          variant="link" 
          className="p-0 ml-2 text-xs underline" 
          onClick={onRetry}
        >
          Prøv igjen
        </Button>
      </AlertDescription>
    </Alert>
  );
};
