
import { corsHeaders } from './constants.ts';
import { GOOGLE_ENDPOINTS, DEFAULT_SCOPES } from './constants.ts';
import { GoogleTokens } from './types.ts';

/**
 * Genererer Google OAuth URL for autorisasjon
 */
export const generateAuthUrl = (clientId: string, redirectUri: string): string => {
  const scopes = DEFAULT_SCOPES;
  
  try {
    const authUrl = new URL(GOOGLE_ENDPOINTS.AUTH);
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', scopes.join(' '));
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('prompt', 'consent');

    return authUrl.toString();
  } catch (error) {
    console.error('Error generating auth URL:', error);
    throw new Error(`Failed to generate Google auth URL: ${error.message}`);
  }
};

/**
 * Utveksler OAuth-kode for tilgangs- og oppdateringstokener
 */
export const exchangeCodeForTokens = async (
  code: string, 
  clientId: string, 
  clientSecret: string, 
  redirectUri: string
): Promise<GoogleTokens> => {
  console.log(`Exchanging code for tokens with redirectUri: ${redirectUri}`);
  
  try {
    const params = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    });
    
    const tokenResponse = await fetch(GOOGLE_ENDPOINTS.TOKEN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });
    
    console.log(`Token response status: ${tokenResponse.status}`);
    
    if (!tokenResponse.ok) {
      const responseText = await tokenResponse.text();
      console.error('Token exchange error response:', responseText);
      throw new Error(`Google token exchange failed with status ${tokenResponse.status}: ${responseText}`);
    }

    console.log('Successfully received token response');
    const tokenData = await tokenResponse.json();
    return tokenData;
  } catch (error) {
    console.error('Error in exchangeCodeForTokens:', error);
    throw error;
  }
};

export { corsHeaders };
