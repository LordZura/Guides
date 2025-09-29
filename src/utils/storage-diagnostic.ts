import { supabase } from '../lib/supabaseClient';
import { universalListFiles, checkBucketAccess, ensureStoragePolicies } from './universal-storage';

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

    // Step 1: List all buckets
    console.log('\n🗂️ Step 1: Listing all storage buckets...');
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        diagnosticResults.errors.push(`List buckets: ${bucketsError.message}`);
        console.error('❌ Error listing buckets:', bucketsError);
      } else {
        diagnosticResults.bucketsFound = buckets.map(b => b.name);
        console.log(`✅ Found ${buckets.length} buckets:`, diagnosticResults.bucketsFound);
      }
    } catch (err: any) {
      diagnosticResults.errors.push(`Network error listing buckets: ${err.message}`);
      console.error('❌ Network error:', err);
    }

    // Step 2: Test access to specific buckets using universal listing
    console.log('\n🔍 Step 2: Testing bucket access with universal listing...');
    const bucketsToTest = ['profile-images', 'avatars'];
    
    for (const bucketName of bucketsToTest) {
      try {
        console.log(`  Testing "${bucketName}" bucket...`);
        
        // Use universal bucket access check
        const accessResult = await checkBucketAccess(bucketName);
        
        if (!accessResult.accessible) {
          diagnosticResults.accessTests[bucketName] = { 
            success: false, 
            error: accessResult.error || 'Bucket not accessible' 
          };
          console.log(`  ❌ Cannot access "${bucketName}": ${accessResult.error}`);
        } else {
          // Use universal listing to find files in any location
          const listResult = await universalListFiles(bucketName, ['avatars', ''], { limit: 10 });
          
          diagnosticResults.accessTests[bucketName] = { 
            success: true, 
            fileCount: listResult.totalFound 
          };
          console.log(`  ✅ Successfully accessed "${bucketName}" (${listResult.totalFound} files found in "${listResult.foundInPath}" path)`);
          
          if (listResult.totalFound > 0) {
            console.log(`    📁 Files found in path: "${listResult.foundInPath}"`);
            console.log(`    📄 Sample files: ${listResult.files.slice(0, 3).map(f => f.name).join(', ')}`);
          }
        }
      } catch (err: any) {
        diagnosticResults.accessTests[bucketName] = { success: false, error: `Network error: ${err.message}` };
        console.log(`  ❌ Network error testing "${bucketName}": ${err.message}`);
      }
    }

    // Step 3: Try to create missing buckets
    console.log('\n🛠️ Step 3: Attempting to create missing buckets...');
    
    if (!diagnosticResults.bucketsFound.includes('profile-images')) {
      try {
        console.log('  Creating "profile-images" bucket...');
        const { error } = await supabase.storage.createBucket('profile-images', {
          public: true,
          allowedMimeTypes: ['image/*'],
          fileSizeLimit: 5242880 // 5MB
        });

        if (error) {
          if (error.message.includes('already exists')) {
            diagnosticResults.createTests['profile-images'] = { success: true };
            console.log('  ℹ️ Bucket "profile-images" already exists');
          } else {
            diagnosticResults.createTests['profile-images'] = { success: false, error: error.message };
            console.log(`  ❌ Failed to create "profile-images": ${error.message}`);
          }
        } else {
          diagnosticResults.createTests['profile-images'] = { success: true };
          console.log('  ✅ Successfully created "profile-images" bucket');
          // Re-test access
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for creation to propagate
          const { data: testData, error: testError } = await supabase.storage.from('profile-images').list();
          if (!testError) {
            diagnosticResults.accessTests['profile-images'] = { success: true, fileCount: testData.length };
            console.log('  ✅ Confirmed access to newly created bucket');
          }
        }
      } catch (err: any) {
        diagnosticResults.createTests['profile-images'] = { success: false, error: `Network error: ${err.message}` };
        console.log(`  ❌ Network error creating "profile-images": ${err.message}`);
      }
    }

    // Step 4: Test a small upload if possible
    console.log('\n📤 Step 4: Testing upload functionality...');
    
    if (diagnosticResults.accessTests['profile-images']?.success) {
      try {
        // Create a small test file
        const testContent = new Blob(['test avatar'], { type: 'text/plain' });
        const testFileName = `test-${Date.now()}.txt`;
        const testPath = `avatars/${testFileName}`;

        console.log(`  Testing upload to profile-images/${testPath}...`);
        
        const { data, error } = await supabase.storage
          .from('profile-images')
          .upload(testPath, testContent);

        if (error) {
          diagnosticResults.uploadTests['profile-images/avatars/'] = { success: false, error: error.message };
          console.log(`  ❌ Upload failed: ${error.message}`);
        } else {
          diagnosticResults.uploadTests['profile-images/avatars/'] = { success: true, path: data.path };
          console.log(`  ✅ Upload successful: ${data.path}`);
          
          // Clean up test file
          try {
            await supabase.storage.from('profile-images').remove([testPath]);
            console.log('  🗑️ Cleaned up test file');
          } catch (cleanupErr) {
            console.log('  ⚠️ Could not clean up test file (not critical)');
          }
        }
      } catch (err: any) {
        diagnosticResults.uploadTests['profile-images/avatars/'] = { success: false, error: `Network error: ${err.message}` };
        console.log(`  ❌ Network error during upload test: ${err.message}`);
      }
    }

    // Generate recommendations
    console.log('\n📊 Generating recommendations...');
    
    // Ensure storage policies are in place
    if (diagnosticResults.accessTests['profile-images']?.success) {
      console.log('🔒 Ensuring storage policies are configured...');
      await ensureStoragePolicies('profile-images');
    }
    
    if (diagnosticResults.accessTests['profile-images']?.success) {
      diagnosticResults.recommendations.push('✅ "profile-images" bucket exists and is accessible - configuration should work');
    } else if (diagnosticResults.createTests['profile-images']?.success) {
      diagnosticResults.recommendations.push('✅ Successfully created "profile-images" bucket - retry the upload');
    } else if (diagnosticResults.bucketsFound.includes('avatars')) {
      diagnosticResults.recommendations.push('⚠️ Consider using "avatars" bucket instead of "profile-images"');
    } else {
      diagnosticResults.recommendations.push('❌ Create "profile-images" bucket in Supabase dashboard or check permissions');
    }

    // Check upload functionality
    if (diagnosticResults.uploadTests['profile-images/avatars/']?.success) {
      diagnosticResults.recommendations.push('✅ Upload functionality working correctly');
    } else if (Object.keys(diagnosticResults.uploadTests).length > 0) {
      diagnosticResults.recommendations.push('❌ Upload functionality has issues - check storage policies and permissions');
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
    // Try to create the profile-images bucket
    console.log('Creating "profile-images" bucket...');
    const { error } = await supabase.storage.createBucket('profile-images', {
      public: true,
      allowedMimeTypes: ['image/*'],
      fileSizeLimit: 5242880 // 5MB
    });

    if (error && !error.message.includes('already exists')) {
      console.error('❌ Failed to create bucket:', error.message);
      return false;
    }

    console.log('✅ Bucket "profile-images" is now available');
    
    // Test upload functionality
    const testContent = new Blob(['test'], { type: 'text/plain' });
    const testPath = `avatars/test-${Date.now()}.txt`;
    
    const { error: uploadError } = await supabase.storage
      .from('profile-images')
      .upload(testPath, testContent);

    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError.message);
      return false;
    }

    // Clean up test file
    await supabase.storage.from('profile-images').remove([testPath]);
    
    console.log('✅ Storage issue has been fixed!');
    return true;

  } catch (err: any) {
    console.error('❌ Error fixing storage issue:', err.message);
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

    // Test the specific bucket used in the code with universal listing
    console.log('2. Testing "profile-images" bucket with universal file search...');
    const listResult = await universalListFiles('profile-images', ['avatars', ''], { limit: 10 });
    
    if (listResult.totalFound === 0 && buckets && !buckets.map(b => b.name).includes('profile-images')) {
      console.error('Error: "profile-images" bucket not found or inaccessible');
    } else {
      console.log('Successfully accessed "profile-images" bucket');
      console.log(`Files found: ${listResult.totalFound} (in path: "${listResult.foundInPath}")`);
      if (listResult.totalFound > 0) {
        console.log('Sample files:', listResult.files.slice(0, 3).map(f => f.name).join(', '));
      }
    }

    return { buckets: buckets || [], error: null };

  } catch (error) {
    console.error('Unexpected error:', error);
    return { buckets: [], error };
  }
}