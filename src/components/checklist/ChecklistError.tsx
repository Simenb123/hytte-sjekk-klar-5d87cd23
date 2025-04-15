
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';

interface ChecklistErrorProps {
  error: string;
}

const ChecklistError = ({ error }: ChecklistErrorProps) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 text-red-800 flex items-start">
      <AlertCircle className="mr-2 h-5 w-5 flex-shrink-0" />
      <div>
        <h3 className="font-medium">Feil ved lasting av sjekklister</h3>
        <p className="text-sm mt-1">{error}</p>
        <Button 
          onClick={() => window.location.reload()} 
          variant="destructive"
          className="mt-2"
          size="sm"
        >
          Last på nytt
        </Button>
      </div>
    </div>
  );
};

export default ChecklistError;
