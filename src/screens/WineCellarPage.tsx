import React, { useState, useMemo } from 'react';
import { Wine, Plus } from 'lucide-react';
import Layout from '@/layout/Layout';
import { WineDialog } from '@/components/wine/WineDialog';
import { WineList } from '@/components/wine/WineList';
import { WineFilters } from '@/components/wine/WineFilters';
import { WineStats } from '@/components/wine/WineStats';
import { useWineCellar } from '@/hooks/useWineCellar';
import { Button } from '@/components/ui/button';
import type { WineFilters as WineFiltersType } from '@/types/wine';

export default function WineCellarPage() {
  const { wines, isLoading, error } = useWineCellar();
  const [filters, setFilters] = useState<WineFiltersType>({
    search: '',
    location: 'all',
    wine_color: 'all',
    rating: 'all',
    is_consumed: 'all',
    sort_by: 'created_at',
    sort_direction: 'desc',
  });

  const availableLocations = useMemo(() => {
    const locations = wines.map(wine => wine.location);
    return Array.from(new Set(locations)).sort();
  }, [wines]);

  const filteredAndSortedWines = useMemo(() => {
    let filtered = wines.filter(wine => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          wine.name.toLowerCase().includes(searchLower) ||
          wine.producer?.toLowerCase().includes(searchLower) ||
          wine.grape_variety?.toLowerCase().includes(searchLower) ||
          wine.vintage?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Location filter
      if (filters.location && filters.location !== 'all' && wine.location !== filters.location) {
        return false;
      }

      // Wine color filter
      if (filters.wine_color && filters.wine_color !== 'all' && wine.wine_color !== filters.wine_color) {
        return false;
      }

      // Rating filter
      if (filters.rating && filters.rating !== 'all' && wine.rating?.toString() !== filters.rating) {
        return false;
      }

      // Consumed status filter
      if (filters.is_consumed !== 'all' && filters.is_consumed !== '') {
        const isConsumed = filters.is_consumed === 'true';
        if (wine.is_consumed !== isConsumed) {
          return false;
        }
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (filters.sort_by) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'rating':
          aValue = a.rating || 0;
          bValue = b.rating || 0;
          break;
        case 'current_price':
          aValue = a.current_price || 0;
          bValue = b.current_price || 0;
          break;
        case 'purchase_date':
          aValue = a.purchase_date ? new Date(a.purchase_date) : new Date(0);
          bValue = b.purchase_date ? new Date(b.purchase_date) : new Date(0);
          break;
        case 'created_at':
        default:
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
      }

      if (filters.sort_direction === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [wines, filters]);

  if (isLoading) {
    return (
      <Layout title="Vinlager">
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Laster vinlager...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Vinlager">
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-destructive mb-4">Feil ved lasting av vinlager</p>
          <Button onClick={() => window.location.reload()}>Prøv igjen</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Vinlager">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Wine className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Vinlager</h1>
              <p className="text-muted-foreground">
                Oversikt over ditt personlige vinlager
              </p>
            </div>
          </div>
          <WineDialog 
            trigger={
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Legg til vin
              </Button>
            }
          />
        </div>

        <WineStats wines={wines} />

        <WineFilters
          filters={filters}
          onFiltersChange={setFilters}
          availableLocations={availableLocations}
        />

        <div className="mt-6">
          <WineList wines={filteredAndSortedWines} />
        </div>
      </div>
    </Layout>
  );
}