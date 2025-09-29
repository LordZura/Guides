import { supabase } from '../lib/supabaseClient';

export async function diagnoseBuckets() {
  console.log('=== Supabase Storage Diagnostic ===');
  console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? `${import.meta.env.VITE_SUPABASE_ANON_KEY.slice(0, 20)}...` : 'Not set');
  console.log();

  try {
    // List all buckets
    console.log('1. Listing all storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return { buckets: [], error: bucketsError };
    }
    
    console.log('Available buckets:');
    if (buckets && buckets.length > 0) {
      buckets.forEach((bucket, index) => {
        console.log(`${index + 1}. Name: "${bucket.name}", ID: "${bucket.id}", Public: ${bucket.public}`);
      });
    } else {
      console.log('No buckets found!');
    }
    
    console.log();

    // Test the specific bucket used in the code
    console.log('2. Testing "profile-images" bucket...');
    const { data: files, error: listError } = await supabase.storage
      .from('profile-images')
      .list('avatars', { limit: 1 });
    
    if (listError) {
      console.error('Error accessing "profile-images" bucket:', listError);
    } else {
      console.log('Successfully accessed "profile-images" bucket');
      console.log('Files in avatars folder:', files ? files.length : 0);
    }

    return { buckets: buckets || [], error: listError };

  } catch (error) {
    console.error('Unexpected error:', error);
    return { buckets: [], error };
  }
}