
/**
 * Henter påkrevd miljøvariabel og kaster feil hvis den ikke eksisterer
 */
export const getRequiredEnv = (name: string): string => {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

/**
 * Genererer redirect URI basert på opprinnelse
 */
export const getRedirectURI = (origin: string): string => {
  console.log(`Getting redirect URI based on origin: ${origin}`);
  
  // Hvis origin er lovableproject.com eller lovable.app, da er det Lovable preview miljø
  if (origin.includes('lovableproject.com') || origin.includes('lovable.app')) {
    console.log('In Lovable preview environment, using special redirect URL');
    return `${origin}/auth/calendar`;
  }
  
  // Ellers bruk det faktiske nettstedet (produksjon)
  const redirectUri = `${origin}/auth/calendar`;
  console.log(`Generated redirect URI: ${redirectUri}`);
  return redirectUri;
};
