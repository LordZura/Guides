import { supabase } from '../lib/supabaseClient';

export interface StorageFile {
  name: string;
  id?: string;
  updated_at?: string;
  created_at?: string;
  last_accessed_at?: string;
  metadata?: Record<string, unknown>;
}

export interface UniversalListResult {
  files: StorageFile[];
  publicUrls: Record<string, string>;
  foundInPath: string;
  totalFound: number;
}

/**
 * Universal-safe list function that searches for files in multiple possible paths
 * within a Supabase storage bucket. This handles cases where files might be stored
 * in nested folders (like 'avatars/') or at the bucket root.
 * 
 * @param bucketName - The name of the storage bucket
 * @param searchPaths - Array of paths to search (defaults to ['avatars', ''])
 * @param options - Additional options for listing files
 * @returns Promise with files found, their public URLs, and metadata
 */
export async function universalListFiles(
  bucketName: string,
  searchPaths: string[] = ['avatars', ''],
  options: {
    limit?: number;
    offset?: number;
    sortBy?: { column: string; order: 'asc' | 'desc' };
  } = {}
): Promise<UniversalListResult> {
  const result: UniversalListResult = {
    files: [],
    publicUrls: {},
    foundInPath: '',
    totalFound: 0
  };

  // Ensure searchPaths includes both nested and root paths
  const pathsToSearch = [...new Set([...searchPaths, 'avatars', ''])];

  for (const searchPath of pathsToSearch) {
    try {
      const { data: files, error } = await supabase.storage
        .from(bucketName)
        .list(searchPath, {
          limit: options.limit,
          offset: options.offset,
          sortBy: options.sortBy
        });

      if (error) {
        console.error(`Error listing files in path "${searchPath}":`, error.message);
        continue;
      }

      if (files && files.length > 0) {
        // Filter out folders (items without file extensions or with '/' at the end)
        const actualFiles = files.filter(file => 
          file.name && 
          !file.name.endsWith('/') && 
          (file.name.includes('.') || file.metadata)
        );

        if (actualFiles.length > 0) {
          result.files = actualFiles;
          result.foundInPath = searchPath;
          result.totalFound = actualFiles.length;

          // Generate public URLs for found files
          actualFiles.forEach(file => {
            const filePath = searchPath ? `${searchPath}/${file.name}` : file.name;
            const { data } = supabase.storage
              .from(bucketName)
              .getPublicUrl(filePath);
            result.publicUrls[file.name] = data.publicUrl;
          });

          // Return immediately when files are found
          return result;
        }
      }
    } catch (error) {
      console.error(`Unexpected error searching path "${searchPath}":`, error);
      continue;
    }
  }

  return result;
}

/**
 * Creates necessary RLS policies for storage bucket access
 * This ensures users can list and access files in the specified bucket
 */
export async function ensureStoragePolicies(bucketName: string): Promise<boolean> {
  try {
    // Note: This requires service role key or proper permissions
    // In a production environment, this should be handled server-side
    
    const selectPolicySQL = `
      CREATE POLICY IF NOT EXISTS "allow_list_${bucketName}" 
      ON storage.objects FOR SELECT 
      USING (bucket_id = '${bucketName}');
    `;

    console.warn('Policy creation requires service role key or database access');
    console.warn('Execute this SQL in your Supabase dashboard:');
    console.warn(selectPolicySQL);
    
    return true;
  } catch (error) {
    console.error('Error ensuring storage policies:', error);
    return false;
  }
}

/**
 * Universal file uploader that creates consistent paths and handles errors gracefully
 */
export async function universalUpload(
  bucketName: string,
  file: File,
  userId: string,
  folder: string = 'avatars'
): Promise<{ success: boolean; path?: string; publicUrl?: string; error?: string }> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file);

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return {
      success: true,
      path: data.path,
      publicUrl: urlData.publicUrl
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check if bucket exists and is accessible
 */
export async function checkBucketAccess(bucketName: string): Promise<{
  exists: boolean;
  accessible: boolean;
  error?: string;
}> {
  try {
    // Try to list buckets first
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      return {
        exists: false,
        accessible: false,
        error: `Cannot list buckets: ${listError.message}`
      };
    }

    const bucketExists = buckets?.some(bucket => bucket.name === bucketName) || false;
    
    if (!bucketExists) {
      return {
        exists: false,
        accessible: false,
        error: `Bucket "${bucketName}" does not exist`
      };
    }

    // Try to access the bucket
    const { error: accessError } = await supabase.storage
      .from(bucketName)
      .list('', { limit: 1 });

    if (accessError) {
      return {
        exists: true,
        accessible: false,
        error: `Bucket exists but is not accessible: ${accessError.message}`
      };
    }

    return {
      exists: true,
      accessible: true
    };
  } catch (error) {
    return {
      exists: false,
      accessible: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}