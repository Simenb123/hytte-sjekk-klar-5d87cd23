
import { ERROR_MESSAGES } from './constants.ts';

/**
 * Gets required environment variable or throws an error
 */
export const getRequiredEnv = (name: string): string => {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(ERROR_MESSAGES.MISSING_ENV(name));
  }
  return value;
};

/**
 * Determines the correct redirect URI based on origin and request data
 */
export const getRedirectURI = (origin: string, requestData?: any): string => {
  console.log('getRedirectURI - Origin:', origin);
  console.log('getRedirectURI - Request data:', requestData?.redirectUri || 'none provided');
  
  // If requestData contains an explicit redirectUri, use it
  if (requestData?.redirectUri) {
    console.log('Using explicit redirect URI from request:', requestData.redirectUri);
    return requestData.redirectUri;
  }
  
  // Check if origin is a Lovable preview domain
  const isLovablePreview = origin.includes('lovableproject.com');
  console.log('Is Lovable preview domain:', isLovablePreview);
  
  // Check if origin is localhost
  const isLocalhost = origin.includes('localhost');
  console.log('Is localhost:', isLocalhost);
  
  // Check if origin is the production domain
  const isProduction = origin.includes('hytte-sjekk-klar.lovable.app');
  console.log('Is production domain:', isProduction);
  
  // Use a more direct approach - use origin directly
  // Make sure to use /auth/calendar path consistently
  const redirectUri = `${origin}/auth/calendar`;
  console.log(`Using direct origin-based redirect URI: ${redirectUri}`);
  
  // Added debug info for troubleshooting
  console.log('Final redirect URI configuration:', {
    origin,
    redirectUri,
    isLovablePreview,
    isLocalhost,
    isProduction
  });
  
  return redirectUri;
};

/**
 * Helper to create detailed error diagnostics
 */
export const createDiagnosticInfo = (error: any) => {
  return {
    errorType: error.name,
    errorMessage: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  };
};
