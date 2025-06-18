
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit2, Loader2, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  area_id: string;
  order_index: number;
  is_critical: boolean;
}

interface EditChecklistItemDialogProps {
  item: ChecklistItem;
  areas: Array<{ id: string; name: string }>;
  onUpdate: (itemId: string, updates: Partial<ChecklistItem>) => Promise<void>;
  onDelete: (itemId: string) => Promise<void>;
}

export function EditChecklistItemDialog({ item, areas, onUpdate, onDelete }: EditChecklistItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: item.title,
    description: item.description || '',
    area_id: item.area_id,
    is_critical: item.is_critical
  });

  const handleSave = async () => {
    if (!formData.title.trim()) return;
    
    setLoading(true);
    try {
      await onUpdate(item.id, formData);
      setOpen(false);
    } catch (error) {
      console.error('Error updating item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await onDelete(item.id);
      setOpen(false);
    } catch (error) {
      console.error('Error deleting item:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Edit2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Rediger sjekkliste-punkt</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Tittel *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Tittel på oppgaven"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Utfyllende beskrivelse (valgfritt)"
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="area">Område</Label>
            <Select value={formData.area_id} onValueChange={(value) => setFormData(prev => ({ ...prev, area_id: value }))}>
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
              checked={formData.is_critical}
              onChange={(e) => setFormData(prev => ({ ...prev, is_critical: e.target.checked }))}
              className="rounded"
            />
            <Label htmlFor="critical">Kritisk oppgave</Label>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleSave} 
              disabled={loading || !formData.title.trim()}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Lagrer...
                </>
              ) : (
                'Lagre endringer'
              )}
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={loading || deleteLoading}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Slett oppgave</AlertDialogTitle>
                  <AlertDialogDescription>
                    Er du sikker på at du vil slette "{item.title}"? Denne handlingen kan ikke angres.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Avbryt</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDelete}
                    disabled={deleteLoading}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {deleteLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sletter...
                      </>
                    ) : (
                      'Slett'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
