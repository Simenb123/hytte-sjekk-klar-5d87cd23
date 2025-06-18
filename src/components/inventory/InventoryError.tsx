
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InventoryErrorProps {
  error: string;
  onRetry?: () => void;
}

const InventoryError: React.FC<InventoryErrorProps> = ({ error, onRetry }) => {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Noe gikk galt</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline">
            Prøv igjen
          </Button>
        )}
      </div>
    </div>
  );
};

export default InventoryError;
