-- Add locations array field to tours table to support multiple ordered locations
-- Keep existing location field for backward compatibility

-- Add JSONB column for storing ordered locations array
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS locations JSONB DEFAULT '[]';

-- Add index for better performance on locations queries
CREATE INDEX IF NOT EXISTS idx_tours_locations ON public.tours USING GIN (locations);

-- Create a function to migrate existing single location tours to locations array
CREATE OR REPLACE FUNCTION migrate_single_locations_to_array()
RETURNS void AS $$
BEGIN
  -- Update tours that have a location but empty locations array
  UPDATE public.tours 
  SET locations = jsonb_build_array(
    jsonb_build_object(
      'id', gen_random_uuid()::text,
      'name', location,
      'notes', 'Migrated from single location',
      'order', 1
    )
  )
  WHERE location IS NOT NULL 
    AND location != '' 
    AND (locations IS NULL OR locations = '[]'::jsonb);
    
  -- Log the migration
  RAISE NOTICE 'Migration completed: Single locations converted to locations array';
END;
$$ LANGUAGE plpgsql;

-- Run the migration function
SELECT migrate_single_locations_to_array();

-- Add a comment for documentation
COMMENT ON COLUMN public.tours.locations IS 'JSONB array of ordered tour locations: [{"id": "uuid", "name": "string", "notes": "string", "order": number}]';

-- Example of locations data structure:
-- [
--   {"id": "loc1", "name": "Mestia", "notes": "Start point", "order": 1},
--   {"id": "loc2", "name": "Ushguli", "notes": "Village walk", "order": 2}
-- ]