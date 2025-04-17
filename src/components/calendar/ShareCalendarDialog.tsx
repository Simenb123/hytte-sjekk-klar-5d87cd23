
import React, { useState } from 'react';
import { X, Copy, Share, Mail, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ShareCalendarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  googleTokens: any;
  onSuccess?: () => void;
}

export const ShareCalendarDialog: React.FC<ShareCalendarDialogProps> = ({
  open,
  onOpenChange,
  googleTokens,
  onSuccess
}) => {
  const [calendarName, setCalendarName] = useState('Hytte Booking');
  const [familyEmails, setFamilyEmails] = useState<string[]>(['']);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sharingLinks, setSharingLinks] = useState<{googleCalendarUrl?: string, icalUrl?: string}>({});
  const [activeTab, setActiveTab] = useState('setup');
  const [setupComplete, setSetupComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddEmail = () => {
    setFamilyEmails([...familyEmails, '']);
  };

  const handleRemoveEmail = (index: number) => {
    const newEmails = [...familyEmails];
    newEmails.splice(index, 1);
    setFamilyEmails(newEmails);
  };

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...familyEmails];
    newEmails[index] = value;
    setFamilyEmails(newEmails);
  };

  const handleCopyLink = (link: string, type: 'Google Calendar' | 'iCal') => {
    navigator.clipboard.writeText(link);
    toast.success(`${type}-lenke kopiert til utklippstavlen`);
  };

  const validateEmails = () => {
    // Fjern tomme e-poster
    const validEmails = familyEmails.filter(email => email.trim() !== '');
    
    // Enkel e-postvalidering
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = validEmails.filter(email => !emailPattern.test(email));
    
    if (invalidEmails.length > 0) {
      setError(`Følgende e-postadresser er ikke gyldige: ${invalidEmails.join(', ')}`);
      return false;
    }
    
    setFamilyEmails(validEmails);
    setError(null);
    return true;
  };

  const setupSharedCalendar = async () => {
    if (!validateEmails()) return;
    if (!googleTokens) {
      toast.error('Du må være koblet til Google Calendar');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Filtrer ut tomme e-poster
      const validEmails = familyEmails.filter(email => email.trim() !== '');
      
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        method: 'POST',
        body: { 
          action: 'setup_shared_calendar',
          tokens: googleTokens,
          calendar: {
            name: calendarName,
            shareWith: validEmails
          }
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      if (data?.sharingLinks) {
        setSharingLinks(data.sharingLinks);
        setActiveTab('share');
        setSetupComplete(true);
        toast.success('Hytte-kalenderen er opprettet og delt!');
        
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error: any) {
      console.error('Error setting up shared calendar:', error);
      setError(`Kunne ikke sette opp delt kalender: ${error.message}`);
      toast.error('Kunne ikke sette opp delt kalender');
    } finally {
      setIsProcessing(false);
    }
  };

  const sendEmailInvitation = () => {
    // Åpne e-postklient med forhåndsutfylt melding
    const subject = encodeURIComponent('Invitasjon til Hytte-kalenderen');
    const body = encodeURIComponent(
      `Hei!\n\nJeg vil gjerne dele vår felles hytte-kalender med deg.\n\n` +
      `Du kan legge til kalenderen i Google Calendar her:\n${sharingLinks.googleCalendarUrl}\n\n` +
      `Hvis du bruker en annen kalender-app, kan du importere denne iCal-lenken:\n${sharingLinks.icalUrl}\n\n` +
      `Hilsen`
    );
    
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Del hytte-kalenderen med familien</DialogTitle>
          <DialogDescription>
            Sett opp en delt Google-kalender for hytta som alle i familien kan se og bruke.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs 
          value={activeTab} 
          onValueChange={setupComplete ? setActiveTab : undefined} 
          className="mt-4"
        >
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="setup" disabled={activeTab === 'share' && !setupComplete}>
              Oppsett
            </TabsTrigger>
            <TabsTrigger value="share" disabled={!setupComplete}>
              Del kalender
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="setup" className="space-y-4 mt-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="calendar-name">Navn på kalenderen</Label>
              <Input 
                id="calendar-name" 
                value={calendarName} 
                onChange={(e) => setCalendarName(e.target.value)}
                placeholder="F.eks. Hytte Booking" 
              />
            </div>
            
            <div className="space-y-2">
              <Label>Del med familiemedlemmer (valgfritt)</Label>
              <p className="text-sm text-gray-500 mb-2">
                Legg til e-postadressene til familiemedlemmer som skal ha tilgang til hytte-kalenderen.
              </p>
              
              {familyEmails.map((email, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <Input 
                    value={email} 
                    onChange={(e) => handleEmailChange(index, e.target.value)}
                    placeholder="familie@example.com"
                    type="email"
                  />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => handleRemoveEmail(index)}
                    disabled={familyEmails.length === 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleAddEmail}
                className="mt-2"
              >
                Legg til e-post
              </Button>
            </div>
            
            <DialogFooter className="mt-6">
              <Button 
                onClick={setupSharedCalendar} 
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? 'Setter opp kalender...' : 'Opprett felles hytte-kalender'}
              </Button>
            </DialogFooter>
          </TabsContent>
          
          <TabsContent value="share" className="space-y-4 mt-4">
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
              <h3 className="font-medium text-green-800 mb-2">Hytte-kalenderen er klar!</h3>
              <p className="text-sm text-green-700">
                Kalenderen "{calendarName}" er nå opprettet og delt med de angitte e-postadressene.
                Du kan dele den med flere ved å bruke lenkene nedenfor.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="border rounded-md p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium flex items-center">
                    <Calendar className="h-4 w-4 mr-2" /> Google Calendar
                  </h3>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleCopyLink(sharingLinks.googleCalendarUrl || '', 'Google Calendar')}
                    >
                      <Copy className="h-3 w-3 mr-1" /> Kopier
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open(sharingLinks.googleCalendarUrl, '_blank')}
                    >
                      <Share className="h-3 w-3 mr-1" /> Åpne
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 break-all">
                  {sharingLinks.googleCalendarUrl}
                </p>
              </div>
              
              <div className="border rounded-md p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium flex items-center">
                    <Calendar className="h-4 w-4 mr-2" /> iCal for andre kalender-apper
                  </h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleCopyLink(sharingLinks.icalUrl || '', 'iCal')}
                  >
                    <Copy className="h-3 w-3 mr-1" /> Kopier
                  </Button>
                </div>
                <p className="text-xs text-gray-500 break-all">
                  {sharingLinks.icalUrl}
                </p>
              </div>
            </div>
            
            <div className="mt-6">
              <Button 
                onClick={sendEmailInvitation}
                className="w-full"
                variant="outline"
              >
                <Mail className="h-4 w-4 mr-2" />
                Send invitasjon på e-post
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
