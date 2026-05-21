-- Migration: Create plant_memories table and update plants table
-- Run this in your Supabase SQL Editor

-- 1. Add thumbnail fields to plants table
ALTER TABLE plants
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_memory_id UUID;

-- 2. Backfill thumbnail_url from existing image_url
UPDATE plants SET thumbnail_url = image_url WHERE thumbnail_url IS NULL AND image_url IS NOT NULL;

-- 3. Create plant_memories table
CREATE TABLE IF NOT EXISTS plant_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  is_thumbnail_source BOOLEAN DEFAULT FALSE,
  is_favorite BOOLEAN DEFAULT FALSE,
  favorite_order INTEGER,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_plant_memories_plant_id ON plant_memories(plant_id);
CREATE INDEX IF NOT EXISTS idx_plant_memories_favorite ON plant_memories(plant_id, is_favorite) WHERE is_favorite = TRUE;

-- 5. Enable RLS
ALTER TABLE plant_memories ENABLE ROW LEVEL SECURITY;

-- 6. Allow all operations for now (adjust for auth later)
CREATE POLICY "Allow all on plant_memories" ON plant_memories
  FOR ALL USING (true) WITH CHECK (true);

-- 7. Migrate existing memories JSONB array to plant_memories table
-- Run this AFTER creating the table:
INSERT INTO plant_memories (plant_id, image_url, storage_path, filename, order_index)
SELECT
  p.id,
  url.value::text,
  url.value::text,
  split_part(url.value::text, '/', -1),
  (url.ordinality - 1)
FROM plants p,
  jsonb_array_elements_text(p.memories) WITH ORDINALITY AS url(value, ordinality)
WHERE p.memories IS NOT NULL AND jsonb_array_length(p.memories) > 0;

-- 8. Optional: drop the old memories column after verifying migration
-- ALTER TABLE plants DROP COLUMN memories;
