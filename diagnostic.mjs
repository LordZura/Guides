// Simple diagnostic script to test bucket configuration
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ghtdjwcqqcbfzaeiekhk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdodGRqd2NxcWNiZnphZWlla2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NzIwMDQsImV4cCI6MjA3MTU0ODAwNH0.RwFrnqqsbIeWO5u5wrLITaefRc7lD5hjr5DlFFg8Dt4';

console.log('=== Supabase Storage Diagnostic ===');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey.slice(0, 20) + '...');
console.log();

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseBuckets() {
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

    // Test upload simulation (without actual file)
    console.log();
    console.log('3. Testing upload URL generation...');
    const testFileName = 'test_' + Date.now() + '.avif';
    const testPath = `avatars/${testFileName}`;
    
    console.log(`Would upload to: profile-images/${testPath}`);
    console.log(`Full URL would be: ${supabaseUrl}/storage/v1/object/profile-images/${testPath}`);

    return { buckets: buckets || [], error: listError };

  } catch (error) {
    console.error('Unexpected error:', error);
    return { buckets: [], error };
  }
}

diagnoseBuckets().then(() => process.exit(0));