
import React, { useMemo } from 'react';
import { useInventory } from '@/hooks/useInventory';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, User, Calendar, Info, Tag, Palette, Ruler, Home, StickyNote, MoreVertical, Edit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { InventoryItem } from '@/types/inventory';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { EditItemDialog } from './EditItemDialog';
import { Badge } from '../ui/badge';
import { useAuth } from '@/context/AuthContext';

interface InventoryListProps {
  searchTerm: string;
  sortConfig: {
    key: string;
    direction: "asc" | "desc";
  };
  category: string;
}

const InventoryList: React.FC<InventoryListProps> = ({ searchTerm, sortConfig, category }) => {
  const { user } = useAuth();
  const { data: items, isLoading, error } = useInventory();

  console.log('[InventoryList] Render with:', {
    user: user?.id,
    itemsCount: items?.length || 0,
    isLoading,
    error: error?.message,
    searchTerm,
    category
  });

  const processedItems = useMemo(() => {
    if (!items) return [];

    let filteredItems = [...items];

    if (category !== 'all') {
      filteredItems = filteredItems.filter(item => item.category === category);
    }

    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      filteredItems = filteredItems.filter(item => 
        (item.name && item.name.toLowerCase().includes(lowercasedTerm)) ||
        (item.description && item.description.toLowerCase().includes(lowercasedTerm)) ||
        (item.brand && item.brand.toLowerCase().includes(lowercasedTerm)) ||
        (item.color && item.color.toLowerCase().includes(lowercasedTerm)) ||
        (item.owner && item.owner.toLowerCase().includes(lowercasedTerm)) ||
        (item.location && item.location.toLowerCase().includes(lowercasedTerm)) ||
        (item.notes && item.notes.toLowerCase().includes(lowercasedTerm)) ||
        (item.category && item.category.toLowerCase().includes(lowercasedTerm))
      );
    }
    
    filteredItems.sort((a, b) => {
      const key = sortConfig.key as keyof InventoryItem;
      let valA = a[key];
      let valB = b[key];

      if (key === 'created_at') {
        const dateA = new Date(valA as string).getTime();
        const dateB = new Date(valB as string).getTime();
        return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
      }
      
      if (valA === null || valA === undefined || valA === '') return 1;
      if (valB === null || valB === undefined || valB === '') return -1;
      
      if (typeof valA === 'string' && typeof valB === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    console.log('[InventoryList] Processed items:', filteredItems.length);
    return filteredItems;
  }, [items, searchTerm, sortConfig, category]);

  // Check auth status
  if (!user) {
    console.log('[InventoryList] No authenticated user found');
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Ikke logget inn</AlertTitle>
        <AlertDescription>
          Du må logge inn for å se inventaret ditt. <a href="/login" className="underline">Logg inn her</a>.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    console.log('[InventoryList] Loading state');
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
    console.error('[InventoryList] Error state:', error);
    return (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Feil ved henting av inventar</AlertTitle>
            <AlertDescription>
                Klarte ikke å hente inventarliste: {error.message}
                <br />
                <small className="text-xs mt-2 block">
                  Bruker ID: {user.id}<br />
                  Prøv å logge ut og inn igjen, eller kontakt support hvis problemet vedvarer.
                </small>
            </AlertDescription>
        </Alert>
    );
  }

  if (!items || items.length === 0) {
     console.log('[InventoryList] No items found');
     return (
        <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Ingen gjenstander funnet</AlertTitle>
            <AlertDescription>
                Det er ingen gjenstander i inventarlisten ennå. Trykk på "Legg til gjenstand" for å starte.
                <br />
                <small className="text-xs mt-2 block">
                  Bruker ID: {user.id}
                </small>
            </AlertDescription>
        </Alert>
     )
  }

  if (processedItems.length === 0) {
    console.log('[InventoryList] No items after filtering');
    return (
       <Alert>
           <Info className="h-4 w-4" />
           <AlertTitle>Ingen treff</AlertTitle>
           <AlertDescription>
               Ditt søk ga ingen resultater. Prøv å endre søkeordet eller fjerne filtre.
               <br />
               <small className="text-xs mt-2 block">
                 Totalt antall gjenstander: {items.length}
               </small>
           </AlertDescription>
       </Alert>
    )
 }

  console.log('[InventoryList] Rendering', processedItems.length, 'items');

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {processedItems.map((item, index) => (
        <Card 
          key={item.id} 
          className="flex flex-col animate-fade-in hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-in-out"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="relative">
            {item.item_images && item.item_images.length > 0 ? (
              <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                  <img src={item.item_images[0].image_url} alt={item.name || 'Inventar Bilde'} className="w-full h-full object-cover"/>
              </div>
            ) : (
              <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-gray-200 flex items-center justify-center">
                <Palette className="h-12 w-12 text-gray-400" />
              </div>
            )}
             <div className="absolute top-2 right-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8 bg-white/80 hover:bg-white backdrop-blur-sm">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Handlinger</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <EditItemDialog item={item}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Edit className="mr-2 h-4 w-4" />
                      <span>Rediger</span>
                    </DropdownMenuItem>
                  </EditItemDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <CardHeader>
            <div className="flex justify-between items-start gap-2">
                <CardTitle>{item.name || "Uten navn"}</CardTitle>
                {item.category && <Badge variant="secondary" className="whitespace-nowrap">{item.category}</Badge>}
            </div>
            <CardDescription className="flex items-center text-xs text-gray-500 gap-4 pt-1">
                 <span className="flex items-center gap-1">
                    <User size={12}/> {item.owner || 'Ukjent'}
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
