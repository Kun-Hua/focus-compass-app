-- Increase file size limit to 100MB for timelapse buckets
-- This is necessary to support .mp4 video uploads which are larger than default limits
-- 100MB = 104857600 bytes

UPDATE storage.buckets
SET file_size_limit = 104857600
WHERE id IN ('timelapse_frames', 'timelapse_videos');

-- Ensure allowed mime types include video/mp4
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'video/mp4']
WHERE id = 'timelapse_frames';

UPDATE storage.buckets
SET allowed_mime_types = ARRAY['video/mp4']
WHERE id = 'timelapse_videos';
