import React from 'react';
import { HStack, Icon, useColorModeValue } from '@chakra-ui/react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

export interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  color?: string;
  spacing?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = 4,
  color,
  spacing = 0.5,
  interactive = false,
  onChange
}) => {
  const starColor = useColorModeValue(color || 'yellow.400', color || 'yellow.300');
  const stars = [];

  const handleClick = (index: number) => {
    if (interactive && onChange) {
      onChange(index + 1);
    }
  };

  for (let i = 0; i < maxRating; i++) {
    if (i < Math.floor(rating)) {
      // Full star
      stars.push(
        <Icon 
          key={i} 
          as={FaStar} 
          w={`${size}px`} 
          h={`${size}px`} 
          color={starColor} 
          cursor={interactive ? 'pointer' : 'default'} 
          onClick={() => handleClick(i)}
        />
      );
    } else if (i < Math.ceil(rating) && !Number.isInteger(rating)) {
      // Half star
      stars.push(
        <Icon 
          key={i} 
          as={FaStarHalfAlt} 
          w={`${size}px`} 
          h={`${size}px`} 
          color={starColor}
          cursor={interactive ? 'pointer' : 'default'} 
          onClick={() => handleClick(i)}
        />
      );
    } else {
      // Empty star
      stars.push(
        <Icon 
          key={i} 
          as={FaRegStar} 
          w={`${size}px`} 
          h={`${size}px`} 
          color={starColor}
          cursor={interactive ? 'pointer' : 'default'} 
          onClick={() => handleClick(i)}
        />
      );
    }
  }

  return (
    <HStack spacing={spacing}>
      {stars}
    </HStack>
  );
};

export default StarRating;