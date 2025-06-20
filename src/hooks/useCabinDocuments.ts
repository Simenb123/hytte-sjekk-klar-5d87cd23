
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CabinDocument {
  id: string;
  title: string;
  category: string;
  content: string;
  file_url?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface SearchResult extends CabinDocument {
  relevance: number;
}

export function useCabinDocuments() {
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<CabinDocument[]>([]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cabin_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      console.error('Error fetching cabin documents:', error);
      toast.error('Kunne ikke hente dokumenter');
    } finally {
      setLoading(false);
    }
  };

  const searchDocuments = async (query: string): Promise<SearchResult[]> => {
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
    } catch (error: any) {
      console.error('Error searching cabin documents:', error);
      toast.error('Kunne ikke søke i dokumenter');
      return [];
    }
  };

  const addDocument = async (document: Omit<CabinDocument, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('cabin_documents')
        .insert([document])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Dokument lagt til');
      await fetchDocuments();
      return data;
    } catch (error: any) {
      console.error('Error adding cabin document:', error);
      toast.error('Kunne ikke legge til dokument');
      throw error;
    }
  };

  const updateDocument = async (id: string, updates: Partial<CabinDocument>) => {
    try {
      const { data, error } = await supabase
        .from('cabin_documents')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Dokument oppdatert');
      await fetchDocuments();
      return data;
    } catch (error: any) {
      console.error('Error updating cabin document:', error);
      toast.error('Kunne ikke oppdatere dokument');
      throw error;
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cabin_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Dokument slettet');
      await fetchDocuments();
    } catch (error: any) {
      console.error('Error deleting cabin document:', error);
      toast.error('Kunne ikke slette dokument');
      throw error;
    }
  };

  return {
    documents,
    loading,
    fetchDocuments,
    searchDocuments,
    addDocument,
    updateDocument,
    deleteDocument,
  };
}
