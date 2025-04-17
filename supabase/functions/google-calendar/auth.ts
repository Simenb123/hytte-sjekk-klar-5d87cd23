
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
  
  // Use a more direct approach - use origin directly
  // Make sure to use /auth/calendar path consistently
  const redirectUri = `${origin}/auth/calendar`;
  console.log(`Using direct origin-based redirect URI: ${redirectUri}`);
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

    console.log('Generated complete auth URL:', authUrl.toString().substring(0, 100) + '...');
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
    
    const params = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    });
    
    console.log('Request params prepared (excluding secret values)');
    console.log('Redirect URI in token exchange:', redirectUri);
    
    // Added timeout and more detailed error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log(`Token response status: ${tokenResponse.status}`);
      
      if (!tokenResponse.ok) {
        const responseText = await tokenResponse.text();
        console.error('Token exchange error response:', responseText);
        
        let errorMessage = `Google token exchange failed with status ${tokenResponse.status}: ${responseText}`;
        
        // Improved handling of 403 errors
        if (tokenResponse.status === 403) {
          errorMessage = `403 Forbidden: Google denied the authentication. Check that redirect URI (${redirectUri}) is correctly configured in Google Cloud Console and that your email is added as a test user.`;
        } else if (tokenResponse.status === 400) {
          errorMessage = `400 Bad Request: Problem with OAuth authentication. Check that parameters are correct and that redirect URI (${redirectUri}) is correctly configured.`;
        } else if (tokenResponse.status === 401) {
          errorMessage = `401 Unauthorized: Invalid client credentials. Check client ID and secret in Supabase secrets.`;
        }
        
        console.error('Token exchange error:', errorMessage);
        throw new Error(errorMessage);
      }

      const tokenData = await tokenResponse.json();
      console.log('Successfully received token data from Google');
      return tokenData;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        console.error('Token exchange request timed out after 10 seconds');
        throw new Error('Google authentication request timed out. The Google service might be temporarily unavailable.');
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
      throw new Error(`Network error connecting to Google authentication servers: ${error.message}. Check your internet connection and firewall settings.`);
    }
    
    throw error;
  }
};
