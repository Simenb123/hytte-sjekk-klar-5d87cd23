
import { GoogleEvent, GoogleCalendar } from '@/types/googleCalendar.types';

export interface GoogleCalendarState {
  isGoogleConnected: boolean;
  googleTokens: any;
  isLoadingEvents: boolean;
  googleEvents: GoogleEvent[];
  isConnecting: boolean;
  googleCalendars: GoogleCalendar[];
  connectionError: string | null;
  fetchError: string | null;
  lastRefresh: Date | null;
}

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
