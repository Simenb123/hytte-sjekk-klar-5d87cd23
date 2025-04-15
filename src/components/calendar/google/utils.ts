
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

export const isEdgeFunctionError = (error?: string | null): boolean => {
  if (!error) return false;
  return error.includes('Edge Function') || 
         error.includes('Failed to fetch') ||
         error.includes('Kunne ikke koble til');
};
