import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  Button,
  Badge,
  Image,
  Grid,
  GridItem,
  VStack,
  HStack,
  Icon,
  Divider,
  Skeleton,
  useToast,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { MdAccessTime, MdCalendarToday, MdGroup, MdLanguage, MdLocationOn } from 'react-icons/md';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthProvider';
import { ReviewsProvider } from '../contexts/ReviewsContext';
import ReviewsList from '../components/ReviewsList';
import ReviewForm from '../components/ReviewForm';
import ReviewsSummary from '../components/ReviewsSummary';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TourDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [tour, setTour] = useState<any | null>(null);
  const [guide, setGuide] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  
  useEffect(() => {
    const fetchTourDetails = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch tour details
        const { data: tourData, error: tourError } = await supabase
          .from('tours')
          .select('*')
          .eq('id', id)
          .single();
        
        if (tourError) throw tourError;
        
        setTour(tourData);
        
        // Fetch guide details if this is a guide's tour
        if (tourData.creator_role === 'guide') {
          const { data: guideData, error: guideError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', tourData.creator_id)
            .single();
          
          if (guideError && guideError.code !== 'PGRST116') {
            throw guideError;
          }
          
          setGuide(guideData || null);
        }
      } catch (err: any) {
        console.error('Error fetching tour details:', err);
        setError(err.message || 'Failed to load tour details');
        toast({
          title: 'Error loading tour',
          description: err.message || 'An unexpected error occurred',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTourDetails();
  }, [id, toast]);
  
  if (isLoading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box bg="white" p={6} borderRadius="lg" boxShadow="md">
          <Skeleton height="40px" width="60%" mb={4} />
          <Skeleton height="20px" width="40%" mb={6} />
          
          <Grid templateColumns={{ base: "1fr", md: "2fr 1fr" }} gap={8}>
            <GridItem>
              <Skeleton height="300px" mb={6} />
              <Skeleton height="20px" width="100%" mb={2} />
              <Skeleton height="20px" width="90%" mb={2} />
              <Skeleton height="20px" width="95%" mb={4} />
            </GridItem>
            
            <GridItem>
              <Skeleton height="200px" mb={4} />
              <Skeleton height="50px" mb={2} />
            </GridItem>
          </Grid>
        </Box>
      </Container>
    );
  }
  
  if (error || !tour) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          {error || 'Tour not found'}
        </Alert>
      </Container>
    );
  }
  
  // Format available days
  const availableDays = tour.days_available
    ? DAYS_OF_WEEK.filter((_, index) => tour.days_available[index]).join(', ')
    : 'Not specified';
  
  return (
    <Container maxW="container.xl" py={8}>
      <Box bg="white" p={6} borderRadius="lg" boxShadow="md">
        <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" mb={6}>
          <Box>
            <Heading as="h1" size="xl" mb={2}>{tour.title}</Heading>
            <HStack spacing={3} mb={2}>
              <Badge colorScheme={tour.is_private ? 'purple' : 'green'}>
                {tour.is_private ? 'Private Tour' : 'Public Tour'}
              </Badge>
              <Badge colorScheme="blue">{tour.location}</Badge>
            </HStack>
          </Box>
          
          <Box>
            <Text fontSize="2xl" fontWeight="bold" color="primary.600">
              ${tour.price}
              <Text as="span" fontSize="md" fontWeight="normal" color="gray.500"> per person</Text>
            </Text>
          </Box>
        </Flex>
        
        <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={8}>
          <GridItem>
            {/* Tour details */}
            <Box mb={8}>
              <Text fontSize="lg" mb={4}>{tour.description}</Text>
              
              <VStack align="start" spacing={3} mt={6}>
                <Flex align="center">
                  <Icon as={MdLocationOn} color="primary.500" mr={2} />
                  <Text fontWeight="medium">Location:</Text>
                  <Text ml={2}>{tour.location}</Text>
                </Flex>
                
                <Flex align="center">
                  <Icon as={MdAccessTime} color="primary.500" mr={2} />
                  <Text fontWeight="medium">Duration:</Text>
                  <Text ml={2}>{tour.duration} hour{tour.duration !== 1 ? 's' : ''}</Text>
                </Flex>
                
                <Flex align="center">
                  <Icon as={MdGroup} color="primary.500" mr={2} />
                  <Text fontWeight="medium">Group Size:</Text>
                  <Text ml={2}>Up to {tour.capacity} people</Text>
                </Flex>
                
                <Flex align="center">
                  <Icon as={MdCalendarToday} color="primary.500" mr={2} />
                  <Text fontWeight="medium">Available:</Text>
                  <Text ml={2}>{availableDays}</Text>
                </Flex>
                
                <Flex align="center">
                  <Icon as={MdLanguage} color="primary.500" mr={2} />
                  <Text fontWeight="medium">Languages:</Text>
                  <HStack ml={2} spacing={2} flexWrap="wrap">
                    {tour.languages && tour.languages.map((lang: string, index: number) => (
                      <Badge key={index} colorScheme="primary" fontSize="xs">
                        {lang}
                      </Badge>
                    ))}
                  </HStack>
                </Flex>
              </VStack>
            </Box>
            
            {/* Reviews section */}
            <Box mt={8}>
              <Heading as="h2" size="lg" mb={4}>Reviews</Heading>
              
              <ReviewsProvider>
                <ReviewsSummary 
                  averageRating={0} 
                  totalReviews={0} 
                  ratingCounts={{}}
                />
                
                {user && (
                  <Box mt={6} mb={8}>
                    <ReviewForm 
                      targetId={id || ''} 
                      targetType="tour"
                      tourId={id || ''}
                    />
                  </Box>
                )}
                
                <Box mt={6}>
                  <ReviewsList 
                    targetId={id || ''} 
                    targetType="tour"
                  />
                </Box>
              </ReviewsProvider>
            </Box>
          </GridItem>
          
          <GridItem>
            {/* Guide information or booking box */}
            <Box
              borderWidth="1px"
              borderRadius="lg"
              overflow="hidden"
              p={6}
              boxShadow="sm"
              position="sticky"
              top="100px"
            >
              {tour.creator_role === 'guide' && guide ? (
                <VStack align="start" spacing={4}>
                  <Heading size="md">About Your Guide</Heading>
                  
                  <HStack spacing={4} w="100%">
                    <Image
                      borderRadius="full"
                      boxSize="80px"
                      src={guide.avatar_url || 'https://via.placeholder.com/80'}
                      alt={guide.full_name}
                    />
                    <Box>
                      <Text fontWeight="bold">{guide.full_name}</Text>
                      {guide.years_experience && (
                        <Text fontSize="sm">{guide.years_experience} years experience</Text>
                      )}
                    </Box>
                  </HStack>
                  
                  {guide.bio && (
                    <Text fontSize="sm">{guide.bio}</Text>
                  )}
                  
                  <Divider />
                </VStack>
              ) : (
                <Heading size="md" mb={4}>Tour Details</Heading>
              )}
              
              <Button 
                colorScheme="primary" 
                size="lg" 
                width="100%" 
                mt={4}
                onClick={() => toast({
                  title: "Booking feature coming soon",
                  status: "info",
                  duration: 3000,
                  isClosable: true,
                })}
              >
                Book Now
              </Button>
              
              <Text fontSize="sm" textAlign="center" mt={2} color="gray.500">
                No payment required to reserve
              </Text>
            </Box>
          </GridItem>
        </Grid>
      </Box>
    </Container>
  );
};

export default TourDetail;