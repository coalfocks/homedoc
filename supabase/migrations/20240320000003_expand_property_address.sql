-- Expand property address fields
-- Add new address fields
ALTER TABLE public.properties 
ADD COLUMN address_line_1 text,
ADD COLUMN address_line_2 text,
ADD COLUMN city text,
ADD COLUMN state text,
ADD COLUMN zip_code text;

-- Migrate existing address data to address_line_1
UPDATE public.properties 
SET address_line_1 = address 
WHERE address IS NOT NULL;

-- Drop the old address column
ALTER TABLE public.properties 
DROP COLUMN address; 