import React from 'react';
import { HStack, Icon, Box, Tooltip, useBreakpointValue } from '@chakra-ui/react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

export interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number | { base?: number; sm?: number; md?: number; lg?: number; xl?: number };
  color?: string;
  spacing?: number;
  interactive?: boolean;
  showTooltip?: boolean;
  onChange?: (_value: number) => void;
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
  const starColor = color || 'yellow.400';
  
  // Handle responsive size
  const responsiveSize = useBreakpointValue(
    typeof size === 'object' ? size : { base: size, md: size }
  ) || 4;
  
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
        w={`${responsiveSize}px`} 
        h={`${responsiveSize}px`} 
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