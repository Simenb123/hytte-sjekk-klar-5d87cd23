
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
  
  // Hvis requestData inneholder en eksplisitt redirectUri, bruk den
  if (requestData?.redirectUri) {
    console.log('Using explicit redirect URI from request:', requestData.redirectUri);
    return requestData.redirectUri;
  }
  
  // Håndter localhost
  if (origin.includes('localhost')) {
    console.log('Using localhost redirect URI');
    return 'http://localhost:5173/auth/calendar';
  }
  
  // Håndter Lovable preview
  if (origin.includes('lovableproject.com')) {
    const projectId = origin.split('//')[1].split('.')[0];
    const previewUri = `https://${projectId}.lovableproject.com/auth/calendar`;
    console.log(`Using preview redirect URI: ${previewUri}`);
    return previewUri;
  }
  
  // Håndter produksjonsmiljø
  if (origin.includes('lovable.app')) {
    const subdomain = origin.split('//')[1].split('.')[0];
    const productionUri = `https://${subdomain}.lovable.app/auth/calendar`;
    console.log(`Using production redirect URI: ${productionUri}`);
    return productionUri;
  }
  
  // Fallback til standard produksjons-URI
  const defaultUri = 'https://hytte-sjekk-klar.lovable.app/auth/calendar';
  console.log(`Using default production redirect URI: ${defaultUri}`);
  return defaultUri;
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
  console.log(`Exchanging code for tokens with redirectUri: ${redirectUri}`);
  
  try {
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
      const responseText = await tokenResponse.text();
      let errorMessage = `Google token exchange failed with status ${tokenResponse.status}: ${responseText}`;
      
      // Forbedret håndtering av 403-feil
      if (tokenResponse.status === 403) {
        errorMessage = `403 Forbidden: Google godkjente ikke autentiseringen. Sjekk at redirect URI (${redirectUri}) er riktig konfigurert i Google Cloud Console.`;
      }
      
      console.error('Token exchange error:', errorMessage);
      throw new Error(errorMessage);
    }

    return tokenResponse.json();
  } catch (error) {
    console.error('Error in exchangeCodeForTokens:', error);
    throw error;
  }
};
