
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
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
            Kunne ikke koble til Google Calendar-tjenesten. Dette er et midlertidig problem med serveren.
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
          <p className="text-gray-500 mb-4">
            Google Calendar-integrasjonen er midlertidig utilgjengelig. 
            Du kan fortsatt bruke booking-funksjonene, og prøve tilkoblingen igjen senere.
          </p>
          <Button onClick={onRetry}>
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
