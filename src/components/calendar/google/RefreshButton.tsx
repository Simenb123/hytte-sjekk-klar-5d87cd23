
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Share2 } from 'lucide-react';

interface RefreshButtonProps {
  isLoading: boolean;
  onRefresh: () => void;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({ 
  isLoading, 
  onRefresh 
}) => {
  return (
    <>
      <Button 
        onClick={onRefresh} 
        disabled={isLoading}
        className="w-full mt-5"
        variant="outline"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Oppdaterer...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4 mr-2" />
            Oppdater Google Calendar
          </>
        )}
      </Button>
      
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
    </>
  );
};
