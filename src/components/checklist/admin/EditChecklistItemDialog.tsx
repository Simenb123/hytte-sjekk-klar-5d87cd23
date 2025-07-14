
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NO_SELECTION } from '@/constants';
import { Edit2, Loader2, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface ChecklistItem {
  id: string;
  text: string;
  area_id: string;
  category?: string;
  season?: string;
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
    text: item.text,
    area_id: item.area_id,
    category: item.category || '',
    season: item.season || ''
  });

  const handleSave = async () => {
    if (!formData.text.trim()) return;
    
    setLoading(true);
    try {
      await onUpdate(item.id, {
        text: formData.text,
        area_id: formData.area_id,
        category: formData.category === NO_SELECTION ? null : formData.category || null,
        season: formData.season === NO_SELECTION ? null : formData.season || null
      });
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
      <DialogTrigger asChild><Button variant="ghost" size="sm">
          <Edit2 className="h-4 w-4" />
        </Button></DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Rediger sjekkliste-punkt</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="text">Oppgave *</Label>
            <Input
              id="text"
              value={formData.text}
              onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
              placeholder="Beskrivelse av oppgaven"
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

          <div>
            <Label htmlFor="category">Kategori</Label>
            <Select
              value={formData.category || NO_SELECTION}
              onValueChange={(value) =>
                setFormData(prev => ({
                  ...prev,
                  category: value === NO_SELECTION ? '' : value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Velg kategori (valgfritt)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_SELECTION}>Ingen kategori</SelectItem>
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
              value={formData.season || NO_SELECTION}
              onValueChange={(value) =>
                setFormData(prev => ({
                  ...prev,
                  season: value === NO_SELECTION ? '' : value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Velg sesong (valgfritt)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_SELECTION}>Ingen sesong</SelectItem>
                <SelectItem value="vinter">Vinter</SelectItem>
                <SelectItem value="sommer">Sommer</SelectItem>
                <SelectItem value="høst">Høst</SelectItem>
                <SelectItem value="vår">Vår</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleSave} 
              disabled={loading || !formData.text.trim()}
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
              <AlertDialogTrigger asChild><Button variant="destructive" disabled={loading || deleteLoading}>
                  <Trash2 className="h-4 w-4" />
                </Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Slett oppgave</AlertDialogTitle>
                  <AlertDialogDescription>
                    Er du sikker på at du vil slette "{item.text}"? Denne handlingen kan ikke angres.
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
