-- Add nickname column to properties table
ALTER TABLE properties
ADD COLUMN nickname TEXT;

-- Add comment to explain the field
COMMENT ON COLUMN properties.nickname IS 'A friendly name or nickname for the property'; 