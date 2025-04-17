
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
  
  // Hvis requestData inneholder en eksplisitt redirectUri, bruk den
  if (requestData?.redirectUri) {
    console.log('Using explicit redirect URI from request:', requestData.redirectUri);
    return requestData.redirectUri;
  }
  
  // Utfør en mer direkte tilnærming - bruk origin direkte
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

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', scopes.join(' '));
  authUrl.searchParams.append('access_type', 'offline');
  authUrl.searchParams.append('prompt', 'consent');

  return authUrl.toString();
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
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    console.log(`Token response status: ${tokenResponse.status}`);
    
    if (!tokenResponse.ok) {
      const responseText = await tokenResponse.text();
      console.error('Token exchange error response:', responseText);
      
      let errorMessage = `Google token exchange failed with status ${tokenResponse.status}: ${responseText}`;
      
      // Forbedret håndtering av 403-feil
      if (tokenResponse.status === 403) {
        errorMessage = `403 Forbidden: Google godkjente ikke autentiseringen. Sjekk at redirect URI (${redirectUri}) er riktig konfigurert i Google Cloud Console.`;
      } else if (tokenResponse.status === 400) {
        errorMessage = `400 Bad Request: Problem med OAuth-autentiseringen. Sjekk at parameterne er korrekte og at redirect URI (${redirectUri}) er riktig konfigurert.`;
      }
      
      console.error('Token exchange error:', errorMessage);
      throw new Error(errorMessage);
    }

    const tokenData = await tokenResponse.json();
    console.log('Successfully received token data from Google');
    return tokenData;
  } catch (error) {
    console.error('Error in exchangeCodeForTokens:', error);
    throw error;
  }
};
