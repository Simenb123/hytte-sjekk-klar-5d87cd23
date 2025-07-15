import React, { useState } from 'react';
import { Calendar, Wine, Heart, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWineCellar } from '@/hooks/useWineCellar';
import type { WineCellarItem } from '@/types/wine';

interface ConsumptionTrackerProps {
  wine: WineCellarItem;
  trigger?: React.ReactNode;
}

export function ConsumptionTracker({ wine, trigger }: ConsumptionTrackerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [consumedDate, setConsumedDate] = useState(new Date().toISOString().split('T')[0]);
  const [consumedWith, setConsumedWith] = useState('');
  const [occasion, setOccasion] = useState('');
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState<number | undefined>(wine.rating);
  
  const { updateWine } = useWineCellar();

  const handleMarkAsConsumed = () => {
    updateWine({
      id: wine.id,
      is_consumed: true,
      consumed_date: consumedDate,
      consumed_with: consumedWith || undefined,
      tasting_notes: notes || wine.tasting_notes,
      rating: rating || wine.rating,
    });
    setIsOpen(false);
  };

  const handleUnmarkAsConsumed = () => {
    updateWine({
      id: wine.id,
      is_consumed: false,
      consumed_date: undefined,
      consumed_with: undefined,
    });
    setIsOpen(false);
  };

  const occasionOptions = [
    'Middag hjemme',
    'Restaurant',
    'Fest/feiring',
    'Romantisk kveld',
    'Venner på besøk',
    'Helg på hytta',
    'Spesiell anledning',
    'Vinsmaking',
    'Annet'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Wine className="w-4 h-4" />
            {wine.is_consumed ? 'Rediger drukket' : 'Marker som drukket'}
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {wine.is_consumed ? 'Rediger konsumering' : 'Marker som drukket'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <strong>{wine.name}</strong>
            {wine.vintage && ` ${wine.vintage}`}
          </div>

          {!wine.is_consumed && (
            <>
              {/* Date */}
              <div>
                <Label htmlFor="consumed-date">Dato drukket</Label>
                <Input
                  id="consumed-date"
                  type="date"
                  value={consumedDate}
                  onChange={(e) => setConsumedDate(e.target.value)}
                />
              </div>

              {/* Occasion */}
              <div>
                <Label htmlFor="occasion">Anledning</Label>
                <Select value={occasion} onValueChange={setOccasion}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg anledning (valgfritt)" />
                  </SelectTrigger>
                  <SelectContent>
                    {occasionOptions.map(option => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Consumed with */}
              <div>
                <Label htmlFor="consumed-with">Drukket sammen med</Label>
                <Input
                  id="consumed-with"
                  placeholder="Hvem var du sammen med? (valgfritt)"
                  value={consumedWith}
                  onChange={(e) => setConsumedWith(e.target.value)}
                />
              </div>

              {/* Rating */}
              <div>
                <Label htmlFor="rating">Gi rating (1-6)</Label>
                <Select value={rating?.toString()} onValueChange={(value) => setRating(Number(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg rating (valgfritt)" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} - {num === 1 ? 'Dårlig' : num === 2 ? 'Ikke bra' : num === 3 ? 'OK' : num === 4 ? 'Bra' : num === 5 ? 'Meget bra' : 'Utmerket'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Smaksnotater</Label>
                <Textarea
                  id="notes"
                  placeholder="Beskriv smak, duft, opplevelse... (valgfritt)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
              Avbryt
            </Button>
            {wine.is_consumed ? (
              <Button onClick={handleUnmarkAsConsumed} variant="outline" className="flex-1">
                Marker som ikke drukket
              </Button>
            ) : (
              <Button onClick={handleMarkAsConsumed} className="flex-1">
                <Wine className="w-4 h-4 mr-2" />
                Marker som drukket
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}