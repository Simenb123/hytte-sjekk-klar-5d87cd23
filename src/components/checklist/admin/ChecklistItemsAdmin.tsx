
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, GripVertical, RotateCcw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ChecklistError from '../ChecklistError';
import ChecklistLoading from '../ChecklistLoading';
import { EditChecklistItemDialog } from './EditChecklistItemDialog';
import { ChecklistSearch } from './ChecklistSearch';
import { useChecklistAdmin } from '@/hooks/useChecklistAdmin';
import { useToast } from '@/state/toast';
import { Season, seasonLabels } from '@/models/seasons';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';

interface ChecklistItem {
  id: string;
  text: string;
  area_id: string;
  category?: string;
  season?: Season;
  areas?: { name: string };
  checklist_item_images?: { image_url: string }[];
}

// SortableItem component for drag-and-drop
interface SortableItemProps {
  item: ChecklistItem;
  areas: any[];
  onUpdate: (itemId: string, updates: Partial<ChecklistItem>) => Promise<void>;
  onDelete: (itemId: string) => Promise<void>;
  index: number;
}

function SortableItem({ item, areas, onUpdate, onDelete, index }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
    >
      <div
        className="flex items-center gap-2 cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-mono text-gray-500 w-8">
          {index + 1}
        </span>
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm mb-1">{item.text}</h4>
        <div className="flex gap-2 text-xs text-gray-500">
          <span>Område: {item.areas?.name}</span>
          {item.category && <span>• Kategori: {item.category}</span>}
          {item.season && (
            <span>• Sesong: {seasonLabels[item.season as Season]}</span>
          )}
        </div>
      </div>
      
      <EditChecklistItemDialog
        item={{...item, season: (item.season as Season) || 'all'}}
        areas={areas}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    </div>
  );
}

export function ChecklistItemsAdmin() {
  const [newItem, setNewItem] = useState({
    text: '',
    area_id: '',
    category: '',
    season: 'all' as Season,
    image: null as File | null
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('avreise');
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const { updateChecklistItem, deleteChecklistItem, reorderChecklistItems, resetToLogicalOrder } = useChecklistAdmin();

  const { data: areas = [], isLoading: areasLoading } = useQuery({
    queryKey: ['areas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('areas')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: items = [], isLoading: itemsLoading, error } = useQuery({
    queryKey: ['checklist-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checklist_items')
        .select(`
          *,
          areas (name),
          checklist_item_images ( image_url )
        `)
        .order('category')
        .order('sort_order', { ascending: true })
        .order('created_at');
      if (error) throw error;
      return data;
    }
  });

  const addItemMutation = useMutation({
    mutationFn: async (item: typeof newItem) => {
      // Get the highest sort_order for the category to append new item at the end
      const { data: existingItems } = await supabase
        .from('checklist_items')
        .select('sort_order')
        .eq('category', item.category || 'opphold')
        .order('sort_order', { ascending: false })
        .limit(1);
      
      const nextSortOrder = existingItems && existingItems.length > 0 
        ? (existingItems[0].sort_order || 0) + 10 
        : 10;

      const { data, error } = await supabase
        .from('checklist_items')
        .insert([{ 
          text: item.text,
          area_id: item.area_id,
          category: item.category || null,
          season: item.season,
          sort_order: nextSortOrder
        }])
        .select()
        .single();
      if (error) throw error;
      if (item.image && user) {
        const ext = item.image.name.split(".").pop();
        const fileName = `${user.id}/${data.id}-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('checklist_item_images')
          .upload(fileName, item.image);
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('checklist_item_images')
            .getPublicUrl(fileName);
          await supabase
            .from('checklist_item_images')
            .insert({ item_id: data.id, image_url: publicUrl, user_id: user.id });
        }
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-items'] });
      setNewItem({ text: '', area_id: '', category: '', season: 'all', image: null });
      toast({
        title: "Oppgave lagt til",
        description: "Ny oppgave er opprettet.",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Feil",
        description: "Kunne ikke legge til oppgaven.",
        variant: "destructive",
      });
    }
  });

  const handleUpdateItem = async (itemId: string, updates: Partial<ChecklistItem>) => {
    await updateChecklistItem(itemId, updates);
    queryClient.invalidateQueries({ queryKey: ['checklist-items'] });
  };

  const handleDeleteItem = async (itemId: string) => {
    await deleteChecklistItem(itemId);
    queryClient.invalidateQueries({ queryKey: ['checklist-items'] });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredItems = useMemo(() => {
    let result = items;
    
    // Filter by category if selected
    if (selectedCategory && selectedCategory !== 'all') {
      result = result.filter(item => item.category === selectedCategory);
    }
    
    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.text.toLowerCase().includes(search) ||
        item.category?.toLowerCase().includes(search) ||
        item.areas?.name.toLowerCase().includes(search)
      );
    }
    
    return result;
  }, [items, searchTerm, selectedCategory]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = filteredItems.findIndex(item => item.id === active.id);
    const newIndex = filteredItems.findIndex(item => item.id === over.id);

    if (oldIndex !== newIndex) {
      const reorderedItems = arrayMove(filteredItems, oldIndex, newIndex);
      
      // Update sort_order for all affected items
      const updates = reorderedItems.map((item, index) => ({
        id: item.id,
        sort_order: (index + 1) * 10
      }));

      try {
        await reorderChecklistItems(selectedCategory, updates);
        queryClient.invalidateQueries({ queryKey: ['checklist-items'] });
      } catch (error) {
        console.error('Failed to reorder items:', error);
      }
    }
  };

  const handleResetOrder = async () => {
    try {
      await resetToLogicalOrder(selectedCategory);
      queryClient.invalidateQueries({ queryKey: ['checklist-items'] });
    } catch (error) {
      console.error('Failed to reset order:', error);
    }
  };

  if (areasLoading || itemsLoading) return <ChecklistLoading />;
  if (error) return <ChecklistError error={error.message} />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Legg til ny oppgave</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="text">Oppgave *</Label>
            <Input
              id="text"
              value={newItem.text}
              onChange={(e) => setNewItem(prev => ({ ...prev, text: e.target.value }))}
              placeholder="Beskrivelse av oppgaven"
            />
          </div>
          
          <div>
            <Label htmlFor="area">Område *</Label>
            <Select value={newItem.area_id} onValueChange={(value) => setNewItem(prev => ({ ...prev, area_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Velg område" />
              </SelectTrigger>
              <SelectContent>
                {areas.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="category">Kategori</Label>
            <Select value={newItem.category} onValueChange={(value) => setNewItem(prev => ({ ...prev, category: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Velg kategori (valgfritt)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="før_ankomst">Før ankomst</SelectItem>
                <SelectItem value="ankomst">Ankomst</SelectItem>
                <SelectItem value="opphold">Under oppholdet</SelectItem>
                <SelectItem value="avreise">Avreise</SelectItem>
                <SelectItem value="årlig_vedlikehold">Årlig vedlikehold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="season">Sesong</Label>
            <Select
              value={newItem.season}
              onValueChange={(value) =>
                setNewItem(prev => ({ ...prev, season: value as Season }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Velg sesong" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{seasonLabels.all}</SelectItem>
                <SelectItem value="winter">{seasonLabels.winter}</SelectItem>
                <SelectItem value="summer">{seasonLabels.summer}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="image">Bilde</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => setNewItem(prev => ({ ...prev, image: e.target.files?.[0] || null }))}
            />
          </div>
          
          <Button 
            onClick={() => addItemMutation.mutate(newItem)}
            disabled={addItemMutation.isPending || !newItem.text.trim() || !newItem.area_id}
            className="w-full"
          >
            {addItemMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Legger til...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Legg til oppgave
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Eksisterende oppgaver ({filteredItems.length})</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetOrder}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Tilbakestill rekkefølge
            </Button>
          </div>
          
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <ChecklistSearch 
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Søk etter oppgaver..."
              />
            </div>
            
            <div className="w-48">
              <Select 
                value={selectedCategory} 
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle kategorier</SelectItem>
                  <SelectItem value="før_ankomst">Før ankomst</SelectItem>
                  <SelectItem value="ankomst">Ankomst</SelectItem>
                  <SelectItem value="opphold">Under oppholdet</SelectItem>
                  <SelectItem value="avreise">Avreise</SelectItem>
                  <SelectItem value="årlig_vedlikehold">Årlig vedlikehold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredItems.map(item => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                 {filteredItems.map((item, index) => {
                   // Type assertion to ensure proper typing
                   const typedItem = {
                     ...item,
                     season: (item.season as Season) || 'all'
                   };
                   
                   return (
                     <SortableItem
                       key={item.id}
                       item={typedItem}
                       areas={areas}
                       onUpdate={handleUpdateItem}
                       onDelete={handleDeleteItem}
                       index={index}
                     />
                   );
                 })}
                
                {filteredItems.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? 'Ingen oppgaver matcher søket' : 'Ingen oppgaver funnet'}
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>
    </div>
  );
}

export default ChecklistItemsAdmin;
