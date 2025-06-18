
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Sun, Snowflake, Calendar } from 'lucide-react';
import { DbArea, DbChecklistItem } from '@/types/database.types';
import { checklistCategories, ChecklistCategory } from '@/models/checklist';

interface ChecklistItemFormData {
  text: string;
  category: string;
  season: string;
  area_id: string;
}

const ChecklistItemsAdmin: React.FC = () => {
  const [editingItem, setEditingItem] = useState<DbChecklistItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ChecklistCategory>('før_ankomst');
  const queryClient = useQueryClient();

  const form = useForm<ChecklistItemFormData>({
    defaultValues: {
      text: '',
      category: 'før_ankomst',
      season: 'all',
      area_id: '',
    },
  });

  // Fetch areas
  const { data: areas } = useQuery({
    queryKey: ['areas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('areas')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as DbArea[];
    },
  });

  // Fetch checklist items
  const { data: items, isLoading } = useQuery({
    queryKey: ['checklist-items', selectedCategory],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checklist_items')
        .select('*, areas(name)')
        .eq('category', selectedCategory)
        .order('created_at');
      
      if (error) throw error;
      return data as (DbChecklistItem & { areas?: { name: string } })[];
    },
  });

  // Create item mutation
  const createItemMutation = useMutation({
    mutationFn: async (data: ChecklistItemFormData) => {
      const { error } = await supabase
        .from('checklist_items')
        .insert([data]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-items'] });
      toast.success('Sjekkliste-punkt opprettet');
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      console.error('Error creating item:', error);
      toast.error('Feil ved opprettelse av sjekkliste-punkt');
    },
  });

  // Update item mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ChecklistItemFormData }) => {
      const { error } = await supabase
        .from('checklist_items')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-items'] });
      toast.success('Sjekkliste-punkt oppdatert');
      setIsDialogOpen(false);
      setEditingItem(null);
      form.reset();
    },
    onError: (error) => {
      console.error('Error updating item:', error);
      toast.error('Feil ved oppdatering av sjekkliste-punkt');
    },
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('checklist_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-items'] });
      toast.success('Sjekkliste-punkt slettet');
    },
    onError: (error) => {
      console.error('Error deleting item:', error);
      toast.error('Feil ved sletting av sjekkliste-punkt');
    },
  });

  const onSubmit = (data: ChecklistItemFormData) => {
    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, data });
    } else {
      createItemMutation.mutate(data);
    }
  };

  const handleEdit = (item: DbChecklistItem) => {
    setEditingItem(item);
    form.setValue('text', item.text);
    form.setValue('category', item.category || '');
    form.setValue('season', item.season || 'all');
    form.setValue('area_id', item.area_id || '');
    setIsDialogOpen(true);
  };

  const handleDelete = (item: DbChecklistItem) => {
    if (confirm(`Er du sikker på at du vil slette "${item.text}"?`)) {
      deleteItemMutation.mutate(item.id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    form.reset();
  };

  const getSeasonIcon = (season: string) => {
    switch (season) {
      case 'winter': return <Snowflake className="h-4 w-4 text-blue-500" />;
      case 'summer': return <Sun className="h-4 w-4 text-yellow-500" />;
      default: return <Calendar className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeasonText = (season: string) => {
    switch (season) {
      case 'winter': return 'Vinter';
      case 'summer': return 'Sommer';
      default: return 'Hele året';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Sjekkliste-punkter</h3>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nytt punkt
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Rediger sjekkliste-punkt' : 'Nytt sjekkliste-punkt'}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="text"
                  rules={{ required: 'Tekst er påkrevd' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Beskrivelse</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Beskriv oppgaven..." 
                          className="resize-none"
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Velg kategori" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(checklistCategories).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="season"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sesong</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Velg sesong" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">Hele året</SelectItem>
                          <SelectItem value="winter">Vinter</SelectItem>
                          <SelectItem value="summer">Sommer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="area_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Område</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Velg område" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {areas?.map((area) => (
                            <SelectItem key={area.id} value={area.id}>
                              {area.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Avbryt
                  </Button>
                  <Button type="submit" disabled={createItemMutation.isPending || updateItemMutation.isPending}>
                    {editingItem ? 'Oppdater' : 'Opprett'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as ChecklistCategory)}>
        <TabsList className="grid w-full grid-cols-5">
          {Object.entries(checklistCategories).map(([key, label]) => (
            <TabsTrigger key={key} value={key} className="text-xs">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.keys(checklistCategories).map((category) => (
          <TabsContent key={category} value={category} className="space-y-4">
            <div className="text-sm text-gray-600">
              {items?.length || 0} punkter i denne kategorien
            </div>
            
            <div className="space-y-3">
              {isLoading ? (
                <div>Laster sjekkliste-punkter...</div>
              ) : (
                items?.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <p className="font-medium mb-2">{item.text}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              {getSeasonIcon(item.season || 'all')}
                              {getSeasonText(item.season || 'all')}
                            </div>
                            <div>
                              📍 {item.areas?.name || 'Ukjent område'}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDelete(item)}
                            disabled={deleteItemMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default ChecklistItemsAdmin;
