-- Create generated-assets storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'generated-assets',
  'generated-assets',
  true, -- Set to false for RLS-protected private storage
  52428800, -- 50MB max file size
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/wav',
    'audio/webm',
    'application/octet-stream'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for generated-assets bucket
CREATE POLICY "Users can upload their own generated assets"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'generated-assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own generated assets"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'generated-assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own generated assets"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'generated-assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Service role has full access to generated-assets"
  ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'generated-assets' AND
    auth.jwt()->>'role' = 'service_role'
  );

-- Comment on bucket
COMMENT ON COLUMN storage.buckets.id IS 'Storage bucket for AI-generated images, videos, and audio files';
