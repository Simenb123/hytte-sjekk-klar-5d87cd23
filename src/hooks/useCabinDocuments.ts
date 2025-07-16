
import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface CabinDocument {
  id: string;
  title: string;
  category: string;
  content: string;
  summary?: string | null;
  file_url?: string;
  tags: string[];
  front_page_image_id?: string;
  created_at: string;
  updated_at: string;
}

export interface SearchResult extends CabinDocument {
  relevance: number;
}

export interface DocumentImage {
  id: string;
  document_id: string;
  image_url: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export function useCabinDocuments() {
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<CabinDocument[]>([]);
  const { user } = useAuth();

  const uploadFile = useCallback(async (file: File): Promise<string> => {
    if (!user) {
      throw new Error('Bruker ikke autentisert');
    }
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('document_files')
      .upload(fileName, file);
    if (uploadError) {
      throw uploadError;
    }
    const { data: { publicUrl } } = supabase.storage
      .from('document_files')
      .getPublicUrl(fileName);
    return publicUrl;
  }, [user]);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cabin_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching cabin documents:', error);
      toast.error('Kunne ikke hente dokumenter');
    } finally {
      setLoading(false);
    }
  }, []);

  const searchDocuments = useCallback(async (query: string): Promise<SearchResult[]> => {
    try {
      const { data, error } = await supabase
        .rpc('search_cabin_documents', { search_query: query });

      if (error) throw error;
      
      // Get full document details for search results
      if (data && data.length > 0) {
        const documentIds = data.map(item => item.id);
        const { data: fullDocs, error: docsError } = await supabase
          .from('cabin_documents')
          .select('*')
          .in('id', documentIds);

        if (docsError) throw docsError;

        // Combine search results with full document data
        const searchResults: SearchResult[] = data.map(searchItem => {
          const fullDoc = fullDocs?.find(doc => doc.id === searchItem.id);
          return {
            ...fullDoc!,
            relevance: searchItem.relevance
          };
        });

        return searchResults;
      }
      
      return [];
    } catch (error) {
      console.error('Error searching cabin documents:', error);
      toast.error('Kunne ikke søke i dokumenter');
      return [];
    }
  }, []);

  const addDocument = useCallback(async (
    document: Omit<CabinDocument, 'id' | 'created_at' | 'updated_at'>,
    file?: File
  ) => {
    try {
      let fileUrl: string | undefined;
      if (file) {
        fileUrl = await uploadFile(file);
      }
      const { data, error } = await supabase
        .from('cabin_documents')
        .insert([{ ...document, ...(fileUrl ? { file_url: fileUrl } : {}) }])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Dokument lagt til');
      await fetchDocuments();
      return data;
    } catch (error) {
      console.error('Error adding cabin document:', error);
      toast.error('Kunne ikke legge til dokument');
      throw error;
    }
  }, [uploadFile, fetchDocuments]);

  const updateDocument = useCallback(async (
    id: string,
    updates: Partial<CabinDocument>,
    file?: File
  ) => {
    try {
      let fileUrl: string | undefined;
      if (file) {
        fileUrl = await uploadFile(file);
      }
      const { data, error } = await supabase
        .from('cabin_documents')
        .update({ ...updates, ...(fileUrl ? { file_url: fileUrl } : {}) })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Dokument oppdatert');
      await fetchDocuments();
      return data;
    } catch (error) {
      console.error('Error updating cabin document:', error);
      toast.error('Kunne ikke oppdatere dokument');
      throw error;
    }
  }, [uploadFile, fetchDocuments]);

  const deleteDocument = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('cabin_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Dokument slettet');
      await fetchDocuments();
    } catch (error) {
      console.error('Error deleting cabin document:', error);
      toast.error('Kunne ikke slette dokument');
      throw error;
    }
  }, [fetchDocuments]);

  // Image operations
  const uploadDocumentImage = useCallback(async (file: File, documentId: string, description?: string): Promise<string> => {
    if (!user) {
      throw new Error('Bruker ikke autentisert');
    }
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${documentId}/${Math.random()}.${fileExt}`;
    const filePath = `document-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('document_files')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('document_files')
      .getPublicUrl(filePath);

    const { error: dbError } = await supabase
      .from('document_images')
      .insert({
        document_id: documentId,
        image_url: publicUrl,
        description
      });

    if (dbError) throw dbError;
    return publicUrl;
  }, [user]);

  const getDocumentImages = useCallback(async (documentId: string): Promise<DocumentImage[]> => {
    try {
      const { data, error } = await supabase
        .from('document_images')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching document images:', error);
      toast.error('Kunne ikke hente bilder');
      return [];
    }
  }, []);

  const updateImageDescription = useCallback(async (imageId: string, description: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('document_images')
        .update({ description })
        .eq('id', imageId);

      if (error) throw error;
      toast.success('Bildebeskrivelse oppdatert');
    } catch (error) {
      console.error('Error updating image description:', error);
      toast.error('Kunne ikke oppdatere bildebeskrivelse');
      throw error;
    }
  }, []);

  const deleteDocumentImage = useCallback(async (imageId: string): Promise<void> => {
    try {
      // First get the image URL to delete from storage
      const { data: image } = await supabase
        .from('document_images')
        .select('image_url')
        .eq('id', imageId)
        .single();

      if (image?.image_url) {
        const path = image.image_url.split('/').pop(); // Get filename
        if (path) {
          await supabase.storage
            .from('document_files')
            .remove([`document-images/${path}`]);
        }
      }

      const { error } = await supabase
        .from('document_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;
      toast.success('Bilde slettet');
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Kunne ikke slette bilde');
      throw error;
    }
  }, []);

  const setFrontPageImage = useCallback(async (documentId: string, imageId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('cabin_documents')
        .update({ front_page_image_id: imageId })
        .eq('id', documentId);

      if (error) throw error;
      toast.success('Forsidebilde satt');
      await fetchDocuments();
    } catch (error) {
      console.error('Error setting front page image:', error);
      toast.error('Kunne ikke sette forsidebilde');
      throw error;
    }
  }, [fetchDocuments]);

  return {
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
    deleteDocumentImage,
    setFrontPageImage,
  };
}
