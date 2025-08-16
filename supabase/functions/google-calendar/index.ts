
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleAuthUrlGeneration, handleOAuthCodeExchange, handleCalendarOperations } from './handlers.ts';
import { corsHeaders } from './constants.ts';

console.log("🚀 Google Calendar Edge Function starting up...");

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
    const url = new URL(req.url);
    const origin = req.headers.get('origin') || 'http://localhost:3000';
    
    // DEBUG ENDPOINT: Check environment variables
    if (url.pathname.includes('/debug')) {
      console.log('🧪 DEBUG: Checking environment variables...');
      
      const envCheck = {
        timestamp: new Date().toISOString(),
        available_env_vars: Object.keys(Deno.env.toObject()).sort(),
        google_client_id_exists: !!Deno.env.get('GOOGLE_CLIENT_ID'),
        google_client_secret_exists: !!Deno.env.get('GOOGLE_CLIENT_SECRET'),
        google_client_id_length: Deno.env.get('GOOGLE_CLIENT_ID')?.length || 0,
        google_client_secret_length: Deno.env.get('GOOGLE_CLIENT_SECRET')?.length || 0,
      };
      
      console.log('🔍 Environment check result:', envCheck);
      
      return new Response(JSON.stringify(envCheck, null, 2), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // SIMPLE TEST ENDPOINT: Basic functionality
    if (url.pathname.includes('/test')) {
      console.log('✅ TEST: Basic connectivity test');
      
      const testResult = {
        status: 'success',
        message: 'Google Calendar Edge Function is running!',
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url
      };
      
      return new Response(JSON.stringify(testResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check environment variables for actual functionality
    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    
    if (!googleClientId || !googleClientSecret) {
      console.error('❌ Missing Google credentials:', {
        clientIdExists: !!googleClientId,
        clientSecretExists: !!googleClientSecret
      });
      
      return new Response(JSON.stringify({ 
        error: 'Missing Google credentials',
        debug: {
          clientIdExists: !!googleClientId,
          clientSecretExists: !!googleClientSecret,
          availableEnvVars: Object.keys(Deno.env.toObject()).filter(key => key.includes('GOOGLE'))
        }
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log('✅ Environment variables validated');

    // Handle GET requests - OAuth URL generation
    if (req.method === 'GET') {
      console.log('🔗 Generating OAuth URL...');
      return await handleAuthUrlGeneration(req, origin);
    }

    // Handle POST requests - OAuth code exchange and calendar operations
    if (req.method === 'POST') {
      const bodyText = await req.text();
      console.log(`📦 Request body: ${bodyText.substring(0, 200)}...`);
      
      const requestData = JSON.parse(bodyText);
      console.log(`📦 Request action: ${requestData.action || 'code_exchange'}`);
      
      // Handle OAuth code exchange (when user returns from Google)
      if (requestData.code && !requestData.action) {
        console.log('🔄 Handling OAuth code exchange...');
        return await handleOAuthCodeExchange(requestData, origin);
      }
      
      // Handle calendar operations (list_events, get_calendars, etc.)
      if (requestData.action) {
        console.log(`📅 Handling calendar action: ${requestData.action}`);
        return await handleCalendarOperations(requestData);
      }
      
      return new Response(JSON.stringify({ 
        error: 'Invalid request format',
        message: 'Request must include either code for OAuth exchange or action for calendar operations'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
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
        details: error.message,
        stack: error.stack 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
