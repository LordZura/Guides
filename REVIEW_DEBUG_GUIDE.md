# Review System Debugging Guide

## Problem: P0001 "User has already reviewed this tour" Error

This error occurs when users try to submit reviews but get a constraint violation from the database. The enhanced debugging system now provides comprehensive logging to identify the exact cause.

## How to Debug Review Issues

### 1. Check Browser Console
When a review submission fails, look for these log patterns:

```
🔍 ReviewForm: Checking completion status: { user, targetId, targetType, tourId, ... }
📝 Attempting to add review: { reviewData, timestamp }
🔍 Validating review request: { reviewer_id, target_id, target_type, ... }
📊 All user reviews: [array of existing reviews]
💥 Error adding review: { error, reviewData, errorCode, errorMessage, ... }
```

### 2. Key Information to Look For

**In the validation logs:**
- `target_id` and `target_type` values
- Existing reviews by the user
- Potential conflicts detected

**In the error logs:**
- Error code (P0001, 23505, etc.)
- Database error message
- Review data being submitted

### 3. Common Scenarios

**Scenario 1: Legitimate Duplicate**
```
User tries to review the same guide/tour twice
→ Should be blocked with clear message
```

**Scenario 2: Guide vs Tour Confusion**
```
User reviewed guide X, then tries to review tour Y created by guide X
→ Should be allowed (separate reviews)
→ Look for conflictingReviews in logs showing the relationship
```

**Scenario 3: Data Integrity Issue**
```
Database constraint triggered unexpectedly
→ Check if target_id values are being mixed up
→ Verify target_type is correct
```

### 4. Debugging Steps

1. **Reproduce the error** with browser console open
2. **Copy all review-related logs** (lines with 🔍📝💥⚠️✅❌ emojis)
3. **Check the exact parameters** being passed to the database
4. **Verify the relationship** between guides and tours involved
5. **Look for any ID mismatches** or incorrect target_type values

### 5. Enhanced Error Messages

The system now provides contextual error messages:

- **P0001 errors**: "You have already reviewed this [guide/tour]"
- **With context**: "Note: You have previously reviewed the guide who created this tour, but tour and guide reviews are separate"
- **Development environment**: Includes error codes for debugging

## Database Schema Reference

```sql
-- Reviews table structure
reviews (
  reviewer_id UUID,  -- User who wrote the review
  target_id UUID,    -- ID of what's being reviewed (guide user ID or tour ID)
  target_type TEXT,  -- 'guide' or 'tour'
  tour_id UUID       -- Optional: specific tour context
)

-- Unique constraint
UNIQUE (reviewer_id, target_id, target_type)
```

## Expected Log Example

When working correctly, you should see:
```
🔍 ReviewForm: Checking completion status: { user: "user123", targetId: "tour456", targetType: "tour" }
✅ ReviewForm: Booking status is completed, checking if already reviewed
🔍 Checking if user has reviewed: { userId: "user123", targetId: "tour456", targetType: "tour" }
✅ Review check result: { hasReviewed: false, existingReviews: [] }
📝 Attempting to add review: { reviewer_id: "user123", target_id: "tour456", target_type: "tour" }
🔍 Validating review request: { reviewer_id: "user123", target_id: "tour456", target_type: "tour" }
📊 All user reviews: [{ target_id: "guide789", target_type: "guide" }]
📊 Review context information: [{ type: "guide_reviewed_before_tour", message: "User has reviewed the guide who created this tour" }]
✨ Proceeding with review insertion...
✅ Review successfully inserted
```

This comprehensive logging will help identify exactly where the confusion occurs in the review process.