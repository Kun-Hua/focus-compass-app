-- Create table for tracking timelapse videos
CREATE TABLE IF NOT EXISTS public.timelapse_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    file_path TEXT NOT NULL,
    public_url TEXT,
    upload_date TIMESTAMPTZ DEFAULT NOW(),
    expiration_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.timelapse_videos ENABLE ROW LEVEL SECURITY;

-- Allow public read (or authenticated depending on auth strategy)
CREATE POLICY "Public videos are viewable by everyone" 
ON public.timelapse_videos FOR SELECT 
USING (true);

-- Allow service role to full access
CREATE POLICY "Service role full access" 
ON public.timelapse_videos FOR ALL 
USING (auth.role() = 'service_role');

-- Create Storage Buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('timelapse_frames', 'timelapse_frames', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('timelapse_videos', 'timelapse_videos', true) ON CONFLICT DO NOTHING;

-- Storage Policies for timelapse_frames
-- Allow authenticated users to upload frames
CREATE POLICY "Users can upload frames"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'timelapse_frames');

-- Allow users to read their own frames (optional, mainly for backend)
CREATE POLICY "Users can read own frames"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'timelapse_frames' AND auth.uid() = owner);

-- Storage Policies for timelapse_videos
-- Allow public to read videos
CREATE POLICY "Public can view videos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'timelapse_videos');

-- Allow service role (backend) to insert/delete
CREATE POLICY "Service role manages videos"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'timelapse_videos' OR bucket_id = 'timelapse_frames');
