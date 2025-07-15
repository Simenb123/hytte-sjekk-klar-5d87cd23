import React from 'react';
import { Search, Filter, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { WineFilters } from '@/types/wine';

interface WineFiltersProps {
  filters: WineFilters;
  onFiltersChange: (filters: WineFilters) => void;
  availableLocations: string[];
}

export function WineFilters({ filters, onFiltersChange, availableLocations }: WineFiltersProps) {
  const handleFilterChange = (key: keyof WineFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      location: '',
      wine_color: '',
      rating: '',
      is_consumed: '',
      sort_by: 'created_at',
      sort_direction: 'desc',
    });
  };

  const hasActiveFilters = filters.search || filters.location || filters.wine_color || filters.rating || filters.is_consumed !== '';

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          <span className="font-medium">Filtre</span>
        </div>
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Nullstill
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Search */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Søk</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Søk etter vin..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            Lokasjon
          </label>
          <Select value={filters.location} onValueChange={(value) => handleFilterChange('location', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Alle lokasjoner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Alle lokasjoner</SelectItem>
              {availableLocations.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Wine Color */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Type</label>
          <Select value={filters.wine_color} onValueChange={(value) => handleFilterChange('wine_color', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Alle typer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Alle typer</SelectItem>
              <SelectItem value="red">Rødvin</SelectItem>
              <SelectItem value="white">Hvitvin</SelectItem>
              <SelectItem value="rosé">Rosévin</SelectItem>
              <SelectItem value="sparkling">Musserende</SelectItem>
              <SelectItem value="dessert">Dessertvin</SelectItem>
              <SelectItem value="fortified">Sterkvin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Rating */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Rating</label>
          <Select value={filters.rating} onValueChange={(value) => handleFilterChange('rating', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Alle ratings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Alle ratings</SelectItem>
              <SelectItem value="6">6 - Enestående</SelectItem>
              <SelectItem value="5">5 - Meget bra</SelectItem>
              <SelectItem value="4">4 - Bra</SelectItem>
              <SelectItem value="3">3 - Middels</SelectItem>
              <SelectItem value="2">2 - Under middels</SelectItem>
              <SelectItem value="1">1 - Dårlig</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Consumed Status */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select value={filters.is_consumed} onValueChange={(value) => handleFilterChange('is_consumed', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Alle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Alle</SelectItem>
              <SelectItem value="false">På lager</SelectItem>
              <SelectItem value="true">Drukket</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sort */}
      <div className="flex gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Sorter etter</label>
          <Select value={filters.sort_by} onValueChange={(value) => handleFilterChange('sort_by', value as any)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Navn</SelectItem>
              <SelectItem value="created_at">Lagt til</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="current_price">Pris</SelectItem>
              <SelectItem value="purchase_date">Kjøpsdato</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Retning</label>
          <Select value={filters.sort_direction} onValueChange={(value) => handleFilterChange('sort_direction', value as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Stigende</SelectItem>
              <SelectItem value="desc">Synkende</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}