import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useSmsNotifications } from '@/hooks/useSmsNotifications';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const NotificationChannelTest: React.FC = () => {
  const [title, setTitle] = useState('Test Notification');
  const [message, setMessage] = useState('Dette er en test-notifikasjon');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { user } = useAuth();
  const { isRegistered } = usePushNotifications();
  const { sendSms, isSending } = useSmsNotifications();

  const testPushNotification = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userId: user.id,
          title,
          body: message,
          data: { test: true }
        }
      });

      if (error) throw error;
      toast.success('Push-notifikasjon sendt!');
    } catch (error) {
      console.error('Error sending push notification:', error);
      toast.error('Kunne ikke sende push-notifikasjon');
    } finally {
      setIsLoading(false);
    }
  };

  const testSmsNotification = async () => {
    if (!phoneNumber) {
      toast.error('Skriv inn telefonnummer');
      return;
    }

    try {
      await sendSms(phoneNumber, `${title}\n\n${message}`);
    } catch (error) {
      console.error('Error sending SMS:', error);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Test Notifikasjonskanaler</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Tittel</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Notifikasjonstittel"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Melding</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Notifikasjonsmelding"
            rows={3}
          />
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Push-notifikasjon</h3>
            <Button 
              onClick={testPushNotification}
              disabled={!isRegistered || isLoading}
              className="w-full"
            >
              {isLoading ? 'Sender...' : 'Send Push-notifikasjon'}
            </Button>
            {!isRegistered && (
              <p className="text-sm text-muted-foreground mt-2">
                Push-notifikasjoner er ikke aktivert
              </p>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">SMS-notifikasjon</h3>
            <div className="space-y-2">
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+47 123 45 678"
                type="tel"
              />
              <Button 
                onClick={testSmsNotification}
                disabled={isSending || !phoneNumber}
                className="w-full"
              >
                {isSending ? 'Sender...' : 'Send SMS'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};