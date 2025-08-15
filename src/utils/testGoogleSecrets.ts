import { supabase } from '@/integrations/supabase/client';

export const testGoogleCalendarSecrets = async () => {
  try {
    console.log('🧪 Testing Google Calendar secrets...');
    
    // Test GET request to see if secrets are available
    const response = await supabase.functions.invoke('google-calendar', {
      method: 'GET'
    });
    
    console.log('✅ Test response received:', response);
    return response;
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
};