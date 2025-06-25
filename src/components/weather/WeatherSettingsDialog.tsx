import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WeatherLocation } from '@/types/weather';

interface WeatherSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: WeatherLocation;
  onSave: (loc: WeatherLocation) => void;
}

const presetLocations: WeatherLocation[] = [
  { name: 'Gaustablikk, Tinn', lat: 59.8726, lon: 8.6475 },
  { name: 'Oslo', lat: 59.9139, lon: 10.7522 },
  { name: 'Bergen', lat: 60.39299, lon: 5.32415 },
];

export const WeatherSettingsDialog: React.FC<WeatherSettingsDialogProps> = ({ open, onOpenChange, location, onSave }) => {
  const [selected, setSelected] = useState<string>(location.name);
  const [lat, setLat] = useState(location.lat.toString());
  const [lon, setLon] = useState(location.lon.toString());

  useEffect(() => {
    setSelected(location.name);
    setLat(location.lat.toString());
    setLon(location.lon.toString());
  }, [location]);

  const handleSave = () => {
    let loc: WeatherLocation;
    const preset = presetLocations.find((p) => p.name === selected);
    if (preset) {
      loc = preset;
    } else {
      loc = { name: selected || 'Custom', lat: parseFloat(lat), lon: parseFloat(lon) };
    }
    onSave(loc);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Velg sted</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger>
                <SelectValue placeholder="Velg sted" />
              </SelectTrigger>
              <SelectContent>
                {presetLocations.map((loc) => (
                  <SelectItem key={loc.name} value={loc.name}>
                    {loc.name}
                  </SelectItem>
                ))}
                <SelectItem value="Custom">Egendefinert</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {selected === 'Custom' && (
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Lat" value={lat} onChange={(e) => setLat(e.target.value)} />
              <Input placeholder="Lon" value={lon} onChange={(e) => setLon(e.target.value)} />
            </div>
          )}
          <Button onClick={handleSave} className="w-full">
            Lagre
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
