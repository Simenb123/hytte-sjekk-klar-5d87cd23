-- Add sort_order column to checklist_items table
ALTER TABLE checklist_items ADD COLUMN sort_order INTEGER;

-- Set initial sort order for existing items by category and logical sequence
-- Start with avreise (departure) category with logical order
UPDATE checklist_items 
SET sort_order = CASE 
  -- Innendørs oppgaver (Indoor tasks)
  WHEN text ILIKE '%rydde%' OR text ILIKE '%vaske%' OR text ILIKE '%rengjøre%' THEN 10
  WHEN text ILIKE '%slukke%' OR text ILIKE '%skru av%' THEN 20
  WHEN text ILIKE '%tømme%' OR text ILIKE '%oppvask%' THEN 30
  
  -- Vann og sikring (Water and securing)
  WHEN text ILIKE '%steng%vann%' OR text ILIKE '%vannforsyning%' THEN 40
  WHEN text ILIKE '%boblebadet%' OR text ILIKE '%spa%' OR text ILIKE '%hottub%' THEN 45
  WHEN text ILIKE '%tank%' OR text ILIKE '%pumpe%' THEN 50
  
  -- Innendørs låsing (Indoor locking)
  WHEN text ILIKE '%nøkkel%' OR text ILIKE '%legge%nøkkel%' THEN 60
  WHEN text ILIKE '%låse%' AND text NOT ILIKE '%ytterdør%' THEN 65
  
  -- Utendørs kontroll (Outdoor control)
  WHEN text ILIKE '%ytterdør%' OR text ILIKE '%hoveddør%' THEN 70
  WHEN text ILIKE '%uteområde%' OR text ILIKE '%terrasse%' THEN 80
  WHEN text ILIKE '%søppel%' OR text ILIKE '%avfall%' THEN 85
  
  -- Default for other items
  ELSE 90
END
WHERE category = 'avreise';

-- Set sort order for other categories with general logic
UPDATE checklist_items 
SET sort_order = CASE 
  WHEN category = 'før_ankomst' THEN 
    CASE 
      WHEN text ILIKE '%bestill%' OR text ILIKE '%book%' THEN 10
      WHEN text ILIKE '%pakk%' OR text ILIKE '%klargjør%' THEN 20
      WHEN text ILIKE '%sjekk%' THEN 30
      ELSE 40
    END
  WHEN category = 'ankomst' THEN
    CASE 
      WHEN text ILIKE '%nøkkel%' OR text ILIKE '%åpne%' THEN 10
      WHEN text ILIKE '%strøm%' OR text ILIKE '%vann%' THEN 20
      WHEN text ILIKE '%varme%' OR text ILIKE '%oppvarming%' THEN 30
      WHEN text ILIKE '%sjekk%' THEN 40
      ELSE 50
    END
  WHEN category = 'opphold' THEN
    CASE 
      WHEN text ILIKE '%daglig%' THEN 10
      WHEN text ILIKE '%ukentlig%' THEN 20
      ELSE 30
    END
  WHEN category = 'årlig_vedlikehold' THEN
    CASE 
      WHEN text ILIKE '%vinter%' OR text ILIKE '%vår%' THEN 10
      WHEN text ILIKE '%sommer%' THEN 20
      WHEN text ILIKE '%høst%' THEN 30
      ELSE 40
    END
  ELSE 50
END
WHERE sort_order IS NULL;

-- Create index for better performance when sorting
CREATE INDEX idx_checklist_items_sort_order ON checklist_items(category, sort_order);