
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Loader2, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import { useInventoryAI, InventoryAIResult } from '@/hooks/useInventoryAI';
import { useAddInventoryItem } from '@/hooks/useInventory/index';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { useToast } from '@/state/toast';
import ImageCaptureButton from '@/components/chat/ImageCaptureButton';
import { getAllCategories, getCategorySubcategories } from '@/data/categories';
import { PrimaryLocation } from '@/types/inventory';

export function AIItemDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'capture' | 'analyze' | 'edit'>('capture');
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [analysisResult, setAnalysisResult] = useState<InventoryAIResult | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    subcategory: '',
    brand: '',
    color: '',
    size: '',
    location: '',
    shelf: '',
    family_member_id: '',
    primary_location: 'hjemme' as PrimaryLocation,
    notes: ''
  });

  const { analyzeItemFromImage, loading: aiLoading, error: aiError } = useInventoryAI();
  const addItemMutation = useAddInventoryItem();
  const { data: familyMembers = [] } = useFamilyMembers();
  const { toast } = useToast();

  const handleImageCapture = async (images: string[]) => {
    setCapturedImages(images); // Store all captured images
    setStep('analyze');
    
    try {
      console.log(`[AIItemDialog] Analyzing ${images.length} images with AI`);
      const result = await analyzeItemFromImage(images, familyMembers.map(m => ({
        id: m.id,
        name: m.name,
        nickname: m.nickname,
        height: m.height,
        role: m.role,
        birth_date: m.birth_date
      })));
      
      if (result) {
        setAnalysisResult(result);
        console.log('[AIItemDialog] AI analysis result:', result);
        
        // Enhanced owner matching logic with better name handling
        let suggestedFamilyMemberId = '';
        console.log('[AIItemDialog] Family members available:', familyMembers?.map(m => ({ id: m.id, name: m.name, nickname: m.nickname })));
        console.log('[AIItemDialog] AI suggested owner:', result.suggested_owner);
        
        if (result.suggested_owner?.family_member_id) {
          // Use AI's direct family_member_id if provided
          const directMatch = familyMembers?.find(m => m.id === result.suggested_owner.family_member_id);
          if (directMatch) {
            suggestedFamilyMemberId = result.suggested_owner.family_member_id;
            console.log('[AIItemDialog] Direct ID match:', directMatch.name);
          } else {
            console.log('[AIItemDialog] ID not found in family list:', result.suggested_owner.family_member_id);
          }
        } else if (result.suggested_owner?.name && familyMembers) {
          // Fallback: name matching with exact match priority
          const suggestionName = result.suggested_owner.name.toLowerCase().trim();
          console.log('[AIItemDialog] Trying to match name:', suggestionName);
          
          const matchedMember = familyMembers.find(member => {
            const memberName = member.name.toLowerCase();
            const memberNickname = member.nickname?.toLowerCase();
            
            // Exact name match (highest priority)
            if (memberName === suggestionName) {
              console.log('[AIItemDialog] Exact name match found:', member.name);
              return true;
            }
            
            // Nickname match
            if (memberNickname === suggestionName) {
              console.log('[AIItemDialog] Nickname match found:', member.name);
              return true;
            }
            
            // First name match (extract first name from both)
            const suggestionFirstName = suggestionName.split(' ')[0];
            const memberFirstName = memberName.split(' ')[0];
            
            if (memberFirstName === suggestionFirstName) {
              console.log('[AIItemDialog] First name match found:', member.name);
              return true;
            }
            
            return false;
          });
          
          if (matchedMember) {
            suggestedFamilyMemberId = matchedMember.id;
            console.log('[AIItemDialog] Name match successful:', matchedMember.name);
          } else {
            console.log('[AIItemDialog] No name match found for:', suggestionName);
          }
        }
        
        // Force owner selection if AI didn't suggest one but family members exist
        if (!suggestedFamilyMemberId && familyMembers && familyMembers.length > 0) {
          console.log('[AIItemDialog] AI failed to suggest owner, forcing fallback based on size:', result.size);
          
          // Size-based aggressive fallback
          const size = result.size?.toLowerCase() || '';
          let fallbackMember = null;
          
          if (size.includes('xs') || size.includes('s') || size === '34' || size === '36') {
            // Small sizes - prefer youngest or female family member
            fallbackMember = familyMembers.find(m => m.role?.toLowerCase().includes('barn') || 
                                                   m.role?.toLowerCase().includes('datter')) ||
                            familyMembers.find(m => m.birth_date && new Date().getFullYear() - new Date(m.birth_date).getFullYear() < 18) ||
                            familyMembers[0];
          } else if (size.includes('l') || size.includes('xl') || size === '42' || size === '44' || size === '46') {
            // Large sizes - prefer male/adult family member
            fallbackMember = familyMembers.find(m => m.role?.toLowerCase().includes('far') || 
                                                   m.role?.toLowerCase().includes('sønn')) ||
                            familyMembers.find(m => m.height && m.height > 170) ||
                            familyMembers[0];
          } else {
            // Medium or unknown size - just pick first family member
            fallbackMember = familyMembers[0];
          }
          
          if (fallbackMember) {
            suggestedFamilyMemberId = fallbackMember.id;
            console.log('[AIItemDialog] Forced owner selection:', fallbackMember.name, 'based on size:', size);
          }
        }
        
        if (familyMembers && result.size) {
          // Original size-based matching (kept as secondary option)
          const size = result.size?.toLowerCase();
          const sizeMatchedMember = familyMembers.find(member => {
            if (size === '38' || size === 'm' || size === 'medium') {
              // Size 38/M typically fits adult woman or smaller man
              return member.role === 'parent';
            } else if (size === 's' || size === 'small' || size === '36') {
              // Small sizes - adults
              return member.role === 'parent';
            }
            return false;
          });
          
          if (sizeMatchedMember) {
            suggestedFamilyMemberId = sizeMatchedMember.id;
            console.log(`[AIItemDialog] Aggressive fallback match: ${sizeMatchedMember.name} for size ${result.size}`);
          }
        }
        
        setFormData({
          name: result.name || '',
          description: result.description || '',
          category: result.category || '',
          subcategory: result.subcategory || '',
          brand: result.brand || '',
          color: result.color || '',
          size: result.size || '',
          location: (result as any).location || '',
          shelf: (result as any).shelf || '',
          family_member_id: suggestedFamilyMemberId,
          primary_location: ((result as any).primary_location as PrimaryLocation) || 'hjemme',
          notes: result.suggested_owner?.reason ? `AI-forslag: ${result.suggested_owner.reason}` : ''
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
        family_member_id: formData.family_member_id || undefined,
        primary_location: formData.primary_location,
        images: capturedImages.length > 0 ? await Promise.all(
          capturedImages.map(async (imageUrl, index) => {
            const blob = await fetch(imageUrl).then(r => r.blob());
            return new File([blob], `ai-captured-image-${index + 1}.jpg`, { type: 'image/jpeg' });
          })
        ) : undefined
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
    setCapturedImages([]);
    setAnalysisResult(null);
    setFormData({
      name: '',
      description: '',
      category: '',
      subcategory: '',
      brand: '',
      color: '',
      size: '',
      location: '',
      shelf: '',
      family_member_id: '',
      primary_location: 'hjemme' as PrimaryLocation,
      notes: ''
    });
  };

  const categories = getAllCategories();
  const subcategories = formData.category ? getCategorySubcategories(formData.category) : [];

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
            
            {capturedImages.length > 0 && (
              <div className="flex justify-center">
                <img 
                  src={capturedImages[0]} 
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
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-green-700 text-sm">
                    AI-analyse fullført! Kontroller og juster informasjonen nedenfor.
                  </span>
                </div>
                
                {analysisResult.suggested_owner && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm text-blue-700">
                      <strong>AI foreslår eier:</strong> {analysisResult.suggested_owner.name}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      {analysisResult.suggested_owner.reason} (Sikkerhet: {Math.round(analysisResult.suggested_owner.confidence * 100)}%)
                    </div>
                  </div>
                )}
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
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value, subcategory: '' }))}>
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

              {subcategories.length > 0 && (
                <div>
                  <Label htmlFor="subcategory">Underkategori</Label>
                  <Select value={formData.subcategory} onValueChange={(value) => setFormData(prev => ({ ...prev, subcategory: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Velg underkategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategories.map((subcat) => (
                        <SelectItem key={subcat} value={subcat}>{subcat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

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
                 <Select
                   value={formData.family_member_id || "none"}
                   onValueChange={(value) =>
                     setFormData(prev => ({
                       ...prev,
                       family_member_id: value === "none" ? "" : value,
                     }))
                   }
                 >
                   <SelectTrigger>
                     <SelectValue placeholder="Velg eier" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="none">Ingen spesifikk eier</SelectItem>
                     {familyMembers.map((member) => (
                       <SelectItem key={member.id} value={member.id}>
                         {member.name} {member.nickname ? `(${member.nickname})` : ''}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>

               <div>
                 <Label htmlFor="primary_location">Hvor er den?</Label>
                  <Select
                    value={formData.primary_location}
                    onValueChange={(value: PrimaryLocation) =>
                      setFormData(prev => ({
                        ...prev,
                        primary_location: value,
                      }))
                    }
                 >
                   <SelectTrigger>
                     <SelectValue placeholder="Velg plassering" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="hjemme">Hjemme</SelectItem>
                     <SelectItem value="hytta">På hytta</SelectItem>
                     <SelectItem value="reiser">På reise</SelectItem>
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

            {capturedImages.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-center">Bilder ({capturedImages.length})</div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {capturedImages.map((imageUrl, index) => (
                    <img 
                      key={index}
                      src={imageUrl} 
                      alt={`Captured item ${index + 1}`} 
                      className="w-20 h-20 object-cover border rounded-lg"
                    />
                  ))}
                </div>
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
