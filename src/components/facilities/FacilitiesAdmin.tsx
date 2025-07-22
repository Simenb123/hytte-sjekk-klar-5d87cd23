import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  useFacilities, 
  useCreateFacility, 
  useUpdateFacility, 
  useDeleteFacility,
  type Facility 
} from "@/hooks/useFacilities";
import ChecklistLoading from "@/components/checklist/ChecklistLoading";
import ChecklistError from "@/components/checklist/ChecklistError";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, ChefHat, Wrench, GamepadIcon, MoreHorizontal } from "lucide-react";

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'cooking': return ChefHat;
    case 'tools': return Wrench;
    case 'entertainment': return GamepadIcon;
    default: return MoreHorizontal;
  }
};

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'cooking': return 'Matlaging';
    case 'tools': return 'Redskaper';
    case 'entertainment': return 'Fornøyelse';
    case 'other': return 'Annet';
    default: return category;
  }
};

interface FacilityFormData {
  name: string;
  category: string;
  description: string;
  icon_url: string;
  is_seasonal: boolean;
  season: string;
}

const initialFormData: FacilityFormData = {
  name: '',
  category: 'other',
  description: '',
  icon_url: '',
  is_seasonal: false,
  season: 'all',
};

export const FacilitiesAdmin = () => {
  const { data: facilities, isLoading, error } = useFacilities();
  const createFacility = useCreateFacility();
  const updateFacility = useUpdateFacility();
  const deleteFacility = useDeleteFacility();
  
  const [formData, setFormData] = useState<FacilityFormData>(initialFormData);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (isLoading) return <ChecklistLoading />;
  if (error) return <ChecklistError error={error.message} />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingFacility) {
        await updateFacility.mutateAsync({
          id: editingFacility.id,
          updates: formData
        });
      } else {
        await createFacility.mutateAsync(formData);
      }
      
      setFormData(initialFormData);
      setEditingFacility(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving facility:', error);
    }
  };

  const handleEdit = (facility: Facility) => {
    setEditingFacility(facility);
    setFormData({
      name: facility.name,
      category: facility.category,
      description: facility.description || '',
      icon_url: facility.icon_url || '',
      is_seasonal: facility.is_seasonal,
      season: facility.season,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteFacility.mutateAsync(id);
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingFacility(null);
  };

  const groupedFacilities = facilities?.reduce((acc, facility) => {
    if (!acc[facility.category]) {
      acc[facility.category] = [];
    }
    acc[facility.category].push(facility);
    return acc;
  }, {} as Record<string, Facility[]>) || {};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Fasilitetsadministrasjon</h2>
          <p className="text-muted-foreground">
            Administrer fasilitetene på hytta
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Ny fasilitet
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingFacility ? 'Rediger fasilitet' : 'Ny fasilitet'}
              </DialogTitle>
              <DialogDescription>
                {editingFacility ? 'Oppdater' : 'Opprett'} fasilitetsinformasjon
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Navn</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="category">Kategori</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Velg kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cooking">Matlaging</SelectItem>
                    <SelectItem value="tools">Redskaper</SelectItem>
                    <SelectItem value="entertainment">Fornøyelse</SelectItem>
                    <SelectItem value="other">Annet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="description">Beskrivelse</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="icon_url">Ikon URL</Label>
                <Input
                  id="icon_url"
                  type="url"
                  value={formData.icon_url}
                  onChange={(e) => setFormData({ ...formData, icon_url: e.target.value })}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_seasonal"
                  checked={formData.is_seasonal}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, is_seasonal: checked })
                  }
                />
                <Label htmlFor="is_seasonal">Sesongavhengig</Label>
              </div>
              
              {formData.is_seasonal && (
                <div>
                  <Label htmlFor="season">Sesong</Label>
                  <Select
                    value={formData.season}
                    onValueChange={(value) => setFormData({ ...formData, season: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Velg sesong" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="winter">Vinter</SelectItem>
                      <SelectItem value="summer">Sommer</SelectItem>
                      <SelectItem value="all">Hele året</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingFacility ? 'Oppdater' : 'Opprett'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Avbryt
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {Object.entries(groupedFacilities).map(([category, categoryFacilities]) => {
        const CategoryIcon = getCategoryIcon(category);
        
        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CategoryIcon className="h-5 w-5" />
                {getCategoryLabel(category)}
              </CardTitle>
              <CardDescription>
                {categoryFacilities.length} fasilitet(er)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categoryFacilities.map((facility) => (
                  <div 
                    key={facility.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{facility.name}</h4>
                        {facility.is_seasonal && (
                          <Badge variant="secondary">
                            {facility.season === 'winter' ? 'Vinter' : 
                             facility.season === 'summer' ? 'Sommer' : 'Hele året'}
                          </Badge>
                        )}
                      </div>
                      {facility.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {facility.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(facility)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Slett fasilitet</AlertDialogTitle>
                            <AlertDialogDescription>
                              Er du sikker på at du vil slette "{facility.name}"? 
                              Denne handlingen kan ikke angres.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Avbryt</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(facility.id)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Slett
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};