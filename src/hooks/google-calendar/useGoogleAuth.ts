import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { handleOAuthCallback as processOAuthCallback } from '@/services/googleCalendar.service';

export function useGoogleAuth(setState: any) {
  const [isAutoRetrying, setIsAutoRetrying] = useState(false);
  
  const connectGoogleCalendar = useCallback(async () => {
    setState(prev => ({ ...prev, isConnecting: true, connectionError: null }));
    
    try {
      console.log('Initiating Google Calendar connection...');
      toast.info('Kobler til Google Calendar...');
      
      console.log('Invoking google-calendar edge function...');
      
      try {
        const currentOrigin = window.location.origin;
        console.log('Current origin for Google OAuth request:', currentOrigin);
        
        const { data, error } = await supabase.functions.invoke('google-calendar', {
          method: 'GET'
        });
        
        if (error) {
          console.error('Supabase function error:', error);
          throw error;
        }
        
        if (data?.error) {
          console.error('Google API error:', data.error);
          if (data.details) {
            console.error('Error details:', data.details);
          }
          throw new Error(data.error);
        }
        
        if (data?.url) {
          console.log('Received Google authorization URL, redirecting...', data.url);
          sessionStorage.setItem('calendarReturnUrl', window.location.href);
          
          console.log('Redirecting to:', data.url);
          
          const browserInfo = {
            userAgent: navigator.userAgent,
            cookiesEnabled: navigator.cookieEnabled,
            language: navigator.language,
            platform: navigator.platform,
            vendor: navigator.vendor,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          };
          console.log('Browser environment details:', browserInfo);
          
          setTimeout(() => {
            window.location.href = data.url;
          }, 100);
        } else {
          throw new Error('Ingen autoriseringslenke mottatt fra serveren');
        }
      } catch (fetchError: any) {
        console.error('Error detail:', fetchError);
        
        try {
          const networkState = {
            online: navigator.onLine,
            connection: (navigator as any).connection 
              ? { 
                  type: (navigator as any).connection.type,
                  effectiveType: (navigator as any).connection.effectiveType,
                  downlink: (navigator as any).connection.downlink,
                  rtt: (navigator as any).connection.rtt,
                }
              : 'Not available',
            timestamp: new Date().toISOString()
          };
          console.log('Network state during error:', networkState);
        } catch (e) {
          console.log('Could not retrieve network state:', e);
        }
        
        if (fetchError.name === 'FunctionsFetchError' || 
            fetchError.message?.includes('Failed to fetch') ||
            fetchError.context?.value?.message?.includes('Failed to fetch')) {
          throw new Error('Nettverksfeil ved tilkobling til Edge Function. Sjekk at Edge Function er aktiv og at alle miljøvariabler er riktig satt opp.');
        }
        
        throw fetchError;
      }
    } catch (error: any) {
      console.error('Error connecting to Google Calendar:', error);
      
      let errorMessage = 'Kunne ikke koble til Google Calendar.';
      
      if (error.message?.includes('Edge Function') || 
          error.message?.includes('Nettverksfeil')) {
        errorMessage = error.message;
      } else if (error.name === 'FunctionsFetchError') {
        errorMessage = 'Kunne ikke nå Edge Function. Sjekk at Supabase-funksjonen er aktiv.';
      } else if (error.message?.includes('403') || error.status === 403) {
        errorMessage = 'Fikk 403 Forbidden fra Google. Sjekk at OAuth-konfigurasjonen er riktig oppsatt i Google Cloud Console.';
      } else if (error.message?.includes('refused to connect') || 
                error.message?.includes('avviste tilkoblingsforsøket')) {
        errorMessage = 'Nettleseren kunne ikke koble til accounts.google.com. Dette kan skyldes at tredjepartsinfokapsler er blokkert i nettleseren. Prøv å aktivere tredjepartsinfokapsler, sjekk brannmur/VPN-innstillinger, eller prøv en annen nettleser.';
      }
      
      toast.error(errorMessage);
      setState(prev => ({
        ...prev,
        connectionError: errorMessage
      }));
      
      setIsAutoRetrying(false);
      
      return false;
    } finally {
      setState(prev => ({ ...prev, isConnecting: false }));
    }
    
    return true;
  }, [setState]);

  const disconnectGoogleCalendar = useCallback(() => {
    console.log('Disconnecting from Google Calendar...');
    localStorage.removeItem('googleCalendarTokens');
    setState(prev => ({
      ...prev,
      googleTokens: null,
      isGoogleConnected: false,
      googleEvents: [],
      connectionError: null,
      fetchError: null
    }));
    toast.success('Koblet fra Google Calendar');
  }, [setState]);

  const handleOAuthCallback = useCallback(async (code: string) => {
    setState(prev => ({ ...prev, connectionError: null }));
    
    try {
      console.log('Processing OAuth callback with code:', code.substring(0, 10) + '...');
      const tokens = await processOAuthCallback(code);
      
      if (!tokens) {
        throw new Error('Ingen tokens mottatt fra serveren');
      }
      
      localStorage.setItem('googleCalendarTokens', JSON.stringify(tokens));
      setState(prev => ({
        ...prev,
        googleTokens: tokens,
        isGoogleConnected: true
      }));
      toast.success('Koblet til Google Calendar!');
      return true;
    } catch (error: any) {
      console.error('Error exchanging code for tokens:', error);
      
      let errorMessage = error.message || 'Kunne ikke fullføre Google Calendar-integrasjonen';
      
      if (error.message?.includes('Edge Function') || 
          error.message?.includes('Nettverksfeil')) {
        errorMessage = 'Kunne ikke koble til serveren. Google Calendar-integrasjonen er midlertidig utilgjengelig.';
      } else if (error.message?.includes('403') || error.status === 403) {
        errorMessage = 'Fikk 403 Forbidden fra Google. Sjekk at OAuth-konfigurasjonen er riktig oppsatt i Google Cloud Console.';
        if (error.details) {
          console.error('Error details:', error.details);
        }
      } else if (error.message?.includes('refused to connect') || 
                error.message?.includes('avviste tilkoblingsforsøket')) {
        errorMessage = 'Nettleseren kunne ikke koble til accounts.google.com. Dette kan skyldes at tredjepartsinfokapsler er blokkert i nettleseren. Prøv å aktivere tredjepartsinfokapsler, sjekk brannmur/VPN-innstillinger, eller prøv en annen nettleser.';
      }
      
      toast.error(errorMessage);
      setState(prev => ({
        ...prev,
        connectionError: errorMessage
      }));
    }
    return false;
  }, [setState]);

  return {
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    handleOAuthCallback,
    isAutoRetrying,
    setIsAutoRetrying
  };
}
