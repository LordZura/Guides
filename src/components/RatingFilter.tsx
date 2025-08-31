import React from 'react';
import {
  Box,
  HStack,
  Text,
  Button,
  Select,
  FormControl,
  FormLabel,
  useBreakpointValue,
} from '@chakra-ui/react';
import StarRating from './StarRating';

interface RatingFilterProps {
  selectedRating: number;
  onChange: (rating: number) => void;
  label?: string;
  showClear?: boolean;
}

/**
 * A standardized rating filter component that works consistently
 * across mobile and desktop views
 */
const RatingFilter: React.FC<RatingFilterProps> = ({
  selectedRating,
  onChange,
  label = 'Minimum Rating',
  showClear = true,
}) => {
  const isMobile = useBreakpointValue({ base: true, md: false });
  
  // Handle rating selection from star component
  const handleStarChange = (rating: number) => {
    onChange(rating);
  };
  
  // Handle rating selection from dropdown
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(Number(e.target.value));
  };
  
  // Clear the rating filter
  const handleClear = () => {
    onChange(0);
  };
  
  // Get descriptive text for the current rating threshold
  const getRatingText = (rating: number): string => {
    if (rating === 0) return 'Any rating';
    return `${rating}+ stars`;
  };
  
  return (
    <FormControl>
      <FormLabel fontSize="sm" fontWeight="semibold" color="gray.700">{label}</FormLabel>
      
      {isMobile ? (
        // Mobile view - use select dropdown
        <Select 
          placeholder="Any rating"
          value={selectedRating || ''}
          onChange={handleSelectChange}
          borderRadius="lg"
          border="2px"
          borderColor="gray.200"
          _hover={{ borderColor: 'primary.300' }}
          _focus={{ borderColor: 'primary.500', boxShadow: '0 0 0 1px var(--chakra-colors-primary-500)' }}
        >
          <option value={5}>5+ stars</option>
          <option value={4}>4+ stars</option>
          <option value={3}>3+ stars</option>
          <option value={2}>2+ stars</option>
          <option value={1}>1+ stars</option>
        </Select>
      ) : (
        // Desktop view - use interactive stars with clear description
        <HStack spacing={3} align="center">
          <StarRating 
            rating={selectedRating}
            interactive={true}
            size={24}
            onChange={handleStarChange}
          />
          <Box>
            {selectedRating > 0 ? (
              <HStack>
                <Text fontSize="sm" color="gray.600">
                  {getRatingText(selectedRating)}
                </Text>
                {showClear && (
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
            ) : (
              <Text fontSize="sm" color="gray.500">Click stars to filter</Text>
            )}
          </Box>
        </HStack>
      )}
    </FormControl>
  );
};

export default RatingFilter;