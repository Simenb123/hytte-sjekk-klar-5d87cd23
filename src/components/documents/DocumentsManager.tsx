import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Search, Plus, Edit, Trash2, FileText, Eye } from 'lucide-react';
import { useCabinDocuments, CabinDocument, SearchResult, DocumentImage } from '@/hooks/useCabinDocuments';
import DocumentImageGallery from './DocumentImageGallery';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

const DocumentsManager: React.FC = () => {
  const { 
    documents, 
    loading, 
    fetchDocuments, 
    searchDocuments, 
    addDocument, 
    updateDocument, 
    deleteDocument,
    uploadDocumentImage,
    getDocumentImages,
    updateImageDescription,
    deleteDocumentImage
  } = useCabinDocuments();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDoc, setEditingDoc] = useState<CabinDocument | null>(null);
  const [viewingDoc, setViewingDoc] = useState<CabinDocument | null>(null);
  const [documentImages, setDocumentImages] = useState<DocumentImage[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    content: '',
    summary: '',
    tags: '',
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      const results = await searchDocuments(searchQuery);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const docData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      };

      if (editingDoc) {
        await updateDocument(editingDoc.id, docData, file ?? undefined);
        setEditingDoc(null);
      } else {
        await addDocument(docData, file ?? undefined);
      }

      setFormData({ title: '', category: '', content: '', summary: '', tags: '' });
      setFile(null);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error('Kunne ikke lagre dokument');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (doc: CabinDocument) => {
    setEditingDoc(doc);
    setFormData({
      title: doc.title,
      category: doc.category,
      content: doc.content,
      summary: doc.summary || '',
      tags: (doc.tags || []).join(', '),
    });
    setFile(null);
    setShowAddForm(true);
  };

  const cancelEdit = () => {
    setEditingDoc(null);
    setViewingDoc(null);
    setFormData({ title: '', category: '', content: '', summary: '', tags: '' });
    setFile(null);
    setShowAddForm(false);
  };

  const viewDocument = async (doc: CabinDocument) => {
    setViewingDoc(doc);
    try {
      const images = await getDocumentImages(doc.id);
      setDocumentImages(images);
    } catch (error) {
      console.error('Feil ved henting av bilder:', error);
    }
  };

  const refreshDocumentImages = async () => {
    if (viewingDoc) {
      try {
        const images = await getDocumentImages(viewingDoc.id);
        setDocumentImages(images);
      } catch (error) {
        console.error('Feil ved oppdatering av bilder:', error);
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDocument(id);
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold">Hytte-dokumenter</h2>
        <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Legg til dokument
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Søk i dokumenter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Søk etter innhold, tittel eller kategori..."
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} className="w-full sm:w-auto">Søk</Button>
          </div>
          
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="font-semibold">Søkeresultater:</h4>
              {searchResults.map((result) => (
                <div key={result.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium">{result.title}</h5>
                    <Badge>{result.category}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {(result.summary || result.content).substring(0, 150)}...
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-500">
                      Relevans: {(result.relevance * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingDoc ? 'Rediger dokument' : 'Legg til nytt dokument'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Dokumenttittel"
                  required
                />
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Kategori (manual, guide, info)"
                  required
                />
                <Textarea
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Kort sammendrag av dokumentet"
                  rows={3}
                  className="resize-none"
                />
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Dokumentinnhold..."
                  rows={8}
                  required
                  className="resize-none"
                />
                {editingDoc && editingDoc.file_url && (
                  <a
                    href={editingDoc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary underline hover:no-underline block"
                  >
                    Last ned eksisterende fil
                  </a>
                )}
                <div className="space-y-2">
                  <Input
                    type="file"
                    accept=".pdf,.xlsx"
                    onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                  />
                  {file && <p className="text-sm text-muted-foreground">Valgt fil: {file.name}</p>}
                </div>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="Tags (kommaseparert)"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                  {isSubmitting ? 'Lagrer...' : (editingDoc ? 'Oppdater' : 'Legg til')}
                </Button>
                <Button type="button" variant="outline" onClick={cancelEdit} disabled={isSubmitting} className="w-full sm:w-auto">
                  Avbryt
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Documents List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Alle dokumenter</h3>
        {loading ? (
          <p>Laster dokumenter...</p>
        ) : documents.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">Ingen dokumenter funnet</p>
                <p className="text-sm text-muted-foreground mt-1">Legg til ditt første dokument for å komme i gang</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <Card key={doc.id}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <h4 className="font-medium truncate">{doc.title}</h4>
                          <Badge variant="secondary" className="self-start">{doc.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-3">
                          {(doc.summary || doc.content).substring(0, 200)}...
                        </p>
                        {(doc.tags || []).length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {(doc.tags || []).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {doc.file_url && (
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary underline hover:no-underline"
                          >
                            Last ned fil
                          </a>
                        )}
                      </div>
                      <div className="flex gap-2 self-start">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => viewDocument(doc)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => startEdit(doc)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Er du sikker?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Dette vil permanent slette dokumentet "{doc.title}". Denne handlingen kan ikke angres.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Avbryt</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(doc.id)}>
                                Slett
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Document View Dialog */}
      {viewingDoc && (
        <Dialog open={!!viewingDoc} onOpenChange={() => setViewingDoc(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {viewingDoc.title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Kategori:</span> {viewingDoc.category}
                </div>
                <div>
                  <span className="font-medium">Opprettet:</span> {format(new Date(viewingDoc.created_at), 'dd.MM.yyyy', { locale: nb })}
                </div>
              </div>

              {viewingDoc.summary && (
                <div>
                  <h4 className="font-medium mb-2">Sammendrag</h4>
                  <p className="text-muted-foreground bg-muted p-3 rounded-md">
                    {viewingDoc.summary}
                  </p>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2">Innhold</h4>
                <div className="bg-muted p-4 rounded-md max-h-60 overflow-y-auto">
                  <p className="whitespace-pre-wrap">{viewingDoc.content}</p>
                </div>
              </div>

              {viewingDoc.tags && viewingDoc.tags.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {viewingDoc.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {viewingDoc.file_url && (
                <div>
                  <h4 className="font-medium mb-2">Vedlagt fil</h4>
                  <a 
                    href={viewingDoc.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Last ned fil
                  </a>
                </div>
              )}

              <Separator />

              <DocumentImageGallery
                documentId={viewingDoc.id}
                documentTitle={viewingDoc.title}
                documentCategory={viewingDoc.category}
                images={documentImages}
                onImagesChange={refreshDocumentImages}
                uploadImage={uploadDocumentImage}
                updateImageDescription={updateImageDescription}
                deleteImage={deleteDocumentImage}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default DocumentsManager;