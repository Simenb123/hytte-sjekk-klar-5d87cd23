import type { GoogleOAuthTokens } from '@/types/googleCalendar.types';

const TOKENS_KEY_PREFIX = 'googleCalendarTokens';
const LEGACY_TOKENS_KEY = 'googleCalendarTokens'; // For migration
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 100; // ms

/**
 * Get the user-specific storage key
 */
const getUserTokensKey = (userId: string): string => {
  return `${TOKENS_KEY_PREFIX}_${userId}`;
};

/**
 * Migrate legacy tokens (without userId) to user-specific storage
 * This runs once per user to preserve existing connections
 */
export const migrateLegacyTokens = (userId: string): boolean => {
  try {
    const legacyTokens = localStorage.getItem(LEGACY_TOKENS_KEY);
    if (!legacyTokens) {
      console.log('No legacy tokens to migrate');
      return false;
    }

    const userKey = getUserTokensKey(userId);
    const existingUserTokens = localStorage.getItem(userKey);
    
    // Only migrate if user doesn't already have tokens
    if (!existingUserTokens) {
      console.log(`Migrating legacy tokens to user-specific key: ${userKey}`);
      localStorage.setItem(userKey, legacyTokens);
      localStorage.removeItem(LEGACY_TOKENS_KEY); // Clean up legacy key
      console.log('✅ Legacy tokens migrated successfully');
      return true;
    } else {
      console.log('User already has tokens, skipping migration');
      // Still remove legacy key if user has their own tokens
      localStorage.removeItem(LEGACY_TOKENS_KEY);
      return false;
    }
  } catch (error) {
    console.error('Error migrating legacy tokens:', error);
    return false;
  }
};

/**
 * Safely store Google OAuth tokens with retry mechanism
 */
export const storeGoogleTokens = async (userId: string, tokens: GoogleOAuthTokens): Promise<boolean> => {
  console.log('🔍 DEBUG: storeGoogleTokens called with:', {
    userId,
    tokens_exists: !!tokens,
    access_token_exists: !!tokens?.access_token,
    access_token_type: typeof tokens?.access_token,
    access_token_length: tokens?.access_token?.length || 0,
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

  const tokensKey = getUserTokensKey(userId);
  
  let attempt = 0;
  while (attempt < MAX_RETRY_ATTEMPTS) {
    try {
      console.log(`Storage attempt ${attempt + 1} - preparing to store tokens for user ${userId}`);
      const tokenString = JSON.stringify(tokens);
      console.log(`Token string length: ${tokenString.length} characters`);
      
      localStorage.setItem(tokensKey, tokenString);
      console.log(`Successfully wrote to localStorage with key: ${tokensKey}`);
      
      // Verify storage
      const stored = localStorage.getItem(tokensKey);
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
export const retrieveGoogleTokens = (userId: string): GoogleOAuthTokens | null => {
  try {
    console.log(`🔍 DEBUG: retrieveGoogleTokens called for user ${userId} - checking localStorage...`);
    
    // Try to migrate legacy tokens first
    migrateLegacyTokens(userId);
    
    const tokensKey = getUserTokensKey(userId);
    const stored = localStorage.getItem(tokensKey);
    
    if (!stored) {
      console.log(`❌ No Google Calendar tokens found in localStorage for user ${userId}`);
      return null;
    }
    
    console.log(`✅ Found stored tokens in localStorage for user ${userId} (${stored.length} characters)`);
    const tokens = JSON.parse(stored) as GoogleOAuthTokens;
    
    // Enhanced validation of token structure
    if (!tokens.access_token || typeof tokens.access_token !== 'string' || tokens.access_token.length < 10) {
      console.error('❌ Invalid token structure found, removing from storage:', {
        access_token_exists: !!tokens.access_token,
        access_token_type: typeof tokens.access_token,
        access_token_length: tokens.access_token?.length || 0,
        access_token_sample: tokens.access_token?.substring(0, 10) + '...' || 'NONE'
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
export const removeGoogleTokens = (userId: string): boolean => {
  try {
    const tokensKey = getUserTokensKey(userId);
    localStorage.removeItem(tokensKey);
    // Also clean up legacy key if it exists
    localStorage.removeItem(LEGACY_TOKENS_KEY);
    return true;
  } catch (error) {
    console.error('Error removing tokens:', error);
    return false;
  }
};

/**
 * Check if valid tokens exist in storage
 */
export const hasValidTokens = (userId: string): boolean => {
  const tokens = retrieveGoogleTokens(userId);
  return !!(tokens?.access_token);
};