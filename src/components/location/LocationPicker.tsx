import React, { useState, useEffect } from 'react';
import { Search, MapPin, Plus, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface Location {
  id?: string;
  name: string;
  latitude: number;
  longitude: number;
  is_default?: boolean;
}

interface GeocodeResult {
  name: string;
  display_name: string;
  latitude: number;
  longitude: number;
  type: string;
  importance: number;
}

interface LocationPickerProps {
  currentLocation?: Location;
  onLocationSelect: (location: Location) => void;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  currentLocation,
  onLocationSelect
}) => {
  const [savedLocations, setSavedLocations] = useState<Location[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Load saved locations
  useEffect(() => {
    loadSavedLocations();
  }, []);

  const loadSavedLocations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setSavedLocations(data || []);
    } catch (error) {
      console.error('Error loading locations:', error);
      toast.error('Kunne ikke laste steder');
    } finally {
      setLoading(false);
    }
  };

  const searchLocations = async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('geocoding', {
        body: { query, limit: 5 }
      });

      if (error) throw error;
      setSearchResults(data.results || []);
    } catch (error) {
      console.error('Error searching locations:', error);
      toast.error('Kunne ikke søke etter steder');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const saveLocation = async (location: GeocodeResult) => {
    try {
      const newLocation = {
        name: location.display_name,
        latitude: location.latitude,
        longitude: location.longitude,
        is_default: false
      };

      const { data, error } = await supabase
        .from('locations')
        .insert([newLocation])
        .select()
        .single();

      if (error) throw error;

      toast.success(`${location.name} lagt til som favoritt`);
      await loadSavedLocations();
      
      // Select the newly saved location
      onLocationSelect(data);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error saving location:', error);
      toast.error('Kunne ikke lagre sted');
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await searchLocations(searchQuery);
  };

  const isCurrentLocation = (location: Location) => {
    return currentLocation && 
           Math.abs(currentLocation.latitude - location.latitude) < 0.001 &&
           Math.abs(currentLocation.longitude - location.longitude) < 0.001;
  };

  return (
    <div className="space-y-4">
      {/* Current Location */}
      {currentLocation && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Nåværende lokasjon:</span>
              <span className="text-sm">{currentLocation.name}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved Locations */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Lagrede steder</h4>
        {loading ? (
          <div className="text-sm text-muted-foreground">Laster...</div>
        ) : savedLocations.length > 0 ? (
          <div className="grid gap-2">
            {savedLocations.map((location) => (
              <Button
                key={location.id}
                variant={isCurrentLocation(location) ? "default" : "outline"}
                className="justify-start h-auto p-3"
                onClick={() => onLocationSelect(location)}
              >
                <div className="flex items-center gap-2 w-full">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <div className="text-left flex-1">
                    <div className="font-medium">{location.name}</div>
                    <div className="text-xs opacity-70">
                      {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                    </div>
                  </div>
                  {isCurrentLocation(location) && (
                    <Check className="h-4 w-4 flex-shrink-0" />
                  )}
                </div>
              </Button>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Ingen lagrede steder</div>
        )}
      </div>

      {/* Search */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Søk etter nytt sted</h4>
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="text"
            placeholder="Skriv stedsnavn (f.eks. Oslo)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={searchLoading}>
            <Search className="h-4 w-4" />
          </Button>
        </form>

        {/* Search Results */}
        {searchLoading && (
          <div className="text-sm text-muted-foreground">Søker...</div>
        )}
        
        {searchResults.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Søkeresultater:</div>
            {searchResults.map((result, index) => (
              <Card key={index} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{result.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {result.display_name}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onLocationSelect({
                          name: result.display_name,
                          latitude: result.latitude,
                          longitude: result.longitude
                        })}
                      >
                        Velg
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => saveLocation(result)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};