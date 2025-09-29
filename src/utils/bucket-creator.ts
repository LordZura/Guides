/**
 * Bucket Creator Utility
 * 
 * A utility for creating the required Supabase storage buckets
 * with proper configuration for avatar uploads.
 * 
 * Usage:
 * 1. With service role key (recommended for production setup)
 * 2. Manual creation via Supabase Dashboard
 */

import { createClient } from '@supabase/supabase-js';

export interface BucketCreationResult {
  success: boolean;
  bucketName: string;
  error?: string;
  publicUrl?: string;
}

/**
 * Creates the profile-images bucket with service role key
 * This requires SUPABASE_SERVICE_ROLE_KEY environment variable
 */
export async function createProfileImagesBucket(): Promise<BucketCreationResult> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    return {
      success: false,
      bucketName: 'profile-images',
      error: 'VITE_SUPABASE_URL not configured'
    };
  }

  if (!serviceRoleKey) {
    return {
      success: false,
      bucketName: 'profile-images',
      error: 'SUPABASE_SERVICE_ROLE_KEY not configured - needed for bucket creation'
    };
  }

  try {
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Create bucket with proper configuration
    const { data, error } = await adminClient.storage.createBucket('profile-images', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'],
      fileSizeLimit: 5 * 1024 * 1024, // 5MB
    });

    if (error) {
      if (error.message.includes('already exists')) {
        return {
          success: true,
          bucketName: 'profile-images',
          error: 'Bucket already exists'
        };
      }
      throw error;
    }

    // Get public URL format
    const { data: urlData } = adminClient.storage
      .from('profile-images')
      .getPublicUrl('test-path');

    return {
      success: true,
      bucketName: 'profile-images',
      publicUrl: urlData.publicUrl.replace('/test-path', '')
    };

  } catch (err: any) {
    return {
      success: false,
      bucketName: 'profile-images',
      error: err.message || 'Unknown error creating bucket'
    };
  }
}

/**
 * Instructions for manual bucket creation
 */
export const MANUAL_CREATION_INSTRUCTIONS = {
  title: 'Manual Bucket Creation Steps',
  steps: [
    '1. Go to Supabase Dashboard (https://supabase.com/dashboard)',
    '2. Select your project: ghtdjwcqqcbfzaeiekhk',
    '3. Navigate to Storage → Buckets',
    '4. Click "Create Bucket"',
    '5. Configure bucket:',
    '   - Name: profile-images',
    '   - Public: true',
    '   - File size limit: 5MB',
    '   - Allowed MIME types: image/jpeg, image/png, image/webp, image/gif, image/avif',
    '6. Click "Create Bucket"',
    '7. Go to Storage → Policies',
    '8. Add INSERT policy for authenticated users or anon role',
    '9. Test avatar upload in ProfileEditor'
  ],
  sqlPolicy: `
-- RLS Policy for profile-images bucket uploads
CREATE POLICY "Allow authenticated users to upload avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = 'avatars');

-- Alternative: Allow anon users (less secure)
CREATE POLICY "Allow anon users to upload avatars"
ON storage.objects  
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = 'avatars');
  `.trim()
};

/**
 * Validates bucket configuration
 */
export async function validateBucketConfiguration(): Promise<{
  isConfigured: boolean;
  canAccess: boolean;
  canUpload: boolean;
  recommendations: string[];
}> {
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  const result = {
    isConfigured: false,
    canAccess: false,
    canUpload: false,
    recommendations: [] as string[]
  };

  try {
    // Test bucket access
    const { data, error: accessError } = await supabase.storage
      .from('profile-images')
      .list('avatars');

    if (!accessError) {
      result.isConfigured = true;
      result.canAccess = true;
    }

    // Test upload capability
    const testBlob = new Blob(['test'], { type: 'text/plain' });
    const testPath = `avatars/validation-test-${Date.now()}.txt`;
    
    const { error: uploadError } = await supabase.storage
      .from('profile-images')
      .upload(testPath, testBlob);

    if (!uploadError) {
      result.canUpload = true;
      // Clean up
      await supabase.storage.from('profile-images').remove([testPath]);
    }

  } catch (err) {
    // Handle network errors
  }

  // Generate recommendations
  if (!result.isConfigured) {
    result.recommendations.push('Create "profile-images" bucket in Supabase Dashboard');
  }
  
  if (result.isConfigured && !result.canUpload) {
    result.recommendations.push('Add INSERT policy for uploads to profile-images bucket');
  }

  if (result.isConfigured && result.canUpload) {
    result.recommendations.push('✅ Bucket is properly configured for avatar uploads');
  }

  return result;
}