// Make sure the component uses 'comment' consistently

import React from 'react';
import {
  Box,
  Flex,
  Text,
  Avatar,
  Stack,
  Badge,
  useColorModeValue,
} from '@chakra-ui/react';
import StarRating from './StarRating';
import { formatDistanceToNow } from 'date-fns';

export interface ReviewItemProps {
  id: string;
  reviewer_name: string;
  reviewer_avatar?: string;
  rating: number;
  comment: string;
  created_at: string;
  tour_name?: string;
  showTour?: boolean;
}

const ReviewItem: React.FC<ReviewItemProps> = ({
  reviewer_name,
  reviewer_avatar,
  rating,
  comment,
  created_at,
  tour_name,
  showTour = false,
}) => {
  const bg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  return (
    <Box
      p={4}
      borderWidth="1px"
      borderRadius="md"
      borderColor={borderColor}
      bg={bg}
      boxShadow="sm"
    >
      <Stack spacing={3}>
        <Flex justifyContent="space-between" alignItems="center">
          <Flex alignItems="center">
            <Avatar 
              size="sm" 
              name={reviewer_name} 
              src={reviewer_avatar} 
              mr={3}
            />
            <Box>
              <Text fontWeight="bold">{reviewer_name}</Text>
              {showTour && tour_name && (
                <Badge colorScheme="green" fontSize="xs">
                  {tour_name}
                </Badge>
              )}
            </Box>
          </Flex>
          <Box>
            <StarRating rating={rating} size={16} />
          </Box>
        </Flex>
        
        <Text fontSize="md">{comment}</Text>
        
        <Text fontSize="xs" color="gray.500" alignSelf="flex-end">
          {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
        </Text>
      </Stack>
    </Box>
  );
};

export default ReviewItem;