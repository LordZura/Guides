import React, { useState } from 'react';
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
} from '@chakra-ui/react';
import StarRating from './StarRating';
import { useReviews } from '../contexts/ReviewsContext';
import { useAuth } from '../contexts/AuthProvider';

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
  const toast = useToast();
  
  const [rating, setRating] = useState<number>(0);
  const [content, setContent] = useState<string>('');
  const [errors, setErrors] = useState<{
    rating?: string;
    content?: string;
  }>({});
  
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
    
    // Prepare review data using 'comment' instead of 'content'
    const reviewData = {
        reviewer_id: user.id,
        target_id: targetId,
        target_type: targetType,
        rating,
        comment: content, // Map 'content' from form to 'comment' for database
    };
    
    // Only add tour_id if it exists and is not undefined
    if (tourId) {
        (reviewData as any).tour_id = tourId;
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