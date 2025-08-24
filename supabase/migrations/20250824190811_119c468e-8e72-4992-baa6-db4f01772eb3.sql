-- Add SmartTub app integration to boblebadet/hot tub related checklist items
UPDATE checklist_items 
SET 
  app_name = 'SmartTub',
  app_url_ios = 'https://apps.apple.com/no/app/smarttub/id1318260634?l=nb',
  app_url_android = 'https://play.google.com/store/apps/details?id=com.balboa.smarttub',
  app_icon_url = 'https://is1-ssl.mzstatic.com/image/thumb/Purple126/v4/19/ef/65/19ef6549-2a7f-0c44-8b4a-6c9e92f5b5f7/AppIcon-0-0-1x_U007emarketing-0-0-0-7-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/512x512bb.jpg',
  app_description = 'Kontroller boblebadet direkte fra appen - temperatur, pumper, lys og mer.'
WHERE 
  text ILIKE '%boble%' 
  OR text ILIKE '%pH%' 
  OR text ILIKE '%klor%' 
  OR text ILIKE '%alkalinitet%' 
  OR text ILIKE '%vannivå%' 
  OR text ILIKE '%badestamp%'
  OR text ILIKE '%spa%'
  OR text ILIKE '%hottub%'
  OR text ILIKE '%jacuzzi%';