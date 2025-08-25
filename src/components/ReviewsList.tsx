import React from 'react';
import {
  Box,
  Stack,
  Text,
  Button,
  Center,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import ReviewItem from './ReviewItem';
import { useReviews } from '../contexts/ReviewsContext';

interface ReviewsListProps {
  targetId: string;
  targetType: 'guide' | 'tour';
  showTourInfo?: boolean;
  maxItems?: number;
}

const ReviewsList: React.FC<ReviewsListProps> = ({
  targetId,
  targetType,
  showTourInfo = false,
  maxItems,
}) => {
  const { reviews, isLoading, error, loadMoreReviews, hasMoreReviews } = useReviews(targetId, targetType);
  
  if (isLoading && reviews.length === 0) {
    return (
      <Center py={8}>
        <Spinner size="lg" color="primary.500" />
      </Center>
    );
  }
  
  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        {error}
      </Alert>
    );
  }
  
  if (reviews.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Text color="gray.500">No reviews yet. Be the first to leave a review!</Text>
      </Box>
    );
  }
  
  const displayedReviews = maxItems ? reviews.slice(0, maxItems) : reviews;
  
  return (
    <Stack spacing={4}>
      {displayedReviews.map(review => (
        <ReviewItem 
          key={review.id}
          id={review.id}
          reviewer_name={review.reviewer_name}
          reviewer_avatar={review.reviewer_avatar}
          rating={review.rating}
          content={review.content}
          created_at={review.created_at}
          tour_name={review.tour_name}
          showTour={showTourInfo}
        />
      ))}
      
      {(hasMoreReviews && !maxItems) && (
        <Button 
          onClick={loadMoreReviews} 
          variant="outline" 
          size="sm" 
          alignSelf="center"
          isLoading={isLoading}
        >
          Load More Reviews
        </Button>
      )}
    </Stack>
  );
};

export default ReviewsList;