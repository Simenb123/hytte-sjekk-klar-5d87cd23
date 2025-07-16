import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { X, Edit2, ZoomIn, Upload, Loader2, Sparkles, Pause, Play } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DocumentImage {
  id: string;
  document_id: string;
  image_url: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface DocumentImageGalleryProps {
  documentId: string;
  documentTitle: string;
  documentCategory: string;
  images: DocumentImage[];
  onImagesChange: () => void;
  uploadImage: (file: File, documentId: string, description?: string) => Promise<string>;
  updateImageDescription: (imageId: string, description: string) => Promise<void>;
  deleteImage: (imageId: string) => Promise<void>;
}

interface ImageUploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'analyzing' | 'uploading' | 'completed' | 'error';
  suggestedName?: string;
  description?: string;
  tags?: string[];
  error?: string;
}

const DocumentImageGallery: React.FC<DocumentImageGalleryProps> = ({
  documentId,
  documentTitle,
  documentCategory,
  images,
  onImagesChange,
  uploadImage,
  updateImageDescription,
  deleteImage,
}) => {
  const { toast } = useToast();
  const [uploadQueue, setUploadQueue] = useState<ImageUploadProgress[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [editingImage, setEditingImage] = useState<DocumentImage | null>(null);
  const [editDescription, setEditDescription] = useState('');

  const analyzeImage = async (file: File): Promise<{ suggestedName: string; description: string; tags: string[] }> => {
    try {
      // Convert file to base64 for API
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.readAsDataURL(file);
      });
      
      const { data, error } = await supabase.functions.invoke('analyze-document-image', {
        body: {
          imageUrl: base64,
          documentTitle,
          documentCategory
        }
      });

      if (error) throw error;
      
      return {
        suggestedName: data.suggestedName || file.name,
        description: data.description || '',
        tags: data.tags || []
      };
    } catch (error) {
      console.error('Error analyzing image:', error);
      return {
        suggestedName: file.name,
        description: '',
        tags: []
      };
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      toast({
        title: "Advarsel",
        description: "Kun bildefiler er tillatt",
        variant: "destructive",
      });
    }

    if (imageFiles.length === 0) return;

    // Add files to upload queue
    const newQueueItems: ImageUploadProgress[] = imageFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending'
    }));

    setUploadQueue(newQueueItems);
    startUploadProcess(newQueueItems);
  };

  const startUploadProcess = async (queueItems: ImageUploadProgress[]) => {
    setUploading(true);
    setIsPaused(false);

    for (let i = 0; i < queueItems.length; i++) {
      if (isPaused) break;

      const item = queueItems[i];
      
      try {
        // Update status to analyzing
        setUploadQueue(prev => prev.map((q, idx) => 
          idx === i ? { ...q, status: 'analyzing', progress: 10 } : q
        ));

        // Analyze image with AI
        const analysis = await analyzeImage(item.file);
        
        setUploadQueue(prev => prev.map((q, idx) => 
          idx === i ? { 
            ...q, 
            suggestedName: analysis.suggestedName,
            description: analysis.description,
            tags: analysis.tags,
            status: 'uploading',
            progress: 50 
          } : q
        ));

        // Upload image
        await uploadImage(item.file, documentId, analysis.description);
        
        setUploadQueue(prev => prev.map((q, idx) => 
          idx === i ? { ...q, status: 'completed', progress: 100 } : q
        ));

      } catch (error) {
        console.error('Error processing image:', error);
        setUploadQueue(prev => prev.map((q, idx) => 
          idx === i ? { 
            ...q, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Ukjent feil' 
          } : q
        ));
      }
    }

    const completedCount = queueItems.filter(item => item.status === 'completed').length;
    if (completedCount > 0) {
      toast({
        title: "Suksess",
        description: `${completedCount} bilde(r) lastet opp og analysert`,
      });
      onImagesChange();
    }

    setUploading(false);
    
    // Clear queue after a delay
    setTimeout(() => {
      setUploadQueue([]);
    }, 3000);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const clearQueue = () => {
    setUploadQueue([]);
    setUploading(false);
    setIsPaused(false);
  };

  const handleEditDescription = async () => {
    if (!editingImage) return;
    
    try {
      await updateImageDescription(editingImage.id, editDescription);
      toast({
        title: "Suksess",
        description: "Bildebeskrivelsen ble oppdatert",
      });
      setEditingImage(null);
      onImagesChange();
    } catch (error) {
      console.error('Error updating description:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke oppdatere beskrivelsen",
        variant: "destructive",
      });
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      await deleteImage(imageId);
      toast({
        title: "Suksess",
        description: "Bildet ble slettet",
      });
      onImagesChange();
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke slette bildet",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-border rounded-lg p-6">
        <div className="text-center space-y-4">
          <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
          <div>
            <Label htmlFor="image-upload" className="cursor-pointer">
              <span className="text-sm font-medium">Velg bilder</span>
              <Input
                id="image-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              Støtter flere bildefiler samtidig • AI analyserer automatisk
            </p>
          </div>
        </div>
        
        {uploadQueue.length > 0 && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Opplastingskø ({uploadQueue.length} bilder)</h4>
              {uploading && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={togglePause}
                    className="h-8"
                  >
                    {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    {isPaused ? 'Fortsett' : 'Pause'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearQueue}
                    className="h-8"
                  >
                    <X className="h-4 w-4" />
                    Avbryt
                  </Button>
                </div>
              )}
            </div>
            
            {uploadQueue.map((item, index) => (
              <Card key={index} className="p-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">
                      {item.suggestedName || item.file.name}
                    </span>
                    <div className="flex items-center gap-2">
                      {item.status === 'analyzing' && (
                        <div className="flex items-center gap-1">
                          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                          <span className="text-xs text-muted-foreground">AI analyserer...</span>
                        </div>
                      )}
                      {item.status === 'uploading' && (
                        <div className="flex items-center gap-1">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-xs text-muted-foreground">Laster opp...</span>
                        </div>
                      )}
                      {item.status === 'completed' && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Ferdig
                        </Badge>
                      )}
                      {item.status === 'error' && (
                        <Badge variant="destructive">
                          Feil
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {item.progress > 0 && (
                    <Progress value={item.progress} className="h-2" />
                  )}
                  
                  {item.description && (
                    <p className="text-xs text-muted-foreground italic">
                      {item.description}
                    </p>
                  )}
                  
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.tags.map((tag, tagIndex) => (
                        <Badge key={tagIndex} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {item.error && (
                    <p className="text-xs text-destructive">
                      Feil: {item.error}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((image) => (
            <Card key={image.id} className="overflow-hidden">
              <div className="relative group">
                <img
                  src={image.image_url}
                  alt={image.description || 'Dokumentbilde'}
                  className="w-full h-48 object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="secondary">
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>Forstørret bilde</DialogTitle>
                      </DialogHeader>
                      <img
                        src={image.image_url}
                        alt={image.description || 'Dokumentbilde'}
                        className="w-full h-auto max-h-[70vh] object-contain"
                      />
                      {image.description && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {image.description}
                        </p>
                      )}
                    </DialogContent>
                  </Dialog>
                  
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setEditingImage(image);
                      setEditDescription(image.description || '');
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteImage(image.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {image.description && (
                <CardContent className="p-3">
                  <p className="text-sm text-muted-foreground">
                    {image.description}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Edit Description Dialog */}
      <Dialog open={!!editingImage} onOpenChange={() => setEditingImage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rediger bildebeskrivelse</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Skriv inn beskrivelse..."
              rows={3}
            />
            <div className="flex gap-2">
              <Button onClick={handleEditDescription} className="flex-1">
                Lagre
              </Button>
              <Button variant="outline" onClick={() => setEditingImage(null)}>
                Avbryt
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentImageGallery;