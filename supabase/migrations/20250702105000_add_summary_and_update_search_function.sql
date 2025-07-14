-- 1. Legg til summary-kolonnen bare hvis den mangler
ALTER TABLE public.cabin_documents
  ADD COLUMN IF NOT EXISTS summary TEXT;

-- 2. Fjern den gamle funksjonen (hvis den finnes)
DROP FUNCTION IF EXISTS search_cabin_documents(TEXT);

-- 3. Opprett funksjonen på nytt med utvidet returtype
CREATE FUNCTION search_cabin_documents(search_query TEXT)
RETURNS TABLE (
  id          UUID,
  title       TEXT,
  category    TEXT,
  summary     TEXT,
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

-- 4. Sett korte sammendrag på eksisterende rader
UPDATE public.cabin_documents SET summary =
  'Hvordan starte, bruke og vedlikeholde boblebadet.'
  WHERE title = 'Boblebad brukermanual';

UPDATE public.cabin_documents SET summary =
  'Grunnleggende fyringstips, sikker bruk og rengjøring av pizzaovnen.'
  WHERE title = 'Pizzaovn bruksanvisning';

UPDATE public.cabin_documents SET summary =
  'Slik klargjør du gassgrillen, trygg grilling og enkelt vedlikehold.'
  WHERE title = 'Grill bruksanvisning';

UPDATE public.cabin_documents SET summary =
  'Oversikt over TV, strømmetjenester og annet underholdningsutstyr.'
  WHERE title = 'TV og underholdning setup';

UPDATE public.cabin_documents SET summary =
  'Historikk om hytta og tips til aktiviteter og attraksjoner i nærområdet.'
  WHERE title = 'Hytta historie og område';
