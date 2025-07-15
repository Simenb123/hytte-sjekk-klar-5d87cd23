import React from 'react';
import { Wine, MapPin, Star, Calendar, Trash2, Edit, CheckCircle, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WineDialog } from './WineDialog';
import { ConsumptionTracker } from './ConsumptionTracker';
import { useWineCellar } from '@/hooks/useWineCellar';
import type { WineCellarItem } from '@/types/wine';

interface WineListProps {
  wines: WineCellarItem[];
}

export function WineList({ wines }: WineListProps) {
  const { updateWine, deleteWine } = useWineCellar();

  const getWineColorBadge = (color?: string) => {
    const colorMap = {
      red: { label: 'Rødvin', className: 'bg-red-100 text-red-800' },
      white: { label: 'Hvitvin', className: 'bg-yellow-100 text-yellow-800' },
      rosé: { label: 'Rosévin', className: 'bg-pink-100 text-pink-800' },
      sparkling: { label: 'Musserende', className: 'bg-blue-100 text-blue-800' },
      dessert: { label: 'Dessertvin', className: 'bg-purple-100 text-purple-800' },
      fortified: { label: 'Sterkvin', className: 'bg-orange-100 text-orange-800' },
    };

    if (!color || !colorMap[color as keyof typeof colorMap]) return null;

    const { label, className } = colorMap[color as keyof typeof colorMap];
    return <Badge className={className}>{label}</Badge>;
  };

  const handleMarkAsConsumed = (wine: WineCellarItem) => {
    updateWine({
      id: wine.id,
      is_consumed: !wine.is_consumed,
      consumed_date: !wine.is_consumed ? new Date().toISOString().split('T')[0] : undefined,
    });
  };

  const handleMoveWine = (wine: WineCellarItem, newLocation: string) => {
    updateWine({ id: wine.id, location: newLocation });
  };

  if (wines.length === 0) {
    return (
      <div className="text-center py-12">
        <Wine className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Ingen viner i lageret</h3>
        <p className="text-muted-foreground mb-4">Begynn å bygge ditt vinlager!</p>
        <WineDialog />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {wines.map((wine) => (
        <Card key={wine.id} className={`relative ${wine.is_consumed ? 'opacity-60' : ''}`}>
          {wine.is_consumed && (
            <div className="absolute top-2 right-2 z-10">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Drukket
              </Badge>
            </div>
          )}
          
          {wine.image_url && (
            <div className="h-48 overflow-hidden rounded-t-lg">
              <img 
                src={wine.image_url} 
                alt={wine.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg leading-tight">{wine.name}</h3>
                {wine.vintage && (
                  <p className="text-sm text-muted-foreground">{wine.vintage}</p>
                )}
                {wine.producer && (
                  <p className="text-sm text-muted-foreground">{wine.producer}</p>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              {getWineColorBadge(wine.wine_color)}
              {wine.rating && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  {wine.rating}/6
                </Badge>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                {wine.location}
              </div>
              <div className="font-medium">
                {wine.bottle_count} {wine.bottle_count === 1 ? 'flaske' : 'flasker'}
              </div>
            </div>
            
            {wine.current_price && (
              <div className="text-sm">
                <span className="font-medium">{wine.current_price} kr</span>
              </div>
            )}
            
            {wine.grape_variety && (
              <div className="text-sm text-muted-foreground">
                <strong>Druesort:</strong> {wine.grape_variety}
              </div>
            )}
            
            {wine.tasting_notes && (
              <div className="text-sm text-muted-foreground">
                <strong>Smaksnotater:</strong> {wine.tasting_notes}
              </div>
            )}
            
            {wine.consumed_date && (
              <div className="flex items-center gap-1 text-sm text-green-600">
                <Calendar className="w-4 h-4" />
                Drukket {new Date(wine.consumed_date).toLocaleDateString('no-NO')}
              </div>
            )}
            
            <div className="flex justify-between items-center pt-2 border-t">
              <div className="flex gap-1">
                <ConsumptionTracker 
                  wine={wine}
                  trigger={
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      {wine.is_consumed ? <CheckCircle className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                      {wine.is_consumed ? 'Drukket' : 'Drikk'}
                    </Button>
                  }
                />
              </div>
              
              <div className="flex gap-1">
                <WineDialog 
                  wine={wine}
                  trigger={
                    <Button size="sm" variant="outline">
                      <Edit className="w-3 h-3" />
                    </Button>
                  }
                />
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => deleteWine(wine.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}