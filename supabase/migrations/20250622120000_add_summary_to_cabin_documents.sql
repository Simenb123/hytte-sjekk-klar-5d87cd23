-- Add summary column to cabin_documents
ALTER TABLE public.cabin_documents ADD COLUMN summary TEXT;

-- Update search_cabin_documents function to include summary and file_url
CREATE OR REPLACE FUNCTION search_cabin_documents(search_query TEXT)
RETURNS TABLE (
  id UUID,
  title TEXT,
  category TEXT,
  summary TEXT,
  file_url TEXT,
  tags TEXT[],
  relevance REAL
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    d.id,
    d.title,
    d.category,
    d.summary,
    d.file_url,
    d.tags,
    ts_rank(
      setweight(to_tsvector('norwegian', d.title), 'A') ||
      setweight(to_tsvector('norwegian', d.category), 'B') ||
      setweight(to_tsvector('norwegian', d.content), 'C'),
      plainto_tsquery('norwegian', search_query)
    ) as relevance
  FROM cabin_documents d
  WHERE
    setweight(to_tsvector('norwegian', d.title), 'A') ||
    setweight(to_tsvector('norwegian', d.category), 'B') ||
    setweight(to_tsvector('norwegian', d.content), 'C')
    @@ plainto_tsquery('norwegian', search_query)
  ORDER BY relevance DESC;
$$;

-- Initialize summaries for existing documents
UPDATE public.cabin_documents SET summary = 'Hvordan starte, bruke og vedlikeholde boblebadet.' WHERE title = 'Boblebad brukermanual';
UPDATE public.cabin_documents SET summary = 'Grunnleggende fyringstips, sikker bruk og rengjøring av pizzaovnen.' WHERE title = 'Pizzaovn bruksanvisning';
UPDATE public.cabin_documents SET summary = 'Slik klargjør du gassgrillen, trygg grilling og enkelt vedlikehold.' WHERE title = 'Grill bruksanvisning';
UPDATE public.cabin_documents SET summary = 'Oversikt over TV, strømmetjenester og annet underholdningsutstyr.' WHERE title = 'TV og underholdning setup';
UPDATE public.cabin_documents SET summary = 'Historikk om hytta og tips til aktiviteter og attraksjoner i nærområdet.' WHERE title = 'Hytta historie og område';
