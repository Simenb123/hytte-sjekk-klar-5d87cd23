
import { useState, useEffect, useCallback, useRef } from 'react';
import { useGoogleAuth } from './useGoogleAuth';
import { useGoogleEvents } from './useGoogleEvents';
import { retrieveGoogleTokens } from '@/utils/tokenStorage';
import { GoogleCalendarState, initialState } from './types';

export function useGoogleCalendar() {
  const [state, setState] = useState<GoogleCalendarState>(initialState);
  const isInitializedRef = useRef(false);
  
  const { connectGoogleCalendar, disconnectGoogleCalendar, handleOAuthCallback } = useGoogleAuth(setState);
  const { fetchGoogleEvents, fetchGoogleCalendars } = useGoogleEvents(
    useCallback(() => state.googleTokens, [state.googleTokens]),
    setState,
    disconnectGoogleCalendar
  );

  // Load tokens from localStorage on component mount (only once)
  useEffect(() => {
    if (isInitializedRef.current) return;
    
    console.log('Loading Google Calendar tokens from localStorage (initial load)');
    const tokens = retrieveGoogleTokens();
    
    if (tokens) {
      console.log('Found stored tokens, access_token exists:', !!tokens.access_token);
      setState(prev => ({
        ...prev,
        googleTokens: tokens,
        isGoogleConnected: true
      }));
      
      // Delay initial fetch to avoid immediate API calls and rate limiting
      setTimeout(() => {
        fetchGoogleEvents(tokens);
        fetchGoogleCalendars(tokens);
      }, 1000); // Increased delay to 1 second
    } else {
      console.log('No valid Google Calendar tokens found in localStorage');
    }
    
    isInitializedRef.current = true;
  }, []);

  // Memoize the refresh functions to pass forceRefresh
  const refreshGoogleEvents = useCallback(() => {
    if (state.googleTokens) {
      fetchGoogleEvents(state.googleTokens, true); // force refresh
    }
  }, [state.googleTokens, fetchGoogleEvents]);

  const refreshGoogleCalendars = useCallback(() => {
    if (state.googleTokens) {
      fetchGoogleCalendars(state.googleTokens, true); // force refresh
    }
  }, [state.googleTokens, fetchGoogleCalendars]);

  return {
    ...state,
    fetchGoogleEvents: refreshGoogleEvents,
    fetchGoogleCalendars: refreshGoogleCalendars,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    handleOAuthCallback,
  };
}
