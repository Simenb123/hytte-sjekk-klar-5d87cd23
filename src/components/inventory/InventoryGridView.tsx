
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit2, MapPin, User, Package, ImageIcon } from 'lucide-react';
import { EditItemDialog } from './EditItemDialog';
import { ImageViewer } from './ImageViewer';
import { InventoryItem } from '@/types/inventory';
import { LocationBadge } from './InventoryLocationFilter';

interface InventoryGridViewProps {
  items: InventoryItem[];
}

export function InventoryGridView({ items }: InventoryGridViewProps) {
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Ingen gjenstander funnet</h3>
        <p className="text-gray-500">Legg til din første gjenstand for å komme i gang.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item) => (
        <Card key={item.id} className="hover:shadow-md transition-shadow overflow-hidden">
          {/* Image section */}
          <div className="relative h-48 bg-gray-100">
            {item.item_images && item.item_images.length > 0 ? (
              <img
                src={item.item_images[0].image_url}
                alt={item.name}
                className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setSelectedImage({ 
                  url: item.item_images[0].image_url, 
                  name: item.name 
                })}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`absolute inset-0 flex items-center justify-center ${item.item_images?.length ? 'hidden' : ''}`}>
              <ImageIcon className="h-12 w-12 text-gray-400" />
            </div>
            <div className="absolute top-2 right-2">
              <EditItemDialog
                item={item}
                trigger={
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-white/80 hover:bg-white">
                    <Edit2 className="h-3 w-3" />
                  </Button>
                }
              />
            </div>
          </div>
          
          <CardContent className="p-4">
            <div className="mb-3">
              <h3 className="font-semibold text-sm line-clamp-2">{item.name}</h3>
            </div>
            
            {item.description && (
              <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                {item.description}
              </p>
            )}
            
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 mb-2">
                <LocationBadge location={item.primary_location} />
                {item.category && (
                  <Badge variant="secondary" className="text-xs">
                    {item.category}
                  </Badge>
                )}
              </div>
              
              <div className="space-y-1">
                {item.brand && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <span className="font-medium">Merke:</span>
                    <span>{item.brand}</span>
                  </div>
                )}
                
                {item.color && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <span className="font-medium">Farge:</span>
                    <span>{item.color}</span>
                  </div>
                )}
                
                {item.size && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <span className="font-medium">Størrelse:</span>
                    <span>{item.size}</span>
                  </div>
                )}
                
                {item.location && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="h-3 w-3" />
                    <span>{item.location}</span>
                    {item.shelf && <span>({item.shelf})</span>}
                  </div>
                )}
                
                {(item.family_members?.name || item.owner) && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <User className="h-3 w-3" />
                    <span>{item.family_members?.name || item.owner}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      <ImageViewer
        imageUrl={selectedImage?.url || ''}
        itemName={selectedImage?.name || ''}
        open={!!selectedImage}
        onOpenChange={(open) => !open && setSelectedImage(null)}
      />
    </div>
  );
}
