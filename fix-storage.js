#!/usr/bin/env node

/**
 * Supabase Storage Fix Script
 * 
 * This script creates the missing 'profile-images' bucket that's causing
 * the "400 Bad Request / Bucket not found" error in avatar uploads.
 * 
 * Usage: node fix-storage.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables:');
  console.error('   VITE_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY:', SUPABASE_SERVICE_KEY ? '✅' : '❌');
  console.error('\nPlease ensure these are set in your .env file.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fixStorageIssue() {
  console.log('🔧 Fixing Supabase Storage Issue...');
  console.log(`📡 Project: ${SUPABASE_URL}`);
  console.log(`🔑 Using key: ${SUPABASE_SERVICE_KEY.slice(0, 20)}...`);
  console.log();

  try {
    // Step 1: List existing buckets
    console.log('1️⃣ Checking existing buckets...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Failed to list buckets:', listError.message);
      return false;
    }

    console.log(`   Found ${buckets.length} existing buckets:`);
    buckets.forEach((bucket, i) => {
      console.log(`   ${i + 1}. ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });

    // Step 2: Check if profile-images bucket exists
    const hasProfileImages = buckets.some(b => b.name === 'profile-images');
    
    if (hasProfileImages) {
      console.log('✅ "profile-images" bucket already exists!');
      
      // Test access
      console.log('\n2️⃣ Testing bucket access...');
      const { data, error: accessError } = await supabase.storage.from('profile-images').list();
      
      if (accessError) {
        console.error('❌ Cannot access "profile-images" bucket:', accessError.message);
        console.log('💡 Check bucket permissions in Supabase dashboard');
        return false;
      }
      
      console.log(`✅ Bucket is accessible (contains ${data.length} files)`);
      
    } else {
      // Step 3: Create the missing bucket
      console.log('\n2️⃣ Creating "profile-images" bucket...');
      
      const { data, error: createError } = await supabase.storage.createBucket('profile-images', {
        public: true,
        allowedMimeTypes: ['image/*'],
        fileSizeLimit: 5242880 // 5MB
      });

      if (createError) {
        console.error('❌ Failed to create bucket:', createError.message);
        console.log('💡 Make sure you\'re using a service role key with storage admin permissions');
        return false;
      }

      console.log('✅ Successfully created "profile-images" bucket!');
    }

    // Step 4: Test upload functionality
    console.log('\n3️⃣ Testing upload functionality...');
    
    const testFile = new Blob(['test avatar upload'], { type: 'text/plain' });
    const testFileName = `test-${Date.now()}.txt`;
    const testPath = `avatars/${testFileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-images')
      .upload(testPath, testFile);

    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError.message);
      return false;
    }

    console.log(`✅ Upload test successful: ${uploadData.path}`);

    // Clean up test file
    await supabase.storage.from('profile-images').remove([testPath]);
    console.log('🗑️ Cleaned up test file');

    // Step 5: Verify public URL access
    console.log('\n4️⃣ Testing public URL generation...');
    const { data: urlData } = supabase.storage
      .from('profile-images')
      .getPublicUrl('avatars/example.jpg');
    
    console.log(`✅ Public URL format: ${urlData.publicUrl}`);

    console.log('\n🎉 Storage issue has been fixed!');
    console.log('📝 What was fixed:');
    console.log('   • Created "profile-images" bucket with public access');
    console.log('   • Configured for image uploads (5MB limit)');
    console.log('   • Verified upload functionality works');
    console.log('   • Avatar uploads should now work in ProfileEditor');

    return true;

  } catch (error) {
    console.error('💥 Unexpected error:', error);
    return false;
  }
}

// Run the fix
fixStorageIssue()
  .then(success => {
    if (success) {
      console.log('\n✨ Fix completed successfully!');
      console.log('🔄 You can now test avatar uploads in the application.');
    } else {
      console.log('\n❌ Fix failed. Please check the errors above.');
      console.log('💡 You may need to create the bucket manually in the Supabase Dashboard.');
    }
  })
  .catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });