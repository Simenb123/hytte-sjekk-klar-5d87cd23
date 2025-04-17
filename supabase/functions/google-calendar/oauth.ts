
import { corsHeaders } from './constants.ts';
import { getRequiredEnv, getRedirectURI, createDiagnosticInfo } from './utils.ts';
import { GOOGLE_ENDPOINTS, DEFAULT_SCOPES, ERROR_MESSAGES } from './constants.ts';
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
    console.log('Full URL parameters:', Object.fromEntries(authUrl.searchParams.entries()));
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
      
      const tokenResponse = await fetch(GOOGLE_ENDPOINTS.TOKEN, {
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
          errorMessage = ERROR_MESSAGES.FORBIDDEN_ERROR(redirectUri);
          errorDetails = `Verify that the redirect URI "${redirectUri}" exactly matches one of the URIs configured in Google Cloud Console's OAuth consent screen.`;
        } else if (tokenResponse.status === 400) {
          errorMessage = ERROR_MESSAGES.BAD_REQUEST_ERROR(redirectUri);
          errorDetails = `This often means the redirect URI "${redirectUri}" doesn't match what's configured in Google Cloud Console. Check for exact matches including http/https and trailing slashes.`;
        } else if (tokenResponse.status === 401) {
          errorMessage = `401 Unauthorized: Invalid client credentials. Check client ID and secret in Supabase secrets.`;
          errorDetails = ERROR_MESSAGES.UNAUTHORIZED_ERROR;
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
        throw new Error(ERROR_MESSAGES.TIMEOUT_ERROR);
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
      const diagnosticInfo = createDiagnosticInfo(error);
      console.error('Network diagnostic info:', JSON.stringify(diagnosticInfo));
      
      throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
    }
    
    throw error;
  }
};

/**
 * Simplified export of auth-related constants for backward compatibility
 */
export { corsHeaders };
