
// CORS headers for all responses
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Common error messages
export const ERROR_MESSAGES = {
  MISSING_ENV: (name: string) => `Missing required environment variable: ${name}`,
  NETWORK_ERROR: 'Network error connecting to Google authentication servers. Check your internet connection, firewall settings, and whether third-party cookies are enabled in your browser.',
  TIMEOUT_ERROR: 'Google authentication request timed out. The Google service might be temporarily unavailable or blocked by network settings.',
  FORBIDDEN_ERROR: (redirectUri: string) => 
    `403 Forbidden: Google denied the authentication. Check that redirect URI (${redirectUri}) is correctly configured in Google Cloud Console and that your email is added as a test user.`,
  BAD_REQUEST_ERROR: (redirectUri: string) => 
    `400 Bad Request: Problem with OAuth authentication. This often means the redirect URI "${redirectUri}" doesn't match what's configured in Google Cloud Console.`,
  UNAUTHORIZED_ERROR: 'Verify that the GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are set correctly in Supabase.',
};

// Google API endpoints
export const GOOGLE_ENDPOINTS = {
  AUTH: 'https://accounts.google.com/o/oauth2/v2/auth',
  TOKEN: 'https://oauth2.googleapis.com/token',
};

// Default scopes for Google Calendar API
export const DEFAULT_SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events'
];
