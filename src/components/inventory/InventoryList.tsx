
import React from 'react';
import { useInventory } from '@/hooks/useInventory';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, User, Calendar, Info } from "lucide-react";
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card key={item.id}>
          {item.item_images && item.item_images.length > 0 && (
            <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                <img src={item.item_images[0].image_url} alt={item.name} className="w-full h-full object-cover"/>
            </div>
          )}
          <CardHeader>
            <CardTitle>{item.name}</CardTitle>
            <CardDescription className="flex items-center text-xs text-gray-500 gap-4">
                 <span className="flex items-center gap-1">
                    <User size={12}/> {item.profiles?.first_name || 'Ukjent'}
                 </span>
                 <span className="flex items-center gap-1">
                    <Calendar size={12}/> {format(new Date(item.created_at), 'd. MMM yyyy', { locale: nb })}
                 </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700">{item.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default InventoryList;
