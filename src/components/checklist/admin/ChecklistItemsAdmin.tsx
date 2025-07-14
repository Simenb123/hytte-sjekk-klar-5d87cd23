
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2 } from 'lucide-react';
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

interface ChecklistItem {
  id: string;
  text: string;
  area_id: string;
  category?: string;
  season?: Season;
  areas?: { name: string };
  checklist_item_images?: { image_url: string }[];
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
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const { updateChecklistItem, deleteChecklistItem } = useChecklistAdmin();

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
        .order('text');
      if (error) throw error;
      return data;
    }
  });

  const addItemMutation = useMutation({
    mutationFn: async (item: typeof newItem) => {
      const { data, error } = await supabase
        .from('checklist_items')
        .insert([{ 
          text: item.text,
          area_id: item.area_id,
          category: item.category || null,
          season: item.season
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

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    
    const search = searchTerm.toLowerCase();
    return items.filter(item => 
      item.text.toLowerCase().includes(search) ||
      item.category?.toLowerCase().includes(search) ||
      item.areas?.name.toLowerCase().includes(search)
    );
  }, [items, searchTerm]);

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
          <CardTitle>Eksisterende oppgaver ({filteredItems.length})</CardTitle>
          <ChecklistSearch 
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Søk etter oppgaver..."
          />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
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
                  item={{...item, season: item.season as Season}}
                  areas={areas}
                  onUpdate={handleUpdateItem}
                  onDelete={handleDeleteItem}
                />
              </div>
            ))}
            
            {filteredItems.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'Ingen oppgaver matcher søket' : 'Ingen oppgaver funnet'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ChecklistItemsAdmin;
