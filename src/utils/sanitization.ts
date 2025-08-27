import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  });
};

/**
 * Sanitize and trim text input
 */
export const sanitizeTextInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  // Remove leading/trailing whitespace
  let cleaned = input.trim();
  
  // Remove control characters except newlines and tabs
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Limit length to prevent abuse
  const maxLength = 10000;
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength);
  }
  
  return cleaned;
};

/**
 * Validate and sanitize email input
 */
export const sanitizeEmail = (email: string): string => {
  if (!email || typeof email !== 'string') return '';
  
  let cleaned = email.trim().toLowerCase();
  
  // Basic email validation pattern
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(cleaned)) {
    return '';
  }
  
  return cleaned;
};

/**
 * Sanitize numeric input
 */
export const sanitizeNumber = (input: string | number, min = 0, max = Number.MAX_SAFE_INTEGER): number => {
  const num = typeof input === 'string' ? parseFloat(input) : input;
  
  if (isNaN(num)) return min;
  if (num < min) return min;
  if (num > max) return max;
  
  return num;
};

/**
 * Sanitize phone number input
 */
export const sanitizePhone = (phone: string): string => {
  if (!phone || typeof phone !== 'string') return '';
  
  // Remove all non-digit characters except + and -
  let cleaned = phone.replace(/[^\d+\-\s()]/g, '');
  
  // Limit length
  if (cleaned.length > 20) {
    cleaned = cleaned.substring(0, 20);
  }
  
  return cleaned.trim();
};

/**
 * Sanitize array of strings
 */
export const sanitizeStringArray = (arr: string[]): string[] => {
  if (!Array.isArray(arr)) return [];
  
  return arr
    .map(item => sanitizeTextInput(item))
    .filter(item => item.length > 0)
    .slice(0, 50); // Limit array size
};