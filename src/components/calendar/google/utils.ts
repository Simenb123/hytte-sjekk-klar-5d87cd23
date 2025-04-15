
export const formatGoogleEventDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateString);
      return 'Ugyldig dato';
    }
    
    return date.toLocaleString('nb-NO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    console.error('Error formatting date:', e, dateString);
    return 'Ugyldig dato format';
  }
};

/**
 * Comprehensive error detection for connection issues
 * @param error Error message string
 * @returns Boolean indicating if this is a connection error
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
    'midlertidig utilgjengelig'
  ];
  
  return connectionErrors.some(errorText => error.includes(errorText));
};

/**
 * Formats error messages to be more user-friendly
 * @param error Original error message
 * @returns User-friendly error message
 */
export const formatErrorMessage = (error: string): string => {
  if (isEdgeFunctionError(error)) {
    return 'Det er problemer med tilkobling til serveren. Google Calendar-integrasjonen er midlertidig utilgjengelig. Prøv igjen senere.';
  }
  
  if (error.includes('invalid_grant') || error.includes('expired') || error.includes('utløpt')) {
    return 'Din tilkobling til Google Calendar har utløpt. Du må koble til på nytt.';
  }
  
  return error;
};

/**
 * Creates consistent technical error details for developers
 * @param error Original error
 * @returns Formatted technical details
 */
export const getTechnicalErrorDetails = (error: string): string => {
  if (isEdgeFunctionError(error)) {
    return 'Teknisk feil: Kunne ikke koble til Edge Function. Sjekk at Supabase-tjenesten er tilgjengelig og at alle miljøvariabler er riktig satt opp.';
  }
  
  return `Teknisk feil: ${error}`;
};
