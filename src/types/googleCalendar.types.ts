
export interface GoogleEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  htmlLink?: string;
}

export interface GoogleCalendar {
  id: string;
  summary: string;
  primary?: boolean;
  description?: string;
  accessRole: string;
}

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

