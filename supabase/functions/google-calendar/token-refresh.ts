import { GOOGLE_ENDPOINTS } from './constants.ts';
import { GoogleTokens } from './types.ts';

/**
 * Refreshes Google OAuth tokens using the refresh token
 */
export const refreshGoogleTokens = async (
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<GoogleTokens> => {
  console.log('Attempting to refresh Google tokens');
  
  try {
    const params = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token'
    });
    
    const response = await fetch(GOOGLE_ENDPOINTS.TOKEN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });
    
    console.log(`Token refresh response status: ${response.status}`);
    
    if (!response.ok) {
      const responseText = await response.text();
      console.error('Token refresh error response:', responseText);
      throw new Error(`Token refresh failed with status ${response.status}: ${responseText}`);
    }

    const tokenData = await response.json();
    console.log('Successfully refreshed tokens');
    
    // Preserve the refresh token if not returned (Google sometimes omits it)
    if (!tokenData.refresh_token) {
      tokenData.refresh_token = refreshToken;
    }
    
    return tokenData;
  } catch (error) {
    console.error('Error refreshing tokens:', error);
    throw error;
  }
};

/**
 * Checks if a token is expired or will expire soon
 */
export const isTokenExpired = (tokens: GoogleTokens): boolean => {
  if (!tokens.expiry_date) {
    return false; // If no expiry date, assume it's still valid
  }
  
  const now = Date.now();
  const expiryTime = tokens.expiry_date;
  const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
  
  return now >= (expiryTime - bufferTime);
};

/**
 * Validates and refreshes tokens if needed
 */
export const validateAndRefreshTokens = async (
  tokens: GoogleTokens,
  clientId: string,
  clientSecret: string
): Promise<{ tokens: GoogleTokens; refreshed: boolean }> => {
  if (!isTokenExpired(tokens)) {
    console.log('Tokens are still valid');
    return { tokens, refreshed: false };
  }
  
  if (!tokens.refresh_token) {
    console.error('Token expired but no refresh token available');
    throw new Error('Token expired and no refresh token available. Re-authentication required.');
  }
  
  console.log('Tokens expired, attempting refresh');
  const refreshedTokens = await refreshGoogleTokens(
    tokens.refresh_token,
    clientId,
    clientSecret
  );
  
  return { tokens: refreshedTokens, refreshed: true };
};

/**
 * Checks if an error indicates token expiration/authentication issues
 */
export const isAuthError = (error: any): boolean => {
  if (typeof error === 'string') {
    return error.includes('401') || 
           error.includes('Unauthorized') || 
           error.includes('Invalid Credentials') || 
           error.includes('UNAUTHENTICATED');
  }
  
  if (error && typeof error === 'object') {
    const errorStr = JSON.stringify(error).toLowerCase();
    return errorStr.includes('401') || 
           errorStr.includes('unauthorized') || 
           errorStr.includes('invalid credentials') || 
           errorStr.includes('unauthenticated');
  }
  
  return false;
};