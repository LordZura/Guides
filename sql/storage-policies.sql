-- Storage policies for universal-safe file access
-- Run this in your Supabase SQL Editor

-- Create SELECT policy for profile-images bucket to enable file listing
CREATE POLICY IF NOT EXISTS "allow_list_profile_images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'profile-images');

-- Allow authenticated users to insert into profile-images bucket
CREATE POLICY IF NOT EXISTS "allow_upload_profile_images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images'
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own files (optional)
CREATE POLICY IF NOT EXISTS "allow_update_own_profile_images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'profile-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own files (optional)
CREATE POLICY IF NOT EXISTS "allow_delete_own_profile_images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%profile_images%';