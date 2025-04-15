
export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
  token_type: string;
  scope: string;
}

export interface GoogleCalendarEvent {
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
}

export interface GoogleAuthResponse {
  url?: string;
  tokens?: GoogleTokens;
  error?: string;
  details?: string;
}

export interface RequestData {
  code?: string;
  redirectUri?: string;
  action?: string;
  tokens?: GoogleTokens;
  event?: {
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
  };
}
