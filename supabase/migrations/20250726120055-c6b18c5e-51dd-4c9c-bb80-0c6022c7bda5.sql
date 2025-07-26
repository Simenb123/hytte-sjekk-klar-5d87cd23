-- Update all existing inventory items to have primary_location 'hytta' instead of 'hjemme'
UPDATE inventory_items 
SET primary_location = 'hytta' 
WHERE primary_location = 'hjemme';