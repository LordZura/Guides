// Test helper for mocking BookingContext completion checks
export const createMockBookingCompletion = (hasCompleted: boolean, shouldError: boolean = false) => {
  if (shouldError) {
    return {
      hasCompletedGuideBooking: false,
      hasCompletedTour: false,
      error: 'Database table does not exist'
    };
  }
  
  return {
    hasCompletedGuideBooking: hasCompleted,
    hasCompletedTour: hasCompleted,
    error: null
  };
};

// Example API response for the check (as requested in requirements)
export const exampleBookingCompletionResponse = {
  "hasCompletedGuideBooking": true
};

// Test cases for booking completion
export const bookingCompletionTestCases = [
  {
    name: "User has completed guide booking",
    userID: "user-123",
    guideID: "guide-456",
    expected: true,
    description: "Should return true when user has completed booking with guide"
  },
  {
    name: "User has not completed guide booking",
    userID: "user-123", 
    guideID: "guide-789",
    expected: false,
    description: "Should return false when user has not completed booking with guide"
  },
  {
    name: "Database error handling",
    userID: "user-123",
    guideID: "guide-456",
    expected: false,
    simulateError: true,
    description: "Should return false and not crash when database error occurs"
  },
  {
    name: "Missing parameters",
    userID: "",
    guideID: "",
    expected: false,
    description: "Should return false when parameters are missing"
  }
];