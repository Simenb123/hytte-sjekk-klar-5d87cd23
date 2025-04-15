
import { useState, useEffect } from 'react';
import { useGoogleAuth } from './useGoogleAuth';
import { useGoogleEvents } from './useGoogleEvents';
import { GoogleCalendarState, initialState } from './types';

export function useGoogleCalendar() {
  const [state, setState] = useState<GoogleCalendarState>(initialState);
  
  const { connectGoogleCalendar, disconnectGoogleCalendar, handleOAuthCallback } = useGoogleAuth(setState);
  const { fetchGoogleEvents, fetchGoogleCalendars } = useGoogleEvents(setState, disconnectGoogleCalendar);

  // Load tokens from localStorage on component mount
  useEffect(() => {
    console.log('Loading Google Calendar tokens from localStorage');
    const storedTokens = localStorage.getItem('googleCalendarTokens');
    if (storedTokens) {
      try {
        const tokens = JSON.parse(storedTokens);
        console.log('Found stored tokens, access_token exists:', !!tokens.access_token);
        setState(prev => ({
          ...prev,
          googleTokens: tokens,
          isGoogleConnected: true
        }));
        
        // If we have tokens, fetch events right away
        fetchGoogleEvents(tokens);
        fetchGoogleCalendars(tokens);
      } catch (e) {
        console.error('Error parsing stored tokens:', e);
        localStorage.removeItem('googleCalendarTokens');
        setState(prev => ({
          ...prev,
          connectionError: 'Kunne ikke koble til Google Calendar. Vennligst prøv igjen.'
        }));
      }
    } else {
      console.log('No Google Calendar tokens found in localStorage');
    }
  }, [fetchGoogleEvents, fetchGoogleCalendars]);

  return {
    ...state,
    fetchGoogleEvents,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    handleOAuthCallback,
  };
}
