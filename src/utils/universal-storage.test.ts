import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the supabase client
vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    storage: {
      from: vi.fn(),
      listBuckets: vi.fn(),
    }
  }
}));

import { universalListFiles, checkBucketAccess, universalUpload } from './universal-storage';
import { supabase } from '../lib/supabaseClient';

describe('universal-storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('universalListFiles', () => {
    it('should find files in avatars folder', async () => {
      const mockList = vi.fn();
      const mockGetPublicUrl = vi.fn();
      
      (supabase.storage.from as any).mockReturnValue({
        list: mockList,
        getPublicUrl: mockGetPublicUrl
      });

      // Mock empty response for first path, files in second path
      mockList
        .mockResolvedValueOnce({ data: [], error: null }) // avatars folder empty
        .mockResolvedValueOnce({ 
          data: [
            { name: 'user1_123.jpg', metadata: { size: 1024 } },
            { name: 'user2_456.png', metadata: { size: 2048 } }
          ], 
          error: null 
        }); // root folder has files

      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/bucket/file.jpg' }
      });

      const result = await universalListFiles('profile-images', ['avatars', '']);

      expect(result.totalFound).toBe(2);
      expect(result.foundInPath).toBe('');
      expect(result.files).toHaveLength(2);
      expect(result.publicUrls).toHaveProperty('user1_123.jpg');
    });

    it('should handle errors gracefully', async () => {
      const mockList = vi.fn();
      (supabase.storage.from as any).mockReturnValue({ list: mockList });

      mockList.mockResolvedValue({ 
        data: null, 
        error: { message: 'Bucket not found' } 
      });

      const result = await universalListFiles('non-existent-bucket');

      expect(result.totalFound).toBe(0);
      expect(result.files).toHaveLength(0);
    });

    it('should filter out folders and keep only files', async () => {
      const mockList = vi.fn();
      const mockGetPublicUrl = vi.fn();
      
      (supabase.storage.from as any).mockReturnValue({
        list: mockList,
        getPublicUrl: mockGetPublicUrl
      });

      mockList.mockResolvedValueOnce({ 
        data: [
          { name: 'subfolder/', metadata: null }, // folder - should be filtered out
          { name: 'file.jpg', metadata: { size: 1024 } }, // file - should be kept
          { name: 'another-folder/', metadata: null }, // folder - should be filtered out
          { name: 'document.pdf', metadata: { size: 2048 } } // file - should be kept
        ], 
        error: null 
      });

      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/bucket/file.jpg' }
      });

      const result = await universalListFiles('profile-images', ['avatars']);

      expect(result.totalFound).toBe(2);
      expect(result.files.map(f => f.name)).toEqual(['file.jpg', 'document.pdf']);
    });
  });

  describe('checkBucketAccess', () => {
    it('should return bucket exists and accessible when all checks pass', async () => {
      (supabase.storage.listBuckets as any).mockResolvedValue({
        data: [{ name: 'profile-images', public: true }],
        error: null
      });

      const mockList = vi.fn();
      (supabase.storage.from as any).mockReturnValue({ list: mockList });
      mockList.mockResolvedValue({ data: [], error: null });

      const result = await checkBucketAccess('profile-images');

      expect(result.exists).toBe(true);
      expect(result.accessible).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return bucket does not exist when not found in list', async () => {
      (supabase.storage.listBuckets as any).mockResolvedValue({
        data: [{ name: 'other-bucket', public: true }],
        error: null
      });

      const result = await checkBucketAccess('profile-images');

      expect(result.exists).toBe(false);
      expect(result.accessible).toBe(false);
      expect(result.error).toBe('Bucket "profile-images" does not exist');
    });

    it('should handle access errors gracefully', async () => {
      (supabase.storage.listBuckets as any).mockResolvedValue({
        data: [{ name: 'profile-images', public: true }],
        error: null
      });

      const mockList = vi.fn();
      (supabase.storage.from as any).mockReturnValue({ list: mockList });
      mockList.mockResolvedValue({ 
        data: null, 
        error: { message: 'Permission denied' } 
      });

      const result = await checkBucketAccess('profile-images');

      expect(result.exists).toBe(true);
      expect(result.accessible).toBe(false);
      expect(result.error).toBe('Bucket exists but is not accessible: Permission denied');
    });
  });

  describe('universalUpload', () => {
    it('should upload file successfully', async () => {
      const mockUpload = vi.fn();
      const mockGetPublicUrl = vi.fn();
      
      (supabase.storage.from as any).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl
      });

      mockUpload.mockResolvedValue({
        data: { path: 'avatars/user123_1234567890.jpg' },
        error: null
      });

      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/bucket/avatars/user123_1234567890.jpg' }
      });

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = await universalUpload('profile-images', file, 'user123', 'avatars');

      expect(result.success).toBe(true);
      expect(result.path).toBe('avatars/user123_1234567890.jpg');
      expect(result.publicUrl).toContain('https://example.com');
    });

    it('should handle upload errors', async () => {
      const mockUpload = vi.fn();
      (supabase.storage.from as any).mockReturnValue({ upload: mockUpload });

      mockUpload.mockResolvedValue({
        data: null,
        error: { message: 'Bucket not found' }
      });

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = await universalUpload('non-existent-bucket', file, 'user123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Bucket not found');
    });
  });
});