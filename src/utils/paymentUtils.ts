import { format, isBefore, startOfDay, addHours, differenceInHours } from 'date-fns';

export interface PaymentValidationResult {
  isValid: boolean;
  error?: string;
  canPay: boolean;
  daysUntilStart?: number;
  hoursUntilStart?: number;
}

/**
 * Validates if payment can be made for a booking
 * Payment cannot be made after tour start date (beginning of day)
 */
export const validatePaymentTiming = (bookingDate: string, preferredTime?: string): PaymentValidationResult => {
  const now = new Date();
  const tourDate = new Date(bookingDate);
  
  // Set tour start time to beginning of day if no preferred time is specified
  let tourStartTime = startOfDay(tourDate);
  
  if (preferredTime) {
    const [hours, minutes] = preferredTime.split(':').map(Number);
    tourStartTime = new Date(tourDate);
    tourStartTime.setHours(hours, minutes || 0, 0, 0);
  }
  
  const hoursUntilStart = differenceInHours(tourStartTime, now);
  const daysUntilStart = Math.ceil(hoursUntilStart / 24);
  
  // Check if tour has already started (cannot pay after start of tour day)
  if (isBefore(tourStartTime, now)) {
    return {
      isValid: false,
      canPay: false,
      error: 'Payment deadline has passed. This tour has already started or passed.',
      daysUntilStart,
      hoursUntilStart
    };
  }
  
  return {
    isValid: true,
    canPay: true,
    daysUntilStart,
    hoursUntilStart
  };
};

/**
 * Checks if a tour should be automatically completed
 * Tours are auto-completed 24 hours after the booking date if not manually completed
 */
export const shouldAutoComplete = (bookingDate: string, status: string, preferredTime?: string): boolean => {
  if (status !== 'paid') return false;
  
  const now = new Date();
  const tourDate = new Date(bookingDate);
  
  let tourEndTime = new Date(tourDate);
  
  if (preferredTime) {
    const [hours, minutes] = preferredTime.split(':').map(Number);
    tourEndTime.setHours(hours, minutes || 0, 0, 0);
  } else {
    // Default to end of day if no time specified
    tourEndTime.setHours(23, 59, 59, 999);
  }
  
  // Add 24 hours to tour end time
  const autoCompleteTime = addHours(tourEndTime, 24);
  
  return isBefore(autoCompleteTime, now);
};

/**
 * Get user-friendly payment deadline message
 */
export const getPaymentDeadlineMessage = (bookingDate: string, preferredTime?: string): string => {
  const result = validatePaymentTiming(bookingDate, preferredTime);
  
  if (!result.canPay) {
    return result.error || 'Payment no longer available';
  }
  
  if (result.hoursUntilStart! <= 24) {
    return `Payment must be completed before tour starts in ${result.hoursUntilStart} hours`;
  }
  
  return `Payment must be completed before ${format(new Date(bookingDate), 'MMM dd, yyyy')}`;
};

/**
 * Format tour completion deadline message
 */
export const getCompletionDeadlineMessage = (bookingDate: string, preferredTime?: string): string => {
  const tourDate = new Date(bookingDate);
  let tourEndTime = new Date(tourDate);
  
  if (preferredTime) {
    const [hours, minutes] = preferredTime.split(':').map(Number);
    tourEndTime.setHours(hours, minutes || 0, 0, 0);
  } else {
    tourEndTime.setHours(23, 59, 59, 999);
  }
  
  const autoCompleteTime = addHours(tourEndTime, 24);
  
  return `Tour will be automatically completed on ${format(autoCompleteTime, 'MMM dd, yyyy \'at\' h:mm a')} if not confirmed earlier`;
};