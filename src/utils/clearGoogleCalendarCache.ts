/**
 * Utility to clear Google Calendar cache
 */

import { googleCalendarCache } from './googleCalendarCache';

export const clearGoogleCalendarCache = () => {
  console.log('🗑️ Clearing Google Calendar cache...');
  
  try {
    googleCalendarCache.clearCache();
    console.log('✅ Google Calendar cache cleared successfully');
    return true;
  } catch (error) {
    console.error('❌ Error clearing Google Calendar cache:', error);
    return false;
  }
};

export const getCacheInfo = () => {
  return googleCalendarCache.getCacheInfo();
};
