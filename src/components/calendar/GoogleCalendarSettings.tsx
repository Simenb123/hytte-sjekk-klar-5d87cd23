import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, RefreshCw } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useGoogleCalendar } from '@/contexts/GoogleCalendarContext';

interface CalendarSettings {
  selectedCalendars: string[];
  filterWeekEvents: boolean;
  filterHolidays: boolean;
}

const DEFAULT_SETTINGS: CalendarSettings = {
  selectedCalendars: [],
  filterWeekEvents: true,
  filterHolidays: false,
};

export const GoogleCalendarSettings: React.FC = () => {
  const { googleCalendars, fetchGoogleCalendars, fetchGoogleEvents } = useGoogleCalendar();
  const [settings, setSettings] = useState<CalendarSettings>(DEFAULT_SETTINGS);
  const [isOpen, setIsOpen] = useState(false);

  // Load settings from localStorage and ensure filters are initialized
  useEffect(() => {
    const savedSettings = localStorage.getItem('googleCalendarSettings');
    let loadedSettings = DEFAULT_SETTINGS;
    
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        loadedSettings = { ...DEFAULT_SETTINGS, ...parsed };
      } catch (error) {
        console.error('Error parsing saved calendar settings:', error);
      }
    }
    
    setSettings(loadedSettings);
    
    // Ensure googleCalendarFilters is initialized in localStorage
    localStorage.setItem('googleCalendarFilters', JSON.stringify({
      selectedCalendars: loadedSettings.selectedCalendars,
      filterWeekEvents: loadedSettings.filterWeekEvents,
      filterHolidays: loadedSettings.filterHolidays,
    }));
  }, []);

  // Save settings to localStorage and apply them
  const updateSettings = (newSettings: CalendarSettings) => {
    setSettings(newSettings);
    localStorage.setItem('googleCalendarSettings', JSON.stringify(newSettings));
    
    // Store settings for the Edge Function to use
    localStorage.setItem('googleCalendarFilters', JSON.stringify({
      selectedCalendars: newSettings.selectedCalendars,
      filterWeekEvents: newSettings.filterWeekEvents,
      filterHolidays: newSettings.filterHolidays,
    }));
    
    // Refresh events with new settings
    fetchGoogleEvents();
  };

  const handleCalendarToggle = (calendarId: string, enabled: boolean) => {
    const newSelectedCalendars = enabled
      ? [...settings.selectedCalendars, calendarId]
      : settings.selectedCalendars.filter(id => id !== calendarId);
    
    updateSettings({
      ...settings,
      selectedCalendars: newSelectedCalendars,
    });
  };

  const handleSelectAll = () => {
    updateSettings({
      ...settings,
      selectedCalendars: googleCalendars.map(cal => cal.id),
    });
  };

  const handleDeselectAll = () => {
    updateSettings({
      ...settings,
      selectedCalendars: [],
    });
  };

  const isCalendarSelected = (calendarId: string) => {
    return settings.selectedCalendars.includes(calendarId);
  };

  // Auto-select all calendars when they're first loaded, except week calendars
  useEffect(() => {
    if (googleCalendars.length > 0 && settings.selectedCalendars.length === 0) {
      const filteredCalendars = googleCalendars
        .filter(cal => {
          const name = cal.summary.toLowerCase();
          // Filter out obvious week calendars
          return !name.includes('uke') && 
                 !name.includes('week') && 
                 !name.includes('ukenr') &&
                 !name.includes('kalenderwoche');
        })
        .map(cal => cal.id);
      
      updateSettings({
        ...settings,
        selectedCalendars: filteredCalendars,
      });
    }
  }, [googleCalendars, settings.selectedCalendars.length]);

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                <span>Kalenderinnstillinger</span>
              </div>
              <Badge variant="outline">
                {settings.selectedCalendars.length} valgt
              </Badge>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Filter Options */}
            <div className="space-y-4">
              <h4 className="font-medium">Automatisk filtrering</h4>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="filter-weeks" className="flex flex-col gap-1">
                  <span>Filtrer bort ukehendelser</span>
                  <span className="text-sm text-muted-foreground">
                    Skjuler hendelser som "Uke 33 i 2025"
                  </span>
                </Label>
                <Switch
                  id="filter-weeks"
                  checked={settings.filterWeekEvents}
                  onCheckedChange={(checked) => 
                    updateSettings({ ...settings, filterWeekEvents: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="filter-holidays" className="flex flex-col gap-1">
                  <span>Filtrer bort helligdager</span>
                  <span className="text-sm text-muted-foreground">
                    Skjuler offentlige helligdager og ferier
                  </span>
                </Label>
                <Switch
                  id="filter-holidays"
                  checked={settings.filterHolidays}
                  onCheckedChange={(checked) => 
                    updateSettings({ ...settings, filterHolidays: checked })
                  }
                />
              </div>
            </div>

            {/* Calendar Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Velg kalendere</h4>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    disabled={settings.selectedCalendars.length === googleCalendars.length}
                  >
                    Velg alle
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeselectAll}
                    disabled={settings.selectedCalendars.length === 0}
                  >
                    Fjern alle
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchGoogleCalendars}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {googleCalendars.map((calendar) => {
                  const isWeekCalendar = calendar.summary.toLowerCase().includes('uke') ||
                                       calendar.summary.toLowerCase().includes('week');
                  
                  return (
                    <div key={calendar.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{calendar.summary}</span>
                          {calendar.primary && (
                            <Badge variant="secondary" className="text-xs">Primær</Badge>
                          )}
                          {isWeekCalendar && (
                            <Badge variant="outline" className="text-xs">Ukekalender</Badge>
                          )}
                        </div>
                        {calendar.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {calendar.description}
                          </p>
                        )}
                      </div>
                      
                      <Switch
                        checked={isCalendarSelected(calendar.id)}
                        onCheckedChange={(checked) => handleCalendarToggle(calendar.id, checked)}
                      />
                    </div>
                  );
                })}
              </div>
              
              {googleCalendars.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  Ingen kalendere funnet. Trykk på oppdater-knappen for å laste kalendere.
                </p>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};