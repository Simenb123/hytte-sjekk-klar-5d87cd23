import { useState } from 'react';
import { X, Settings, Calendar, Clock, User, Phone } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { GoogleCalendarStatusInline } from './GoogleCalendarStatusInline';
import { SimpleBookingForm } from '@/components/booking/SimpleBookingForm';
import { SilhouetteUploader } from '@/components/admin/SilhouetteUploader';
import { LocationPicker } from '@/components/location/LocationPicker';
import { clearGoogleCalendarCache } from '@/utils/debugGoogleCalendar';
import { testGoogleCalendarSecrets } from '@/utils/testGoogleSecrets';
import { toast } from 'sonner';

interface AdminPanelProps {
  onClose: () => void;
  isGoogleConnected: boolean;
  onConnectGoogle?: () => void;
  onReconnectGoogle?: () => void;
  forceNight: boolean;
  setForceNight: (value: boolean) => void;
  showWeatherForecast: boolean;
  setShowWeatherForecast: (value: boolean) => void;
  showFT: boolean;
  setShowFT: (value: boolean) => void;
  usingMock: boolean;
  setUsingMock: (value: boolean) => void;
  online: boolean;
  lastSyncTime: Date | null;
  silhouetteUrl: string | null;
  setSilhouetteUrl: (url: string | null) => void;
  currentWeatherLocation: any;
  handleLocationSelect: (location: any) => void;
  handleQuickBooking: (data: any) => void;
  isBookingSubmitting: boolean;
  openLink: (url: string) => void;
}

export const AdminPanel = ({
  onClose,
  isGoogleConnected,
  onConnectGoogle,
  onReconnectGoogle,
  forceNight,
  setForceNight,
  showWeatherForecast,
  setShowWeatherForecast,
  showFT,
  setShowFT,
  usingMock,
  setUsingMock,
  online,
  lastSyncTime,
  silhouetteUrl,
  setSilhouetteUrl,
  currentWeatherLocation,
  handleLocationSelect,
  handleQuickBooking,
  isBookingSubmitting,
  openLink,
}: AdminPanelProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <div>
            <CardTitle className="text-2xl">Admin Panel</CardTitle>
            <CardDescription>Administrer innstillinger og funksjoner</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
              <TabsTrigger value="general" className="gap-2">
                <Settings className="h-4 w-4" />
                Generelt
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-2">
                <Calendar className="h-4 w-4" />
                Kalender
              </TabsTrigger>
              <TabsTrigger value="booking" className="gap-2">
                <Clock className="h-4 w-4" />
                Booking
              </TabsTrigger>
              <TabsTrigger value="personalize" className="gap-2">
                <User className="h-4 w-4" />
                Personalisering
              </TabsTrigger>
              <TabsTrigger value="contacts" className="gap-2">
                <Phone className="h-4 w-4" />
                Kontakter
              </TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="general" className="space-y-4 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Visningsinnstillinger</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium">Nattmodus</div>
                        <div className="text-xs text-muted-foreground">Tvungen nattmodus-visning</div>
                      </div>
                      <Switch checked={forceNight} onCheckedChange={setForceNight} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium">Værvarsel</div>
                        <div className="text-xs text-muted-foreground">Vis værvarsel på hovedskjerm</div>
                      </div>
                      <Switch checked={showWeatherForecast} onCheckedChange={setShowWeatherForecast} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium">FaceTime/SMS knapper</div>
                        <div className="text-xs text-muted-foreground">Vis kontaktknapper</div>
                      </div>
                      <Switch checked={showFT} onCheckedChange={setShowFT} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium">Mock data</div>
                        <div className="text-xs text-muted-foreground">Bruk testdata i stedet for ekte</div>
                      </div>
                      <Switch checked={usingMock} onCheckedChange={setUsingMock} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Systemstatus</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Nettverksstatus</span>
                      <Badge variant={online ? 'default' : 'secondary'}>
                        {online ? 'Online' : 'Offline'}
                      </Badge>
                    </div>
                    {lastSyncTime && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Siste synkronisering</span>
                        <span className="text-sm text-muted-foreground">
                          {lastSyncTime.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="calendar" className="space-y-4 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Google Calendar</CardTitle>
                    <CardDescription>Administrer Google Calendar-integrasjon</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <GoogleCalendarStatusInline onReconnect={onReconnectGoogle} />

                    <div className="flex gap-2">
                      {!isGoogleConnected && onConnectGoogle && (
                        <Button onClick={onConnectGoogle} className="flex-1">
                          Koble til Google Calendar
                        </Button>
                      )}
                      {isGoogleConnected && onReconnectGoogle && (
                        <Button onClick={onReconnectGoogle} variant="outline" className="flex-1">
                          Gjenopprett tilkobling
                        </Button>
                      )}
                    </div>

                    <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full">
                          {showAdvanced ? 'Skjul' : 'Vis'} avanserte valg
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-2 pt-2">
                        <Button
                          onClick={() => {
                            clearGoogleCalendarCache();
                            toast.success('Cache tømt');
                          }}
                          variant="destructive"
                          size="sm"
                          className="w-full"
                        >
                          Tøm cache
                        </Button>
                        <Button
                          onClick={async () => {
                            try {
                              await testGoogleCalendarSecrets();
                              toast.success('Test fullført');
                            } catch {
                              toast.error('Test feilet');
                            }
                          }}
                          variant="secondary"
                          size="sm"
                          className="w-full"
                        >
                          Test secrets
                        </Button>
                      </CollapsibleContent>
                    </Collapsible>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="booking" className="space-y-4 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Hurtig booking</CardTitle>
                    <CardDescription>Lag en ny booking raskt</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SimpleBookingForm
                      onSubmit={handleQuickBooking}
                      isSubmitting={isBookingSubmitting}
                      googleIntegration={isGoogleConnected}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="personalize" className="space-y-4 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Profilbilde</CardTitle>
                    <CardDescription>Last opp og generer silhuett</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SilhouetteUploader
                      onSilhouetteGenerated={setSilhouetteUrl}
                      currentSilhouette={silhouetteUrl}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Værlokasjon</CardTitle>
                    <CardDescription>Velg hvilken lokasjon som skal vises</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <LocationPicker
                      currentLocation={currentWeatherLocation}
                      onLocationSelect={handleLocationSelect}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="contacts" className="space-y-4 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Hurtigkontakter</CardTitle>
                    <CardDescription>Ring eller send SMS direkte</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={() => openLink('facetime-audio://+4748075204')}
                        className="h-auto py-3"
                      >
                        📞 Ring Simen
                      </Button>
                      <Button
                        onClick={() => openLink('facetime-audio://+4741815832')}
                        className="h-auto py-3"
                      >
                        📞 Ring Eivind
                      </Button>
                      <Button
                        onClick={() => openLink('facetime-audio://+4795917304')}
                        className="h-auto py-3"
                      >
                        📞 Ring Knut
                      </Button>
                      <Button
                        onClick={() => openLink('sms://+4748075204')}
                        variant="secondary"
                        className="h-auto py-3"
                      >
                        💬 SMS Simen
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </Card>
    </div>
  );
};
