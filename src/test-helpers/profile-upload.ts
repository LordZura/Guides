// Test helper for profile upload functionality
export const createMockProfileUpload = (shouldSucceed: boolean = true) => {
  if (!shouldSucceed) {
    return {
      success: false,
      error: 'Upload failed',
      url: null
    };
  }
  
  return {
    success: true,
    error: null,
    url: 'https://example.com/storage/avatars/user123_1234567890.jpg'
  };
};

// Example request/response shape for upload endpoint (as requested in requirements)
export const exampleUploadRequest = {
  file: 'File object',
  userId: 'user-123',
  bucket: 'profile-images',
  path: 'avatars/'
};

export const exampleUploadResponse = {
  success: true,
  url: 'https://supabase-storage-url.com/profile-images/avatars/user123_1234567890.jpg',
  error: null
};

// Test cases for profile upload
export const profileUploadTestCases = [
  {
    name: "Valid image upload",
    file: {
      name: 'avatar.jpg',
      type: 'image/jpeg',
      size: 1024 * 1024 // 1MB
    },
    expected: { success: true },
    description: "Should successfully upload valid image file"
  },
  {
    name: "File too large",
    file: {
      name: 'large-image.jpg',
      type: 'image/jpeg',
      size: 3 * 1024 * 1024 // 3MB
    },
    expected: { success: false, error: 'File too large' },
    description: "Should reject files larger than 2MB"
  },
  {
    name: "Invalid file type",
    file: {
      name: 'document.pdf',
      type: 'application/pdf',
      size: 1024 * 1024
    },
    expected: { success: false, error: 'Invalid file type' },
    description: "Should reject non-image files"
  },
  {
    name: "Network error",
    file: {
      name: 'avatar.jpg',
      type: 'image/jpeg',
      size: 1024 * 1024
    },
    simulateNetworkError: true,
    expected: { success: false, error: 'Upload failed' },
    description: "Should handle network errors gracefully"
  }
];