
import React, { useMemo, useCallback } from 'react';
import { useInventory } from '@/hooks/useInventory';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, User, Calendar, Info, Tag, Palette, Ruler, Home, StickyNote, MoreVertical, Edit, Users } from "lucide-react";
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
  familyMemberId?: string;
}

const InventoryList: React.FC<InventoryListProps> = ({ searchTerm, sortConfig, category, familyMemberId }) => {
  const { user } = useAuth();
  const { data: items, isLoading, error, isFetching } = useInventory();

  console.log('[InventoryList] Render with:', {
    user: user?.id,
    itemsCount: items?.length || 0,
    isLoading,
    isFetching,
    error: error?.message,
    searchTerm,
    category,
    familyMemberId
  });

  // Memoized filtering function for better performance
  const filterItems = useCallback((items: InventoryItem[], searchTerm: string, category: string, familyMemberId?: string) => {
    if (!items || !Array.isArray(items)) {
      console.log('[InventoryList] No valid items array provided');
      return [];
    }

    let filteredItems = [...items];
    console.log('[InventoryList] Starting with', filteredItems.length, 'items');

    // Category filtering
    if (category && category !== 'all') {
      const beforeCount = filteredItems.length;
      filteredItems = filteredItems.filter(item => {
        const itemCategory = item.category || '';
        return itemCategory === category;
      });
      console.log('[InventoryList] After category filter:', beforeCount, '->', filteredItems.length);
    }

    // Family member filtering
    if (familyMemberId && familyMemberId !== 'all') {
      const beforeCount = filteredItems.length;
      if (familyMemberId === 'none') {
        filteredItems = filteredItems.filter(item => !item.family_member_id);
      } else {
        filteredItems = filteredItems.filter(item => item.family_member_id === familyMemberId);
      }
      console.log('[InventoryList] After family member filter:', beforeCount, '->', filteredItems.length);
    }

    // Search term filtering - more robust
    if (searchTerm && searchTerm.trim()) {
      const beforeCount = filteredItems.length;
      const lowercasedTerm = searchTerm.toLowerCase().trim();
      filteredItems = filteredItems.filter(item => {
        const searchFields = [
          item.name || '',
          item.description || '',
          item.brand || '',
          item.color || '',
          item.owner || '',
          item.location || '',
          item.notes || '',
          item.category || '',
          item.family_members?.name || '',
          item.family_members?.nickname || ''
        ];
        
        return searchFields.some(field => 
          field.toLowerCase().includes(lowercasedTerm)
        );
      });
      console.log('[InventoryList] After search filter:', beforeCount, '->', filteredItems.length);
    }

    return filteredItems;
  }, []);

  // Memoized sorting function
  const sortItems = useCallback((items: InventoryItem[], sortConfig: { key: string; direction: "asc" | "desc" }) => {
    if (!items || !Array.isArray(items)) return [];

    return [...items].sort((a, b) => {
      const key = sortConfig.key as keyof InventoryItem;
      let valA = a[key];
      let valB = b[key];

      // Special handling for date sorting
      if (key === 'created_at') {
        const dateA = new Date(valA as string).getTime();
        const dateB = new Date(valB as string).getTime();
        return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
      }
      
      // Handle null/undefined values
      if (!valA && !valB) return 0;
      if (!valA) return 1;
      if (!valB) return -1;
      
      // String comparison
      if (typeof valA === 'string' && typeof valB === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, []);

  // Stable processed items with better memoization
  const processedItems = useMemo(() => {
    console.log('[InventoryList] Processing items, raw items:', items?.length || 0);
    
    if (!items || !Array.isArray(items)) {
      console.log('[InventoryList] No items to process');
      return [];
    }

    // First filter, then sort for better performance
    const filtered = filterItems(items, searchTerm, category, familyMemberId);
    const sorted = sortItems(filtered, sortConfig);
    
    console.log('[InventoryList] Final processed items:', sorted.length);
    return sorted;
  }, [items, searchTerm, sortConfig, category, familyMemberId, filterItems, sortItems]);

  // Auth check
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

  // Loading state - show loading even during background refetch
  if (isLoading) {
    console.log('[InventoryList] Loading state');
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
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

  // Error state
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
                  Prøv å oppdatere siden eller kontakt support hvis problemet vedvarer.
                </small>
            </AlertDescription>
        </Alert>
    );
  }

  // No items at all
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

  // No items after filtering
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
    <div>
      {/* Show fetching indicator if background refresh is happening */}
      {isFetching && !isLoading && (
        <div className="mb-4 text-sm text-gray-500 text-center">
          Oppdaterer inventar...
        </div>
      )}
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {processedItems.map((item, index) => (
          <Card 
            key={`${item.id}-${index}`}
            className="flex flex-col animate-fade-in hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-in-out"
            style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }}
          >
            <div className="relative">
              {item.item_images && item.item_images.length > 0 ? (
                <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                    <img 
                      src={item.item_images[0].image_url} 
                      alt={item.name || 'Inventar Bilde'} 
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
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
                  <CardTitle className="text-base">{item.name || "Uten navn"}</CardTitle>
                  {item.category && <Badge variant="secondary" className="whitespace-nowrap text-xs">{item.category}</Badge>}
              </div>
              <CardDescription className="flex items-center text-xs text-gray-500 gap-4 pt-1">
                   <span className="flex items-center gap-1">
                      {item.family_members ? (
                        <>
                          <Users size={12}/> 
                          {item.family_members.name}
                          {item.family_members.nickname && ` (${item.family_members.nickname})`}
                        </>
                      ) : item.owner ? (
                        <>
                          <User size={12}/> {item.owner}
                        </>
                      ) : (
                        <>
                          <User size={12}/> Ingen eier
                        </>
                      )}
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
    </div>
  );
};

export default InventoryList;
