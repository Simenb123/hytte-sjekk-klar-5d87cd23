
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Smartphone, Laptop, Copy, ExternalLink, InfoIcon, AppleIcon, Globe } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';

interface MobileCalendarGuideProps {
  googleCalendarUrl: string;
  icalUrl: string;
}

export const MobileCalendarGuide: React.FC<MobileCalendarGuideProps> = ({
  googleCalendarUrl,
  icalUrl
}) => {
  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success(message))
      .catch(err => {
        console.error('Failed to copy:', err);
        toast.error('Kunne ikke kopiere til utklippstavlen');
      });
  };

  return (
    <Tabs defaultValue="ios" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="ios">
          <AppleIcon className="h-4 w-4 mr-2" />
          iPhone/iPad
        </TabsTrigger>
        <TabsTrigger value="android">
          <Smartphone className="h-4 w-4 mr-2" />
          Android
        </TabsTrigger>
        <TabsTrigger value="desktop">
          <Laptop className="h-4 w-4 mr-2" />
          Desktop
        </TabsTrigger>
      </TabsList>

      <TabsContent value="ios" className="space-y-4 mt-4">
        <div className="mb-4">
          <h3 className="text-lg font-medium">Legg til på iPhone eller iPad</h3>
          <ol className="mt-2 space-y-3 text-sm">
            <li className="flex items-start">
              <span className="bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">1</span>
              <span>Gå til <strong>Innstillinger</strong> på enheten din</span>
            </li>
            <li className="flex items-start">
              <span className="bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">2</span>
              <span>Bla ned og trykk på <strong>Kalender</strong></span>
            </li>
            <li className="flex items-start">
              <span className="bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">3</span>
              <span>Trykk på <strong>Kontoer</strong></span>
            </li>
            <li className="flex items-start">
              <span className="bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">4</span>
              <span>Velg <strong>Legg til konto</strong> → <strong>Andre</strong></span>
            </li>
            <li className="flex items-start">
              <span className="bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">5</span>
              <span>Velg <strong>Legg til abonnert kalender</strong></span>
            </li>
            <li className="flex items-start">
              <span className="bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">6</span>
              <span>Lim inn iCal-adressen nedenfor i <strong>Server</strong>-feltet</span>
            </li>
          </ol>
        </div>
        
        <div className="bg-muted p-4 rounded-lg flex flex-col space-y-2">
          <div className="text-sm font-medium flex items-center justify-between">
            <span>iCal-adresse:</span>
            <div className="flex space-x-2">
              <Button 
                size="sm"
                variant="outline"
                className="h-6 px-2 text-xs"
                onClick={() => copyToClipboard(icalUrl, 'iCal-adresse kopiert!')}
              >
                <Copy className="h-3 w-3 mr-1" /> Kopier
              </Button>
            </div>
          </div>
          <Input value={icalUrl} readOnly className="font-mono text-xs" />
        </div>
        
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Kalenderen vil automatisk bli oppdatert når nye bookinger legges til i appen.
          </AlertDescription>
        </Alert>
      </TabsContent>

      <TabsContent value="android" className="space-y-4 mt-4">
        <div className="mb-4">
          <h3 className="text-lg font-medium">Legg til på Android-telefon</h3>
          <ol className="mt-2 space-y-3 text-sm">
            <li className="flex items-start">
              <span className="bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">1</span>
              <span>Åpne <strong>Google Calendar</strong>-appen på telefonen din</span>
            </li>
            <li className="flex items-start">
              <span className="bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">2</span>
              <span>Trykk på menyikonet (≡) øverst til venstre</span>
            </li>
            <li className="flex items-start">
              <span className="bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">3</span>
              <span>Bla ned og trykk på <strong>Innstillinger</strong></span>
            </li>
            <li className="flex items-start">
              <span className="bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">4</span>
              <span>Velg <strong>Legg til konto</strong></span>
            </li>
            <li className="flex items-start">
              <span className="bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">5</span>
              <span>Velg <strong>Annet</strong></span>
            </li>
            <li className="flex items-start">
              <span className="bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">6</span>
              <span>Lim inn iCal-adressen nedenfor</span>
            </li>
          </ol>
          
          <p className="mt-4 text-sm">
            <strong>Alternativ metode:</strong> Du kan også åpne Google Calendar i nettleseren og legge til via lenken nedenfor.
          </p>
        </div>
        
        <div className="bg-muted p-4 rounded-lg flex flex-col space-y-2">
          <div className="text-sm font-medium flex items-center justify-between">
            <span>iCal-adresse:</span>
            <div className="flex space-x-2">
              <Button 
                size="sm"
                variant="outline"
                className="h-6 px-2 text-xs"
                onClick={() => copyToClipboard(icalUrl, 'iCal-adresse kopiert!')}
              >
                <Copy className="h-3 w-3 mr-1" /> Kopier
              </Button>
            </div>
          </div>
          <Input value={icalUrl} readOnly className="font-mono text-xs" />
        </div>
        
        <div className="bg-muted p-4 rounded-lg flex flex-col space-y-2">
          <div className="text-sm font-medium flex items-center justify-between">
            <span>Google Calendar direkte:</span>
            <div className="flex space-x-2">
              <Button 
                size="sm"
                variant="outline"
                className="h-6 px-2 text-xs"
                onClick={() => copyToClipboard(googleCalendarUrl, 'Google Calendar-lenke kopiert!')}
              >
                <Copy className="h-3 w-3 mr-1" /> Kopier
              </Button>
              <Button 
                size="sm"
                variant="outline"
                className="h-6 px-2 text-xs"
                onClick={() => window.open(googleCalendarUrl, '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" /> Åpne
              </Button>
            </div>
          </div>
          <Input value={googleCalendarUrl} readOnly className="font-mono text-xs" />
        </div>
      </TabsContent>

      <TabsContent value="desktop" className="space-y-4 mt-4">
        <div className="mb-4">
          <h3 className="text-lg font-medium">Legg til på PC/Mac</h3>
          <ol className="mt-2 space-y-3 text-sm">
            <li className="flex items-start">
              <span className="bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">1</span>
              <div>
                <p><strong>Google Calendar:</strong> Åpne Google Calendar i nettleseren</p>
                <p className="text-xs text-muted-foreground">Gå til <strong>+ Andre kalendere</strong> → <strong>Fra URL</strong> og lim inn iCal-adressen</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">2</span>
              <div>
                <p><strong>Microsoft Outlook:</strong> Åpne Outlook</p>
                <p className="text-xs text-muted-foreground">Gå til <strong>Kalender</strong> → <strong>Legg til kalender</strong> → <strong>Fra Internett</strong> og lim inn iCal-adressen</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">3</span>
              <div>
                <p><strong>Apple Calendar (Mac):</strong> Åpne Calendar-appen</p>
                <p className="text-xs text-muted-foreground">Gå til <strong>Fil</strong> → <strong>Ny kalenderabonnement</strong> og lim inn iCal-adressen</p>
              </div>
            </li>
          </ol>
        </div>
        
        <div className="flex space-x-4">
          <div className="flex-1 bg-muted p-4 rounded-lg space-y-2">
            <div className="text-sm font-medium flex items-center justify-between">
              <span>iCal-adresse:</span>
              <Button 
                size="sm"
                variant="outline"
                className="h-6 px-2 text-xs"
                onClick={() => copyToClipboard(icalUrl, 'iCal-adresse kopiert!')}
              >
                <Copy className="h-3 w-3 mr-1" /> Kopier
              </Button>
            </div>
            <Input value={icalUrl} readOnly className="font-mono text-xs" />
          </div>
          
          <div className="flex-1 bg-muted p-4 rounded-lg space-y-2">
            <div className="text-sm font-medium flex items-center justify-between">
              <span>Google Calendar:</span>
              <Button 
                size="sm"
                variant="outline"
                className="h-6 px-2 text-xs"
                onClick={() => window.open(googleCalendarUrl, '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" /> Åpne
              </Button>
            </div>
            <Input value={googleCalendarUrl} readOnly className="font-mono text-xs" />
          </div>
        </div>
        
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Du kan dele disse lenkene med familiemedlemmer så alle kan holde oversikt over hyttebookingene.
          </AlertDescription>
        </Alert>
      </TabsContent>
    </Tabs>
  );
};
