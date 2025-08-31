import { PostgrestError } from '@supabase/supabase-js';

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
}

/**
 * Retry a Supabase query with exponential backoff for 406 and network errors
 */
export async function retrySupabaseQuery<T>(
  queryFunction: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  options: RetryOptions = {}
): Promise<{ data: T | null; error: PostgrestError | null }> {
  const { maxRetries = 3, baseDelay = 1000, maxDelay = 10000 } = options;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await queryFunction();
      
      // If successful or non-retryable error, return immediately
      if (!result.error || !isRetryableError(result.error)) {
        return result;
      }
      
      // If this is the last attempt, return the error
      if (attempt === maxRetries) {
        return result;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      console.warn(`Supabase query failed (attempt ${attempt + 1}), retrying in ${delay}ms:`, result.error);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
    } catch (exception) {
      // Handle network errors or other exceptions
      if (attempt === maxRetries) {
        return { data: null, error: { message: String(exception) } as PostgrestError };
      }
      
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      console.warn(`Supabase query exception (attempt ${attempt + 1}), retrying in ${delay}ms:`, exception);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return { data: null, error: { message: 'Max retries exceeded' } as PostgrestError };
}

/**
 * Retry a Supabase booking update with special handling for 400 errors
 */
export async function retryBookingUpdate<T>(
  queryFunction: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  options: RetryOptions = {}
): Promise<{ data: T | null; error: PostgrestError | null }> {
  const { maxRetries = 3, baseDelay = 1000, maxDelay = 10000 } = options;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await queryFunction();
      
      // If successful or non-retryable error, return immediately
      if (!result.error || !isRetryableBookingError(result.error)) {
        return result;
      }
      
      // If this is the last attempt, return the error
      if (attempt === maxRetries) {
        return result;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      console.warn(`Booking update failed (attempt ${attempt + 1}), retrying in ${delay}ms:`, result.error);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
    } catch (exception) {
      // Handle network errors or other exceptions
      if (attempt === maxRetries) {
        return { data: null, error: { message: String(exception) } as PostgrestError };
      }
      
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      console.warn(`Booking update exception (attempt ${attempt + 1}), retrying in ${delay}ms:`, exception);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return { data: null, error: { message: 'Max retries exceeded' } as PostgrestError };
}

/**
 * Check if an error is retryable (network issues, 406 errors, etc.)
 */
function isRetryableError(error: PostgrestError): boolean {
  // Retry on 406 Not Acceptable errors
  if (error.code === '406' || error.message?.includes('406')) {
    return true;
  }
  
  // Retry on network/connection errors
  if (error.message?.includes('fetch') || 
      error.message?.includes('network') || 
      error.message?.includes('timeout') ||
      error.message?.includes('ECONNRESET') ||
      error.message?.includes('ENOTFOUND')) {
    return true;
  }
  
  // Don't retry on authentication or permission errors
  if (error.code === '401' || error.code === '403' || 
      error.code === 'PGRST301' || error.code === 'PGRST116') {
    return false;
  }
  
  return false;
}

/**
 * Check if an error is retryable for booking updates specifically
 * This includes 400 errors which might be due to temporary RLS policy issues
 */
function isRetryableBookingError(error: PostgrestError): boolean {
  // First check general retryable errors
  if (isRetryableError(error)) {
    return true;
  }
  
  // For booking updates, also retry 400 errors which might be due to
  // temporary RLS policy evaluation issues or database constraint conflicts
  if (error.code === '400' || error.message?.includes('400')) {
    return true;
  }
  
  return false;
}