
import { corsHeaders } from './auth.ts';
import { handleAuthUrlGeneration, handleOAuthCodeExchange, handleCalendarOperations } from './handlers.ts';
import { RequestData } from './types.ts';

Deno.serve(async (req) => {
  console.log(`[${new Date().toISOString()}] ${req.method} request received`);
  console.log(`Request URL: ${req.url}`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const origin = req.headers.get('origin') || 'https://hytte-sjekk-klar.lovable.app';
    console.log(`Origin header: ${origin}`);

    // Handle GET requests for OAuth URL generation
    if (req.method === 'GET') {
      return await handleAuthUrlGeneration(req, origin);
    }

    // Handle POST requests for OAuth code exchange and calendar operations
    if (req.method === 'POST') {
      const requestData: RequestData = await req.json();
      console.log('POST request data:', JSON.stringify({
        ...requestData,
        code: requestData.code ? `${requestData.code.substring(0, 10)}...` : undefined,
        tokens: requestData.tokens ? 'tokens-object-present' : undefined
      }));
      
      // Handle OAuth code exchange
      if (requestData.code) {
        return await handleOAuthCodeExchange(requestData, origin);
      }

      // Handle calendar operations
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
        error: `Edge function error: ${error.message}`,
        details: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
