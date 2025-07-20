-- Add sample app data to existing items
UPDATE public.checklist_items 
SET 
  app_name = 'Sikom Living',
  app_url_ios = 'https://apps.apple.com/no/app/sikom-living/id1518982391',
  app_url_android = 'https://play.google.com/store/apps/details?id=no.sikom.living',
  app_icon_url = 'https://is1-ssl.mzstatic.com/image/thumb/Purple125/v4/7a/c1/0a/7ac10a5e-6c9f-3e8d-8c5e-8f7b5a2e4c8d/AppIcon-0-0-1x_U007emarketing-0-0-0-7-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/230x0w.webp',
  app_description = 'Logg inn på Sikom Living appen og sett ønsket temperatur for hytta. Sjekk at oppvarmingssystemet fungerer som det skal og at alle innstillinger er optimale for ankomst.'
WHERE text ILIKE '%sikom%' OR text ILIKE '%temperatur%' OR text ILIKE '%oppvarming%';

UPDATE public.checklist_items 
SET 
  app_name = 'EWPE Smart',
  app_url_ios = 'https://apps.apple.com/app/ewpe-smart/id1378516817',
  app_url_android = 'https://play.google.com/store/apps/details?id=com.gree.ewpesmart',
  app_icon_url = 'https://is1-ssl.mzstatic.com/image/thumb/Purple125/v4/1c/9f/0b/1c9f0b0e-7a8d-3c1e-9f0b-1c9f0b0e7a8d/AppIcon-0-0-1x_U007emarketing-0-0-0-7-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/230x0w.webp',
  app_description = 'Åpne EWPE Smart appen og kontroller klimaanlegget. Sett ønsket temperatur og modus (oppvarming/kjøling) avhengig av sesong. Sjekk at alle enheter responderer og fungerer korrekt.'
WHERE text ILIKE '%ewpe%' OR text ILIKE '%klima%' OR text ILIKE '%aircondition%' OR text ILIKE '%luft%';

UPDATE public.checklist_items 
SET 
  app_name = 'SmartTub',
  app_url_ios = 'https://apps.apple.com/app/smarttub/id1454594267',
  app_url_android = 'https://play.google.com/store/apps/details?id=com.smarttub.app',
  app_icon_url = 'https://is1-ssl.mzstatic.com/image/thumb/Purple115/v4/8c/7d/5e/8c7d5e2f-4b8a-3c1d-9e0f-8c7d5e2f4b8a/AppIcon-0-0-1x_U007emarketing-0-0-0-7-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/230x0w.webp',
  app_description = 'Bruk SmartTub appen for å starte oppvarmingen av boblebad/spa. Sett ønsket temperatur og sjekk vannkvalitet. Kontroller at alle systemer fungerer som de skal før ankomst.'
WHERE text ILIKE '%boblebad%' OR text ILIKE '%spa%' OR text ILIKE '%smarttub%' OR text ILIKE '%jacuzzi%';