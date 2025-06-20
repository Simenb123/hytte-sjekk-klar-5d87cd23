
-- Create table for storing cabin documents/manuals
CREATE TABLE public.cabin_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- 'manual', 'guide', 'info' etc
  content TEXT NOT NULL, -- Full text content for searching
  file_url TEXT, -- Optional link to original file
  tags TEXT[], -- Array of tags for better categorization
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (documents are public for all authenticated users)
ALTER TABLE public.cabin_documents ENABLE ROW LEVEL SECURITY;

-- Policy to allow all authenticated users to read documents
CREATE POLICY "Authenticated users can view cabin documents" 
  ON public.cabin_documents 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Policy to allow authenticated users to insert documents (for admin purposes)
CREATE POLICY "Authenticated users can create cabin documents" 
  ON public.cabin_documents 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Policy to allow authenticated users to update documents
CREATE POLICY "Authenticated users can update cabin documents" 
  ON public.cabin_documents 
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- Create function for full-text search on documents
CREATE OR REPLACE FUNCTION search_cabin_documents(search_query TEXT)
RETURNS TABLE (
  id UUID,
  title TEXT,
  category TEXT,
  content TEXT,
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
    d.content,
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

-- Insert some sample cabin documents
INSERT INTO public.cabin_documents (title, category, content, tags) VALUES
('Boblebad brukermanual', 'manual', 'BOBLEBAD BRUKERMANUAL

OPPSTART:
1. Sjekk at strømmen er på
2. Fyll boblebadet med vann til riktig nivå (markering på siden)
3. Skru på hovedbryteren
4. Sett ønsket temperatur (anbefalt 37-40°C)
5. Oppvarming tar ca 2-3 timer første gang

DAGLIG BRUK:
- Alltid dusj før bruk
- Maksimalt 6 personer samtidig
- Bruk kun godkjente badeprodukter
- Skru på boblesystemet ved å trykke på "Jets" knappen

VEDLIKEHOLD:
- Sjekk vannkvaliteten daglig med teststrips
- Tilsett klor ved behov (følg instruksjoner på emballasjen)
- Rengjør filter hver uke
- Tøm og rengjør boblebad hver 2. uke ved mye bruk

STENGING:
- Skru av alle systemer
- Trekk ut støpselet
- Dekk til med presenning om vinteren', ARRAY['boblebad', 'varmtvann', 'vedlikehold']),

('Pizzaovn bruksanvisning', 'manual', 'PIZZAOVN BRUKSANVISNING

FYRING:
1. Åpne alle lufteventiler
2. Legg tørr bjørkeved i ovnen (ikke bruk granved)
3. Tenn ilden med opptenningskuber
4. Hold døra åpen de første 15 minuttene
5. Fyr i ca 1-2 timer til ovnen er varm (ca 300-400°C)

PIZZA BAKING:
- Optimal temperatur: 350-400°C
- Bakingstid: 2-3 minutter per pizza
- Bruk pizzaspade for å snu pizzaen
- Ha alltid mel på pizzaspaden for å unngå at deigen setter seg fast

SIKKERHET:
- Bruk alltid hansker når du håndterer varme gjenstander
- Hold døra lukket når ovnen ikke er i bruk
- Aldri forlat ovnen uten tilsyn når det brenner
- Sørg for god ventilasjon

STENGING:
- La ilden brenne ut naturlig
- Lukk alle lufteventiler når asken er kald
- Rengjør ovnen når den er helt avkjølt', ARRAY['pizzaovn', 'matlaging', 'sikkerhet']),

('Grill bruksanvisning', 'manual', 'GRILL BRUKSANVISNING

FORBEREDELSE:
1. Sjekk at gasslangen er riktig tilkoblet
2. Åpne gassventilen på flasken
3. Skru på grillen og trykk på tennknappen
4. La grillen varme opp i 10-15 minutter med lukket lokk

GRILLING:
- Direkte grilling: 200-250°C for steaks, kylling
- Indirekte grilling: 160-180°C for større kjøttstykker
- Bruk grillbørste for å rengjøre grillristen før bruk
- Snu maten kun én gang for best resultat

VEDLIKEHOLD:
- Rengjør grillristen etter hver bruk
- Tøm fettbrettet jevnlig
- Dekk til grillen etter bruk
- Sjekk gassslangen årlig for slitasje

SIKKERHET:
- Aldri grill innendørs
- Hold barn på avstand
- Ha brannslukkingsutstyr tilgjengelig
- Steng alltid gassen etter bruk', ARRAY['grill', 'matlaging', 'sikkerhet', 'vedlikehold']),

('TV og underholdning setup', 'guide', 'TV OG UNDERHOLDNING

TV BETJENING:
- Hovedfjernkontroll: Samsung TV fjernkontroll
- Skru på TV med rød knapp
- Skift kanal med tall-knappene eller opp/ned piler
- Volum kontrolleres med +/- på siden

STREAMING TJENESTER:
- Netflix: Brukernavn hytteguest@email.com
- Disney+: Logget inn på familieprofil
- TV2 Play: Gratis tilgang uten innlogging
- YouTube: Tilgjengelig via Smart TV

LYDANLEGG:
- Bluetooth høyttaler i stua kan kobles til telefon
- Trykk på Bluetooth knappen og søk etter "Cabin Speaker"
- Volumkontroll både på høyttaler og telefon

INTERNETT:
- WiFi navn: "Gaustablikk_Hytte"
- Passord: "Gausta2024"
- Restart router hvis problemer (rød knapp bak)

SPILLKONSOLLER:
- PlayStation 5 i TV-benken
- Kontrollere må lades med USB-C kabel
- Spill finnes i skuffen under TV-en', ARRAY['tv', 'underholdning', 'streaming', 'wifi']),

('Hytta historie og område', 'info', 'GAUSTABLIKK HYTTE - HISTORIE OG OMRÅDE

HYTTENS HISTORIE:
Hytta ble bygget i 1987 av familien Andersen som ønsket et tilfluktssted i fjellene. Opprinnelig en enkel tømmerhytte, har den blitt utvidet og modernisert flere ganger. I 2015 ble boblebad og pizzaovn lagt til, og i 2020 ble kjøkkenet totalrenovert.

GAUSTABLIKK OMRÅDET:
- Høyde: 1200 moh
- Kjent for fantastisk utsikt mot Gaustatoppen
- Utmerkede skiløyper vinterstid
- Gode turstier sommerstid
- 15 minutter til Rjukan sentrum

LOKALE ATTRAKSJONER:
- Gaustatoppen (1883 moh) - 45 min kjøring
- Rjukan by og Vemork museum - 15 min
- Krokan skisenter - 10 min
- Hardangervidda nasjonalpark - 30 min

AKTIVITETER:
- Vinter: Alpint, langrenn, skøyter, sledding
- Sommer: Turgåing, sykling, fiske, bading
- Året rundt: Grilling, bålkos, stjernetitting

PRAKTISK INFO:
- Nærmeste butikk: Rema 1000 i Rjukan (15 min)
- Legevakt: Rjukan kommune (20 min)
- Drivstoff: Shell/Circle K i Rjukan', ARRAY['historie', 'område', 'aktiviteter', 'gaustablikk']);
