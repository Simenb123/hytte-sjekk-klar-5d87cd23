import type { GoogleOAuthTokens } from '@/types/googleCalendar.types';

const TOKENS_KEY = 'googleCalendarTokens';
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 100; // ms

/**
 * Safely store Google OAuth tokens with retry mechanism
 */
export const storeGoogleTokens = async (tokens: GoogleOAuthTokens): Promise<boolean> => {
  if (!tokens?.access_token) {
    console.error('Invalid tokens provided for storage');
    return false;
  }

  let attempt = 0;
  while (attempt < MAX_RETRY_ATTEMPTS) {
    try {
      const tokenString = JSON.stringify(tokens);
      localStorage.setItem(TOKENS_KEY, tokenString);
      
      // Verify storage
      const stored = localStorage.getItem(TOKENS_KEY);
      if (stored === tokenString) {
        console.log(`Tokens successfully stored on attempt ${attempt + 1}`);
        return true;
      } else {
        throw new Error('Storage verification failed');
      }
    } catch (error) {
      console.error(`Storage attempt ${attempt + 1} failed:`, error);
      attempt++;
      
      if (attempt < MAX_RETRY_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
      }
    }
  }
  
  console.error('Failed to store tokens after all retry attempts');
  return false;
};

/**
 * Safely retrieve Google OAuth tokens
 */
export const retrieveGoogleTokens = (): GoogleOAuthTokens | null => {
  try {
    const stored = localStorage.getItem(TOKENS_KEY);
    if (!stored) {
      return null;
    }
    
    const tokens = JSON.parse(stored) as GoogleOAuthTokens;
    
    // Validate token structure
    if (!tokens.access_token || typeof tokens.access_token !== 'string') {
      console.error('Invalid token structure found, removing from storage');
      localStorage.removeItem(TOKENS_KEY);
      return null;
    }
    
    return tokens;
  } catch (error) {
    console.error('Error retrieving tokens:', error);
    localStorage.removeItem(TOKENS_KEY);
    return null;
  }
};

/**
 * Remove Google OAuth tokens from storage
 */
export const removeGoogleTokens = (): boolean => {
  try {
    localStorage.removeItem(TOKENS_KEY);
    return true;
  } catch (error) {
    console.error('Error removing tokens:', error);
    return false;
  }
};

/**
 * Check if valid tokens exist in storage
 */
export const hasValidTokens = (): boolean => {
  const tokens = retrieveGoogleTokens();
  return !!(tokens?.access_token);
};