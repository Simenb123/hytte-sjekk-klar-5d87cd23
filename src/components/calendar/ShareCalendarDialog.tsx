
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { CopyIcon, CalendarIcon, Share2, PlusCircle, CheckIcon, InfoIcon, Smartphone } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { GoogleOAuthTokens } from '@/types/googleCalendar.types';

type ShareCalendarDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  googleTokens: GoogleOAuthTokens;
  onSuccess?: () => void;
};

export const ShareCalendarDialog: React.FC<ShareCalendarDialogProps> = ({
  open,
  onOpenChange,
  googleTokens,
  onSuccess
}) => {
  const [calendarName, setCalendarName] = useState('Hytte Booking');
  const [emails, setEmails] = useState<string[]>([]);
  const [currentEmail, setCurrentEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sharingLinks, setSharingLinks] = useState<{
    googleCalendarUrl: string;
    icalUrl: string;
  } | null>(null);
  
  const handleAddEmail = () => {
    if (!currentEmail) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(currentEmail)) {
      toast.error('Vennligst skriv inn en gyldig e-postadresse');
      return;
    }
    
    if (emails.includes(currentEmail)) {
      toast.error('Denne e-postadressen er allerede lagt til');
      return;
    }
    
    setEmails([...emails, currentEmail]);
    setCurrentEmail('');
  };
  
  const handleRemoveEmail = (email: string) => {
    setEmails(emails.filter(e => e !== email));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      toast.info('Oppretter og deler hytte-kalender...');
      
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        method: 'POST',
        body: { 
          action: 'setup_shared_calendar',
          tokens: googleTokens,
          calendar: {
            name: calendarName,
            shareWith: emails
          }
        }
      });
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      if (data.calendar) {
        toast.success('Hytte-kalender opprettet!');
        
        if (data.sharingLinks) {
          setSharingLinks(data.sharingLinks);
        }
        
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error: unknown) {
      console.error('Error creating shared calendar:', error);
      const message = error instanceof Error ? error.message : 'Ukjent feil';
      toast.error(`Kunne ikke opprette felles kalender: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const copyToClipboard = (text: string, successMessage: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success(successMessage))
      .catch(err => {
        console.error('Failed to copy:', err);
        toast.error('Kunne ikke kopiere til utklippstavlen');
      });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Oppsett av felles hytte-kalender</DialogTitle>
          <DialogDescription>
            Opprett en delt Google-kalender for hytta som alle kan ha tilgang til.
          </DialogDescription>
        </DialogHeader>
        
        {sharingLinks ? (
          <Tabs defaultValue="mobile" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="mobile">
                <Smartphone className="h-4 w-4 mr-2" />
                Mobil
              </TabsTrigger>
              <TabsTrigger value="share">
                <Share2 className="h-4 w-4 mr-2" />
                Del med andre
              </TabsTrigger>
            </TabsList>

            <TabsContent value="mobile" className="space-y-4">
              <div className="text-center py-2">
                <h3 className="text-lg font-medium">Få kalenderen på din mobiltelefon</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Følg instruksjonene under for å legge til hytte-kalenderen på din mobiltelefon
                </p>
              </div>
              
              <Alert>
                <div className="flex items-start space-x-2">
                  <InfoIcon className="h-4 w-4 mt-0.5 text-blue-500" />
                  <AlertDescription className="text-sm">
                    <strong>iOS (iPhone)</strong>: Gå til Innstillinger → Kalender → Kontoer → Legg til konto → Andre → 
                    Legg til abonnert kalender og lim inn iCal-adressen nedenfor.
                  </AlertDescription>
                </div>
              </Alert>
              
              <Alert>
                <div className="flex items-start space-x-2">
                  <InfoIcon className="h-4 w-4 mt-0.5 text-green-500" />
                  <AlertDescription className="text-sm">
                    <strong>Android</strong>: Åpne Google Calendar-appen → Trykk på meny (≡) → Innstillinger → 
                    Legg til konto → Abonner på kalender → og lim inn iCal-adressen nedenfor.
                  </AlertDescription>
                </div>
              </Alert>
              
              <div className="rounded-lg border p-4 mt-4">
                <Label htmlFor="ical-url" className="text-sm font-medium mb-2 block">
                  iCal-adresse (fungerer med alle kalenderapper)
                </Label>
                <div className="flex items-center space-x-2">
                  <Input 
                    id="ical-url"
                    value={sharingLinks.icalUrl}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyToClipboard(sharingLinks.icalUrl, 'iCal-adresse kopiert!')}
                  >
                    <CopyIcon className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Kopier denne adressen og lim den inn i kalenderprogrammet ditt for å abonnere på hytte-kalenderen.
                </p>
              </div>
              
              <div className="rounded-lg border p-4">
                <Label htmlFor="google-url" className="text-sm font-medium mb-2 block">
                  Google Calendar-lenke (for direkte tilgang)
                </Label>
                <div className="flex items-center space-x-2">
                  <Input 
                    id="google-url"
                    value={sharingLinks.googleCalendarUrl}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyToClipboard(sharingLinks.googleCalendarUrl, 'Google Calendar-lenke kopiert!')}
                  >
                    <CopyIcon className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Åpne denne lenken i en nettleser for å se og legge til kalenderen i din Google Calendar.
                </p>
              </div>
              
              <DialogFooter>
                <Button 
                  onClick={() => onOpenChange(false)}
                  className="w-full"
                >
                  Lukk
                </Button>
              </DialogFooter>
            </TabsContent>
            
            <TabsContent value="share" className="space-y-4">
              <div className="text-center py-2">
                <h3 className="text-lg font-medium">Del kalenderen med andre</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Del denne lenken med de som skal ha tilgang til hytte-kalenderen
                </p>
              </div>
              
              <div className="rounded-lg border p-4">
                <Label htmlFor="share-ical-url" className="text-sm font-medium mb-2 block">
                  Del iCal-abonnement (fungerer med alle kalenderprogrammer)
                </Label>
                <div className="flex items-center space-x-2">
                  <Input 
                    id="share-ical-url"
                    value={sharingLinks.icalUrl}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyToClipboard(sharingLinks.icalUrl, 'iCal-adresse kopiert og klar til deling!')}
                  >
                    <CopyIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="rounded-lg border p-4">
                <Label htmlFor="share-google-url" className="text-sm font-medium mb-2 block">
                  Del Google Calendar-lenke
                </Label>
                <div className="flex items-center space-x-2">
                  <Input 
                    id="share-google-url"
                    value={sharingLinks.googleCalendarUrl}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyToClipboard(sharingLinks.googleCalendarUrl, 'Google Calendar-lenke kopiert og klar til deling!')}
                  >
                    <CopyIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <Alert>
                <div className="flex items-start space-x-2">
                  <InfoIcon className="h-4 w-4 mt-0.5" />
                  <AlertDescription className="text-sm">
                    Alle med disse lenkene vil kunne <strong>se</strong> hendelser i kalenderen.
                    For å gi noen <strong>redigeringstilgang</strong>, legg til e-postadressen deres i forrige trinn.
                  </AlertDescription>
                </div>
              </Alert>
              
              <DialogFooter>
                <Button 
                  onClick={() => onOpenChange(false)}
                  className="w-full"
                >
                  Lukk
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="calendar-name" className="text-sm font-medium">
                Kalendernavn
              </Label>
              <Input
                id="calendar-name"
                value={calendarName}
                onChange={(e) => setCalendarName(e.target.value)}
                className="mt-1"
                placeholder="F.eks. Hytte Booking"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium">
                Del med familie/venner (valgfritt)
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Legg til e-postadresser til de som skal kunne redigere bookinger i kalenderen
              </p>
              
              <div className="flex space-x-2 mt-1">
                <Input
                  value={currentEmail}
                  onChange={(e) => setCurrentEmail(e.target.value)}
                  placeholder="E-postadresse"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEmail())}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleAddEmail}
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
              
              {emails.length > 0 && (
                <div className="mt-2">
                  <Label className="text-sm">Personer med redigeringstilgang:</Label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {emails.map(email => (
                      <div 
                        key={email} 
                        className="bg-muted text-sm px-2 py-1 rounded-md flex items-center"
                      >
                        <span>{email}</span>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="h-5 w-5 p-0 ml-1" 
                          onClick={() => handleRemoveEmail(email)}
                        >
                          &times;
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="pt-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Alert>
                      <CalendarIcon className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        Etter oppretting vil du kunne eksportere kalenderen til din mobiltelefon og andre enheter.
                      </AlertDescription>
                    </Alert>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">
                      Du vil få mulighet til å kopiere en lenke du kan bruke på mobiltelefonen din
                      eller dele med andre familiemedlemmer.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <DialogFooter>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Oppretter kalender...' : 'Opprett og del kalender'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
