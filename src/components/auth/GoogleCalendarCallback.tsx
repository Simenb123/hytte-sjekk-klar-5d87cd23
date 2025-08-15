import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useGoogleCalendar } from '@/contexts/GoogleCalendarContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

/**
 * OAuth callback-side for Google Calendar
 * Håndterer authorization code fra Google og sender den til parent window
 */
export default function GoogleCalendarCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleOAuthCallback } = useGoogleCalendar();

  useEffect(() => {
    const processCallback = async () => {
      console.log('🔵 Google Calendar OAuth callback processing started');
      
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const state = searchParams.get('state');
      
      console.log('🔍 URL parameters:', {
        code_exists: !!code,
        code_length: code?.length,
        error,
        state,
        full_url: window.location.href
      });

      // Handle OAuth errors
      if (error) {
        console.error('❌ OAuth error from Google:', error);
        
        let errorMessage = 'Google Calendar-tilkobling ble avbrutt.';
        if (error === 'access_denied') {
          errorMessage = 'Tilgang til Google Calendar ble nektet. Vennligst prøv igjen og gi tillatelse.';
        }
        
        toast.error(errorMessage);
        
        // If we're in a popup, send error to parent
        if (window.opener && window.opener !== window) {
          console.log('📡 Sending error message to parent window');
          window.opener.postMessage({
            type: 'GOOGLE_OAUTH_ERROR',
            error: errorMessage
          }, window.location.origin);
          window.close();
          return;
        }
        
        // Otherwise redirect to main page
        navigate('/');
        return;
      }

      // Handle missing authorization code
      if (!code) {
        console.error('❌ No authorization code received from Google');
        const errorMessage = 'Ingen autorisasjonskode mottatt fra Google.';
        toast.error(errorMessage);
        
        if (window.opener && window.opener !== window) {
          console.log('📡 Sending error message to parent window (no code)');
          window.opener.postMessage({
            type: 'GOOGLE_OAUTH_ERROR',
            error: errorMessage
          }, window.location.origin);
          window.close();
          return;
        }
        
        navigate('/');
        return;
      }

      try {
        console.log('🔄 Processing OAuth callback with authorization code');
        
        // If we're in a popup, handle the code exchange here and send tokens to parent
        if (window.opener && window.opener !== window) {
          console.log('📡 Processing OAuth in popup window');
          
          const result = await handleOAuthCallback(code);
          
          if (result.success && result.tokens) {
            console.log('✅ OAuth successful in popup, sending tokens to parent');
            window.opener.postMessage({
              type: 'GOOGLE_OAUTH_SUCCESS',
              tokens: result.tokens
            }, window.location.origin);
            
            toast.success('Google Calendar koblet til!');
            setTimeout(() => window.close(), 1000);
          } else {
            throw new Error('OAuth-utveksling feilet');
          }
        } else {
          // Direct callback (not popup)
          console.log('🔄 Processing OAuth in direct callback');
          
          const result = await handleOAuthCallback(code);
          
          if (result.success) {
            console.log('✅ OAuth successful, redirecting to previous page');
            toast.success('Google Calendar koblet til!');
            
            // Redirect to the stored return URL or default
            const returnUrl = sessionStorage.getItem('calendarReturnUrl') || '/';
            sessionStorage.removeItem('calendarReturnUrl');
            navigate(returnUrl);
          } else {
            throw new Error('OAuth-utveksling feilet');
          }
        }
      } catch (error) {
        console.error('❌ Error processing OAuth callback:', error);
        
        const errorMessage = error instanceof Error ? error.message : 'Ukjent feil ved OAuth-behandling';
        toast.error(errorMessage);
        
        if (window.opener && window.opener !== window) {
          console.log('📡 Sending error to parent window');
          window.opener.postMessage({
            type: 'GOOGLE_OAUTH_ERROR',
            error: errorMessage
          }, window.location.origin);
          window.close();
        } else {
          navigate('/');
        }
      }
    };

    processCallback();
  }, [searchParams, navigate, handleOAuthCallback]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Google Calendar</CardTitle>
          <CardDescription>
            Behandler tilkobling til Google Calendar...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    </div>
  );
}
