import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ghtdjwcqqcbfzaeiekhk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdodGRqd2NxcWNiZnphZWlla2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NzIwMDQsImV4cCI6MjA3MTU0ODAwNH0.RwFrnqqsbIeWO5u5wrLITaefRc7lD5hjr5DlFFg8Dt4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testStorageBuckets() {
  console.log('=== Testing Supabase Storage Buckets ===');
  console.log('Project URL:', supabaseUrl);
  console.log('Using anon key');
  console.log();

  // Test 1: List all buckets
  console.log('1. Listing all buckets:');
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
      console.log('❌ Error listing buckets:', error);
    } else {
      console.log('✅ Available buckets:', buckets.map(b => b.name));
      buckets.forEach(bucket => {
        console.log(`  - Name: ${bucket.name}, Public: ${bucket.public}, Created: ${bucket.created_at}`);
      });
    }
  } catch (err) {
    console.log('❌ Exception listing buckets:', err.message);
  }
  console.log();

  // Test 2: Test the bucket used in ProfileEditor ("profile-images")
  const testBucketName = 'profile-images';
  console.log(`2. Testing bucket "${testBucketName}":`)
  
  try {
    const { data: files, error } = await supabase.storage
      .from(testBucketName)
      .list('', { limit: 1 });
    
    if (error) {
      console.log(`❌ Error accessing bucket "${testBucketName}":`, error);
    } else {
      console.log(`✅ Bucket "${testBucketName}" exists and is accessible`);
      console.log('Files in root:', files.length);
    }
  } catch (err) {
    console.log(`❌ Exception accessing bucket "${testBucketName}":`, err.message);
  }
  console.log();

  // Test 3: Test uploading to the problematic path
  console.log('3. Testing upload to problematic path:');
  const testFileName = 'test-avatar-' + Date.now() + '.txt';
  const testFilePath = `avatars/${testFileName}`;
  const testContent = 'This is a test file for avatar upload';
  
  try {
    const { data, error } = await supabase.storage
      .from('profile-images')
      .upload(testFilePath, testContent, {
        contentType: 'text/plain'
      });
    
    if (error) {
      console.log('❌ Upload error:', error);
    } else {
      console.log('✅ Upload successful:', data);
    }
  } catch (err) {
    console.log('❌ Upload exception:', err.message);
  }
  console.log();

  // Test 4: Test different bucket names that might be the correct one
  const possibleBuckets = ['avatars', 'profile-images/avatars', 'user-avatars', 'images', 'uploads'];
  console.log('4. Testing possible bucket names:');
  
  for (const bucketName of possibleBuckets) {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .list('', { limit: 1 });
      
      if (error) {
        console.log(`❌ "${bucketName}": ${error.message}`);
      } else {
        console.log(`✅ "${bucketName}": accessible`);
      }
    } catch (err) {
      console.log(`❌ "${bucketName}": ${err.message}`);
    }
  }
}

testStorageBuckets().catch(console.error);