-- Migration 022: Fix Storage RLS Policies for Profile Images
-- Addresses: "new row violates row-level security policy" for avatar uploads
-- Requirement: profile-images bucket must exist first

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE IF EXISTS storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Allow authenticated users to upload profile images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to view profile images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own profile images" ON storage.objects;

-- Policy 1: Allow authenticated users to INSERT into profile-images bucket
CREATE POLICY "Allow authenticated users to upload profile images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images'
  AND auth.role() = 'authenticated'
);

-- Policy 2: Allow users to SELECT from profile-images bucket (for public avatars)
CREATE POLICY "Allow users to view profile images"
ON storage.objects FOR SELECT
TO authenticated, anon
USING (
  bucket_id = 'profile-images'
);

-- Policy 3: Allow users to UPDATE their own files only
-- Uses the user ID from the file path: avatars/{user_id}_{timestamp}.ext
CREATE POLICY "Allow users to update own profile images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-images'
  AND auth.uid()::text = (string_to_array(name, '/'))[2]::text
  AND name LIKE 'avatars/' || auth.uid()::text || '%'
)
WITH CHECK (
  bucket_id = 'profile-images'
  AND auth.uid()::text = (string_to_array(name, '/'))[2]::text
  AND name LIKE 'avatars/' || auth.uid()::text || '%'
);

-- Policy 4: Allow users to DELETE their own files only
CREATE POLICY "Allow users to delete own profile images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-images'
  AND auth.uid()::text = (string_to_array(name, '/'))[2]::text
  AND name LIKE 'avatars/' || auth.uid()::text || '%'
);

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%profile images%'
ORDER BY policyname;

-- Instructions for manual execution:
-- 1. Ensure 'profile-images' bucket exists in Supabase Storage
-- 2. Run this migration in Supabase SQL Editor
-- 3. Test avatar upload functionality
-- 4. Check that uploads return HTTP 201 instead of 400/403