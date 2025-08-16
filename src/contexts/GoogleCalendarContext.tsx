import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { useGoogleAuth } from '@/hooks/google-calendar/useGoogleAuth';
import { useGoogleEvents } from '@/hooks/google-calendar/useGoogleEvents';
import { retrieveGoogleTokens } from '@/utils/tokenStorage';
import { GoogleCalendarState, initialState } from '@/hooks/google-calendar/types';

interface GoogleCalendarContextType extends GoogleCalendarState {
  fetchGoogleEvents: () => void;
  fetchGoogleCalendars: () => void;
  connectGoogleCalendar: () => Promise<boolean>;
  disconnectGoogleCalendar: () => void;
  handleOAuthCallback: (code: string) => Promise<{ success: boolean; tokens?: any }>;
}

const GoogleCalendarContext = createContext<GoogleCalendarContextType | undefined>(undefined);

export function GoogleCalendarProvider({ children }: { children: React.ReactNode }) {
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
    
    console.log('GoogleCalendarProvider: Loading tokens from localStorage (initial load)');
    const tokens = retrieveGoogleTokens();
    
    if (tokens) {
      console.log('GoogleCalendarProvider: Found stored tokens, access_token exists:', !!tokens.access_token);
      setState(prev => ({
        ...prev,
        googleTokens: tokens,
        isGoogleConnected: true
      }));
      
      // Delay initial fetch to avoid immediate API calls and rate limiting
      setTimeout(() => {
        fetchGoogleEvents(tokens);
        fetchGoogleCalendars(tokens);
      }, 1000);
    } else {
      console.log('GoogleCalendarProvider: No valid Google Calendar tokens found in localStorage');
    }
    
    isInitializedRef.current = true;
  }, [fetchGoogleEvents, fetchGoogleCalendars]);

  // Listen for OAuth success events and token refresh events
  useEffect(() => {
    const handleOAuthSuccess = () => {
      console.log('🔄 GoogleCalendarProvider: OAuth success event received, checking for tokens...');
      
      const tokens = retrieveGoogleTokens();
      if (tokens) {
        console.log('✅ GoogleCalendarProvider: Successfully loaded tokens after OAuth success');
        setState(prev => ({
          ...prev,
          googleTokens: tokens,
          isGoogleConnected: true
        }));
        
        // Fetch data with new tokens immediately
        fetchGoogleEvents(tokens);
        fetchGoogleCalendars(tokens);
      } else {
        console.warn('⚠️ GoogleCalendarProvider: Still no tokens found after OAuth success');
      }
    };

    const handleTokensRefreshed = (event: CustomEvent) => {
      console.log('🔄 GoogleCalendarProvider: Tokens refreshed event received, updating state');
      if (event.detail?.refreshedTokens) {
        setState(prev => ({
          ...prev,
          googleTokens: event.detail.refreshedTokens
        }));
      }
    };

    window.addEventListener('google-oauth-success', handleOAuthSuccess);
    window.addEventListener('google-tokens-refreshed', handleTokensRefreshed as EventListener);
    
    return () => {
      window.removeEventListener('google-oauth-success', handleOAuthSuccess);
      window.removeEventListener('google-tokens-refreshed', handleTokensRefreshed as EventListener);
    };
  }, [fetchGoogleEvents, fetchGoogleCalendars]);

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

  const contextValue: GoogleCalendarContextType = {
    ...state,
    fetchGoogleEvents: refreshGoogleEvents,
    fetchGoogleCalendars: refreshGoogleCalendars,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    handleOAuthCallback,
  };

  return (
    <GoogleCalendarContext.Provider value={contextValue}>
      {children}
    </GoogleCalendarContext.Provider>
  );
}

export function useGoogleCalendar() {
  const context = useContext(GoogleCalendarContext);
  if (context === undefined) {
    throw new Error('useGoogleCalendar must be used within a GoogleCalendarProvider');
  }
  return context;
}