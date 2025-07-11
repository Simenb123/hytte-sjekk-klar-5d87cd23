
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MobileCalendarGuide } from './MobileCalendarGuide';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { GoogleOAuthTokens } from '@/types/googleCalendar.types';

interface CalendarExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  googleTokens: GoogleOAuthTokens | null;
}

export const CalendarExportDialog: React.FC<CalendarExportDialogProps> = ({
  open,
  onOpenChange,
  googleTokens
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [calendarLinks, setCalendarLinks] = useState<{
    googleCalendarUrl: string;
    icalUrl: string;
  } | null>(null);
  
  useEffect(() => {
    const fetchCalendarLinks = async () => {
      if (!open || !googleTokens) return;
      
      setIsLoading(true);
      
      try {
        // Sjekk først om det allerede eksisterer en hytte-kalender
        const { data, error } = await supabase.functions.invoke('google-calendar', {
          method: 'POST',
          body: { 
            action: 'setup_shared_calendar',
            tokens: googleTokens,
            calendar: {
              name: 'Hytte Booking'
            }
          }
        });
        
        if (error) throw error;
        if (data.error) throw new Error(data.error);
        
        if (data.sharingLinks) {
          setCalendarLinks(data.sharingLinks);
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('Error fetching calendar links:', err);
        toast.error(`Kunne ikke hente kalenderlenker: ${err.message || 'Ukjent feil'}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCalendarLinks();
  }, [open, googleTokens]);
  
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Legg til hytte-kalenderen på din telefon</DialogTitle>
          <DialogDescription>
            Følg instruksjonene under for å legge til hytte-kalenderen på din enhet
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Henter kalenderinformasjon...</span>
          </div>
        ) : calendarLinks ? (
          <MobileCalendarGuide 
            googleCalendarUrl={calendarLinks.googleCalendarUrl}
            icalUrl={calendarLinks.icalUrl}
          />
        ) : (
          <div className="py-4 text-center">
            <p className="text-red-500">
              Kunne ikke hente kalenderlenker. Prøv å opprette en delt kalender først.
            </p>
          </div>
        )}
        
        <DialogFooter>
          <Button 
            onClick={() => onOpenChange(false)}
            className="w-full mt-4"
          >
            Lukk
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
