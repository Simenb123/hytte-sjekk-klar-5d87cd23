import React, { useState } from 'react';
import { MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useWineCellar } from '@/hooks/useWineCellar';
import type { WineCellarItem } from '@/types/wine';

interface BulkLocationMoveProps {
  wines: WineCellarItem[];
  availableLocations: string[];
}

export function BulkLocationMove({ wines, availableLocations }: BulkLocationMoveProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedWines, setSelectedWines] = useState<string[]>([]);
  const [targetLocation, setTargetLocation] = useState<string>('');
  const { updateWine } = useWineCellar();

  const handleWineSelection = (wineId: string, checked: boolean) => {
    if (checked) {
      setSelectedWines(prev => [...prev, wineId]);
    } else {
      setSelectedWines(prev => prev.filter(id => id !== wineId));
    }
  };

  const handleSelectAll = (checked: string | boolean) => {
    if (checked) {
      setSelectedWines(wines.map(w => w.id));
    } else {
      setSelectedWines([]);
    }
  };

  const handleMoveWines = () => {
    if (!targetLocation || selectedWines.length === 0) return;

    selectedWines.forEach(wineId => {
      updateWine({ id: wineId, location: targetLocation });
    });

    setSelectedWines([]);
    setTargetLocation('');
    setIsOpen(false);
  };

  const selectedWineDetails = wines.filter(w => selectedWines.includes(w.id));
  const totalBottles = selectedWineDetails.reduce((sum, wine) => sum + wine.bottle_count, 0);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Flytt viner
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Flytt viner mellom lokasjoner</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Wine Selection */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Checkbox
                id="select-all"
                checked={selectedWines.length === wines.length}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="select-all" className="font-medium">
                Velg alle ({wines.length} viner)
              </Label>
            </div>
            
            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto border rounded-md p-3">
              {wines.map(wine => (
                <div key={wine.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={wine.id}
                    checked={selectedWines.includes(wine.id)}
                    onCheckedChange={(checked) => handleWineSelection(wine.id, !!checked)}
                  />
                  <Label htmlFor={wine.id} className="flex-1 text-sm cursor-pointer">
                    <div className="flex justify-between items-center">
                      <span>{wine.name} {wine.vintage && `(${wine.vintage})`}</span>
                      <div className="text-xs text-muted-foreground">
                        {wine.location} • {wine.bottle_count} fl.
                      </div>
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          {selectedWines.length > 0 && (
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm font-medium">
                Valgt: {selectedWines.length} viner ({totalBottles} flasker)
              </p>
            </div>
          )}

          {/* Target Location */}
          <div>
            <Label htmlFor="target-location" className="text-sm font-medium">
              Flytt til lokasjon:
            </Label>
            <Select value={targetLocation} onValueChange={setTargetLocation}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Velg ny lokasjon" />
              </SelectTrigger>
              <SelectContent>
                {availableLocations.map(location => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
                <SelectItem value="Ny lokasjon">+ Legg til ny lokasjon</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Avbryt
            </Button>
            <Button 
              onClick={handleMoveWines}
              disabled={selectedWines.length === 0 || !targetLocation}
              className="flex items-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              Flytt {selectedWines.length} viner
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}