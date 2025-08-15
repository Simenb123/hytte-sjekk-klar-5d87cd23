
import { corsHeaders } from './constants.ts';
import { handleAuthUrlGeneration, handleOAuthCodeExchange, handleCalendarOperations } from './handlers.ts';
import { RequestData } from './types.ts';

Deno.serve(async (req) => {
  console.log(`[${new Date().toISOString()}] ${req.method} request received`);
  console.log('🔄 Google Calendar Edge Function restarted - New deployment active');
  
  // DEBUG: Log all available environment variables
  console.log('🔍 DEBUG: Available environment variables:');
  for (const [key, value] of Object.entries(Deno.env.toObject())) {
    if (key.includes('GOOGLE') || key.includes('CLIENT')) {
      console.log(`  ${key}: ${value ? '[SET]' : '[NOT SET]'}`);
    }
  }
  
  // Specific checks for Google secrets
  const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
  console.log(`🔍 GOOGLE_CLIENT_ID: ${googleClientId ? 'EXISTS (length: ' + googleClientId.length + ')' : 'MISSING'}`);
  console.log(`🔍 GOOGLE_CLIENT_SECRET: ${googleClientSecret ? 'EXISTS (length: ' + googleClientSecret.length + ')' : 'MISSING'}`);
  
  // CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const defaultOrigin = Deno.env.get('APP_ORIGIN');
    const origin = req.headers.get('origin') || defaultOrigin || '';
    console.log(`Request origin: ${origin}`);

    // Håndter GET-forespørsler for OAuth URL-generering
    if (req.method === 'GET') {
      return await handleAuthUrlGeneration(req, origin);
    }

    // Håndter POST-forespørsler for OAuth-kode-utveksling og kalenderoperasjoner
    if (req.method === 'POST') {
      const requestData: RequestData = await req.json();
      
      // Logging uten sensitive data
      console.log('POST request data keys:', Object.keys(requestData));
      
      // Håndter OAuth-kode-utveksling
      if (requestData.code) {
        return await handleOAuthCodeExchange(requestData, origin);
      }

      // Håndter kalenderoperasjoner
      if (requestData.action && requestData.tokens) {
        return await handleCalendarOperations(requestData);
      }

      return new Response(
        JSON.stringify({ error: 'Invalid request: missing action, code, or tokens' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Edge function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: `Edge function error: ${error.message}` 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
