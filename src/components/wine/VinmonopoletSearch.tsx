import React, { useState } from 'react';
import { Search, Plus, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWineCellar } from '@/hooks/useWineCellar';
import type { VinmonopolProduct } from '@/types/wine';

export function VinmonopoletSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<VinmonopolProduct[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { searchVinmonopolet, isSearching, addWine } = useWineCellar();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    console.log('🔍 Starting Vinmonopolet search for:', searchTerm);
    setHasSearched(true);
    setErrorMessage(null);
    
    try {
      const products = await searchVinmonopolet(searchTerm);
      console.log('✅ Search successful, found', products.length, 'products');
      setResults(products);
    } catch (error: any) {
      console.error('❌ Search error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      setResults([]);
      setErrorMessage(error?.message || 'Kunne ikke søke i Vinmonopolet. Prøv igjen.');
    }
  };

  const handleImport = (product: VinmonopolProduct) => {
    addWine({
      name: product.name,
      producer: product.producer,
      vintage: product.vintage,
      grape_variety: product.grape_variety,
      wine_color: product.wine_color as any,
      alcohol_percentage: product.alcohol_percentage,
      current_price: product.current_price,
      vinmonopol_id: product.vinmonopol_id,
      vinmonopol_url: product.vinmonopol_url,
      image_url: product.image_url,
      description: product.description,
      country: product.country,
      region: product.region,
      tasting_notes: product.tasting_notes,
      bottle_count: 1,
      location: 'Hjemme',
      is_consumed: false,
    });
  };

  const getColorBadge = (color?: string) => {
    const colorMap: Record<string, string> = {
      red: 'bg-red-500/20 text-red-700 border-red-300',
      white: 'bg-yellow-500/20 text-yellow-700 border-yellow-300',
      rosé: 'bg-pink-500/20 text-pink-700 border-pink-300',
      sparkling: 'bg-blue-500/20 text-blue-700 border-blue-300',
      dessert: 'bg-purple-500/20 text-purple-700 border-purple-300',
      fortified: 'bg-orange-500/20 text-orange-700 border-orange-300',
    };
    
    if (!color) return null;
    
    return (
      <Badge variant="outline" className={colorMap[color] || ''}>
        {color === 'red' ? 'Rød' : color === 'white' ? 'Hvit' : color === 'rosé' ? 'Rosé' : 
         color === 'sparkling' ? 'Musserende' : color === 'dessert' ? 'Dessert' : 'Annet'}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Søk i Vinmonopolet
          </CardTitle>
          <CardDescription>
            Søk etter viner fra Vinmonopolets sortiment og importer til ditt vinlager
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Søk etter vin, produsent eller land..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isSearching || !searchTerm.trim()}>
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Søker...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Søk
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {errorMessage && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <p className="text-destructive font-medium">⚠️ {errorMessage}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Sjekk konsollen for mer detaljer eller prøv igjen senere.
            </p>
          </CardContent>
        </Card>
      )}

      {hasSearched && !errorMessage && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {results.length > 0 ? `Fant ${results.length} viner` : 'Ingen resultater funnet'}
            </h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {results.map((product) => (
              <Card key={product.vinmonopol_id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {product.image_url && (
                      <div className="aspect-[3/4] relative bg-muted rounded-md overflow-hidden">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="object-contain w-full h-full"
                        />
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold line-clamp-2 min-h-[2.5rem]">
                        {product.name}
                      </h4>
                      
                      {product.producer && (
                        <p className="text-sm text-muted-foreground">
                          {product.producer}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-2">
                        {getColorBadge(product.wine_color)}
                        {product.country && (
                          <Badge variant="outline">{product.country}</Badge>
                        )}
                        {product.vintage && (
                          <Badge variant="outline">{product.vintage}</Badge>
                        )}
                      </div>

                      {product.current_price && (
                        <p className="text-lg font-bold text-primary">
                          {product.current_price.toFixed(2)} kr
                        </p>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => handleImport(product)}
                          className="flex-1"
                          size="sm"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Importer
                        </Button>
                        {product.vinmonopol_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <a
                              href={product.vinmonopol_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
