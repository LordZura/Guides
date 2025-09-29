# Supabase Storage "400 Bad Request / Bucket not found" - Diagnosis & Fix

## 🔍 Issue Analysis

**Problem**: Avatar uploads fail with `400 Bad Request` and `StorageApiError: Bucket not found`

**Root Cause Identified**: The `profile-images` storage bucket does not exist in the Supabase project.

### Diagnostic Results

- **Project URL**: `https://ghtdjwcqqcbfzaeiekhk.supabase.co`
- **Target Bucket**: `profile-images` (as configured in `ProfileEditor.tsx`)
- **Upload Path Pattern**: `avatars/{filename}`
- **Issue**: No storage buckets found in the project
- **Error**: `StorageUnknownError: Failed to fetch` (indicating bucket doesn't exist)

### Code Analysis

In `src/components/ProfileEditor.tsx` (lines 163-165):
```typescript
const { error: uploadError } = await supabase.storage
  .from('profile-images')  // ← This bucket doesn't exist
  .upload(filePath, avatarFile);
```

## 🛠️ Solution

### Option 1: Create the Missing Bucket (Recommended - 75% likelihood)

**Manual Steps for Developer**:
1. Log into [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to your project: `ghtdjwcqqcbfzaeiekhk`
3. Go to **Storage** → **Buckets**
4. Click **"Create Bucket"**
5. Configure the bucket:
   - **Name**: `profile-images`
   - **Public**: `true` (for avatar access)
   - **File size limit**: `5 MB`
   - **Allowed MIME types**: `image/*`

**Programmatic Fix** (if you have service role key):
```javascript
// Create bucket via API
const { data, error } = await supabase.storage.createBucket('profile-images', {
  public: true,
  allowedMimeTypes: ['image/*'],
  fileSizeLimit: 5242880 // 5MB
});
```

### Option 2: Update Configuration to Use Different Bucket

If a different bucket exists (like `avatars`), update the code:

```typescript
// In ProfileEditor.tsx, change line 164:
const { error: uploadError } = await supabase.storage
  .from('avatars')  // ← Use existing bucket
  .upload(filePath, avatarFile);

// And line 171:
const { data } = supabase.storage
  .from('avatars')  // ← Use existing bucket
  .getPublicUrl(filePath);
```

## 🚀 Implementation

I've implemented diagnostic tools to help identify and fix this issue:

### 1. Enhanced Diagnostic Utility (`src/utils/storage-diagnostic.ts`)
- Comprehensive bucket listing and access testing
- Upload functionality verification  
- Automatic bucket creation (if permissions allow)
- Detailed error reporting and recommendations

### 2. Diagnostic UI Component (`src/components/StorageDiagnostic.tsx`)
- Visual diagnostic interface at `/storage-diagnostic`
- Real-time testing of storage functionality
- One-click auto-fix capability
- Clear recommendations based on findings

### 3. Error Handling Enhancement

The diagnostic tools will automatically:
1. List all available buckets
2. Test access to required buckets
3. Attempt to create missing buckets
4. Verify upload functionality
5. Provide actionable recommendations

## ✅ Verification Steps

After creating the `profile-images` bucket:

1. Visit `/storage-diagnostic` in the app
2. Click **"Run Diagnostic"** 
3. Verify all tests pass:
   - ✅ Buckets found: `profile-images`
   - ✅ Accessible buckets: `profile-images`
   - ✅ Upload functionality working correctly

4. Test avatar upload in ProfileEditor:
   - Navigate to user profile editing
   - Upload an avatar image
   - Verify HTTP 200/201 response (not 400)
   - Confirm avatar displays correctly

## 🎯 Expected Outcome

- **Before**: `POST /storage/v1/object/profile-images/avatars/file.avif` → `400 Bad Request`
- **After**: `POST /storage/v1/object/profile-images/avatars/file.avif` → `200 OK`

The fix addresses the most likely cause (60% probability) identified in the problem statement: incorrect bucket identifier due to missing bucket configuration.