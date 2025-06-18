import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChecklistError } from '../ChecklistError';
import { ChecklistLoading } from '../ChecklistLoading';
import { EditChecklistItemDialog } from './EditChecklistItemDialog';
import { ChecklistSearch } from './ChecklistSearch';
import { useChecklistAdmin } from '@/hooks/useChecklistAdmin';
import { useToast } from '@/hooks/use-toast';

export function ChecklistItemsAdmin() {
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    area_id: '',
    is_critical: false
  });
  const [searchTerm, setSearchTerm] = useState('');
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
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
          areas (name)
        `)
        .order('order_index');
      if (error) throw error;
      return data;
    }
  });

  const addItemMutation = useMutation({
    mutationFn: async (item: typeof newItem) => {
      const { data, error } = await supabase
        .from('checklist_items')
        .insert([{
          ...item,
          order_index: items.length
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-items'] });
      setNewItem({ title: '', description: '', area_id: '', is_critical: false });
      toast({
        title: "Oppgave lagt til",
        description: "Ny oppgave er opprettet.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Feil",
        description: "Kunne ikke legge til oppgaven.",
        variant: "destructive",
      });
    }
  });

  const handleUpdateItem = async (itemId: string, updates: any) => {
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
      item.title.toLowerCase().includes(search) ||
      item.description?.toLowerCase().includes(search) ||
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
            <Label htmlFor="title">Tittel *</Label>
            <Input
              id="title"
              value={newItem.title}
              onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Tittel på oppgaven"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea
              id="description"
              value={newItem.description}
              onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Utfyllende beskrivelse (valgfritt)"
              rows={3}
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
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="critical"
              checked={newItem.is_critical}
              onChange={(e) => setNewItem(prev => ({ ...prev, is_critical: e.target.checked }))}
              className="rounded"
            />
            <Label htmlFor="critical">Kritisk oppgave</Label>
          </div>
          
          <Button 
            onClick={() => addItemMutation.mutate(newItem)}
            disabled={addItemMutation.isPending || !newItem.title.trim() || !newItem.area_id}
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
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{item.title}</h4>
                    {item.is_critical && (
                      <Badge variant="destructive" className="text-xs">Kritisk</Badge>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-gray-600 mb-1">{item.description}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Område: {item.areas?.name}
                  </p>
                </div>
                
                <EditChecklistItemDialog
                  item={item}
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
