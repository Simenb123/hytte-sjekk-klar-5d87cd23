import React from 'react';
import { Wine, MapPin, TrendingUp, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { WineCellarItem } from '@/types/wine';

interface WineStatsProps {
  wines: WineCellarItem[];
}

export function WineStats({ wines }: WineStatsProps) {
  const stats = React.useMemo(() => {
    const totalBottles = wines.reduce((sum, wine) => sum + wine.bottle_count, 0);
    const totalValue = wines.reduce((sum, wine) => {
      const value = wine.current_price || 0;
      return sum + (value * wine.bottle_count);
    }, 0);
    
    const locationStats = wines.reduce((acc, wine) => {
      const location = wine.location;
      if (!acc[location]) {
        acc[location] = { bottles: 0, value: 0, count: 0 };
      }
      acc[location].bottles += wine.bottle_count;
      acc[location].value += (wine.current_price || 0) * wine.bottle_count;
      acc[location].count += 1;
      return acc;
    }, {} as Record<string, { bottles: number; value: number; count: number }>);

    const colorStats = wines.reduce((acc, wine) => {
      const color = wine.wine_color || 'ukjent';
      acc[color] = (acc[color] || 0) + wine.bottle_count;
      return acc;
    }, {} as Record<string, number>);

    const averageRating = wines.filter(w => w.rating).reduce((sum, wine, _, arr) => {
      return sum + (wine.rating || 0) / arr.length;
    }, 0);

    const consumedCount = wines.filter(w => w.is_consumed).length;
    const consumedBottles = wines.filter(w => w.is_consumed).reduce((sum, wine) => sum + wine.bottle_count, 0);

    return {
      totalBottles,
      totalValue,
      totalWines: wines.length,
      locationStats,
      colorStats,
      averageRating,
      consumedCount,
      consumedBottles,
    };
  }, [wines]);

  const colorLabels = {
    red: 'Rødvin',
    white: 'Hvitvin',
    rosé: 'Rosévin',
    sparkling: 'Musserende',
    dessert: 'Dessertvin',
    fortified: 'Sterkvin',
    ukjent: 'Ukjent type',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Wine className="w-4 h-4" />
            Totalt i vinlageret
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalBottles}</div>
          <p className="text-xs text-muted-foreground">
            {stats.totalWines} {stats.totalWines === 1 ? 'vin' : 'viner'}
          </p>
          {stats.totalValue > 0 && (
            <p className="text-xs text-muted-foreground">
              Verdi: {Math.round(stats.totalValue).toLocaleString('no-NO')} kr
            </p>
          )}
        </CardContent>
      </Card>

      {/* Location Stats */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Lokasjoner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {Object.entries(stats.locationStats)
              .sort(([,a], [,b]) => b.bottles - a.bottles)
              .slice(0, 3)
              .map(([location, data]) => (
                <div key={location} className="flex justify-between text-xs">
                  <span className="truncate">{location}</span>
                  <span>{data.bottles} fl.</span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Rating */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Star className="w-4 h-4" />
            Gjennomsnittlig rating
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '-'}
          </div>
          <p className="text-xs text-muted-foreground">av 6</p>
        </CardContent>
      </Card>

      {/* Consumed */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Drukket
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.consumedBottles}</div>
          <p className="text-xs text-muted-foreground">
            {stats.consumedCount} {stats.consumedCount === 1 ? 'vin' : 'viner'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}