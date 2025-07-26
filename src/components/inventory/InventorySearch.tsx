
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface InventorySearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  familyMemberId: string;
  onFamilyMemberChange: (value: string) => void;
  primaryLocation: string;
  onPrimaryLocationChange: (value: string) => void;
  familyMembers: Array<{ id: string; name: string; nickname?: string }>;
  resultCount: number;
  showFilters: boolean;
  onToggleFilters: () => void;
  sortKey: string;
  onSortKeyChange: (value: string) => void;
  sortDirection: string;
  onSortDirectionChange: (value: string) => void;
}

export function InventorySearch({
  searchTerm,
  onSearchChange,
  category,
  onCategoryChange,
  familyMemberId,
  onFamilyMemberChange,
  primaryLocation,
  onPrimaryLocationChange,
  familyMembers,
  resultCount,
  showFilters,
  onToggleFilters,
  sortKey,
  onSortKeyChange,
  sortDirection,
  onSortDirectionChange
}: InventorySearchProps) {
  const categories = [
    'Klær', 'Langrennski', 'Langrennstaver', 'Alpint', 'Verktøy', 
    'Kjøkkenutstyr', 'Møbler', 'Elektronikk', 'Sport', 'Annet'
  ];

  const activeFiltersCount = [
    category !== 'all' ? 1 : 0,
    familyMemberId !== 'all' ? 1 : 0,
    primaryLocation !== 'all' ? 1 : 0
  ].reduce((sum, val) => sum + val, 0);

  const clearFilters = () => {
    onCategoryChange('all');
    onFamilyMemberChange('all');
    onPrimaryLocationChange('all');
    onSearchChange('');
  };

  return (
    <div className="space-y-4">
      {/* Search bar on its own row */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Søk etter navn, beskrivelse, merke..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSearchChange('')}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Sort and filter controls on second row */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex gap-2 flex-1 min-w-0">
          <Select value={sortKey} onValueChange={onSortKeyChange}>
            <SelectTrigger className="w-[140px]">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Navn</SelectItem>
              <SelectItem value="created_at">Opprettet</SelectItem>
              <SelectItem value="category">Kategori</SelectItem>
              <SelectItem value="brand">Merke</SelectItem>
              <SelectItem value="primary_location">Lokasjon</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortDirection} onValueChange={onSortDirectionChange}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">A-Å</SelectItem>
              <SelectItem value="desc">Å-A</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleFilters}
          className="gap-2 flex-shrink-0"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filter
          {activeFiltersCount > 0 && (
            <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs rounded-full">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border">
          <div>
            <label className="text-sm font-medium mb-2 block">Kategori</label>
            <Select value={category} onValueChange={onCategoryChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle kategorier</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Eier</label>
            <Select value={familyMemberId} onValueChange={onFamilyMemberChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="none">Ingen eier</SelectItem>
                {familyMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name} {member.nickname ? `(${member.nickname})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Lokasjon</label>
            <Select value={primaryLocation} onValueChange={onPrimaryLocationChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle lokasjoner</SelectItem>
                <SelectItem value="hjemme">Hjemme</SelectItem>
                <SelectItem value="hytta">På hytta</SelectItem>
                <SelectItem value="reiser">På reise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button 
              variant="outline" 
              onClick={clearFilters}
              disabled={activeFiltersCount === 0 && !searchTerm}
              className="w-full"
            >
              Nullstill alle
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>{resultCount} gjenstander funnet</span>
        {(searchTerm || activeFiltersCount > 0) && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="text-xs h-auto p-1"
          >
            Vis alle
          </Button>
        )}
      </div>
    </div>
  );
}
