
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Loader2, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import { useInventoryAI } from '@/hooks/useInventoryAI';
import { useAddInventoryItem } from '@/hooks/useInventory';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { useToast } from '@/state/toast';
import ImageCaptureButton from '@/components/ImageCaptureButton';

export function AIItemDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'capture' | 'analyze' | 'edit'>('capture');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    brand: '',
    color: '',
    size: '',
    location: '',
    shelf: '',
    family_member_id: '',
    notes: ''
  });

  const { analyzeItemFromImage, loading: aiLoading, error: aiError } = useInventoryAI();
  const addItemMutation = useAddInventoryItem();
  const { data: familyMembers = [] } = useFamilyMembers();
  const { toast } = useToast();

  const handleImageCapture = async (image: string) => {
    setCapturedImage(image);
    setStep('analyze');
    
    try {
      const result = await analyzeItemFromImage(image);
      if (result) {
        setAnalysisResult(result);
        setFormData({
          name: result.name || '',
          description: result.description || '',
          category: result.category || '',
          brand: result.brand || '',
          color: result.color || '',
          size: result.size || '',
          location: '',
          shelf: '',
          family_member_id: '',
          notes: ''
        });
        setStep('edit');
      }
    } catch (error) {
      console.error('AI analysis failed:', error);
      toast({
        title: "Analyse feilet",
        description: "Kunne ikke analysere bildet. Prøv igjen.",
        variant: "destructive",
      });
      setStep('capture');
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Navn mangler",
        description: "Vennligst fyll inn navn på gjenstanden.",
        variant: "destructive",
      });
      return;
    }

    try {
      await addItemMutation.mutateAsync({
        ...formData,
        family_member_id: formData.family_member_id || undefined
      });
      
      toast({
        title: "Gjenstand lagt til",
        description: "Gjenstanden er lagt til i inventaret.",
      });
      
      handleReset();
      setOpen(false);
    } catch (error) {
      console.error('Error adding item:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke legge til gjenstanden.",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    setStep('capture');
    setCapturedImage(null);
    setAnalysisResult(null);
    setFormData({
      name: '',
      description: '',
      category: '',
      brand: '',
      color: '',
      size: '',
      location: '',
      shelf: '',
      family_member_id: '',
      notes: ''
    });
  };

  const categories = [
    'Klær', 'Langrennski', 'Langrennstaver', 'Alpint', 'Verktøy', 
    'Kjøkkenutstyr', 'Møbler', 'Elektronikk', 'Sport', 'Annet'
  ];

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) handleReset();
    }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Sparkles className="h-4 w-4" />
          AI Analyse
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Inventaranalyse
          </DialogTitle>
        </DialogHeader>

        {step === 'capture' && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Ta et bilde av gjenstanden du vil legge til i inventaret. 
                AI vil analysere bildet og foreslå informasjon automatisk.
              </p>
            </div>
            
            <div className="flex justify-center">
              <ImageCaptureButton 
                onImageCapture={handleImageCapture}
                disabled={aiLoading}
              />
            </div>
            
            {aiError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-red-700 text-sm">{aiError}</span>
              </div>
            )}
          </div>
        )}

        {step === 'analyze' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
              <p className="text-gray-600">
                Analyserer bilde med AI...
              </p>
            </div>
            
            {capturedImage && (
              <div className="flex justify-center">
                <img 
                  src={capturedImage} 
                  alt="Captured item" 
                  className="max-w-xs max-h-48 object-contain border rounded-lg"
                />
              </div>
            )}
          </div>
        )}

        {step === 'edit' && (
          <div className="space-y-6">
            {analysisResult && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-green-700 text-sm">
                  AI-analyse fullført! Kontroller og juster informasjonen nedenfor.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="name">Navn *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Navn på gjenstanden"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Beskrivelse</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detaljert beskrivelse"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="category">Kategori</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="brand">Merke</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                  placeholder="Merke/produsent"
                />
              </div>

              <div>
                <Label htmlFor="color">Farge</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  placeholder="Hovedfarge"
                />
              </div>

              <div>
                <Label htmlFor="size">Størrelse</Label>
                <Input
                  id="size"
                  value={formData.size}
                  onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
                  placeholder="Størrelse"
                />
              </div>

              <div>
                <Label htmlFor="location">Plassering</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Hvor er gjenstanden?"
                />
              </div>

              <div>
                <Label htmlFor="shelf">Hylle/Skuff</Label>
                <Input
                  id="shelf"
                  value={formData.shelf}
                  onChange={(e) => setFormData(prev => ({ ...prev, shelf: e.target.value }))}
                  placeholder="Spesifikk plassering"
                />
              </div>

              <div>
                <Label htmlFor="owner">Eier</Label>
                <Select value={formData.family_member_id} onValueChange={(value) => setFormData(prev => ({ ...prev, family_member_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg eier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Ingen spesifikk eier</SelectItem>
                    {familyMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} {member.nickname ? `(${member.nickname})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="notes">Notater</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Ytterligere notater"
                  rows={2}
                />
              </div>
            </div>

            {capturedImage && (
              <div className="flex justify-center">
                <img 
                  src={capturedImage} 
                  alt="Captured item" 
                  className="max-w-xs max-h-32 object-contain border rounded-lg"
                />
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleReset}
                className="flex-1"
              >
                Start på nytt
              </Button>
              <Button 
                onClick={handleSave}
                disabled={addItemMutation.isPending || !formData.name.trim()}
                className="flex-1"
              >
                {addItemMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Lagrer...
                  </>
                ) : (
                  'Legg til i inventar'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
