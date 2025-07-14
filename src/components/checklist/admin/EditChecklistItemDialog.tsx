
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit2, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Season, seasonLabels } from '@/models/seasons';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';

interface ChecklistItem {
  id: string;
  text: string;
  area_id: string;
  category?: string;
  season?: Season;
  checklist_item_images?: { image_url: string }[];
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    text: item.text,
    area_id: item.area_id,
    category: item.category || '',
    season: (item.season as Season) || 'all'
  });

  const handleSave = async () => {
    if (!formData.text.trim()) return;

    setLoading(true);
    try {
      await onUpdate(item.id, {
        text: formData.text,
        area_id: formData.area_id,
        category: formData.category || null,
        season: formData.season
      });

      if (imageFile && user) {
        const { data: oldImages } = await supabase
          .from('checklist_item_images')
          .select('image_url')
          .eq('item_id', item.id)
          .eq('user_id', user.id);

        if (oldImages && oldImages.length > 0) {
          const oldPaths = oldImages.map(img => {
            const parts = img.image_url.split('/');
            return parts.slice(parts.indexOf('checklist_item_images') + 1).join('/');
          });
          await supabase.storage.from('checklist_item_images').remove(oldPaths);
          await supabase
            .from('checklist_item_images')
            .delete()
            .eq('item_id', item.id)
            .eq('user_id', user.id);
        }

        const ext = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${item.id}-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('checklist_item_images')
          .upload(fileName, imageFile);
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('checklist_item_images')
            .getPublicUrl(fileName);
          await supabase
            .from('checklist_item_images')
            .insert({ item_id: item.id, image_url: publicUrl, user_id: user.id });
        }
      }

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
              value={formData.category || "none"}
              onValueChange={(value) =>
                setFormData(prev => ({
                  ...prev,
                  category: value === "none" ? "" : value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Velg kategori (valgfritt)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ingen kategori</SelectItem>
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
              value={formData.season}
              onValueChange={(value) =>
                setFormData(prev => ({ ...prev, season: value as Season }))
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
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
            {item.checklist_item_images && item.checklist_item_images.length > 0 && (
              <img
                src={item.checklist_item_images[0].image_url}
                alt=""
                className="mt-2 max-h-48 rounded"
              />
            )}
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
