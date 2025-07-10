
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

export interface GoogleOAuthTokens {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  scope?: string;
  expiry_date?: number;
}

export interface GoogleCalendarState {
  isGoogleConnected: boolean;
  googleTokens: GoogleOAuthTokens | null;
  isLoadingEvents: boolean;
  googleEvents: GoogleEvent[];
  isConnecting: boolean;
  googleCalendars: GoogleCalendar[];
  connectionError: string | null;
  fetchError: string | null;
  lastRefresh: Date | null;
}

