
import React from 'react';
import { useInventory } from '@/hooks/useInventory';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, User, Calendar, Info, Tag, Palette, Ruler, Home, StickyNote } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

const InventoryList: React.FC = () => {
  const { data: items, isLoading, error } = useInventory();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
            <CardFooter>
               <Skeleton className="h-4 w-1/4" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Feil</AlertTitle>
            <AlertDescription>
                Klarte ikke å hente inventarliste: {error.message}
            </AlertDescription>
        </Alert>
    );
  }

  if (!items || items.length === 0) {
     return (
        <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Ingen gjenstander funnet</AlertTitle>
            <AlertDescription>
                Det er ingen gjenstander i inventarlisten ennå. Trykk på "Legg til gjenstand" for å starte.
            </AlertDescription>
        </Alert>
     )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.id} className="flex flex-col">
          {item.item_images && item.item_images.length > 0 && (
            <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                <img src={item.item_images[0].image_url} alt={item.name} className="w-full h-full object-cover"/>
            </div>
          )}
          <CardHeader>
            <CardTitle>{item.name}</CardTitle>
            <CardDescription className="flex items-center text-xs text-gray-500 gap-4 pt-1">
                 <span className="flex items-center gap-1">
                    <User size={12}/> {item.owner || item.profiles?.first_name || 'Ukjent'}
                 </span>
                 <span className="flex items-center gap-1">
                    <Calendar size={12}/> {format(new Date(item.created_at), 'd. MMM yyyy', { locale: nb })}
                 </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            {item.description && <p className="text-sm text-gray-700 mb-4">{item.description}</p>}
            
            <div className="text-xs text-gray-600 space-y-2">
              {item.brand && <p className="flex items-center gap-2"><Tag size={12} className="text-gray-500"/> <span className="font-semibold">Merke:</span> {item.brand}</p>}
              {item.color && <p className="flex items-center gap-2"><Palette size={12} className="text-gray-500"/> <span className="font-semibold">Farge:</span> {item.color}</p>}
              {item.size && <p className="flex items-center gap-2"><Ruler size={12} className="text-gray-500"/> <span className="font-semibold">Størrelse:</span> {item.size}</p>}
              {item.location && <p className="flex items-center gap-2"><Home size={12} className="text-gray-500"/> <span className="font-semibold">Plassering:</span> {item.location}{item.shelf ? `, hylle ${item.shelf}`: ''}</p>}
              {item.notes && <p className="flex items-start gap-2 pt-2"><StickyNote size={12} className="text-gray-500 mt-0.5"/> <span className="italic">"{item.notes}"</span></p>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default InventoryList;
