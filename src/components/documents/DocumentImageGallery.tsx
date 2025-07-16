import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { X, Edit2, ZoomIn, Upload, Loader2, Sparkles, Pause, Play, Trash2 } from 'lucide-react';
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
  status: 'pending' | 'analyzing' | 'uploading' | 'completed' | 'error' | 'retrying';
  suggestedName?: string;
  description?: string;
  tags?: string[];
  error?: string;
  retryCount?: number;
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

  const analyzeImageWithTimeout = async (file: File, timeoutMs = 30000): Promise<{ 
    suggestedName: string; 
    description: string; 
    tags: string[];
    status: 'success' | 'fallback' | 'error';
    requestId?: string;
    retryable?: boolean;
  }> => {
    console.log(`Starting AI analysis for file: ${file.name} (${file.size} bytes)`);
    
    try {
      // Convert file to base64 for API
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
      
      console.log(`File converted to base64, size: ${base64.length} characters`);
      
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Analyse tidsavbrudd - AI-tjenesten svarer ikke')), timeoutMs);
      });
      
      // Race between API call and timeout
      const apiPromise = supabase.functions.invoke('analyze-document-image', {
        body: {
          imageUrl: base64,
          documentTitle,
          documentCategory
        }
      });
      
      const { data, error } = await Promise.race([apiPromise, timeoutPromise]);

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }
      
      console.log('AI analysis response:', data);
      
      // Check if response contains error but also fallback data
      if (data.error && data.retryable) {
        console.warn('AI analysis failed but is retryable:', data.userMessage);
        return {
          suggestedName: data.suggestedName || file.name,
          description: data.description || 'AI-analyse feilet, kan prøves igjen',
          tags: data.tags || ['dokument'],
          status: 'fallback',
          requestId: data.requestId,
          retryable: true
        };
      } else if (data.error) {
        console.error('AI analysis failed permanently:', data.userMessage);
        throw new Error(data.userMessage || data.error);
      }
      
      return {
        suggestedName: data.suggestedName || file.name,
        description: data.description || '',
        tags: data.tags || [],
        status: data.fromCache ? 'success' : 'success',
        requestId: data.requestId,
        retryable: false
      };
    } catch (error) {
      console.error('Error in analyzeImageWithTimeout:', error);
      
      // Determine if this is a retryable error
      const isRetryable = error.message.includes('tidsavbrudd') || 
                         error.message.includes('network') || 
                         error.message.includes('rate limit');
      
      return {
        suggestedName: file.name,
        description: isRetryable ? 'AI-analyse feilet - kan prøves igjen' : 'Automatisk analyse feilet',
        tags: ['dokument'],
        status: 'error',
        retryable: isRetryable
      };
    }
  };

  const processImageWithRetry = async (file: File, retryCount = 0, maxRetries = 2): Promise<{ 
    success: boolean; 
    analysis?: any; 
    error?: string;
    shouldRetry?: boolean;
  }> => {
    console.log(`Processing ${file.name}, attempt ${retryCount + 1}/${maxRetries + 1}`);
    
    try {
      const analysis = await analyzeImageWithTimeout(file);
      
      // If AI analysis failed but we got fallback data, still try to upload
      const description = analysis.description;
      await uploadImage(file, documentId, description);
      
      console.log(`Successfully processed ${file.name} with status: ${analysis.status}`);
      
      return { 
        success: true, 
        analysis: {
          ...analysis,
          aiStatus: analysis.status // Track AI analysis status separately
        }
      };
    } catch (error) {
      console.error(`Attempt ${retryCount + 1} failed for ${file.name}:`, error);
      
      // Check if this is a retryable error
      const isRetryable = error.message.includes('tidsavbrudd') || 
                         error.message.includes('network') || 
                         error.message.includes('rate limit') ||
                         error.message.includes('503') ||
                         error.message.includes('429');
      
      if (retryCount < maxRetries && isRetryable) {
        console.log(`Retrying ${file.name} in ${Math.pow(2, retryCount)} seconds...`);
        // Exponential backoff
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return processImageWithRetry(file, retryCount + 1, maxRetries);
      }
      
      // Final retry failed or non-retryable error - try upload without AI analysis
      console.log(`All retries exhausted for ${file.name}, uploading without AI analysis`);
      try {
        const fallbackDescription = `Opplastet ${new Date().toLocaleString()} - AI-analyse utilgjengelig`;
        await uploadImage(file, documentId, fallbackDescription);
        return { 
          success: true, 
          analysis: { 
            suggestedName: file.name, 
            description: fallbackDescription, 
            tags: ['manuell'],
            aiStatus: 'failed'
          }
        };
      } catch (uploadError) {
        console.error(`Upload failed for ${file.name}:`, uploadError);
        return { 
          success: false, 
          error: uploadError instanceof Error ? uploadError.message : 'Ukjent opplastingsfeil',
          shouldRetry: false
        };
      }
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

  const processBatch = async (batch: ImageUploadProgress[], batchIndex: number) => {
    const batchPromises = batch.map(async (item, itemIndex) => {
      const globalIndex = batchIndex * 3 + itemIndex;
      
      try {
        // Update status to analyzing
        setUploadQueue(prev => prev.map((q, idx) => 
          idx === globalIndex ? { ...q, status: 'analyzing', progress: 10 } : q
        ));

        const result = await processImageWithRetry(item.file);
        
        if (result.success && result.analysis) {
          setUploadQueue(prev => prev.map((q, idx) => 
            idx === globalIndex ? { 
              ...q, 
              suggestedName: result.analysis.suggestedName,
              description: result.analysis.description,
              tags: result.analysis.tags,
              status: 'completed',
              progress: 100 
            } : q
          ));
        } else {
          setUploadQueue(prev => prev.map((q, idx) => 
            idx === globalIndex ? { 
              ...q, 
              status: 'error', 
              error: result.error || 'Ukjent feil'
            } : q
          ));
        }
      } catch (error) {
        console.error('Error in batch processing:', error);
        setUploadQueue(prev => prev.map((q, idx) => 
          idx === globalIndex ? { 
            ...q, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Ukjent feil'
          } : q
        ));
      }
    });

    await Promise.all(batchPromises);
  };

  const startUploadProcess = async (queueItems: ImageUploadProgress[]) => {
    setUploading(true);
    setIsPaused(false);

    // Process in batches of 3
    const batchSize = 3;
    const batches = [];
    for (let i = 0; i < queueItems.length; i += batchSize) {
      batches.push(queueItems.slice(i, i + batchSize));
    }

    let completedCount = 0;
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      if (isPaused) {
        toast({
          title: "Opplasting pauset",
          description: "Du kan fortsette når som helst",
        });
        break;
      }

      const batch = batches[batchIndex];
      
      // Update batch progress
      setUploadQueue(prev => prev.map((q, idx) => {
        const batchStart = batchIndex * batchSize;
        const batchEnd = batchStart + batchSize;
        if (idx >= batchStart && idx < batchEnd) {
          return { ...q, status: 'analyzing' as const, progress: 5 };
        }
        return q;
      }));

      await processBatch(batch, batchIndex);
      
      // Count completed items in this batch
      const batchCompleted = batch.filter((_, idx) => {
        const globalIdx = batchIndex * batchSize + idx;
        const queueItem = queueItems[globalIdx];
        return queueItem && (queueItem.status === 'completed' || queueItem.status === 'error');
      }).length;
      
      completedCount += batchCompleted;

      // Show progress for each batch
      toast({
        title: "Batch ferdig",
        description: `Batch ${batchIndex + 1}/${batches.length} ferdig. ${completedCount} bilder prosessert totalt.`,
      });

      // Short delay between batches
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    const successCount = queueItems.filter(item => item.status === 'completed').length;
    const errorCount = queueItems.filter(item => item.status === 'error').length;
    
    if (successCount > 0) {
      toast({
        title: "Opplasting fullført",
        description: `${successCount} bilder lastet opp${errorCount > 0 ? `, ${errorCount} feilet` : ''}`,
      });
      onImagesChange();
    }

    setUploading(false);
    
    // Clear queue after a delay
    setTimeout(() => {
      setUploadQueue([]);
    }, 5000);
  };

  const togglePause = () => {
    const newPauseState = !isPaused;
    setIsPaused(newPauseState);
    
    if (!newPauseState && uploadQueue.length > 0) {
      // Resume processing from where we left off
      const pendingItems = uploadQueue.filter(item => 
        item.status === 'pending' || item.status === 'error'
      );
      if (pendingItems.length > 0) {
        startUploadProcess(uploadQueue);
      }
    }
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
              Støtter flere bildefiler samtidig • AI analyserer automatisk • Prosesserer i batches
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
                      {item.status === 'retrying' && (
                        <div className="flex items-center gap-1">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-xs text-muted-foreground">
                            Prøver igjen... ({item.retryCount || 0}/2)
                          </span>
                        </div>
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
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Er du sikker?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Dette vil permanent slette bildet{image.description ? ` "${image.description}"` : ''}. Denne handlingen kan ikke angres.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Avbryt</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteImage(image.id)}>
                          Slett
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
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