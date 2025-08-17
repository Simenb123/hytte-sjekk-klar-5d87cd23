// Debug utilities for Google Calendar filtering

export const clearGoogleCalendarCache = () => {
  console.log('🗑️ Clearing Google Calendar cache...');
  
  // Clear all relevant localStorage keys
  const keysToRemove = [
    'googleCalendarSettings',
    'googleCalendarEvents',
    'googleCalendarTokens',
    'googleCalendars'
  ];
  
  keysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
      console.log(`🗑️ Removing ${key} from localStorage`);
      localStorage.removeItem(key);
    }
  });
  
  console.log('✅ Cache cleared, refresh the page to see changes');
};

export const debugCalendarFilters = (filters: any) => {
  console.log('🔍 DEBUG FILTERS - About to send filters to Edge Function:');
  console.log('🔍 Full filters object:', JSON.stringify(filters, null, 2));
  console.log('🔍 filterWeekEvents value:', filters?.filterWeekEvents, 'type:', typeof filters?.filterWeekEvents);
  console.log('🔍 filterHolidays value:', filters?.filterHolidays, 'type:', typeof filters?.filterHolidays);
  console.log('🔍 selectedCalendars:', filters?.selectedCalendars);
};

export const logCurrentSettings = () => {
  const settings = localStorage.getItem('googleCalendarSettings');
  console.log('🔍 Current localStorage settings:', settings);
  if (settings) {
    try {
      const parsed = JSON.parse(settings);
      console.log('🔍 Parsed settings:', parsed);
    } catch (e) {
      console.error('Failed to parse settings:', e);
    }
  }
};