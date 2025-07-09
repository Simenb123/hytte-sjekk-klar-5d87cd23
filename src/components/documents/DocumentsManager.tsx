
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import { useCabinDocuments, CabinDocument } from '@/hooks/useCabinDocuments';

const DocumentsManager: React.FC = () => {
  const { documents, loading, fetchDocuments, searchDocuments, addDocument, updateDocument, deleteDocument } = useCabinDocuments();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDoc, setEditingDoc] = useState<CabinDocument | null>(null);
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
  }, []);

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
    }
  };

  const startEdit = (doc: CabinDocument) => {
    setEditingDoc(doc);
    setFormData({
      title: doc.title,
      category: doc.category,
      content: doc.content,
      summary: doc.summary || '',
      tags: doc.tags.join(', '),
    });
    setFile(null);
    setShowAddForm(true);
  };

  const cancelEdit = () => {
    setEditingDoc(null);
    setFormData({ title: '', category: '', content: '', summary: '', tags: '' });
    setFile(null);
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Hytte-dokumenter</h2>
        <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
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
          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Søk etter innhold, tittel eller kategori..."
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch}>Søk</Button>
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
              />
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Dokumentinnhold..."
                rows={10}
                required
              />
              {editingDoc && editingDoc.file_url && (
                <a
                  href={editingDoc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 underline"
                >
                  Last ned eksisterende fil
                </a>
              )}
              <Input
                type="file"
                accept=".pdf,.xlsx"
                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              />
              {file && <p className="text-sm">Valgt fil: {file.name}</p>}
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="Tags (kommaseparert)"
              />
              <div className="flex gap-2">
                <Button type="submit">
                  {editingDoc ? 'Oppdater' : 'Legg til'}
                </Button>
                <Button type="button" variant="outline" onClick={cancelEdit}>
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
        ) : (
          <div className="grid gap-4">
            {documents.map((doc) => (
              <Card key={doc.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{doc.title}</h4>
                        <Badge variant="secondary">{doc.category}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {(doc.summary || doc.content).substring(0, 200)}...
                      </p>
                      <div className="flex gap-1">
                        {doc.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      {doc.file_url && (
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 underline mt-2 block"
                        >
                          Last ned fil
                        </a>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => startEdit(doc)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => deleteDocument(doc.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentsManager;
