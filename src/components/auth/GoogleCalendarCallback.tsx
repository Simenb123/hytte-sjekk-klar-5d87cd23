import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleCalendar } from '@/hooks/google-calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const GoogleCalendarCallback: React.FC = () => {
  const navigate = useNavigate();
  const { handleOAuthCallback } = useGoogleCalendar();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Check if this is running in a popup window
        const isPopup = window.opener && window.opener !== window;
        
        // Get authorization code from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        if (error) {
          console.error('OAuth error:', error);
          if (isPopup) {
            // Send error message to parent window
            window.opener.postMessage({
              type: 'GOOGLE_OAUTH_ERROR',
              error: error
            }, window.location.origin);
            window.close();
            return;
          }
          setStatus('error');
          setErrorMessage(`Google OAuth error: ${error}`);
          return;
        }

        if (!code) {
          console.error('No authorization code received');
          if (isPopup) {
            // Send error message to parent window
            window.opener.postMessage({
              type: 'GOOGLE_OAUTH_ERROR',
              error: 'No authorization code received'
            }, window.location.origin);
            window.close();
            return;
          }
          setStatus('error');
          setErrorMessage('Ingen autorisasjonskode mottatt fra Google');
          return;
        }

        console.log('Processing OAuth callback with code:', code);
        const success = await handleOAuthCallback(code);

        if (success) {
          if (isPopup) {
            // Wait a bit longer to ensure token storage is complete
            console.log('🔄 Waiting for token storage to complete...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Send success message to parent window
            window.opener.postMessage({
              type: 'GOOGLE_OAUTH_SUCCESS'
            }, window.location.origin);
            
            // Additional delay before closing to ensure message is received
            setTimeout(() => {
              window.close();
            }, 500);
            return;
          }
          
          setStatus('success');
          // Redirect to Mamma's hjørne after successful connection
          setTimeout(() => {
            navigate('/mammas-hjorne');
          }, 2000);
        } else {
          if (isPopup) {
            // Send error message to parent window
            window.opener.postMessage({
              type: 'GOOGLE_OAUTH_ERROR',
              error: 'Could not complete connection'
            }, window.location.origin);
            window.close();
            return;
          }
          
          setStatus('error');
          setErrorMessage('Kunne ikke fullføre tilkobling til Google Calendar');
        }
      } catch (error) {
        console.error('Error processing OAuth callback:', error);
        
        const isPopup = window.opener && window.opener !== window;
        if (isPopup) {
          // Send error message to parent window
          window.opener.postMessage({
            type: 'GOOGLE_OAUTH_ERROR',
            error: 'Unexpected error during connection'
          }, window.location.origin);
          window.close();
          return;
        }
        
        setStatus('error');
        setErrorMessage('Uventet feil ved tilkobling til Google Calendar');
      }
    };

    processCallback();
  }, [handleOAuthCallback, navigate]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-12 h-12 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-12 h-12 text-green-500" />;
      case 'error':
        return <XCircle className="w-12 h-12 text-red-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'loading':
        return 'Kobler til Google Calendar...';
      case 'success':
        return 'Google Calendar tilkoblet! Omdirigerer...';
      case 'error':
        return errorMessage;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            {getStatusIcon()}
          </div>
          <h2 className="text-xl font-semibold mb-4">
            Google Calendar tilkobling
          </h2>
          <p className="text-gray-600 mb-6">
            {getStatusMessage()}
          </p>
          {status === 'error' && (
            <button
              onClick={() => navigate('/mammas-hjorne')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Tilbake til Mamma's hjørne
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleCalendarCallback;