import { useState } from 'react';
import { X, Settings, Calendar, Clock, User, Phone, Plus, Trash2, Pencil } from 'lucide-react';
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
import { useQuickContacts, useAddQuickContact, useUpdateQuickContact, useDeleteQuickContact, ContactType } from '@/hooks/useQuickContacts';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
                    {lastSyncTime && lastSyncTime instanceof Date && !isNaN(lastSyncTime.getTime()) && (
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
                <ContactsManager openLink={openLink} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </Card>
    </div>
  );
};

// Contact Manager Component
function ContactsManager({ openLink }: { openLink: (url: string) => void }) {
  const { data: contacts = [], isLoading } = useQuickContacts();
  const addContact = useAddQuickContact();
  const updateContact = useUpdateQuickContact();
  const deleteContact = useDeleteQuickContact();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '+47',
    contact_type: 'audio' as ContactType,
    show_on_main: false,
    sort_order: 0,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      phone_number: '+47',
      contact_type: 'audio',
      show_on_main: false,
      sort_order: contacts.length,
    });
    setEditingContact(null);
  };

  const handleEditContact = (contact: typeof contacts[0]) => {
    setFormData({
      name: contact.name,
      phone_number: contact.phone_number,
      contact_type: contact.contact_type,
      show_on_main: contact.show_on_main,
      sort_order: contact.sort_order,
    });
    setEditingContact(contact.id);
    setIsAddDialogOpen(true);
  };

  const handleAddContact = () => {
    if (!formData.name || !formData.phone_number || formData.phone_number === '+47') {
      toast.error('Fyll inn navn og nummer');
      return;
    }
    
    if (editingContact) {
      updateContact.mutate(
        { id: editingContact, ...formData },
        {
          onSuccess: () => {
            setIsAddDialogOpen(false);
            resetForm();
          },
        }
      );
    } else {
      addContact.mutate(
        { ...formData, sort_order: contacts.length },
        {
          onSuccess: () => {
            setIsAddDialogOpen(false);
            resetForm();
          },
        }
      );
    }
  };

  const handleToggleShowOnMain = (contactId: string, currentValue: boolean) => {
    updateContact.mutate({ id: contactId, show_on_main: !currentValue });
  };

  const handleDelete = (contactId: string) => {
    if (confirm('Er du sikker på at du vil slette denne kontakten?')) {
      deleteContact.mutate(contactId);
    }
  };

  const getContactIcon = (type: ContactType) => {
    switch (type) {
      case 'video': return '📹';
      case 'audio': return '📞';
      case 'sms': return '💬';
    }
  };

  const getContactUrl = (contact: typeof contacts[0]) => {
    switch (contact.contact_type) {
      case 'video': return `facetime://${contact.phone_number}`;
      case 'audio': return `facetime-audio://${contact.phone_number}`;
      case 'sms': return `sms://${contact.phone_number}`;
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Laster kontakter...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-lg">Mine kontakter</CardTitle>
            <CardDescription>Administrer hurtigkontakter</CardDescription>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Ny kontakt
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Ingen kontakter lagt til ennå
            </p>
          ) : (
            contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getContactIcon(contact.contact_type)}</span>
                    <div>
                      <div className="font-medium">{contact.name}</div>
                      <div className="text-xs text-muted-foreground">{contact.phone_number}</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openLink(getContactUrl(contact))}
                  >
                    Ring/Send
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditContact(contact)}
                    title="Rediger"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Switch
                    checked={contact.show_on_main}
                    onCheckedChange={() => handleToggleShowOnMain(contact.id, contact.show_on_main)}
                    title="Vis i hovedbilde"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(contact.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingContact ? 'Rediger kontakt' : 'Legg til ny kontakt'}</DialogTitle>
            <DialogDescription>
              {editingContact 
                ? 'Endre informasjon om kontakten' 
                : 'Opprett en ny hurtigkontakt som du kan ringe eller sende melding til'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Navn</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="F.eks. Simen"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefonnummer</Label>
              <Input
                id="phone"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="+4712345678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.contact_type}
                onValueChange={(value) => setFormData({ ...formData, contact_type: value as ContactType })}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="audio">📞 FaceTime Audio / Oppringning</SelectItem>
                  <SelectItem value="video">📹 FaceTime Video</SelectItem>
                  <SelectItem value="sms">💬 SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="show-main"
                checked={formData.show_on_main}
                onCheckedChange={(checked) => setFormData({ ...formData, show_on_main: checked })}
              />
              <Label htmlFor="show-main">Vis som hurtigknapp i hovedbilde</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Avbryt
            </Button>
            <Button 
              onClick={handleAddContact} 
              disabled={addContact.isPending || updateContact.isPending}
            >
              {(addContact.isPending || updateContact.isPending) 
                ? 'Lagrer...' 
                : editingContact ? 'Lagre endringer' : 'Legg til'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
