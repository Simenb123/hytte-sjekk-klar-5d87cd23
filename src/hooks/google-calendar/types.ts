
import { GoogleEvent, GoogleCalendar } from '@/types/googleCalendar.types';
import type { GoogleCalendarState } from '@/types/googleCalendar.types';

export type { GoogleCalendarState } from '@/types/googleCalendar.types';

export const initialState: GoogleCalendarState = {
  isGoogleConnected: false,
  googleTokens: null,
  isLoadingEvents: false,
  googleEvents: [],
  isConnecting: false,
  googleCalendars: [],
  connectionError: null,
  fetchError: null,
  lastRefresh: null,
};
