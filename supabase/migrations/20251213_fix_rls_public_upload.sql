-- Relax RLS Policies for timelapse_frames to allow public access (for testing)
-- Note: In production, you might want to switch back to authenticated only

-- 1. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can upload frames" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own frames" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload frames" ON storage.objects;

-- 2. Create Public Upload Policy (INSERT + UPDATE for upsert)
CREATE POLICY "Public can upload frames"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'timelapse_frames');

-- 3. Create Public Update Policy (Required for upsert if file exists)
CREATE POLICY "Public can update frames"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'timelapse_frames');

-- 4. Create Public Select Policy (Optional, but good for debugging)
CREATE POLICY "Public can view frames"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'timelapse_frames');
