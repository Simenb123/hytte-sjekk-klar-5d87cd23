
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from './constants.ts';
import { getRequiredEnv, getRedirectURI } from './utils.ts';
import { handleAuthUrlGeneration, handleOAuthCodeExchange, handleCalendarOperations } from './handlers.ts';

console.log("Google Calendar Edge Function starting up...");

serve(async (req) => {
  console.log(`\n🔵 === NEW REQUEST === ${new Date().toISOString()} ===`);
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('⚙️ CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check environment variables
    const googleClientId = getRequiredEnv('GOOGLE_CLIENT_ID');
    const googleClientSecret = getRequiredEnv('GOOGLE_CLIENT_SECRET');
    
    console.log('✅ Environment variables validated');

    // Handle GET requests - OAuth URL generation
    if (req.method === 'GET') {
      const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'http://localhost:3000';
      return await handleAuthUrlGeneration(req, origin);
    }

    // Handle POST requests - OAuth exchange and calendar operations
    if (req.method === 'POST') {
      const bodyText = await req.text();
      console.log(`📦 Raw request body: ${bodyText.substring(0, 200)}...`);
      
      const requestData = JSON.parse(bodyText);
      console.log(`📦 Request action: ${requestData.action || 'code_exchange'}`);
      
      // Handle OAuth code exchange
      if (requestData.code && !requestData.action) {
        const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'http://localhost:3000';
        return await handleOAuthCodeExchange(requestData, origin);
      }
      
      // Handle calendar operations
      return await handleCalendarOperations(requestData);
    }

    return new Response(
      JSON.stringify({ error: `Method ${req.method} not allowed` }),
      { 
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('💥 Unhandled error in edge function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
