/**
 * Utility to clear all Google Calendar tokens and reset connection state
 * This clears tokens for all users and legacy tokens
 */

import { removeGoogleTokens } from './tokenStorage';

export const clearAllGoogleTokens = (userId?: string) => {
  console.log('🗑️ Clearing all Google Calendar tokens...');
  
  // Remove user-specific tokens if userId provided
  if (userId) {
    removeGoogleTokens(userId);
  }
  
  // Also clear any legacy storage locations
  try {
    localStorage.removeItem('googleCalendarTokens');
    localStorage.removeItem('google_calendar_tokens');
    localStorage.removeItem('google-tokens');
    sessionStorage.removeItem('googleCalendarTokens');
    sessionStorage.removeItem('google_calendar_tokens');
    sessionStorage.removeItem('google-tokens');
    
    console.log('✅ All Google Calendar tokens cleared from storage');
    return true;
  } catch (error) {
    console.error('❌ Error clearing tokens:', error);
    return false;
  }
};

export const forceGoogleReconnection = (userId?: string) => {
  clearAllGoogleTokens(userId);
  
  // Trigger a page reload to reset all state
  setTimeout(() => {
    window.location.reload();
  }, 500);
};
