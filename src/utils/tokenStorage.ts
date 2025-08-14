import type { GoogleOAuthTokens } from '@/types/googleCalendar.types';

const TOKENS_KEY = 'googleCalendarTokens';
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 100; // ms

/**
 * Safely store Google OAuth tokens with retry mechanism
 */
export const storeGoogleTokens = async (tokens: GoogleOAuthTokens): Promise<boolean> => {
  console.log('storeGoogleTokens called with:', {
    access_token_exists: !!tokens?.access_token,
    access_token_length: tokens?.access_token?.length,
    refresh_token_exists: !!tokens?.refresh_token,
    token_type: tokens?.token_type,
    scope: tokens?.scope,
    expiry_date: tokens?.expiry_date
  });

  if (!tokens?.access_token) {
    console.error('Invalid tokens provided for storage - no access token');
    return false;
  }

  if (typeof tokens.access_token !== 'string') {
    console.error('Invalid tokens provided for storage - access token is not a string:', typeof tokens.access_token);
    return false;
  }

  let attempt = 0;
  while (attempt < MAX_RETRY_ATTEMPTS) {
    try {
      console.log(`Storage attempt ${attempt + 1} - preparing to store tokens`);
      const tokenString = JSON.stringify(tokens);
      console.log(`Token string length: ${tokenString.length} characters`);
      
      localStorage.setItem(TOKENS_KEY, tokenString);
      console.log(`Successfully wrote to localStorage with key: ${TOKENS_KEY}`);
      
      // Verify storage
      const stored = localStorage.getItem(TOKENS_KEY);
      if (stored === tokenString) {
        console.log(`✅ Tokens successfully stored and verified on attempt ${attempt + 1}`);
        
        // Additional verification - try to parse it back
        try {
          const parsed = JSON.parse(stored);
          console.log(`✅ Stored tokens can be parsed back:`, {
            access_token_exists: !!parsed.access_token,
            access_token_matches: parsed.access_token === tokens.access_token
          });
        } catch (parseError) {
          console.error('❌ Stored tokens cannot be parsed back:', parseError);
          throw new Error('Storage verification failed - invalid JSON');
        }
        
        return true;
      } else {
        console.error('❌ Storage verification failed - stored value does not match input');
        console.log('Expected length:', tokenString.length, 'Actual length:', stored?.length || 0);
        throw new Error('Storage verification failed');
      }
    } catch (error) {
      console.error(`❌ Storage attempt ${attempt + 1} failed:`, error);
      attempt++;
      
      if (attempt < MAX_RETRY_ATTEMPTS) {
        console.log(`Retrying in ${RETRY_DELAY * attempt}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
      }
    }
  }
  
  console.error('❌ Failed to store tokens after all retry attempts');
  return false;
};

/**
 * Safely retrieve Google OAuth tokens
 */
export const retrieveGoogleTokens = (): GoogleOAuthTokens | null => {
  try {
    console.log('retrieveGoogleTokens called - checking localStorage...');
    const stored = localStorage.getItem(TOKENS_KEY);
    
    if (!stored) {
      console.log('❌ No Google Calendar tokens found in localStorage');
      return null;
    }
    
    console.log(`✅ Found stored tokens in localStorage (${stored.length} characters)`);
    const tokens = JSON.parse(stored) as GoogleOAuthTokens;
    
    // Validate token structure
    if (!tokens.access_token || typeof tokens.access_token !== 'string') {
      console.error('❌ Invalid token structure found, removing from storage:', {
        access_token_exists: !!tokens.access_token,
        access_token_type: typeof tokens.access_token
      });
      localStorage.removeItem(TOKENS_KEY);
      return null;
    }
    
    console.log('✅ Valid tokens retrieved from localStorage:', {
      access_token_exists: !!tokens.access_token,
      access_token_length: tokens.access_token.length,
      refresh_token_exists: !!tokens.refresh_token,
      token_type: tokens.token_type,
      scope: tokens.scope,
      expiry_date: tokens.expiry_date
    });
    
    return tokens;
  } catch (error) {
    console.error('❌ Error retrieving tokens:', error);
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