import React, { useState } from 'react';
import { Search, Plus, Wine, MapPin, Star, Calendar, DollarSign } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWineCellar } from '@/hooks/useWineCellar';
import type { WineCellarItem, VinmonopolProduct } from '@/types/wine';

interface WineDialogProps {
  wine?: WineCellarItem;
  trigger?: React.ReactNode;
}

export function WineDialog({ wine, trigger }: WineDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<VinmonopolProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [formData, setFormData] = useState<Partial<WineCellarItem>>({
    name: wine?.name || '',
    vintage: wine?.vintage || '',
    producer: wine?.producer || '',
    grape_variety: wine?.grape_variety || '',
    wine_color: wine?.wine_color || undefined,
    alcohol_percentage: wine?.alcohol_percentage || undefined,
    bottle_count: wine?.bottle_count || 1,
    location: wine?.location || 'Hjemme',
    purchase_price: wine?.purchase_price || undefined,
    current_price: wine?.current_price || undefined,
    purchase_info: wine?.purchase_info || '',
    rating: wine?.rating || undefined,
    tasting_notes: wine?.tasting_notes || '',
    serving_notes: wine?.serving_notes || '',
    consumed_with: wine?.consumed_with || '',
    description: wine?.description || '',
    country: wine?.country || '',
    region: wine?.region || '',
  });

  const { addWine, updateWine, searchVinmonopolet, isAdding, isUpdating } = useWineCellar();

  const handleSearch = async () => {
    if (searchTerm.trim().length < 2) return;
    
    setIsSearching(true);
    const results = await searchVinmonopolet(searchTerm);
    setSearchResults(results);
    setIsSearching(false);
  };

  const selectVinmonopolProduct = (product: VinmonopolProduct) => {
    setFormData({
      ...formData,
      name: product.name,
      vintage: product.vintage || '',
      producer: product.producer || '',
      grape_variety: product.grape_variety || '',
      wine_color: product.wine_color as any,
      alcohol_percentage: product.alcohol_percentage,
      current_price: product.current_price,
      tasting_notes: product.tasting_notes || '',
      description: product.description || '',
      country: product.country || '',
      region: product.region || '',
      vinmonopol_id: product.vinmonopol_id,
      vinmonopol_url: product.vinmonopol_url,
      image_url: product.image_url,
    });
    setSearchResults([]);
    setSearchTerm('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name?.trim()) return;

    if (wine) {
      updateWine({ id: wine.id, ...formData });
    } else {
      addWine(formData);
    }
    
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Legg til vin
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wine className="w-5 h-5" />
            {wine ? 'Rediger vin' : 'Legg til ny vin'}
          </DialogTitle>
        </DialogHeader>

        {!wine && (
          <div className="space-y-4 border-b pb-4">
            <Label>Søk i Vinmonopolet</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Søk etter vin..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                <Search className="w-4 h-4" />
              </Button>
            </div>
            
            {searchResults.length > 0 && (
              <div className="max-h-40 overflow-y-auto space-y-2">
                {searchResults.map((product) => (
                  <div
                    key={product.vinmonopol_id}
                    className="p-2 border rounded cursor-pointer hover:bg-muted"
                    onClick={() => selectVinmonopolProduct(product)}
                  >
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {product.producer} • {product.current_price ? `${product.current_price} kr` : 'Pris ikke tilgjengelig'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Navn *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vintage">Årgang</Label>
              <Input
                id="vintage"
                value={formData.vintage}
                onChange={(e) => setFormData({ ...formData, vintage: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="producer">Produsent</Label>
              <Input
                id="producer"
                value={formData.producer}
                onChange={(e) => setFormData({ ...formData, producer: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wine_color">Type</Label>
              <Select value={formData.wine_color || ''} onValueChange={(value) => setFormData({ ...formData, wine_color: value as any })}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="red">Rødvin</SelectItem>
                  <SelectItem value="white">Hvitvin</SelectItem>
                  <SelectItem value="rosé">Rosévin</SelectItem>
                  <SelectItem value="sparkling">Musserende</SelectItem>
                  <SelectItem value="dessert">Dessertvin</SelectItem>
                  <SelectItem value="fortified">Sterkvin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bottle_count">Antall flasker</Label>
              <Input
                id="bottle_count"
                type="number"
                min="0"
                value={formData.bottle_count}
                onChange={(e) => setFormData({ ...formData, bottle_count: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">
                <MapPin className="w-4 h-4 inline mr-1" />
                Lokasjon
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="f.eks. Hjemme, Hytta, Kjeller"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rating">
                <Star className="w-4 h-4 inline mr-1" />
                Rating (1-6)
              </Label>
              <Select value={formData.rating?.toString() || ''} onValueChange={(value) => setFormData({ ...formData, rating: value ? parseInt(value) : undefined })}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Dårlig</SelectItem>
                  <SelectItem value="2">2 - Under middels</SelectItem>
                  <SelectItem value="3">3 - Middels</SelectItem>
                  <SelectItem value="4">4 - Bra</SelectItem>
                  <SelectItem value="5">5 - Meget bra</SelectItem>
                  <SelectItem value="6">6 - Enestående</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_price">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Pris (kr)
              </Label>
              <Input
                id="current_price"
                type="number"
                min="0"
                step="0.01"
                value={formData.current_price || ''}
                onChange={(e) => setFormData({ ...formData, current_price: parseFloat(e.target.value) || undefined })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="grape_variety">Druesort(er)</Label>
            <Input
              id="grape_variety"
              value={formData.grape_variety}
              onChange={(e) => setFormData({ ...formData, grape_variety: e.target.value })}
              placeholder="f.eks. Cabernet Sauvignon, Merlot"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tasting_notes">Smaksnotater</Label>
            <Textarea
              id="tasting_notes"
              value={formData.tasting_notes}
              onChange={(e) => setFormData({ ...formData, tasting_notes: e.target.value })}
              placeholder="Beskriv smak, aroma, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="serving_notes">Serveringstips</Label>
            <Textarea
              id="serving_notes"
              value={formData.serving_notes}
              onChange={(e) => setFormData({ ...formData, serving_notes: e.target.value })}
              placeholder="f.eks. Passer til rødt kjøtt, server ved 16-18°C"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Avbryt
            </Button>
            <Button type="submit" disabled={isAdding || isUpdating}>
              {wine ? 'Oppdater' : 'Legg til'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}