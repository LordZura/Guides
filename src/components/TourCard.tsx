import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Badge,
  Button,
  Flex,
  Icon,
  Skeleton,
  useColorModeValue,
  HStack,
  VStack,
  useToast,
  Avatar,
} from '@chakra-ui/react';
import { MdAccessTime, MdAttachMoney, MdCalendarToday, MdGroup, MdLocationOn } from 'react-icons/md';
import { Link as RouterLink } from 'react-router-dom';
import { supabase, DEFAULT_AVATAR_URL } from '../lib/supabaseClient';
import StarRating from './StarRating';

interface TourCardProps {
  tourId: string;
}

interface Tour {
  id: string;
  title: string;
  description: string;
  location: string;
  duration: number;
  price: number;
  capacity: number;
  languages: string[];
  days_available: boolean[];
  is_private: boolean;
  creator_id: string;
  creator_role: string;
  created_at: string;
  creator_name?: string;
  creator_avatar?: string;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TourCard = ({ tourId }: TourCardProps) => {
  const [tour, setTour] = useState<Tour | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const cardBg = useColorModeValue('white', 'gray.700');
  const toast = useToast();
  
  useEffect(() => {
    const fetchTour = async () => {
      try {
        setIsLoading(true);
        
        // First fetch the tour
        const { data: tourData, error: tourError } = await supabase
          .from('tours')
          .select('*')
          .eq('id', tourId)
          .single();
        
        if (tourError) throw tourError;
        
        // Then fetch the creator's profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', tourData.creator_id)
          .single();
        
        if (profileError && profileError.code !== 'PGRST116') {
          // PGRST116 is "not found" error, which we can handle gracefully
          throw profileError;
        }
        
        // If this is a guide's tour, fetch their rating
        if (tourData.creator_role === 'guide') {
          const { data: ratingData, error: ratingError } = await supabase
            .rpc('get_review_summary', {
              target_id_param: tourData.creator_id,
              target_type_param: 'guide'
            });
          
          if (!ratingError && ratingData) {
            setAverageRating(ratingData.average_rating || 0);
            setReviewCount(ratingData.total_reviews || 0);
          }
        }
        
        // Combine the data
        setTour({
          ...tourData,
          creator_name: profileData?.full_name || 'Unknown Guide',
          creator_avatar: profileData?.avatar_url || null
        });
      } catch (err) {
        console.error('Error fetching tour:', err);
        toast({
          title: 'Error loading tour',
          description: 'Could not load tour details',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTour();
  }, [tourId, toast]);
  
  if (isLoading) {
    return (
      <Box borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="md" bg={cardBg} p={4}>
        <Skeleton height="24px" width="60%" mb={2} />
        <Skeleton height="16px" width="40%" mb={4} />
        <Skeleton height="16px" width="100%" mb={2} />
        <Skeleton height="16px" width="90%" mb={4} />
        <Flex justify="space-between">
          <Skeleton height="20px" width="30%" />
          <Skeleton height="36px" width="30%" />
        </Flex>
      </Box>
    );
  }
  
  if (!tour) {
    return (
      <Box borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="md" bg={cardBg} p={4}>
        <Text>Tour not found or no longer available</Text>
      </Box>
    );
  }
  
  // Format available days
  const availableDays = tour.days_available
    ? DAYS_OF_WEEK.filter((_, index) => tour.days_available[index]).join(', ')
    : 'Not specified';
  
  const isGuide = tour.creator_role === 'guide';
  
  return (
    <Box
      borderWidth="1px"
      borderRadius="xl"
      overflow="hidden"
      boxShadow="lg"
      bg={cardBg}
      transition="all 0.3s ease"
      _hover={{ 
        transform: 'translateY(-8px)', 
        boxShadow: '2xl',
        borderColor: 'primary.200'
      }}
      borderColor="gray.200"
      position="relative"
    >
      <Box p={6}>
        <Heading as="h3" size="md" mb={3} noOfLines={2} color="gray.800" lineHeight="1.3">
          {tour.title}
        </Heading>
        
        <Flex align="center" mb={4}>
          <Avatar 
            size="sm" 
            src={tour.creator_avatar || DEFAULT_AVATAR_URL} 
            name={tour.creator_name} 
            mr={3}
            border="2px"
            borderColor="primary.100"
          />
          <Box>
            <Text fontSize="sm" fontWeight="semibold" color="gray.700">{tour.creator_name}</Text>
            {isGuide && (
              <Flex align="center" mt={1}>
                <StarRating rating={averageRating} size={14} />
                <Text fontSize="xs" ml={2} color="gray.500" fontWeight="medium">
                  ({reviewCount} reviews)
                </Text>
              </Flex>
            )}
          </Box>
        </Flex>
        
        <Text fontSize="sm" mb={6} noOfLines={3} color="gray.600" lineHeight="1.5">
          {tour.description}
        </Text>
        
        <VStack spacing={3} align="start" mb={6}>
          <Flex align="center">
            <Icon as={MdLocationOn} color="primary.500" mr={3} boxSize="4" />
            <Text fontSize="sm" fontWeight="medium" color="gray.700">{tour.location}</Text>
          </Flex>
          
          <Flex align="center">
            <Icon as={MdAccessTime} color="primary.500" mr={3} boxSize="4" />
            <Text fontSize="sm" fontWeight="medium" color="gray.700">{tour.duration} hour{tour.duration !== 1 ? 's' : ''}</Text>
          </Flex>
          
          <Flex align="center">
            <Icon as={MdAttachMoney} color="green.500" mr={3} boxSize="4" />
            <Text fontSize="sm" fontWeight="bold" color="green.600">${tour.price} per person</Text>
          </Flex>
          
          <Flex align="center">
            <Icon as={MdGroup} color="primary.500" mr={3} boxSize="4" />
            <Text fontSize="sm" fontWeight="medium" color="gray.700">Up to {tour.capacity} people</Text>
          </Flex>
          
          <Flex align="center">
            <Icon as={MdCalendarToday} color="primary.500" mr={3} boxSize="4" />
            <Text fontSize="sm" noOfLines={1} fontWeight="medium" color="gray.700">Available: {availableDays}</Text>
          </Flex>
        </VStack>
        
        {tour.languages && tour.languages.length > 0 && (
          <Box mb={6}>
            <Text fontSize="sm" fontWeight="semibold" mb={2} color="gray.700">Languages:</Text>
            <HStack spacing={2} flexWrap="wrap">
              {tour.languages.map((lang, index) => (
                <Badge key={index} colorScheme="primary" fontSize="xs" borderRadius="full" px={3} py={1}>
                  {lang}
                </Badge>
              ))}
            </HStack>
          </Box>
        )}
        
        <Flex justify="space-between" align="center" pt={2} borderTop="1px" borderColor="gray.100">
          <Badge 
            colorScheme={tour.is_private ? 'purple' : 'green'} 
            fontSize="xs" 
            borderRadius="full"
            px={3}
            py={1}
          >
            {tour.is_private ? 'Private' : 'Public'}
          </Badge>
          
          <Button
            as={RouterLink}
            to={`/tours/${tour.id}`}
            colorScheme="primary"
            size="sm"
            borderRadius="full"
            px={6}
            fontWeight="semibold"
            _hover={{ transform: 'translateY(-1px)', boxShadow: 'md' }}
            transition="all 0.2s"
          >
            View Details
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};

export default TourCard;