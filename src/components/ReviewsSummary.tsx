// Enhance the ReviewsSummary component
import React, { useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  VStack,
  HStack,
  useColorModeValue,
} from '@chakra-ui/react';
import StarRating from './StarRating';

interface ReviewsSummaryProps {
  averageRating: number;
  totalReviews: number;
  ratingCounts?: Record<number, number>;
}

const ReviewsSummary: React.FC<ReviewsSummaryProps> = ({
  averageRating,
  totalReviews,
  ratingCounts = {},
}) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  // Create an array with ratings from 5 to 1
  const ratings = [5, 4, 3, 2, 1];
  
  // Log the summary data when it changes
  useEffect(() => {
    console.log('ReviewsSummary rendered with:', { averageRating, totalReviews, ratingCounts });
  }, [averageRating, totalReviews, ratingCounts]);
  
  // Calculate the percentage for each rating
  const calculatePercentage = (count: number) => {
    if (totalReviews === 0) return 0;
    return (count / totalReviews) * 100;
  };
  
  return (
    <Box 
      p={5} 
      borderWidth="1px" 
      borderRadius="lg" 
      borderColor={borderColor}
      bg={bgColor}
      boxShadow="sm"
    >
      <Flex direction={{ base: 'column', md: 'row' }} gap={6}>
        {/* Left side - average rating */}
        <Box flex="1" textAlign="center">
          <Stat>
            <StatLabel fontSize="lg">Average Rating</StatLabel>
            <StatNumber fontSize="4xl" fontWeight="bold" color="primary.500">
              {averageRating.toFixed(1)}
            </StatNumber>
            <Box my={2} justifyContent="center" display="flex">
              <StarRating rating={averageRating} size={24} />
            </Box>
            <StatHelpText fontSize="md">
              Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
            </StatHelpText>
          </Stat>
        </Box>
        
        {/* Right side - rating distribution */}
        <Box flex="1.5">
          <VStack spacing={2} align="stretch">
            {ratings.map(rating => (
              <HStack key={rating} spacing={4}>
                <Box minW="60px">
                  <Text>{rating} stars</Text>
                </Box>
                <Progress 
                  value={calculatePercentage(ratingCounts[rating] || 0)} 
                  size="sm" 
                  colorScheme="primary" 
                  borderRadius="full" 
                  flex="1"
                />
                <Box minW="40px" textAlign="right">
                  <Text>{ratingCounts[rating] || 0}</Text>
                </Box>
              </HStack>
            ))}
          </VStack>
        </Box>
      </Flex>
    </Box>
  );
};

export default ReviewsSummary;