-- Add video_path column to FocusSessionLog
ALTER TABLE "FocusSessionLog" 
ADD COLUMN IF NOT EXISTS "video_path" TEXT;

-- Attempt to create storage bucket for videos
-- Note: This requires the storage extension to be enabled
INSERT INTO storage.buckets (id, name, public) 
VALUES ('focus-videos', 'focus-videos', false)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated uploads (Update as needed for specific security requirements)
CREATE POLICY "Authenticated users can upload focus videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'focus-videos' AND auth.uid() = owner);

CREATE POLICY "Users can download their own videos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'focus-videos' AND auth.uid() = owner);
