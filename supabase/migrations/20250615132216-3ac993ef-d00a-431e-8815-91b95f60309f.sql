
-- Step 1: Add new columns for category and season to the checklist_items table.
ALTER TABLE public.checklist_items ADD COLUMN category TEXT;
ALTER TABLE public.checklist_items ADD COLUMN season TEXT;

-- Step 2: Make the old 'type' column optional, in preparation for removing it.
ALTER TABLE public.checklist_items ALTER COLUMN type DROP NOT NULL;

-- Step 3: Clear all existing data from checklist-related tables.
-- This is a destructive action that ensures a clean start for the new structure.
TRUNCATE public.completion_logs, public.checklist_items, public.areas RESTART IDENTITY CASCADE;

-- Step 4: Insert the new, comprehensive list of areas.
INSERT INTO public.areas (name) VALUES
('Utområde'),
('Felles/Annet'),
('Boblebad'),
('Hovedhytta'),
('Tilbygg'),
('Anneks'),
('Grill'),
('Pizzaovn'),
('Utebod'),
('Skibod'),
('Innenbod'),
('Alle områder');

-- Step 5: Populate the checklist_items table with all the new tasks.
INSERT INTO public.checklist_items (text, category, season, area_id) VALUES
('Bestill brøyting via Hyttetjenester senest dagen før kl 12', 'før_ankomst', 'winter', (SELECT id FROM public.areas WHERE name = 'Utområde')),
('Slå på varmekabler + panelovner via Seacom Living', 'før_ankomst', 'all', (SELECT id FROM public.areas WHERE name = 'Felles/Annet')),
('Slå på varmepumper via app', 'før_ankomst', 'all', (SELECT id FROM public.areas WHERE name = 'Felles/Annet')),
('Sett ønsket temperatur på boblebadet', 'før_ankomst', 'all', (SELECT id FROM public.areas WHERE name = 'Boblebad')),
('Brøyte inn smal stripe – ikke tråkk ned snøen', 'ankomst', 'winter', (SELECT id FROM public.areas WHERE name = 'Utområde')),
('Skru på vannet (1 håndtak)', 'ankomst', 'all', (SELECT id FROM public.areas WHERE name = 'Hovedhytta')),
('Skru på vannet i Tilbygg', 'ankomst', 'all', (SELECT id FROM public.areas WHERE name = 'Tilbygg')),
('Skru på vannet i Anneks', 'ankomst', 'all', (SELECT id FROM public.areas WHERE name = 'Anneks')),
('Sjekk vannnivå rett under nakkeputene', 'opphold', 'all', (SELECT id FROM public.areas WHERE name = 'Boblebad')),
('Stropp lokk + presenning', 'opphold', 'winter', (SELECT id FROM public.areas WHERE name = 'Boblebad')),
('Mål pH, klor, alkalinitet', 'opphold', 'all', (SELECT id FROM public.areas WHERE name = 'Boblebad')),
('Rengjør rist og fettskuff', 'opphold', 'all', (SELECT id FROM public.areas WHERE name = 'Grill')),
('Legg på overtrekk når grillen er kald', 'opphold', 'all', (SELECT id FROM public.areas WHERE name = 'Grill')),
('Børst bort aske / tørrskrubb stein', 'opphold', 'all', (SELECT id FROM public.areas WHERE name = 'Pizzaovn')),
('Lad batterier til elektrisk kantklipper', 'opphold', 'all', (SELECT id FROM public.areas WHERE name = 'Utebod')),
('Flytt grill til dekk ved Tilbygg ved sesongstart', 'årlig_vedlikehold', 'summer', (SELECT id FROM public.areas WHERE name = 'Utebod')),
('Flytt grill tilbake til Utebod for vintersesong', 'årlig_vedlikehold', 'winter', (SELECT id FROM public.areas WHERE name = 'Utebod')),
('Fyll opp vedstabelen inne', 'avreise', 'winter', (SELECT id FROM public.areas WHERE name = 'Hovedhytta')),
('Sjekk at alle vinduer / ytterdører er lukket', 'avreise', 'all', (SELECT id FROM public.areas WHERE name = 'Alle områder')),
('Ta med medbragte matvarer (kjøl/frys/mateskap)', 'avreise', 'all', (SELECT id FROM public.areas WHERE name = 'Hovedhytta')),
('Sjekk at koketopp og ovn er av', 'avreise', 'all', (SELECT id FROM public.areas WHERE name = 'Hovedhytta')),
('Rengjør kaffemaskin, tøm vann, la åpen', 'avreise', 'all', (SELECT id FROM public.areas WHERE name = 'Hovedhytta')),
('La oppvaskmaskin stå på gløtt', 'avreise', 'all', (SELECT id FROM public.areas WHERE name = 'Hovedhytta')),
('Sjekk at Utebod er låst', 'avreise', 'all', (SELECT id FROM public.areas WHERE name = 'Utebod')),
('Sjekk at Skibod er låst', 'avreise', 'all', (SELECT id FROM public.areas WHERE name = 'Skibod')),
('Legg alle ekstra nøkler i nøkkelskapet', 'avreise', 'all', (SELECT id FROM public.areas WHERE name = 'Hovedhytta')),
('La dør til inneboden stå åpen', 'avreise', 'all', (SELECT id FROM public.areas WHERE name = 'Innenbod')),
('Lukk og lås innerdør til Tilbygg', 'avreise', 'all', (SELECT id FROM public.areas WHERE name = 'Hovedhytta')),
('La badedør stå åpen (varmepumpe-sirkulasjon)', 'avreise', 'all', (SELECT id FROM public.areas WHERE name = 'Tilbygg')),
('La hovedsoveromsdør stå åpen', 'avreise', 'all', (SELECT id FROM public.areas WHERE name = 'Hovedhytta')),
('La dør mellom stue & gang stå åpen', 'avreise', 'all', (SELECT id FROM public.areas WHERE name = 'Hovedhytta')),
('La dør mellom bad og stue stå åpen', 'avreise', 'all', (SELECT id FROM public.areas WHERE name = 'Anneks')),
('Kjøkkenskap under vasken åpent', 'avreise', 'winter', (SELECT id FROM public.areas WHERE name = 'Hovedhytta')),
('Kjøkkenskap under vasken åpent', 'avreise', 'winter', (SELECT id FROM public.areas WHERE name = 'Anneks')),
('Trekk for persienner / gardiner', 'avreise', 'all', (SELECT id FROM public.areas WHERE name = 'Alle områder')),
('Skru av alt innelys', 'avreise', 'all', (SELECT id FROM public.areas WHERE name = 'Alle områder')),
('La bryter for utelys stå på', 'avreise', 'all', (SELECT id FROM public.areas WHERE name = 'Anneks')),
('Skru av baderomsvifte', 'avreise', 'all', (SELECT id FROM public.areas WHERE name = 'Anneks')),
('Skru av alle panelbrytere (lys, vifte, spot)', 'avreise', 'all', (SELECT id FROM public.areas WHERE name = 'Tilbygg')),
('Steng hovedvannkran (ikke bruk vann etterpå)', 'avreise', 'all', (SELECT id FROM public.areas WHERE name = 'Hovedhytta')),
('Steng vann i Tilbygg', 'avreise', 'all', (SELECT id FROM public.areas WHERE name = 'Tilbygg')),
('Steng vann i Anneks', 'avreise', 'all', (SELECT id FROM public.areas WHERE name = 'Anneks')),
('Senk temperatur til økonomi og stropp lokk', 'avreise', 'all', (SELECT id FROM public.areas WHERE name = 'Boblebad')),
('Koble fra gasstank / flytt inn', 'avreise', 'all', (SELECT id FROM public.areas WHERE name = 'Grill')),
('Børst ut aske + lukk dør', 'avreise', 'all', (SELECT id FROM public.areas WHERE name = 'Pizzaovn')),
('Tøm og rengjør isbitmaskin, slå av', 'avreise', 'all', (SELECT id FROM public.areas WHERE name = 'Anneks')),
('Skru av TV/decoder (hovedbryter)', 'avreise', 'all', (SELECT id FROM public.areas WHERE name = 'Hovedhytta')),
('Dra ut stikkontakt til TV', 'avreise', 'all', (SELECT id FROM public.areas WHERE name = 'Tilbygg')),
('Tøm alle søppelbøtter; kjør til container', 'avreise', 'all', (SELECT id FROM public.areas WHERE name = 'Alle områder')),
('Lås verandadøren og legg nøkkel i skap', 'avreise', 'all', (SELECT id FROM public.areas WHERE name = 'Hovedhytta')),
('Fra utsiden: Sjekk at 3 ytterdører + veranda + Utebod + Skibod er låst', 'avreise', 'all', (SELECT id FROM public.areas WHERE name = 'Alle områder')),
('Hvis hoveddørlås mangler strøm: bruk 9 V-batteri til nødåpning', 'avreise', 'all', (SELECT id FROM public.areas WHERE name = 'Hovedhytta')),
('Des–Feb: La varmtvannstankene stå PÅ i alle bygg · Mar–Nov: Slå AV i Tilbygg og Anneks, behold PÅ i Hovedhytta', 'avreise', 'all', (SELECT id FROM public.areas WHERE name = 'Alle områder'));

-- Step 6: Remove the old 'type' column, as it's now replaced by 'category'.
ALTER TABLE public.checklist_items DROP COLUMN type;
