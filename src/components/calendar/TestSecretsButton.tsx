import React from 'react';
import { Button } from '@/components/ui/button';
import { testGoogleCalendarSecrets } from '@/utils/testGoogleSecrets';
import { toast } from 'sonner';

export const TestSecretsButton: React.FC = () => {
  const handleTest = async () => {
    try {
      toast.info('Testing Google Calendar secrets...');
      const result = await testGoogleCalendarSecrets();
      
      if (result.error) {
        toast.error(`Secrets test failed: ${result.error.message}`);
      } else {
        toast.success('Secrets test successful! Check console for details.');
      }
    } catch (error) {
      toast.error('Secrets test failed - check console');
      console.error('Test error:', error);
    }
  };

  return (
    <Button onClick={handleTest} variant="outline" className="mb-4">
      🧪 Test Google Secrets
    </Button>
  );
};