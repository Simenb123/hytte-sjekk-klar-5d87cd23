-- Add pgvector extension and vector columns
CREATE EXTENSION IF NOT EXISTS vector;

-- Add vector column to cabin_documents
ALTER TABLE public.cabin_documents
ADD COLUMN IF NOT EXISTS vector vector(1536);

-- Add vector column to inventory_items
ALTER TABLE public.inventory_items
ADD COLUMN IF NOT EXISTS vector vector(1536);

-- Function to search cabin documents using cosine similarity
CREATE OR REPLACE FUNCTION search_cabin_documents(query_embedding vector, match_count integer DEFAULT 5)
RETURNS TABLE (
  id UUID,
  title TEXT,
  category TEXT,
  content TEXT,
  tags TEXT[],
  similarity real
) AS $$
  SELECT
    d.id,
    d.title,
    d.category,
    d.content,
    d.tags,
    1 - (d.vector <=> query_embedding) AS similarity
  FROM cabin_documents d
  WHERE d.vector IS NOT NULL
  ORDER BY d.vector <=> query_embedding
  LIMIT match_count
$$ LANGUAGE sql STABLE;

-- Function to search inventory items using cosine similarity
CREATE OR REPLACE FUNCTION search_inventory_items(query_embedding vector, match_count integer DEFAULT 5)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  category TEXT,
  brand TEXT,
  color TEXT,
  size TEXT,
  location TEXT,
  shelf TEXT,
  owner TEXT,
  notes TEXT,
  similarity real
) AS $$
  SELECT
    i.id,
    i.name,
    i.description,
    i.category,
    i.brand,
    i.color,
    i.size,
    i.location,
    i.shelf,
    i.owner,
    i.notes,
    1 - (i.vector <=> query_embedding) AS similarity
  FROM inventory_items i
  WHERE i.vector IS NOT NULL
  ORDER BY i.vector <=> query_embedding
  LIMIT match_count
$$ LANGUAGE sql STABLE;
