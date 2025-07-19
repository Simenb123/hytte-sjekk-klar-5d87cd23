import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { X, Edit2, ZoomIn, Upload, Loader2, Sparkles, Pause, Play, Trash2, ChevronLeft, ChevronRight, Search, Filter, Star, StarOff } from 'lucide-react';
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
  frontPageImageId?: string;
  onImagesChange: () => void;
  uploadImage: (file: File, documentId: string, description?: string) => Promise<string>;
  updateImageDescription: (imageId: string, description: string) => Promise<void>;
  deleteImage: (imageId: string) => Promise<void>;
  setFrontPageImage: (documentId: string, imageId: string) => Promise<void>;
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
  frontPageImageId,
  onImagesChange,
  uploadImage,
  updateImageDescription,
  deleteImage,
  setFrontPageImage,
}) => {
  const { toast } = useToast();
  const [uploadQueue, setUploadQueue] = useState<ImageUploadProgress[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedImage, setSelectedImage] = useState<DocumentImage | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(-1);
  const [editingImage, setEditingImage] = useState<DocumentImage | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

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

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
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
  }, [toast, startUploadProcess]);

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

  const handleSetFrontPageImage = async (imageId: string) => {
    try {
      await setFrontPageImage(documentId, imageId);
      toast({
        title: "Forsidebilde satt",
        description: "Bildet er nå forsidebildet for dokumentet",
      });
    } catch (error) {
      console.error('Error setting front page image:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke sette forsidebilde",
        variant: "destructive",
      });
    }
  };

  const filteredImages = images.filter(image => 
    !searchTerm || 
    image.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    image.image_url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openImageModal = (image: DocumentImage, index: number) => {
    setSelectedImage(image);
    setSelectedImageIndex(index);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && selectedImageIndex > 0) {
      const newIndex = selectedImageIndex - 1;
      setSelectedImage(filteredImages[newIndex]);
      setSelectedImageIndex(newIndex);
    } else if (direction === 'next' && selectedImageIndex < filteredImages.length - 1) {
      const newIndex = selectedImageIndex + 1;
      setSelectedImage(filteredImages[newIndex]);
      setSelectedImageIndex(newIndex);
    }
  };

  const generateImageTitle = (description?: string): string => {
    if (!description) return 'Dokumentbilde';
    
    // If description is short (under 40 characters), use as-is
    if (description.length <= 40) return description;
    
    // Look for plant/species names (capitalize words that start sentences)
    const sentences = description.split('.').filter(s => s.trim());
    if (sentences.length > 0) {
      const firstSentence = sentences[0].trim();
      if (firstSentence.length <= 50) return firstSentence;
    }
    
    // Use first 35 characters + ellipsis
    return description.slice(0, 35).trim() + '...';
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Upload Area with Drag & Drop */}
      <div 
        className={`border-2 border-dashed rounded-lg p-6 transition-all duration-200 cursor-pointer relative ${
          isDragOver 
            ? 'border-primary bg-primary/5 scale-[1.02]' 
            : uploading 
              ? 'border-muted-foreground/50 bg-muted/30'
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/2'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!uploading) {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = 'image/*';
            input.onchange = (e) => {
              const files = Array.from((e.target as HTMLInputElement).files || []);
              if (files.length > 0) {
                handleFileSelect({ target: { files } } as any);
              }
            };
            input.click();
          }
        }}
      >
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <div className={`rounded-full p-4 transition-colors ${
              isDragOver ? 'bg-primary/10' : 'bg-muted'
            }`}>
              <Upload className={`h-8 w-8 transition-colors ${
                isDragOver ? 'text-primary' : 'text-muted-foreground'
              }`} />
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium">
              {uploading ? 'Laster opp bilder...' : 'Last opp bilder'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {uploading 
                ? 'Vennligst vent mens bildene blir prosessert'
                : isDragOver 
                  ? 'Slipp bildene her'
                  : 'Dra og slipp bilder her, eller klikk for å velge'
              }
            </p>
          </div>
          
          <div className="text-xs text-muted-foreground">
            <p>PNG, JPG, GIF opp til 10MB • Flere bilder støttes</p>
            <p className="flex items-center justify-center gap-1 mt-1">
              <Sparkles className="h-3 w-3" />
              AI analyserer automatisk
            </p>
          </div>
        </div>
        
        {/* Hidden file input - backup for browsers without good drag support */}
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          disabled={uploading}
        />
      </div>

      {/* Upload Queue */}
      {uploadQueue.length > 0 && (
        <div className="space-y-3">
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

      {/* Search and Filter */}
      {images.length > 0 && (
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Søk i bilder..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Badge variant="outline">
            {filteredImages.length} bilder
          </Badge>
        </div>
      )}

      {/* Images Masonry Grid */}
      {filteredImages.length > 0 && (
        <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
          {filteredImages.map((image, index) => (
            <Card 
              key={image.id} 
              className={`break-inside-avoid overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                frontPageImageId === image.id ? 'ring-2 ring-primary shadow-lg' : ''
              }`}
              onClick={() => openImageModal(image, index)}
            >
              <div className="relative">
                <img
                  src={image.image_url}
                  alt={image.description || 'Dokumentbilde'}
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                </div>
                
                {/* Front page indicator */}
                {frontPageImageId === image.id && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-primary text-primary-foreground shadow-lg">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Forsidebilde
                    </Badge>
                  </div>
                )}
                
                {/* Quick actions on hover */}
                <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 w-7 p-0 shadow-lg bg-background/90 hover:bg-background"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetFrontPageImage(image.id);
                      }}
                    >
                      {frontPageImageId === image.id ? (
                        <Star className="h-3 w-3 fill-current text-yellow-500" />
                      ) : (
                        <StarOff className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              {image.description && (
                <div className="p-3">
                  <p className="text-xs text-muted-foreground line-clamp-2">{image.description}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Image Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => {setSelectedImage(null); setSelectedImageIndex(-1);}}>
        <DialogContent className="max-w-6xl max-h-[95vh] p-2">
          <button
            onClick={() => {setSelectedImage(null); setSelectedImageIndex(-1);}}
            className="absolute top-3 right-3 z-50 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors shadow-lg"
          >
            <X className="h-5 w-5" />
          </button>
          
          <DialogHeader className="px-4 pt-4 pr-16">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg">
                {generateImageTitle(selectedImage?.description)}
              </DialogTitle>
              <div className="flex items-center gap-2">
                {selectedImage && frontPageImageId === selectedImage.id && (
                  <Badge className="bg-primary text-primary-foreground">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Forsidebilde
                  </Badge>
                )}
                <Badge variant="outline">
                  {selectedImageIndex + 1} av {filteredImages.length}
                </Badge>
              </div>
            </div>
          </DialogHeader>
          
          {selectedImage && (
            <div className="space-y-4 px-4 pb-4">
              <div className="relative group">
                <div className="flex justify-center">
                  <img
                    src={selectedImage.image_url}
                    alt={selectedImage.description || 'Dokumentbilde'}
                    className="max-w-full max-h-[65vh] object-contain rounded-lg"
                  />
                </div>
                
                {/* Navigation arrows */}
                {selectedImageIndex > 0 && (
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 w-12 h-12 rounded-full bg-background/90 backdrop-blur-sm hover:bg-background shadow-lg transition-all duration-200 hover:scale-105 opacity-80 hover:opacity-100"
                    onClick={() => navigateImage('prev')}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                )}
                
                {selectedImageIndex < filteredImages.length - 1 && (
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 w-12 h-12 rounded-full bg-background/90 backdrop-blur-sm hover:bg-background shadow-lg transition-all duration-200 hover:scale-105 opacity-80 hover:opacity-100"
                    onClick={() => navigateImage('next')}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                )}
              </div>
              
              {selectedImage.description && selectedImage.description.length > 40 && (
                <div className="text-sm">
                  <p className="font-medium text-muted-foreground">Full beskrivelse</p>
                  <p className="mt-1">{selectedImage.description}</p>
                </div>
              )}
              
              <div className="text-sm">
                <p className="font-medium text-muted-foreground">Opprettet</p>
                <p className="mt-1">{new Date(selectedImage.created_at).toLocaleDateString('no-NO', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              </div>
              
              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingImage(selectedImage);
                    setEditDescription(selectedImage.description || '');
                    setSelectedImage(null);
                    setSelectedImageIndex(-1);
                  }}
                  className="flex-1 min-w-[140px]"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Rediger
                </Button>

                <Button
                  variant={frontPageImageId === selectedImage.id ? "default" : "outline"}
                  onClick={() => handleSetFrontPageImage(selectedImage.id)}
                  className="flex-1 min-w-[140px]"
                >
                  {frontPageImageId === selectedImage.id ? (
                    <Star className="h-4 w-4 mr-2 fill-current" />
                  ) : (
                    <StarOff className="h-4 w-4 mr-2" />
                  )}
                  {frontPageImageId === selectedImage.id ? 'Forsidebilde' : 'Sett som forsidebilde'}
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="flex-1 min-w-[100px]">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Slett
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Er du sikker?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Dette vil permanent slette bildet{selectedImage.description ? ` "${selectedImage.description}"` : ''}. Denne handlingen kan ikke angres.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Avbryt</AlertDialogCancel>
                      <AlertDialogAction onClick={() => {
                        handleDeleteImage(selectedImage.id);
                        setSelectedImage(null);
                        setSelectedImageIndex(-1);
                      }}>
                        Slett
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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