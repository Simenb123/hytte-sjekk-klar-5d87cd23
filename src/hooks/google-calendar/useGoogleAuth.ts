import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { handleOAuthCallback as processOAuthCallback } from '@/services/googleCalendar.service';
import { storeGoogleTokens, removeGoogleTokens } from '@/utils/tokenStorage';
import type { GoogleCalendarState } from './types';

export function useGoogleAuth(
  setState: Dispatch<SetStateAction<GoogleCalendarState>>
) {
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
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            thirdPartyCookiesSupported: 'Unknown - will be tested during OAuth flow'
          };
          console.log('Browser environment details:', browserInfo);
          
          const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
          const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
          
          if (isSafari || isIOS) {
            console.log('Detected Safari or iOS browser which commonly blocks third-party cookies');
            toast.warning('Du bruker Safari eller iOS som kan blokkere tredjepartsinfokapsler. Hvis innloggingen feiler, prøv å aktivere tredjepartsinfokapsler i nettleserinnstillingene eller bruk en annen nettleser.');
          }
          
          setTimeout(() => {
            window.location.href = data.url;
          }, 100);
        } else {
          throw new Error('Ingen autoriseringslenke mottatt fra serveren');
        }
      } catch (fetchError: unknown) {
        console.error('Error detail:', fetchError);
        
        try {
          const nav = navigator as Navigator & {
            connection?: any;
          };
          const connection = nav.connection;
          const networkState = {
            online: navigator.onLine,
            connection: connection
              ? {
                  type: connection.type,
                  effectiveType: connection.effectiveType,
                  downlink: connection.downlink,
                  rtt: connection.rtt,
                }
              : 'Not available',
            timestamp: new Date().toISOString(),
          };
          console.log('Network state during error:', networkState);
        } catch (e) {
          console.log('Could not retrieve network state:', e);
        }

        const fe = fetchError as {
          name?: string;
          message?: string;
          context?: { value?: { message?: string } };
        };
        if (
          fe.name === 'FunctionsFetchError' ||
          fe.message?.includes('Failed to fetch') ||
          fe.context?.value?.message?.includes('Failed to fetch')
        ) {
          throw new Error('Nettverksfeil ved tilkobling til Edge Function. Sjekk at Edge Function er aktiv og at alle miljøvariabler er riktig satt opp.');
        }

        throw fetchError as Error;
      }
    } catch (error: unknown) {
      console.error('Error connecting to Google Calendar:', error);

      let errorMessage = 'Kunne ikke koble til Google Calendar.';
      const err = error as {
        message?: string;
        name?: string;
        status?: number;
      };

      if (err.message?.includes('Edge Function') ||
          err.message?.includes('Nettverksfeil')) {
        errorMessage = err.message ?? errorMessage;
      } else if (err.name === 'FunctionsFetchError') {
        errorMessage = 'Kunne ikke nå Edge Function. Sjekk at Supabase-funksjonen er aktiv.';
      } else if (err.message?.includes('403') || err.status === 403) {
        errorMessage = 'Fikk 403 Forbidden fra Google. Sjekk at OAuth-konfigurasjonen er riktig oppsatt i Google Cloud Console.';
      } else if (err.message?.includes('refused to connect') ||
                err.message?.includes('avviste tilkoblingsforsøket')) {
        errorMessage = 'Nettleseren kunne ikke koble til accounts.google.com. Dette skyldes sannsynligvis at tredjepartsinfokapsler er blokkert i nettleseren din. Prøv å:' +
          '\n1. Aktivere tredjepartsinfokapsler i nettleserinnstillingene' +
          '\n2. Sjekke brannmur/VPN-innstillinger' +
          '\n3. Prøve en annen nettleser som Chrome eller Firefox';
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
    const removed = removeGoogleTokens();
    if (!removed) {
      console.warn('Failed to remove tokens from storage');
    }
    
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
      console.log('🔄 Starting OAuth callback processing with code:', code.substring(0, 10) + '...');
      console.log('🔄 Calling processOAuthCallback service function...');
      
      const tokens = await processOAuthCallback(code);
      console.log('📨 Received response from processOAuthCallback:', {
        tokens_exists: !!tokens,
        access_token_exists: tokens?.access_token ? true : false,
        access_token_type: typeof tokens?.access_token,
        access_token_length: tokens?.access_token?.length,
        refresh_token_exists: tokens?.refresh_token ? true : false,
        token_type: tokens?.token_type,
        scope: tokens?.scope,
        expiry_date: tokens?.expiry_date
      });
      
      if (!tokens) {
        console.error('❌ No tokens received from server');
        throw new Error('Ingen tokens mottatt fra serveren');
      }

      // Validate token structure before saving
      if (!tokens.access_token || typeof tokens.access_token !== 'string') {
        console.error('❌ Invalid token structure received from server:', {
          access_token_exists: !!tokens.access_token,
          access_token_type: typeof tokens.access_token,
          tokens_object: tokens
        });
        throw new Error('Ugyldig token-struktur mottatt fra serveren');
      }
      
      console.log('✅ Tokens validation passed, preparing to store:', {
        access_token_exists: !!tokens.access_token,
        refresh_token_exists: !!tokens.refresh_token,
        expiry_date: tokens.expiry_date
      });
      
      // Store tokens using the utility with retry mechanism
      console.log('💾 Calling storeGoogleTokens...');
      const stored = await storeGoogleTokens(tokens);
      console.log('💾 storeGoogleTokens result:', stored);
      
      if (!stored) {
        console.error('❌ Failed to store tokens in localStorage');
        throw new Error('Kunne ikke lagre tokens i localStorage');
      }
      
      console.log('✅ Tokens stored successfully, updating state...');
      setState(prev => ({
        ...prev,
        googleTokens: tokens,
        isGoogleConnected: true
      }));
      
      console.log('🎉 OAuth callback completed successfully!');
      toast.success('Koblet til Google Calendar!');
      return true;
    } catch (error: unknown) {
      console.error('Error exchanging code for tokens:', error);

      const err = error as {
        message?: string;
        status?: number;
        details?: string;
      };

      let errorMessage = err.message || 'Kunne ikke fullføre Google Calendar-integrasjonen';
      
      if (err.message?.includes('Edge Function') ||
          err.message?.includes('Nettverksfeil')) {
        errorMessage = 'Kunne ikke koble til serveren. Google Calendar-integrasjonen er midlertidig utilgjengelig.';
      } else if (err.message?.includes('403') || err.status === 403) {
        errorMessage = 'Fikk 403 Forbidden fra Google. Sjekk at OAuth-konfigurasjonen er riktig oppsatt i Google Cloud Console.';
        if (err.details) {
          console.error('Error details:', err.details);
        }
      } else if (err.message?.includes('refused to connect') ||
                err.message?.includes('avviste tilkoblingsforsøket')) {
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
