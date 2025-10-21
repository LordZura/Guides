import React from 'react';
import {
  Box,
  Image,
  Stack,
  Heading,
  Text,
  Badge,
  Button,
  Flex,
  Icon,
  useColorModeValue,
  HStack,
} from '@chakra-ui/react';
import { MdLocationOn, MdStar } from 'react-icons/md';
import { Link as RouterLink } from 'react-router-dom';
import { Profile, DEFAULT_AVATAR_URL } from '../lib/supabaseClient';
import StarRating from './StarRating';
import { useGuideRating } from '../hooks/useGuideRating';

interface GuideWithRating extends Profile {
  average_rating?: number;
  reviews_count?: number;
}

interface GuideCardProps {
  guide: GuideWithRating;
}

const GuideCard = ({ guide }: GuideCardProps) => {
  const cardBg = useColorModeValue('white', 'gray.700');
  
  // Use the custom hook for rating management, passing initial data from guide object
  const { averageRating, reviewCount } = useGuideRating(guide.id, {
    averageRating: guide.average_rating || 0,
    reviewCount: guide.reviews_count || 0,
  });
  
  return (
    <Box
      borderWidth="1px"
      borderRadius="xl"
      overflow="hidden"
      boxShadow="lg"
      bg={cardBg}
      transition="all 0.3s ease"
      _hover={{ 
        boxShadow: '2xl',
        borderColor: 'primary.200'
      }}
      borderColor="gray.200"
      position="relative"
    >
      <Box position="relative" height={{ base: "200px", sm: "220px", md: "240px" }} overflow="hidden">
        <Image
          src={guide.avatar_url || DEFAULT_AVATAR_URL}
          alt={guide.full_name}
          objectFit="cover"
          width="100%"
          height="100%"
          transition="transform 0.3s ease"
          _hover={{ transform: 'scale(1.05)' }}
          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
            e.currentTarget.src = DEFAULT_AVATAR_URL;
          }}
        />
        
        <Box
          position="absolute"
          bottom="0"
          left="0"
          right="0"
          bgGradient="linear(to-t, blackAlpha.800, transparent)"
          p={4}
          color="white"
        >
          <Heading size="md" noOfLines={1} fontWeight="bold">{guide.full_name}</Heading>
          
          {guide.years_experience && (
            <Flex align="center" mt={2}>
              <Icon as={MdStar} color="yellow.400" mr={2} boxSize="4" />
              <Text fontSize="sm" fontWeight="medium">{guide.years_experience} years experience</Text>
            </Flex>
          )}
        </Box>
      </Box>
      
      <Box p={{ base: 4, md: 6 }}>
        <Stack spacing={{ base: 3, md: 4 }}>
          {/* Rating display */}
          <Flex align="center" justify="space-between">
            <StarRating rating={averageRating} size={18} />
            <Text fontSize="sm" color="gray.500" fontWeight="medium">
              {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
            </Text>
          </Flex>
          
          {guide.bio && (
            <Text fontSize="sm" noOfLines={2} color="gray.600" lineHeight="1.5">
              {guide.bio}
            </Text>
          )}
          
          {guide.languages && guide.languages.length > 0 && (
            <HStack flexWrap="wrap" spacing={2}>
              {guide.languages.map((lang: string, index: number) => (
                <Badge key={index} colorScheme="primary" fontSize="xs" borderRadius="full" px={3} py={1}>
                  {lang}
                </Badge>
              ))}
            </HStack>
          )}
          
          {guide.location && (
            <Flex align="center">
              <Icon as={MdLocationOn} color="primary.500" mr={2} boxSize="4" />
              <Text fontSize="sm" color="gray.700" fontWeight="medium">{guide.location}</Text>
            </Flex>
          )}
          
          {guide.specialties && (
            <Box>
              <Text fontSize="sm" color="gray.700" fontWeight="semibold" mb={1}>Specialties:</Text>
              <Text fontSize="sm" color="gray.600">{guide.specialties}</Text>
            </Box>
          )}
          
          <Button
            as={RouterLink}
            to={`/profile/${guide.id}`}
            colorScheme="primary"
            size={{ base: "sm", md: "md" }}
            width="100%"
            borderRadius="full"
            fontWeight="semibold"
            _hover={{ transform: 'translateY(-1px)', boxShadow: 'md' }}
            transition="all 0.2s"
            mt={2}
          >
            View Profile
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default GuideCard;