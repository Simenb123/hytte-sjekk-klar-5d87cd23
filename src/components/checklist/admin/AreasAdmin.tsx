
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { DbArea } from '@/types/database.types';

interface AreaFormData {
  name: string;
}

const AreasAdmin: React.FC = () => {
  const [editingArea, setEditingArea] = useState<DbArea | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<AreaFormData>({
    defaultValues: {
      name: '',
    },
  });

  // Fetch areas
  const { data: areas, isLoading } = useQuery({
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

  // Create area mutation
  const createAreaMutation = useMutation({
    mutationFn: async (data: AreaFormData) => {
      const { error } = await supabase
        .from('areas')
        .insert([{ name: data.name }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      toast.success('Område opprettet');
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      console.error('Error creating area:', error);
      toast.error('Feil ved opprettelse av område');
    },
  });

  // Update area mutation
  const updateAreaMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AreaFormData }) => {
      const { error } = await supabase
        .from('areas')
        .update({ name: data.name })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      toast.success('Område oppdatert');
      setIsDialogOpen(false);
      setEditingArea(null);
      form.reset();
    },
    onError: (error) => {
      console.error('Error updating area:', error);
      toast.error('Feil ved oppdatering av område');
    },
  });

  // Delete area mutation
  const deleteAreaMutation = useMutation({
    mutationFn: async (id: string) => {
      // First check if area has checklist items
      const { data: items } = await supabase
        .from('checklist_items')
        .select('id')
        .eq('area_id', id)
        .limit(1);
      
      if (items && items.length > 0) {
        throw new Error('Kan ikke slette område som har sjekkliste-punkter');
      }

      const { error } = await supabase
        .from('areas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      toast.success('Område slettet');
    },
    onError: (error) => {
      console.error('Error deleting area:', error);
      toast.error(error.message || 'Feil ved sletting av område');
    },
  });

  const onSubmit = (data: AreaFormData) => {
    if (editingArea) {
      updateAreaMutation.mutate({ id: editingArea.id, data });
    } else {
      createAreaMutation.mutate(data);
    }
  };

  const handleEdit = (area: DbArea) => {
    setEditingArea(area);
    form.setValue('name', area.name);
    setIsDialogOpen(true);
  };

  const handleDelete = (area: DbArea) => {
    if (confirm(`Er du sikker på at du vil slette området "${area.name}"?`)) {
      deleteAreaMutation.mutate(area.id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingArea(null);
    form.reset();
  };

  const handleNewArea = () => {
    setEditingArea(null);
    form.reset({
      name: '',
    });
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <div>Laster områder...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Områder ({areas?.length || 0})</h3>
        <Button onClick={handleNewArea}>
          <Plus className="h-4 w-4 mr-2" />
          Nytt område
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingArea ? 'Rediger område' : 'Nytt område'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                rules={{ required: 'Navn er påkrevd' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Navn</FormLabel>
                    <FormControl>
                      <Input placeholder="F.eks. Hovedhytta" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Avbryt
                </Button>
                <Button type="submit" disabled={createAreaMutation.isPending || updateAreaMutation.isPending}>
                  {editingArea ? 'Oppdater' : 'Opprett'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4">
        {areas?.map((area) => (
          <Card key={area.id}>
            <CardContent className="flex justify-between items-center p-4">
              <div>
                <h4 className="font-medium">{area.name}</h4>
                <p className="text-sm text-gray-500">ID: {area.id}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(area)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleDelete(area)}
                  disabled={deleteAreaMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AreasAdmin;
