
// SIMPLIFIED FOR DEBUGGING
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};

Deno.serve(async (req) => {
  console.log(`[${new Date().toISOString()}] ${req.method} request received`);
  console.log('🔄 SIMPLIFIED Google Calendar Edge Function');
  
  // CORS preflight request
  if (req.method === 'OPTIONS') {
    console.log('🔍 Handling OPTIONS request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check secrets immediately
    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    console.log(`🔍 GOOGLE_CLIENT_ID: ${googleClientId ? 'EXISTS (length: ' + googleClientId.length + ')' : 'MISSING'}`);
    console.log(`🔍 GOOGLE_CLIENT_SECRET: ${googleClientSecret ? 'EXISTS (length: ' + googleClientSecret.length + ')' : 'MISSING'}`);
    
    if (!googleClientId) {
      console.error('❌ GOOGLE_CLIENT_ID missing');
      return new Response(
        JSON.stringify({ error: 'GOOGLE_CLIENT_ID not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!googleClientSecret) {
      console.error('❌ GOOGLE_CLIENT_SECRET missing');
      return new Response(
        JSON.stringify({ error: 'GOOGLE_CLIENT_SECRET not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const origin = req.headers.get('origin') || 'https://example.com';
    console.log(`🔍 Request origin: ${origin}`);

    // Handle GET requests - generate OAuth URL
    if (req.method === 'GET') {
      console.log('🔍 Handling GET request - generating OAuth URL');
      
      const redirectUri = `${origin}/auth/calendar`;
      const scopes = [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events'
      ];
      
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.append('client_id', googleClientId);
      authUrl.searchParams.append('redirect_uri', redirectUri);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('scope', scopes.join(' '));
      authUrl.searchParams.append('access_type', 'offline');
      authUrl.searchParams.append('prompt', 'consent');

      console.log(`✅ Generated auth URL successfully`);
      return new Response(
        JSON.stringify({ url: authUrl.toString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle POST requests
    if (req.method === 'POST') {
      console.log('🔍 Handling POST request');
      
      let requestData;
      try {
        requestData = await req.json();
        console.log('✅ Successfully parsed POST request JSON');
        console.log('🔍 POST request keys:', Object.keys(requestData));
      } catch (parseError) {
        console.error('❌ Failed to parse POST request JSON:', parseError);
        return new Response(
          JSON.stringify({ error: 'Invalid JSON in request body' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // For now, just return success for any POST request
      console.log('✅ POST request processed successfully (simplified)');
      return new Response(
        JSON.stringify({ success: true, message: 'POST request received and processed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('❌ Method not allowed:', req.method);
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Edge function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: `Edge function error: ${error.message}`,
        stack: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
