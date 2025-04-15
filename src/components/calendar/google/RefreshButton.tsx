
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Share2, AlertTriangle } from 'lucide-react';
import { isEdgeFunctionError, isAuthError } from './utils';

interface RefreshButtonProps {
  isLoading: boolean;
  onRefresh: () => void;
  error?: string | null;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({ 
  isLoading, 
  onRefresh,
  error
}) => {
  const isConnectionError = isEdgeFunctionError(error);
  const isTokenError = isAuthError(error);
  
  // Select button variant based on error type
  const getButtonVariant = () => {
    if (isConnectionError) return "destructive";
    if (isTokenError) return "outline";
    return "outline";
  };
  
  // Get appropriate button text based on error type
  const getButtonText = () => {
    if (isLoading) return "Oppdaterer...";
    if (isConnectionError) return "Prøv tilkobling på nytt";
    if (isTokenError) return "Tilkobling utløpt";
    return "Oppdater Google Calendar";
  };
  
  // Get appropriate button icon based on error type
  const ButtonIcon = () => {
    if (isLoading) return <Loader2 className="h-4 w-4 mr-2 animate-spin" />;
    if (isConnectionError) return <AlertTriangle className="h-4 w-4 mr-2" />;
    if (isTokenError) return <AlertTriangle className="h-4 w-4 mr-2" />;
    return <RefreshCw className="h-4 w-4 mr-2" />;
  };

  return (
    <>
      <Button 
        onClick={onRefresh} 
        disabled={isLoading}
        className="w-full mt-5"
        variant={getButtonVariant()}
      >
        <ButtonIcon />
        {getButtonText()}
      </Button>
      
      {!isConnectionError && !isTokenError && (
        <div className="flex justify-center mt-4">
          <a 
            href="https://calendar.google.com/calendar/u/0/r" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-blue-600 flex items-center hover:underline"
          >
            <Share2 className="h-3 w-3 mr-1" /> Åpne i Google Calendar
          </a>
        </div>
      )}
    </>
  );
};
