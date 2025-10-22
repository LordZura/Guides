import React from 'react';
import {
  Box,
  Text,
  HStack,
  Button,
} from '@chakra-ui/react';
import StarRating from './StarRating';

interface RatingFilterProps {
  selectedRating: number;
  onChange: (_value: number) => void;
  label?: string;
  showClear?: boolean;
}

const RatingFilter: React.FC<RatingFilterProps> = ({
  selectedRating,
  onChange,
  label = 'Rating',
  showClear = false,
}) => {
  const highlightColor = 'primary.500';
  
  const handleRatingChange = (rating: number) => {
    // If user clicks on already selected rating, clear it
    if (rating === selectedRating) {
      onChange(0);
    } else {
      onChange(rating);
    }
  };
  
  const handleClear = () => {
    onChange(0);
  };

  return (
    <Box>
      {label && (
        <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={2}>
          {label}
        </Text>
      )}
      
      <HStack spacing={3} align="center">
        <StarRating
          rating={selectedRating}
          size={24}
          interactive={true}
          onChange={handleRatingChange}
          showTooltip={true}
        />
        
        {selectedRating > 0 && (
          <Text color={highlightColor} fontSize="sm" fontWeight="medium">
            {selectedRating}+ stars
          </Text>
        )}
        
        {showClear && selectedRating > 0 && (
          <Button
            size="xs"
            variant="ghost"
            onClick={handleClear}
            color="gray.500"
            _hover={{ color: 'gray.700' }}
          >
            Clear
          </Button>
        )}
      </HStack>
    </Box>
  );
};

export default RatingFilter;