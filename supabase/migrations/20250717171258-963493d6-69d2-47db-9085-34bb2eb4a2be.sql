-- Improve the search_cabin_documents function to be more robust
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
  WITH search_terms AS (
    SELECT string_to_array(lower(search_query), ' ') as terms
  ),
  base_search AS (
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
        setweight(to_tsvector('norwegian', COALESCE(d.summary, '')), 'B') ||
        setweight(to_tsvector('norwegian', d.content),  'C'),
        plainto_tsquery('norwegian', search_query)
      ) AS ts_relevance,
      -- Add simple text matching for better coverage
      CASE 
        WHEN lower(d.title) LIKE '%' || lower(search_query) || '%' THEN 2.0
        WHEN lower(d.category) LIKE '%' || lower(search_query) || '%' THEN 1.5
        WHEN lower(COALESCE(d.summary, '')) LIKE '%' || lower(search_query) || '%' THEN 1.2
        WHEN lower(d.content) LIKE '%' || lower(search_query) || '%' THEN 1.0
        ELSE 0.0
      END as text_relevance,
      -- Tag matching
      CASE 
        WHEN d.tags && ARRAY[lower(search_query)] THEN 1.5
        ELSE 0.0
      END as tag_relevance
    FROM cabin_documents d, search_terms st
    WHERE 
      -- Full text search
      (setweight(to_tsvector('norwegian', d.title),    'A') ||
       setweight(to_tsvector('norwegian', d.category), 'B') ||
       setweight(to_tsvector('norwegian', COALESCE(d.summary, '')), 'B') ||
       setweight(to_tsvector('norwegian', d.content),  'C')
       @@ plainto_tsquery('norwegian', search_query))
      OR 
      -- Simple text matching fallback
      (lower(d.title) LIKE '%' || lower(search_query) || '%' OR
       lower(d.category) LIKE '%' || lower(search_query) || '%' OR
       lower(COALESCE(d.summary, '')) LIKE '%' || lower(search_query) || '%' OR
       lower(d.content) LIKE '%' || lower(search_query) || '%')
      OR
      -- Tag matching
      (d.tags && ARRAY[lower(search_query)])
      OR
      -- Individual term matching
      EXISTS (
        SELECT 1 FROM unnest(st.terms) as term
        WHERE term != '' AND length(term) > 2 AND (
          lower(d.title) LIKE '%' || term || '%' OR
          lower(d.category) LIKE '%' || term || '%' OR
          lower(COALESCE(d.summary, '')) LIKE '%' || term || '%' OR
          lower(d.content) LIKE '%' || term || '%'
        )
      )
  )
  SELECT 
    id, title, category, summary, content, file_url, tags,
    (COALESCE(ts_relevance, 0) + text_relevance + tag_relevance) as relevance
  FROM base_search
  WHERE (COALESCE(ts_relevance, 0) + text_relevance + tag_relevance) > 0
  ORDER BY relevance DESC;
$$;