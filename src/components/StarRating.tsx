import React from 'react';
import { HStack, Icon, useColorModeValue, Box, Tooltip } from '@chakra-ui/react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

export interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  color?: string;
  spacing?: number;
  interactive?: boolean;
  showTooltip?: boolean;
  onChange?: (rating: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = 4,
  color,
  spacing = 0.5,
  interactive = false,
  showTooltip = false,
  onChange
}) => {
  const starColor = useColorModeValue(color || 'yellow.400', color || 'yellow.300');
  const stars = [];

  const handleClick = (index: number) => {
    if (interactive && onChange) {
      // If clicking on the same star that's already selected, clear the rating
      const newRating = rating === index + 1 ? 0 : index + 1;
      onChange(newRating);
    }
  };

  for (let i = 0; i < maxRating; i++) {
    // Determine which star icon to use
    let StarIcon = FaRegStar;
    if (i < Math.floor(rating)) {
      StarIcon = FaStar;
    } else if (i < Math.ceil(rating) && !Number.isInteger(rating)) {
      StarIcon = FaStarHalfAlt;
    }
    
    // Wrap star in tooltip if showTooltip is true
    const star = (
      <Icon 
        key={i} 
        as={StarIcon} 
        w={`${size}px`} 
        h={`${size}px`} 
        color={starColor} 
        cursor={interactive ? 'pointer' : 'default'} 
        onClick={() => handleClick(i)}
        _hover={interactive ? { transform: 'scale(1.2)' } : undefined}
        transition="transform 0.2s"
      />
    );
    
    if (showTooltip && interactive) {
      stars.push(
        <Tooltip key={i} label={`${i + 1} stars`} placement="top">
          <Box>{star}</Box>
        </Tooltip>
      );
    } else {
      stars.push(star);
    }
  }

  return (
    <HStack spacing={spacing}>
      {stars}
    </HStack>
  );
};

export default StarRating;