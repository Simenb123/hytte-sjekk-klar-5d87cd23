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
        // Get authorization code from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        if (error) {
          console.error('OAuth error:', error);
          setStatus('error');
          setErrorMessage(`Google OAuth error: ${error}`);
          return;
        }

        if (!code) {
          console.error('No authorization code received');
          setStatus('error');
          setErrorMessage('Ingen autorisasjonskode mottatt fra Google');
          return;
        }

        console.log('Processing OAuth callback with code:', code);
        const success = await handleOAuthCallback(code);

        if (success) {
          setStatus('success');
          // Redirect to Mamma's hjørne after successful connection
          setTimeout(() => {
            navigate('/mammas-hjorne');
          }, 2000);
        } else {
          setStatus('error');
          setErrorMessage('Kunne ikke fullføre tilkobling til Google Calendar');
        }
      } catch (error) {
        console.error('Error processing OAuth callback:', error);
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