import { supabase } from '../lib/supabaseClient';

export async function diagnoseStorageIssue() {
  console.log('🔍 Starting Supabase Storage Diagnostic...');
  
  const diagnosticResults = {
    projectUrl: '',
    bucketsFound: [] as string[],
    accessTests: {} as Record<string, { success: boolean; error?: string; fileCount?: number }>,
    uploadTests: {} as Record<string, { success: boolean; error?: string; path?: string }>,
    createTests: {} as Record<string, { success: boolean; error?: string }>,
    errors: [] as string[],
    recommendations: [] as string[]
  };

  try {
    // Get project URL from config
    diagnosticResults.projectUrl = import.meta.env.VITE_SUPABASE_URL || 'Not configured';
    console.log(`📡 Project URL: ${diagnosticResults.projectUrl}`);
    
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      diagnosticResults.errors.push('Missing environment variables - check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    }

    // Step 1: List all buckets with timeout
    console.log('\n🗂️ Step 1: Listing all storage buckets...');
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const bucketsPromise = supabase.storage.listBuckets();
      
      const { data: buckets, error: bucketsError } = await Promise.race([
        bucketsPromise,
        timeoutPromise
      ]) as any;
      
      if (bucketsError) {
        diagnosticResults.errors.push(`List buckets: ${bucketsError.message}`);
        console.error('❌ Error listing buckets:', bucketsError);
        
        if (bucketsError.message.includes('fetch')) {
          diagnosticResults.errors.push('Network connectivity issue - check Supabase project URL and network access');
        }
      } else {
        diagnosticResults.bucketsFound = buckets.map((b: any) => b.name);
        console.log(`✅ Found ${buckets.length} buckets:`, diagnosticResults.bucketsFound);
      }
    } catch (err: any) {
      diagnosticResults.errors.push(`Network error listing buckets: ${err.message}`);
      console.error('❌ Network error:', err);
    }

    // Step 2: Test access to specific buckets with better error handling
    console.log('\n🔍 Step 2: Testing bucket access...');
    const bucketsToTest = ['profile-images'];
    
    // Add any found buckets that might be alternative names
    if (diagnosticResults.bucketsFound.includes('avatars')) {
      bucketsToTest.push('avatars');
    }
    if (diagnosticResults.bucketsFound.includes('images')) {
      bucketsToTest.push('images');
    }
    
    for (const bucketName of bucketsToTest) {
      try {
        console.log(`  Testing "${bucketName}" bucket...`);
        const { data, error } = await supabase.storage.from(bucketName).list('avatars');
        
        if (error) {
          diagnosticResults.accessTests[bucketName] = { success: false, error: error.message };
          console.log(`  ❌ Cannot access "${bucketName}": ${error.message}`);
          
          if (error.message.includes('not found')) {
            console.log(`  💡 Bucket "${bucketName}" does not exist`);
          } else if (error.message.includes('permission')) {
            console.log(`  💡 Permission issue with "${bucketName}" - check storage policies`);
          }
        } else {
          diagnosticResults.accessTests[bucketName] = { success: true, fileCount: data.length };
          console.log(`  ✅ Successfully accessed "${bucketName}" (${data.length} files in avatars folder)`);
        }
      } catch (err: any) {
        diagnosticResults.accessTests[bucketName] = { success: false, error: `Network error: ${err.message}` };
        console.log(`  ❌ Network error testing "${bucketName}": ${err.message}`);
      }
    }

    // Step 3: Try to create missing buckets if profile-images doesn't exist
    console.log('\n🛠️ Step 3: Checking bucket creation needs...');
    
    if (!diagnosticResults.bucketsFound.includes('profile-images') && 
        !diagnosticResults.accessTests['profile-images']?.success) {
      
      try {
        console.log('  Creating "profile-images" bucket...');
        const { error } = await supabase.storage.createBucket('profile-images', {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'],
          fileSizeLimit: 5242880 // 5MB
        });

        if (error) {
          if (error.message.includes('already exists')) {
            diagnosticResults.createTests['profile-images'] = { success: true };
            console.log('  ℹ️ Bucket "profile-images" already exists');
          } else {
            diagnosticResults.createTests['profile-images'] = { success: false, error: error.message };
            console.log(`  ❌ Failed to create "profile-images": ${error.message}`);
            
            if (error.message.includes('permission')) {
              console.log('  💡 Need service role key or storage admin permissions to create buckets');
            }
          }
        } else {
          diagnosticResults.createTests['profile-images'] = { success: true };
          console.log('  ✅ Successfully created "profile-images" bucket');
          
          // Re-test access after creation
          await new Promise(resolve => setTimeout(resolve, 1000));
          try {
            const { data: testData, error: testError } = await supabase.storage.from('profile-images').list();
            if (!testError) {
              diagnosticResults.accessTests['profile-images'] = { success: true, fileCount: testData.length };
              console.log('  ✅ Confirmed access to newly created bucket');
            }
          } catch (reTestErr) {
            console.log('  ⚠️ Could not verify new bucket access');
          }
        }
      } catch (err: any) {
        diagnosticResults.createTests['profile-images'] = { success: false, error: `Network error: ${err.message}` };
        console.log(`  ❌ Network error creating "profile-images": ${err.message}`);
      }
    } else if (diagnosticResults.accessTests['profile-images']?.success) {
      console.log('  ✅ "profile-images" bucket is already accessible');
    }

    // Step 4: Test upload functionality if we have access
    console.log('\n📤 Step 4: Testing upload functionality...');
    
    const accessibleBuckets = Object.entries(diagnosticResults.accessTests)
      .filter(([_, test]) => test.success)
      .map(([bucket, _]) => bucket);
    
    for (const bucketName of accessibleBuckets) {
      try {
        // Create a small test file
        const testContent = new Blob(['test-avatar-upload'], { type: 'text/plain' });
        const testFileName = `diagnostic-test-${Date.now()}.txt`;
        const testPath = `avatars/${testFileName}`;

        console.log(`  Testing upload to ${bucketName}/${testPath}...`);
        
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(testPath, testContent);

        if (error) {
          diagnosticResults.uploadTests[`${bucketName}/avatars/`] = { success: false, error: error.message };
          console.log(`  ❌ Upload failed to ${bucketName}: ${error.message}`);
          
          if (error.message.includes('policy')) {
            console.log(`  💡 Check storage policies for ${bucketName} - may need INSERT permission for anon role`);
          }
        } else {
          diagnosticResults.uploadTests[`${bucketName}/avatars/`] = { success: true, path: data.path };
          console.log(`  ✅ Upload successful to ${bucketName}: ${data.path}`);
          
          // Test public URL generation
          const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(testPath);
          console.log(`  ✅ Public URL: ${urlData.publicUrl}`);
          
          // Clean up test file
          try {
            await supabase.storage.from(bucketName).remove([testPath]);
            console.log('  🗑️ Cleaned up test file');
          } catch (cleanupErr) {
            console.log('  ⚠️ Could not clean up test file (not critical)');
          }
        }
      } catch (err: any) {
        diagnosticResults.uploadTests[`${bucketName}/avatars/`] = { success: false, error: `Network error: ${err.message}` };
        console.log(`  ❌ Network error during upload test to ${bucketName}: ${err.message}`);
      }
    }

    // Generate comprehensive recommendations
    console.log('\n📊 Generating recommendations...');
    
    if (diagnosticResults.accessTests['profile-images']?.success) {
      if (diagnosticResults.uploadTests['profile-images/avatars/']?.success) {
        diagnosticResults.recommendations.push('✅ "profile-images" bucket exists, accessible, and upload works - avatar upload should work correctly');
      } else {
        diagnosticResults.recommendations.push('⚠️ "profile-images" bucket exists and is accessible but upload failed - check storage policies');
        diagnosticResults.recommendations.push('💡 Add INSERT policy for authenticated users or anon role in Supabase Dashboard > Storage > Policies');
      }
    } else if (diagnosticResults.createTests['profile-images']?.success) {
      diagnosticResults.recommendations.push('✅ Successfully created "profile-images" bucket - retry the avatar upload');
    } else if (diagnosticResults.bucketsFound.includes('avatars')) {
      diagnosticResults.recommendations.push('⚠️ Consider using "avatars" bucket instead of "profile-images" - update ProfileEditor.tsx');
    } else {
      diagnosticResults.recommendations.push('❌ Create "profile-images" bucket manually in Supabase Dashboard > Storage > Buckets');
      diagnosticResults.recommendations.push('💡 Set bucket as public and add policies for INSERT (upload) permissions');
    }

    // Network connectivity check
    if (diagnosticResults.errors.some(e => e.includes('Network') || e.includes('fetch'))) {
      diagnosticResults.recommendations.push('🌐 Check network connectivity to Supabase and verify project URL is correct');
    }

    // Environment variables check
    if (diagnosticResults.errors.some(e => e.includes('environment'))) {
      diagnosticResults.recommendations.push('🔧 Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set correctly in .env file');
    }

    console.log('\n📋 Summary:');
    diagnosticResults.recommendations.forEach(rec => console.log(`  ${rec}`));
    
    return diagnosticResults;

  } catch (err: any) {
    console.error('💥 Fatal error in diagnostic:', err);
    diagnosticResults.errors.push(`Fatal diagnostic error: ${err.message}`);
    return diagnosticResults;
  }
}

export async function fixStorageIssue(): Promise<boolean> {
  console.log('🔧 Attempting to fix storage issue...');
  
  try {
    // First, check what buckets exist
    console.log('🔍 Checking existing buckets...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.log('ℹ️ Cannot list buckets (may be permission limitation)');
      // Continue with creation attempt even if listing fails
    } else {
      console.log(`Found ${buckets.length} existing buckets:`, buckets.map(b => b.name));
    }

    // Try to create the profile-images bucket with comprehensive error handling
    console.log('Creating "profile-images" bucket...');
    const { error } = await supabase.storage.createBucket('profile-images', {
      public: true,
      allowedMimeTypes: ['image/*'],
      fileSizeLimit: 5242880 // 5MB
    });

    let bucketAvailable = false;

    if (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Bucket "profile-images" already exists');
        bucketAvailable = true;
      } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
        console.log('⚠️ Permission issue creating bucket - bucket may already exist');
        // Test if we can access it even without creation permissions
        bucketAvailable = true;
      } else {
        console.error('❌ Failed to create bucket:', error.message);
        
        // Try alternative: suggest using existing bucket if available
        if (buckets && buckets.length > 0) {
          console.log('💡 Consider using existing bucket:', buckets[0].name);
        }
        return false;
      }
    } else {
      console.log('✅ Successfully created "profile-images" bucket');
      bucketAvailable = true;
    }

    if (bucketAvailable) {
      // Test upload functionality with more detailed error reporting
      console.log('📤 Testing upload functionality...');
      const testContent = new Blob(['test-avatar-upload'], { type: 'text/plain' });
      const testPath = `avatars/fix-test-${Date.now()}.txt`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(testPath, testContent);

      if (uploadError) {
        console.error('❌ Upload test failed:', uploadError.message);
        console.log('🔍 Upload error details:', {
          code: uploadError.name,
          message: uploadError.message,
          path: testPath
        });
        
        // Provide specific guidance based on error type
        if (uploadError.message.includes('Bucket not found')) {
          console.log('💡 Bucket exists but may need proper configuration or policies');
        } else if (uploadError.message.includes('permission') || uploadError.message.includes('policy')) {
          console.log('💡 Check storage policies - anon key may need upload permissions');
        }
        
        return false;
      }

      console.log('✅ Upload successful:', uploadData.path);

      // Test public URL generation
      const { data: urlData } = supabase.storage
        .from('profile-images')
        .getPublicUrl(testPath);
      
      console.log('✅ Public URL generated:', urlData.publicUrl);

      // Clean up test file
      try {
        await supabase.storage.from('profile-images').remove([testPath]);
        console.log('🗑️ Cleaned up test file');
      } catch (cleanupErr) {
        console.log('⚠️ Could not clean up test file (not critical)');
      }
    }
    
    console.log('🎉 Storage issue has been fixed!');
    return true;

  } catch (err: any) {
    console.error('❌ Error fixing storage issue:', err.message);
    console.log('🔍 Full error details:', err);
    return false;
  }
}

// Legacy function for backward compatibility
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