
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Loader2, Sparkles } from 'lucide-react';
import { useInventoryAI, InventoryAIResult } from '@/hooks/useInventoryAI';
import { useImageCapture } from '@/hooks/useImageCapture';
import { useAddInventoryItem } from '@/hooks/useInventory';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';

export function AIItemDialog() {
  const [open, setOpen] = useState(false);
  const [aiResult, setAiResult] = useState<InventoryAIResult | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    brand: '',
    color: '',
    size: '',
    location: '',
    shelf: '',
    owner: '',
    notes: '',
    family_member_id: ''
  });

  const { analyzeItemFromImage, loading: aiLoading } = useInventoryAI();
  const { capturedImage, captureFromCamera, selectFromGallery, clearImage, fileInputRef, handleFileSelect } = useImageCapture();
  const addItemMutation = useAddInventoryItem();
  const { data: familyMembers } = useFamilyMembers();

  const handleAnalyzeImage = async () => {
    if (!capturedImage) return;
    
    const result = await analyzeItemFromImage(capturedImage);
    if (result) {
      setAiResult(result);
      setFormData(prev => ({
        ...prev,
        name: result.name,
        description: result.description,
        category: result.category,
        brand: result.brand || '',
        color: result.color || '',
        size: result.size || ''
      }));
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    
    try {
      await addItemMutation.mutateAsync({
        ...formData,
        family_member_id: formData.family_member_id || undefined
      });
      
      setOpen(false);
      setAiResult(null);
      clearImage();
      setFormData({
        name: '',
        description: '',
        category: '',
        brand: '',
        color: '',
        size: '',
        location: '',
        shelf: '',
        owner: '',
        notes: '',
        family_member_id: ''
      });
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Sparkles className="h-4 w-4" />
          AI Legg til
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Legg til med AI
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!capturedImage ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">Ta et bilde av gjenstanden for automatisk identifikasjon</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={captureFromCamera} variant="outline">
                  <Camera className="h-4 w-4 mr-2" />
                  Ta bilde
                </Button>
                <Button onClick={selectFromGallery} variant="outline">
                  Velg fra galleri
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <img src={capturedImage} alt="Captured item" className="w-full h-48 object-cover rounded border" />
                <Button
                  onClick={clearImage}
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                >
                  ×
                </Button>
              </div>
              
              {!aiResult ? (
                <Button 
                  onClick={handleAnalyzeImage} 
                  disabled={aiLoading}
                  className="w-full"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyserer...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Analyser med AI
                    </>
                  )}
                </Button>
              ) : (
                <div className="bg-green-50 p-3 rounded border">
                  <p className="text-sm font-medium text-green-800">AI Analyse fullført!</p>
                  <p className="text-xs text-green-600">Konfidans: {Math.round(aiResult.confidence * 100)}%</p>
                </div>
              )}
            </div>
          )}
          
          {aiResult && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Navn *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Navn på gjenstanden"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Beskrivelse</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Beskrivelse av gjenstanden"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Kategori</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Velg kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Klær">Klær</SelectItem>
                      <SelectItem value="Langrennski">Langrennski</SelectItem>
                      <SelectItem value="Langrennstaver">Langrennstaver</SelectItem>
                      <SelectItem value="Alpint">Alpint</SelectItem>
                      <SelectItem value="Verktøy">Verktøy</SelectItem>
                      <SelectItem value="Kjøkkenutstyr">Kjøkkenutstyr</SelectItem>
                      <SelectItem value="Møbler">Møbler</SelectItem>
                      <SelectItem value="Elektronikk">Elektronikk</SelectItem>
                      <SelectItem value="Sport">Sport</SelectItem>
                      <SelectItem value="Annet">Annet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="family_member">Eier</Label>
                  <Select value={formData.family_member_id} onValueChange={(value) => setFormData(prev => ({ ...prev, family_member_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Velg eier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Ingen spesifikk eier</SelectItem>
                      {familyMembers?.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name} {member.nickname ? `(${member.nickname})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="brand">Merke</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                    placeholder="Merke"
                  />
                </div>
                
                <div>
                  <Label htmlFor="color">Farge</Label>
                  <Input
                    id="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    placeholder="Farge"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Plassering</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Rom/område"
                  />
                </div>
                
                <div>
                  <Label htmlFor="shelf">Hylle/Skuff</Label>
                  <Input
                    id="shelf"
                    value={formData.shelf}
                    onChange={(e) => setFormData(prev => ({ ...prev, shelf: e.target.value }))}
                    placeholder="Hylle/skuff"
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleSave} 
                disabled={addItemMutation.isPending || !formData.name.trim()}
                className="w-full"
              >
                {addItemMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Lagrer...
                  </>
                ) : (
                  'Lagre gjenstand'
                )}
              </Button>
            </div>
          )}
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  );
}
