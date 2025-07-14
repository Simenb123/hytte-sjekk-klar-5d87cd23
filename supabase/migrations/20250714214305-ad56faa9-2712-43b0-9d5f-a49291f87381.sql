-- Update search_cabin_documents function to include content field
DROP FUNCTION IF EXISTS search_cabin_documents(TEXT);

CREATE FUNCTION search_cabin_documents(search_query TEXT)
RETURNS TABLE (
  id          UUID,
  title       TEXT,
  category    TEXT,
  summary     TEXT,
  content     TEXT,
  file_url    TEXT,
  tags        TEXT[],
  relevance   REAL
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    d.id,
    d.title,
    d.category,
    d.summary,
    d.content,
    d.file_url,
    d.tags,
    ts_rank(
      setweight(to_tsvector('norwegian', d.title),    'A') ||
      setweight(to_tsvector('norwegian', d.category), 'B') ||
      setweight(to_tsvector('norwegian', d.content),  'C'),
      plainto_tsquery('norwegian', search_query)
    ) AS relevance
  FROM cabin_documents d
  WHERE
    setweight(to_tsvector('norwegian', d.title),    'A') ||
    setweight(to_tsvector('norwegian', d.category), 'B') ||
    setweight(to_tsvector('norwegian', d.content),  'C')
    @@ plainto_tsquery('norwegian', search_query)
  ORDER BY relevance DESC;
$$;