import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Bell, Mail, Smartphone, MessageSquare, Loader2 } from 'lucide-react';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Separator } from '@/components/ui/separator';

export default function NotificationSettings() {
  const { 
    preferences, 
    isLoading, 
    isSaving, 
    updatePreferences 
  } = useNotificationPreferences();
  
  const { 
    isRegistered, 
    isLoading: pushLoading, 
    registerForPushNotifications 
  } = usePushNotifications();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Laster varselinnstillinger...</span>
        </CardContent>
      </Card>
    );
  }

  if (!preferences) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Kunne ikke laste varselinnstillinger</p>
        </CardContent>
      </Card>
    );
  }

  const handleToggle = (key: keyof typeof preferences, value: boolean) => {
    updatePreferences({ [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Varselkanaler
          </CardTitle>
          <CardDescription>
            Velg hvordan du vil motta varsler
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="email-enabled" className="font-medium">
                  E-post varsler
                </Label>
                <p className="text-sm text-muted-foreground">
                  Motta varsler på e-post
                </p>
              </div>
            </div>
            <Switch
              id="email-enabled"
              checked={preferences.email_enabled}
              onCheckedChange={(checked) => handleToggle('email_enabled', checked)}
              disabled={isSaving}
            />
          </div>

          <Separator />

          {/* Push Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="push-enabled" className="font-medium">
                  Push-varsler
                </Label>
                <p className="text-sm text-muted-foreground">
                  Motta varsler direkte til enheten din
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isRegistered && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={registerForPushNotifications}
                  disabled={pushLoading}
                >
                  {pushLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Aktiver'
                  )}
                </Button>
              )}
              <Switch
                id="push-enabled"
                checked={preferences.push_enabled && isRegistered}
                onCheckedChange={(checked) => handleToggle('push_enabled', checked)}
                disabled={isSaving || !isRegistered}
              />
            </div>
          </div>

          <Separator />

          {/* SMS Notifications (Disabled for now) */}
          <div className="flex items-center justify-between opacity-50">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="sms-enabled" className="font-medium">
                  SMS-varsler
                </Label>
                <p className="text-sm text-muted-foreground">
                  Kommer snart
                </p>
              </div>
            </div>
            <Switch
              id="sms-enabled"
              checked={false}
              disabled={true}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle>Varseltyper</CardTitle>
          <CardDescription>
            Velg hvilke typer varsler du vil motta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="booking-reminders" className="font-medium">
                Booking-påminnelser
              </Label>
              <p className="text-sm text-muted-foreground">
                Påminnelser om kommende hytteopphhold
              </p>
            </div>
            <Switch
              id="booking-reminders"
              checked={preferences.booking_reminders}
              onCheckedChange={(checked) => handleToggle('booking_reminders', checked)}
              disabled={isSaving}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="weather-updates" className="font-medium">
                Væroppdateringer
              </Label>
              <p className="text-sm text-muted-foreground">
                Værvarsel for hytteområdet
              </p>
            </div>
            <Switch
              id="weather-updates"
              checked={preferences.weather_updates}
              onCheckedChange={(checked) => handleToggle('weather_updates', checked)}
              disabled={isSaving}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="seasonal-info" className="font-medium">
                Sesong-informasjon
              </Label>
              <p className="text-sm text-muted-foreground">
                Tips og informasjon basert på årstid
              </p>
            </div>
            <Switch
              id="seasonal-info"
              checked={preferences.seasonal_info}
              onCheckedChange={(checked) => handleToggle('seasonal_info', checked)}
              disabled={isSaving}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}