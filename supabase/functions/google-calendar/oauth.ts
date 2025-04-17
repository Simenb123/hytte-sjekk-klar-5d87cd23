
import { corsHeaders } from './constants.ts';
import { GOOGLE_ENDPOINTS, DEFAULT_SCOPES } from './constants.ts';
import { GoogleTokens } from './types.ts';

/**
 * Generates the Google OAuth authorization URL
 */
export const generateAuthUrl = (clientId: string, redirectUri: string): string => {
  const scopes = DEFAULT_SCOPES;

  console.log(`Generating auth URL with client ID: ${clientId.substring(0, 10)}...`);
  console.log(`Using redirect URI: ${redirectUri}`);

  try {
    const authUrl = new URL(GOOGLE_ENDPOINTS.AUTH);
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
    return authUrl.toString();
  } catch (error) {
    console.error('Error generating auth URL:', error);
    throw new Error(`Failed to generate Google auth URL: ${error.message}`);
  }
};

/**
 * Exchanges the OAuth code for access and refresh tokens
 */
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

    console.log('Successfully received token response from Google');
    const tokenData = await tokenResponse.json();
    console.log('Token data structure:', Object.keys(tokenData).join(', '));
    
    return tokenData;
  } catch (error) {
    console.error('Error in exchangeCodeForTokens:', error);
    throw error;
  }
};

/**
 * Simplified export of auth-related constants for backward compatibility
 */
export { corsHeaders };
