
// Authentication and OAuth related functions
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { GoogleTokens, GoogleAuthResponse, RequestData } from './types.ts';

export const getRequiredEnv = (name: string): string => {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const getRedirectURI = (origin: string, requestData?: RequestData): string => {
  console.log('getRedirectURI - Origin:', origin);
  console.log('getRedirectURI - Request data:', requestData?.redirectUri || 'none provided');
  
  // If requestData contains an explicit redirectUri, use it
  if (requestData?.redirectUri) {
    console.log('Using explicit redirect URI from request:', requestData.redirectUri);
    return requestData.redirectUri;
  }
  
  // Check if origin is a Lovable preview domain
  const isLovablePreview = origin.includes('lovableproject.com');
  console.log('Is Lovable preview domain:', isLovablePreview);
  
  // Check if origin is localhost
  const isLocalhost = origin.includes('localhost');
  console.log('Is localhost:', isLocalhost);
  
  // Check if origin is the production domain
  const isProduction = origin.includes('hytte-sjekk-klar.lovable.app');
  console.log('Is production domain:', isProduction);
  
  // Use a more direct approach - use origin directly
  // Make sure to use /auth/calendar path consistently
  const redirectUri = `${origin}/auth/calendar`;
  console.log(`Using direct origin-based redirect URI: ${redirectUri}`);
  
  // Added debug info for troubleshooting
  console.log('Final redirect URI configuration:', {
    origin,
    redirectUri,
    isLovablePreview,
    isLocalhost,
    isProduction
  });
  
  return redirectUri;
};

export const generateAuthUrl = (clientId: string, redirectUri: string): string => {
  const scopes = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events'
  ];

  console.log(`Generating auth URL with client ID: ${clientId.substring(0, 10)}...`);
  console.log(`Using redirect URI: ${redirectUri}`);

  try {
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', scopes.join(' '));
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('prompt', 'consent');
    
    // Add state parameter to help with tracking and security
    const stateValue = Math.random().toString(36).substring(2, 15);
    authUrl.searchParams.append('state', stateValue);

    console.log('Generated complete auth URL:', authUrl.toString().substring(0, 100) + '...');
    console.log('Full URL parameters:', Object.fromEntries(authUrl.searchParams.entries()));
    return authUrl.toString();
  } catch (error) {
    console.error('Error generating auth URL:', error);
    throw new Error(`Failed to generate Google auth URL: ${error.message}`);
  }
};

export const exchangeCodeForTokens = async (
  code: string, 
  clientId: string, 
  clientSecret: string, 
  redirectUri: string
): Promise<GoogleTokens> => {
  console.log(`Exchanging code for tokens with redirectUri: ${redirectUri}`);
  console.log(`Code (first few chars): ${code.substring(0, 10)}...`);
  
  try {
    console.log(`Making token exchange request to Google OAuth API`);
    console.log(`Full redirect URI being used: ${redirectUri}`);
    
    const params = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    });
    
    console.log('Request params prepared (excluding secret values)');
    console.log('URL-encoded redirect URI:', encodeURIComponent(redirectUri));
    console.log('Full params string (excluding secrets):', 
      params.toString()
        .replace(/client_secret=[^&]+/, 'client_secret=REDACTED')
        .replace(/code=[^&]+/, 'code=REDACTED')
    );
    
    // Added timeout and more detailed error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    try {
      console.log('Starting token exchange request to https://oauth2.googleapis.com/token');
      
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log(`Token response status: ${tokenResponse.status}`);
      console.log('Token response headers:', Object.fromEntries(tokenResponse.headers.entries()));
      
      if (!tokenResponse.ok) {
        const responseText = await tokenResponse.text();
        console.error('Token exchange error response:', responseText);
        
        let errorMessage = `Google token exchange failed with status ${tokenResponse.status}: ${responseText}`;
        let errorDetails = '';
        
        // Improved handling of error cases
        if (tokenResponse.status === 403) {
          errorMessage = `403 Forbidden: Google denied the authentication. Check that redirect URI (${redirectUri}) is correctly configured in Google Cloud Console and that your email is added as a test user.`;
          errorDetails = `Verify that the redirect URI "${redirectUri}" exactly matches one of the URIs configured in Google Cloud Console's OAuth consent screen.`;
        } else if (tokenResponse.status === 400) {
          errorMessage = `400 Bad Request: Problem with OAuth authentication. Check that parameters are correct.`;
          errorDetails = `This often means the redirect URI "${redirectUri}" doesn't match what's configured in Google Cloud Console. Check for exact matches including http/https and trailing slashes.`;
        } else if (tokenResponse.status === 401) {
          errorMessage = `401 Unauthorized: Invalid client credentials. Check client ID and secret in Supabase secrets.`;
          errorDetails = 'Verify that the GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are set correctly in Supabase.';
        }
        
        console.error('Token exchange error:', errorMessage);
        console.error('Error details:', errorDetails);
        
        // Added more context to help with debugging
        throw {
          message: errorMessage,
          details: errorDetails,
          status: tokenResponse.status,
          responseText
        };
      }

      console.log('Successfully received token response from Google');
      const tokenData = await tokenResponse.json();
      console.log('Token data structure:', Object.keys(tokenData).join(', '));
      console.log('Access token received:', tokenData.access_token ? 'Yes (hidden)' : 'No');
      console.log('Refresh token received:', tokenData.refresh_token ? 'Yes (hidden)' : 'No');
      
      return tokenData;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        console.error('Token exchange request timed out after 15 seconds');
        throw new Error('Google authentication request timed out. The Google service might be temporarily unavailable or blocked by network settings.');
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Error in exchangeCodeForTokens:', error);
    
    // Provide more specific error messages for common network issues
    if (error.message?.includes('Failed to fetch') || 
        error.name === 'TypeError' || 
        error.message?.includes('Network') ||
        error.message?.includes('connection')) {
      const diagnosticInfo = {
        errorType: error.name,
        errorMessage: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      };
      console.error('Network diagnostic info:', JSON.stringify(diagnosticInfo));
      
      throw new Error(`Network error connecting to Google authentication servers: ${error.message}. Check your internet connection, firewall settings, and whether third-party cookies are enabled in your browser.`);
    }
    
    throw error;
  }
};
