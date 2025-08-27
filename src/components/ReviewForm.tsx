import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Textarea,
  HStack,
  Text,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import StarRating from './StarRating';
import { useReviews } from '../contexts/ReviewsContext';
import { useAuth } from '../contexts/AuthProvider';
import { useBookings } from '../contexts/BookingContext';

// Import the ReviewData interface from context
interface ReviewData {
  reviewer_id: string;
  target_id: string;
  target_type: 'guide' | 'tour';
  rating: number;
  comment: string;
  tour_id?: string;
}

interface ReviewFormProps {
  targetId: string;
  targetType: 'guide' | 'tour';
  tourId?: string;
  onSuccess?: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  targetId,
  targetType,
  tourId,
  onSuccess,
}) => {
  const { addReview, isLoading } = useReviews();
  const { profile, user } = useAuth();
  const { hasCompletedTour, hasCompletedGuideBooking } = useBookings();
  const toast = useToast();
  
  const [rating, setRating] = useState<number>(0);
  const [content, setContent] = useState<string>('');
  const [hasCompletedBooking, setHasCompletedBooking] = useState<boolean>(false);
  const [isCheckingCompletion, setIsCheckingCompletion] = useState<boolean>(true);
  const [errors, setErrors] = useState<{
    rating?: string;
    content?: string;
  }>({});
  
  // Check if the user has completed a tour before allowing review
  useEffect(() => {
    const checkCompletionStatus = async () => {
      if (!user) {
        setHasCompletedBooking(false);
        setIsCheckingCompletion(false);
        return;
      }
      
      // Only set checking to true if we're not already checking
      setIsCheckingCompletion(true);
      
      try {
        let completed = false;
        
        if (targetType === 'tour' && tourId) {
          completed = await hasCompletedTour(tourId);
        } else if (targetType === 'guide') {
          completed = await hasCompletedGuideBooking(targetId);
        }
        
        setHasCompletedBooking(completed);
      } catch (error) {
        console.error('Error checking completion status:', error);
        setHasCompletedBooking(false); // Set to false on error to be safe
      } finally {
        setIsCheckingCompletion(false);
      }
    };
    
    // Only check if we have the required parameters
    if (user && targetId && targetType) {
      checkCompletionStatus();
    } else {
      setHasCompletedBooking(false);
      setIsCheckingCompletion(false);
    }
  }, [user, targetId, targetType, tourId]);
  
  const validateForm = () => {
    const newErrors: {
      rating?: string;
      content?: string;
    } = {};
    
    if (rating === 0) {
      newErrors.rating = 'Please select a rating';
    }
    
    if (!content.trim()) {
      newErrors.content = 'Please enter your review';
    } else if (content.length < 10) {
      newErrors.content = 'Review must be at least 10 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (!user || !profile) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to submit a review',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    if (!hasCompletedBooking) {
      toast({
        title: 'Cannot submit review',
        description: 'You must complete a booking before leaving a review',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // Import sanitization utilities
    const { sanitizeTextInput, sanitizeNumber } = await import('../utils/sanitization');
    
    // Prepare review data using 'comment' instead of 'content'
    const reviewData: ReviewData = {
      reviewer_id: user.id,
      target_id: targetId,
      target_type: targetType,
      rating: sanitizeNumber(rating, 1, 5), // Ensure rating is 1-5
      comment: sanitizeTextInput(content), // Sanitize comment content
    };
    
    // Additional validation after sanitization
    if (!reviewData.comment || reviewData.comment.length < 5) {
      toast({
        title: 'Review too short',
        description: 'Review must be at least 5 characters after cleaning.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // Only add tour_id if it exists and is not undefined
    if (tourId) {
      reviewData.tour_id = tourId;
    }
    
    await addReview(reviewData);
    
    // Reset form
    setRating(0);
    setContent('');
    
    // Call success callback if provided
    if (onSuccess) {
      onSuccess();
    }
  };
  
  if (isCheckingCompletion) {
    return (
      <Box>
        <Text>Checking if you can review...</Text>
      </Box>
    );
  }
  
  if (!user) {
    return (
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        <AlertTitle>Sign in required</AlertTitle>
        <AlertDescription>Please sign in to leave a review</AlertDescription>
      </Alert>
    );
  }
  
  if (!hasCompletedBooking) {
    return (
      <Alert status="warning" borderRadius="md">
        <AlertIcon />
        <AlertTitle>Booking required</AlertTitle>
        <AlertDescription>
          You need to book and complete this tour before you can leave a review.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <Box as="form" onSubmit={handleSubmit}>
      <FormControl isInvalid={!!errors.rating} mb={4}>
        <FormLabel>Your Rating</FormLabel>
        <HStack>
          <StarRating 
            rating={rating} 
            size={24} 
            interactive={true} 
            onChange={setRating} 
          />
          <Text ml={2} color={rating > 0 ? 'primary.500' : 'gray.500'}>
            {rating > 0 ? `${rating} stars` : 'Click to rate'}
          </Text>
        </HStack>
        <FormErrorMessage>{errors.rating}</FormErrorMessage>
      </FormControl>
      
      <FormControl isInvalid={!!errors.content} mb={4}>
        <FormLabel>Your Review</FormLabel>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your experience..."
          rows={4}
        />
        <FormErrorMessage>{errors.content}</FormErrorMessage>
      </FormControl>
      
      <Button 
        type="submit" 
        colorScheme="primary" 
        isLoading={isLoading}
        isDisabled={!user}
      >
        Submit Review
      </Button>
    </Box>
  );
};

export default ReviewForm;