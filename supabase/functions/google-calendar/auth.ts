// Authentication and OAuth related functions
const corsHeaders = {
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
  
  if (requestData?.redirectUri) {
    console.log('Using explicit redirect URI from request:', requestData.redirectUri);
    return requestData.redirectUri;
  }
  
  if (origin.includes('localhost')) {
    console.log('Using localhost redirect URI');
    return 'http://localhost:5173/auth/calendar';
  }
  
  if (origin.includes('lovableproject.com')) {
    const projectId = origin.split('//')[1].split('.')[0];
    const previewUri = `https://${projectId}.lovableproject.com/auth/calendar`;
    console.log(`Using preview redirect URI: ${previewUri}`);
    return previewUri;
  }
  
  const productionUri = 'https://hytte-sjekk-klar.lovable.app/auth/calendar';
  console.log(`Using production redirect URI: ${productionUri}`);
  return productionUri;
};

export const generateAuthUrl = (clientId: string, redirectUri: string): string => {
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

  return authUrl.toString();
};

export const exchangeCodeForTokens = async (
  code: string, 
  clientId: string, 
  clientSecret: string, 
  redirectUri: string
): Promise<GoogleTokens> => {
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error('Token exchange error:', errorText);
    throw new Error(`Google token exchange failed: ${errorText}`);
  }

  return tokenResponse.json();
};
