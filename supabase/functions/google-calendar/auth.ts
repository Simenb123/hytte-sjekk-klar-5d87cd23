
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
  
  // Explicitly provided URI takes precedence - useful for debugging
  if (requestData?.redirectUri) {
    console.log('Using explicit redirect URI from request:', requestData.redirectUri);
    return requestData.redirectUri;
  }
  
  // Use the origin to construct the redirect URI
  const redirectUri = `${origin}/auth/calendar`;
  console.log(`Constructed redirect URI from origin: ${redirectUri}`);
  
  return redirectUri;
};

export const generateAuthUrl = (clientId: string, redirectUri: string): string => {
  console.log(`Generating auth URL with client ID ${clientId.substring(0, 10)}... and redirect URI ${redirectUri}`);
  
  const scopes = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events'
  ];

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', scopes.join(' '));
  authUrl.searchParams.append('access_type', 'offline');
  authUrl.searchParams.append('prompt', 'consent');
  
  // Add state parameter for additional security and debugging - this helps ensure the callback is legitimate
  const state = crypto.randomUUID();
  authUrl.searchParams.append('state', state);
  
  console.log('Full auth URL parameters:', Object.fromEntries(authUrl.searchParams.entries()));
  return authUrl.toString();
};

export const exchangeCodeForTokens = async (
  code: string, 
  clientId: string, 
  clientSecret: string, 
  redirectUri: string
): Promise<GoogleTokens> => {
  console.log(`Exchanging code for tokens with redirect URI: ${redirectUri}`);
  console.log(`Code prefix: ${code.substring(0, 10)}...`);
  
  try {
    const tokenParams = {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    };
    
    console.log('Token exchange parameters:', { 
      ...tokenParams, 
      client_id: `${tokenParams.client_id.substring(0, 10)}...`,
      client_secret: '[REDACTED]',
      code: `${tokenParams.code.substring(0, 10)}...`
    });
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(tokenParams)
    });

    console.log('Token response status:', tokenResponse.status);
    const responseText = await tokenResponse.text();
    
    if (!tokenResponse.ok) {
      console.error('Token exchange failed with status:', tokenResponse.status);
      console.error('Response body:', responseText);
      
      let errorMessage = `Google token exchange failed with status ${tokenResponse.status}: ${responseText}`;
      let errorDetails = '';
      
      try {
        // Try to parse the error JSON if possible
        const errorJson = JSON.parse(responseText);
        if (errorJson.error) {
          errorMessage = `Google OAuth error: ${errorJson.error}`;
          if (errorJson.error_description) {
            errorMessage += ` - ${errorJson.error_description}`;
          }
          
          if (errorJson.error === 'redirect_uri_mismatch') {
            errorDetails = `The redirect URI provided (${redirectUri}) doesn't match the one configured in your Google Cloud Console project. Please verify your OAuth configuration.`;
          }
        }
      } catch (e) {
        // If parsing fails, use the raw response text
      }
      
      if (tokenResponse.status === 403) {
        errorMessage = `403 Forbidden: Google rejected the authentication request`;
        errorDetails = `This usually means your OAuth consent screen needs to be properly configured or your application may still be in "testing" mode with restricted test users. Verify the redirect URI (${redirectUri}) matches exactly what's in your Google Cloud Console.`;
      }
      
      throw Object.assign(new Error(errorMessage), { 
        status: tokenResponse.status,
        details: errorDetails
      });
    }

    try {
      return JSON.parse(responseText);
    } catch (error) {
      console.error('Failed to parse token response JSON:', error);
      throw new Error(`Failed to parse token response: ${responseText}`);
    }
  } catch (error) {
    console.error('Error in exchangeCodeForTokens:', error);
    throw error;
  }
};
