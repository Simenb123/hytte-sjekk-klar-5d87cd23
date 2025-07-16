import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ImageIcon, Upload, Trash2, Edit3, ZoomIn } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

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
  images: DocumentImage[];
  onImagesChange: () => void;
  uploadImage: (file: File, documentId: string, description?: string) => Promise<string>;
  updateImageDescription: (imageId: string, description: string) => Promise<void>;
  deleteImage: (imageId: string) => Promise<void>;
}

export default function DocumentImageGallery({
  documentId,
  images,
  onImagesChange,
  uploadImage,
  updateImageDescription,
  deleteImage
}: DocumentImageGalleryProps) {
  const [uploading, setUploading] = useState(false);
  const [editingImage, setEditingImage] = useState<DocumentImage | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [descriptions, setDescriptions] = useState<string[]>([]);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      toast({
        title: "Kun bildefiler tillatt",
        description: "Velg kun JPG, PNG, GIF eller WEBP filer",
        variant: "destructive"
      });
    }
    
    setSelectedFiles(imageFiles);
    setDescriptions(new Array(imageFiles.length).fill(''));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    setUploading(true);
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        await uploadImage(selectedFiles[i], documentId, descriptions[i] || undefined);
      }
      toast({
        title: "Bilder lastet opp",
        description: `${selectedFiles.length} bilde(r) ble lastet opp`
      });
      setSelectedFiles([]);
      setDescriptions([]);
      onImagesChange();
    } catch (error) {
      toast({
        title: "Feil ved opplasting",
        description: "Kunne ikke laste opp bildene",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleEditDescription = async () => {
    if (!editingImage) return;
    
    try {
      await updateImageDescription(editingImage.id, editDescription);
      toast({
        title: "Beskrivelse oppdatert",
        description: "Bildebeskrivelsen er oppdatert"
      });
      setEditingImage(null);
      onImagesChange();
    } catch (error) {
      toast({
        title: "Feil",
        description: "Kunne ikke oppdatere beskrivelsen",
        variant: "destructive"
      });
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      await deleteImage(imageId);
      toast({
        title: "Bilde slettet",
        description: "Bildet ble slettet"
      });
      onImagesChange();
    } catch (error) {
      toast({
        title: "Feil",
        description: "Kunne ikke slette bildet",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ImageIcon className="h-5 w-5" />
        <h3 className="text-lg font-medium">Bilder ({images.length})</h3>
      </div>

      {/* Upload Section */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div>
            <Input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="mb-2"
            />
            <p className="text-sm text-muted-foreground">
              Velg én eller flere bildefiler (JPG, PNG, GIF, WEBP)
            </p>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Valgte filer:</h4>
              {selectedFiles.map((file, index) => (
                <div key={index} className="space-y-2">
                  <p className="text-sm font-medium">{file.name}</p>
                  <Textarea
                    placeholder="Legg til beskrivelse (valgfritt)"
                    value={descriptions[index]}
                    onChange={(e) => {
                      const newDescriptions = [...descriptions];
                      newDescriptions[index] = e.target.value;
                      setDescriptions(newDescriptions);
                    }}
                    rows={2}
                  />
                </div>
              ))}
              <Button 
                onClick={handleUpload} 
                disabled={uploading}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Laster opp...' : `Last opp ${selectedFiles.length} bilde(r)`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((image) => (
            <Card key={image.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative group">
                  <img
                    src={image.image_url}
                    alt={image.description || 'Dokumentbilde'}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
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
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Slett bilde</AlertDialogTitle>
                          <AlertDialogDescription>
                            Er du sikker på at du vil slette dette bildet? Denne handlingen kan ikke angres.
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
                  <div className="p-3">
                    <p className="text-sm text-muted-foreground">
                      {image.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Description Dialog */}
      {editingImage && (
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
      )}
    </div>
  );
}