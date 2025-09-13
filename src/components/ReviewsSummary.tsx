import React from 'react';
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

/**
 * Clean ReviewsSummary component - recreated with simple logic
 */
const ReviewsSummary: React.FC<ReviewsSummaryProps> = ({
  averageRating,
  totalReviews,
  ratingCounts = {},
}) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  // Rating levels from 5 to 1 stars
  const ratingLevels = [5, 4, 3, 2, 1];
  
  /**
   * Calculate percentage for rating distribution bar
   */
  const calculatePercentage = (count: number): number => {
    if (totalReviews === 0) return 0;
    return (count / totalReviews) * 100;
  };

  // Don't render if no reviews
  if (totalReviews === 0) {
    return (
      <Box 
        p={5} 
        borderWidth="1px" 
        borderRadius="lg" 
        borderColor={borderColor}
        bg={bgColor}
        textAlign="center"
      >
        <Text color="gray.500">No reviews yet</Text>
      </Box>
    );
  }
  
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
        {/* Average Rating Display */}
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
              {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
            </StatHelpText>
          </Stat>
        </Box>
        
        {/* Rating Distribution */}
        <Box flex="1.5">
          <VStack spacing={2} align="stretch">
            {ratingLevels.map(level => {
              const count = ratingCounts[level] || 0;
              const percentage = calculatePercentage(count);
              
              return (
                <HStack key={level} spacing={4}>
                  <Box minW="60px">
                    <Text fontSize="sm">{level} stars</Text>
                  </Box>
                  <Progress 
                    value={percentage}
                    size="sm" 
                    colorScheme="yellow" 
                    borderRadius="full" 
                    flex="1"
                    bg="gray.100"
                  />
                  <Box minW="40px" textAlign="right">
                    <Text fontSize="sm">{count}</Text>
                  </Box>
                </HStack>
              );
            })}
          </VStack>
        </Box>
      </Flex>
    </Box>
  );
};

export default ReviewsSummary;