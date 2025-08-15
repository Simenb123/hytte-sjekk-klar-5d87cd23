/**
 * Utility to clear all Google Calendar tokens and reset connection state
 */

import { removeGoogleTokens } from './tokenStorage';

export const clearAllGoogleTokens = () => {
  console.log('🗑️ Clearing all Google Calendar tokens...');
  
  // Remove from localStorage via our utility
  const removed = removeGoogleTokens();
  
  // Also clear any other possible storage locations
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

export const forceGoogleReconnection = () => {
  clearAllGoogleTokens();
  
  // Trigger a page reload to reset all state
  setTimeout(() => {
    window.location.reload();
  }, 500);
};