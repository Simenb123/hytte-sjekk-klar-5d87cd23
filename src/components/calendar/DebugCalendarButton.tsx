import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGoogleCalendar } from '@/hooks/google-calendar';
import { retrieveGoogleTokens } from '@/utils/tokenStorage';
import { fetchCalendarEvents } from '@/services/googleCalendar.service';
import { toast } from 'sonner';

export const DebugCalendarButton: React.FC = () => {
  const { 
    googleTokens, 
    isGoogleConnected, 
    fetchGoogleEvents,
    connectionError,
    fetchError 
  } = useGoogleCalendar();

  const handleDebugTest = async () => {
    console.log('🐛 DEBUG: Starting comprehensive debug test');
    
    try {
      // Test 1: Check tokens in context
      console.log('🐛 DEBUG Test 1: Context tokens:', {
        isGoogleConnected,
        context_tokens_exists: !!googleTokens,
        context_access_token_exists: !!googleTokens?.access_token,
        context_access_token_type: typeof googleTokens?.access_token,
        context_access_token_length: googleTokens?.access_token?.length || 0
      });

      // Test 2: Check tokens in localStorage
      const storedTokens = retrieveGoogleTokens();
      console.log('🐛 DEBUG Test 2: localStorage tokens:', {
        stored_tokens_exists: !!storedTokens,
        stored_access_token_exists: !!storedTokens?.access_token,
        stored_access_token_type: typeof storedTokens?.access_token,
        stored_access_token_length: storedTokens?.access_token?.length || 0
      });

      // Test 3: Try direct API call with stored tokens
      if (storedTokens?.access_token) {
        console.log('🐛 DEBUG Test 3: Testing direct API call...');
        toast.info('Testing direct API call with stored tokens...');
        
        try {
          const events = await fetchCalendarEvents(storedTokens);
          console.log('🐛 DEBUG Test 3 SUCCESS: Got events:', events?.length || 0);
          toast.success(`Direct API call successful! Got ${events?.length || 0} events`);
        } catch (apiError) {
          console.error('🐛 DEBUG Test 3 FAILED:', apiError);
          toast.error(`Direct API call failed: ${(apiError as Error).message}`);
        }
      } else {
        console.log('🐛 DEBUG Test 3 SKIPPED: No tokens available');
        toast.warning('No tokens available for direct API test');
      }

      // Test 4: Try context-based refresh
      if (isGoogleConnected) {
        console.log('🐛 DEBUG Test 4: Testing context refresh...');
        toast.info('Testing context-based refresh...');
        
        try {
          fetchGoogleEvents(); // This is a void function from context
          console.log('🐛 DEBUG Test 4 SUCCESS: Context fetch initiated');
          toast.success('Context fetch initiated successfully');
        } catch (contextError) {
          console.error('🐛 DEBUG Test 4 FAILED:', contextError);
          toast.error(`Context fetch failed: ${(contextError as Error).message}`);
        }
      } else {
        console.log('🐛 DEBUG Test 4 SKIPPED: Not connected');
        toast.warning('Not connected - cannot test context refresh');
      }

    } catch (error) {
      console.error('🐛 DEBUG: Overall test failed:', error);
      toast.error(`Debug test failed: ${(error as Error).message}`);
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-sm">🐛 Google Calendar Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>Connected: {isGoogleConnected ? '✅' : '❌'}</div>
          <div>Context Tokens: {googleTokens ? '✅' : '❌'}</div>
          <div>Access Token: {googleTokens?.access_token ? '✅' : '❌'}</div>
          <div>Token Length: {googleTokens?.access_token?.length || 0}</div>
        </div>
        
        {connectionError && (
          <div className="text-xs text-red-600 p-2 bg-red-50 rounded">
            Connection Error: {connectionError}
          </div>
        )}
        
        {fetchError && (
          <div className="text-xs text-orange-600 p-2 bg-orange-50 rounded">
            Fetch Error: {fetchError}
          </div>
        )}
        
        <Button 
          onClick={handleDebugTest} 
          variant="outline" 
          size="sm"
          className="w-full"
        >
          🐛 Run Debug Test
        </Button>
      </CardContent>
    </Card>
  );
};