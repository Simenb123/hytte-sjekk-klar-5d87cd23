
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface SubmitButtonProps {
  isSaving: boolean;
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({ isSaving }) => {
  return (
    <Button type="submit" className="w-full" disabled={isSaving}>
      {isSaving ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Lagrer...
        </>
      ) : 'Lagre endringer'}
    </Button>
  );
};
