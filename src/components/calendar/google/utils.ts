
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

export const formatGoogleEventDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateString);
      return 'Ugyldig dato';
    }
    
    return format(date, 'PPp', { locale: nb });
  } catch (e) {
    console.error('Error formatting date:', e, dateString);
    return 'Ugyldig dato format';
  }
};

/**
 * Improved error detection for connection issues with specific patterns
 */
export const isEdgeFunctionError = (error?: string | null): boolean => {
  if (!error) return false;
  
  const connectionErrors = [
    'Edge Function',
    'Failed to fetch',
    'Kunne ikke koble til',
    'FunctionsFetchError',
    'Nettverksfeil',
    'tilkobling til serveren',
    'midlertidig utilgjengelig',
    'TypeError: Failed to fetch',
    'Serverfeil'
  ];
  
  return connectionErrors.some(errorText => error.includes(errorText));
};

/**
 * Check if the error is specifically an authentication error
 */
export const isAuthError = (error?: string | null): boolean => {
  if (!error) return false;
  
  const authErrors = [
    'invalid_grant',
    'invalid_token',
    'expired',
    'utløpt',
    'AUTH_ERROR',
    'tilgangen har utløpt',
    'koble til på nytt',
    '403',
    'Forbidden',
    '401',
    'Unauthorized'
  ];
  
  return authErrors.some(errorText => error.includes(errorText));
};

/**
 * Get a user-friendly error message in Norwegian
 */
export const formatErrorMessage = (error: string): string => {
  if (isEdgeFunctionError(error)) {
    return 'Det er problemer med tilkobling til serveren. Google Calendar-integrasjonen er midlertidig utilgjengelig. Prøv igjen senere.';
  }
  
  if (isAuthError(error)) {
    if (error.includes('403') || error.includes('Forbidden')) {
      return 'Google Calendar ga en 403 Forbidden-feil. Sjekk at OAuth-konfigurasjonen er riktig satt opp i Google Cloud Console.';
    }
    return 'Din tilkobling til Google Calendar har utløpt. Du må koble til på nytt.';
  }

  if (error.includes('GOOGLE_CLIENT_ID') || 
      error.includes('GOOGLE_CLIENT_SECRET') ||
      error.includes('Konfigurasjonsfeil')) {
    return 'Google Calendar er ikke riktig konfigurert. Kontakt administrator.';
  }
  
  if (error.includes('ingen autentiseringskode') ||
      error.includes('redirect mismatch')) {
    return 'Autentiseringsfeil. Sjekk at redirect URI er riktig konfigurert i Google Console.';
  }
  
  return error;
};

/**
 * Get technical error details for developers
 */
export const getTechnicalErrorDetails = (error: string): string => {
  if (isEdgeFunctionError(error)) {
    return 'Teknisk feil: Kunne ikke koble til Edge Function. Sjekk at Supabase-tjenesten er tilgjengelig og at alle miljøvariabler er riktig satt opp.';
  }
  
  if (error.includes('TOKEN_EXCHANGE_ERROR')) {
    return 'Teknisk feil: Kunne ikke utveksle OAuth-kode for tokens. Sjekk at Google API-nøkler er riktig konfigurert.';
  }
  
  if (error.includes('AUTH_URL_GENERATION_ERROR')) {
    return 'Teknisk feil: Kunne ikke generere autentiseringslenke. Sjekk at Google API-nøkler er riktig konfigurert.';
  }
  
  return `Teknisk feil: ${error}`;
};

/**
 * Helper to check if a refreshed token is available and needs to be saved
 */
export const handleRefreshedTokens = (data: any): boolean => {
  if (data && data.refreshedTokens) {
    // Store the refreshed tokens
    localStorage.setItem('googleCalendarTokens', JSON.stringify(data.refreshedTokens));
    console.log('Saved refreshed tokens to localStorage');
    return true;
  }
  return false;
};
