import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const GoogleCalendarDebugPanel: React.FC = () => {
  const [debugResult, setDebugResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDebugTest = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 Running debug test...');
      
      const { data, error } = await supabase.functions.invoke('google-calendar/debug', {
        method: 'GET'
      });
      
      console.log('Debug result:', { data, error });
      setDebugResult({ data, error });
      
      if (error) {
        toast.error('Debug test failed');
      } else {
        toast.success('Debug test completed');
      }
    } catch (err) {
      console.error('Debug test error:', err);
      setDebugResult({ error: err.message });
      toast.error('Debug test failed');
    } finally {
      setIsLoading(false);
    }
  };

  const runConnectivityTest = async () => {
    setIsLoading(true);
    try {
      console.log('🔗 Running connectivity test...');
      
      const { data, error } = await supabase.functions.invoke('google-calendar/test', {
        method: 'GET'
      });
      
      console.log('Connectivity result:', { data, error });
      setDebugResult({ data, error });
      
      if (error) {
        toast.error('Connectivity test failed');
      } else {
        toast.success('Connectivity test passed');
      }
    } catch (err) {
      console.error('Connectivity test error:', err);
      setDebugResult({ error: err.message });
      toast.error('Connectivity test failed');
    } finally {
      setIsLoading(false);
    }
  };

  const testBasicOAuth = async () => {
    setIsLoading(true);
    try {
      console.log('🔐 Testing basic OAuth URL generation...');
      
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        method: 'GET'
      });
      
      console.log('OAuth URL result:', { data, error });
      setDebugResult({ data, error });
      
      if (error) {
        toast.error('OAuth URL generation failed');
      } else if (data?.url) {
        toast.success('OAuth URL generated successfully');
      } else {
        toast.warning('No URL returned');
      }
    } catch (err) {
      console.error('OAuth URL test error:', err);
      setDebugResult({ error: err.message });
      toast.error('OAuth URL test failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>🧪 Google Calendar Debug Panel</CardTitle>
        <CardDescription>
          Test Google Calendar integration step by step
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={runConnectivityTest} 
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? '⏳' : '🔗'} Test Connectivity
          </Button>
          
          <Button 
            onClick={runDebugTest} 
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? '⏳' : '🔍'} Check Secrets
          </Button>
          
          <Button 
            onClick={testBasicOAuth} 
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? '⏳' : '🔐'} Test OAuth URL
          </Button>
        </div>

        {debugResult && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Test Results:</h3>
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto max-h-96">
              {JSON.stringify(debugResult, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};