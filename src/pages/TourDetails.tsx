import { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  Button,
  Badge,
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
  Avatar,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { MdAccessTime, MdCalendarToday, MdGroup, MdLanguage, MdLocationOn } from 'react-icons/md';
import { Tour } from '../lib/types';
import { supabase, DEFAULT_AVATAR_URL, Profile } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthProvider';
import { ReviewsProvider } from '../contexts/ReviewsContext';
import { BookingProvider } from '../contexts/BookingContext';
import { getLocationsDisplayString, sortLocationsByOrder } from '../utils/tourLocations';
import ReviewsList from '../components/ReviewsList';
import ReviewForm from '../components/ReviewForm';
import ReviewsSummary from '../components/ReviewsSummary';
import StarRating from '../components/StarRating';
import BookingForm from '../components/BookingForm';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TourDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [tour, setTour] = useState<Tour | null>(null);
  const [guide, setGuide] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewSummary, setReviewSummary] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingCounts: {}
  });
  
  // Update the useEffect that fetches tour details in TourDetails.tsx
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
        
        // Fetch tour review summary for ALL tours - moved outside guide-specific condition
        try {
          const { data: summaryData, error: summaryError } = await supabase
            .rpc('get_review_summary', { 
              target_id_param: id, 
              target_type_param: 'tour' 
            });
          
          if (summaryError) {
            console.error('Error fetching tour review summary:', summaryError);
            throw summaryError;
          }
          
          if (summaryData && summaryData.length > 0) {
            // console.log('Tour review summary:', summaryData); // Debug only
            const summary = summaryData[0]; // RPC functions return arrays, take first item
            
            // Parse rating counts from JSONB - convert string keys to numeric keys
            let ratingCounts: Record<number, number> = {};
            if (summary.rating_counts) {
              try {
                // rating_counts is JSONB with string keys like {"1": 2, "4": 3, "5": 8}
                const rawCounts = typeof summary.rating_counts === 'string' 
                  ? JSON.parse(summary.rating_counts)
                  : summary.rating_counts;
                
                // Convert string keys to numbers and ensure numeric values
                Object.entries(rawCounts || {}).forEach(([key, value]) => {
                  const numKey = parseInt(key, 10);
                  const numValue = Number(value) || 0;
                  if (numKey >= 1 && numKey <= 5) {
                    ratingCounts[numKey] = numValue;
                  }
                });
              } catch (e) {
                console.warn('Failed to parse rating_counts:', e);
              }
            }
            
            setReviewSummary({
              averageRating: summary.average_rating || 0,
              totalReviews: summary.total_reviews || 0,
              ratingCounts
            });
          } else {
            // console.log('No review summary data returned'); // Debug only
            setReviewSummary({
              averageRating: 0,
              totalReviews: 0,
              ratingCounts: {}
            });
          }
        } catch (summaryErr) {
          console.error('Failed to fetch review summary:', summaryErr);
          // Don't throw, just use default values
          setReviewSummary({
            averageRating: 0,
            totalReviews: 0,
            ratingCounts: {}
          });
        }
      } catch (err) {
        console.error('Error fetching tour details:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load tour details';
        setError(errorMessage);
        toast({
          title: 'Error loading tour',
          description: errorMessage,
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
  
  const isGuide = tour.creator_role === 'guide';
  const isTourRequest = tour.creator_role === 'tourist';
  const isTourist = profile?.role === 'tourist';
  const isOwnTour = profile?.id === tour.creator_id;
  const canBook = user && isTourist && !isOwnTour && isGuide;
  const canOfferTour = user && profile?.role === 'guide' && !isOwnTour && isTourRequest;
  
  return (
    <BookingProvider>
      <Container maxW="container.xl" py={{ base: 4, md: 8 }} px={{ base: 3, md: 4 }}>
        <Box bg="white" p={{ base: 4, md: 6 }} borderRadius="lg" boxShadow="md">
          <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" mb={{ base: 4, md: 6 }} gap={{ base: 4, md: 0 }}>
            <Box>
              <Heading as="h1" size={{ base: "lg", md: "xl" }} mb={2}>{tour.title}</Heading>
              <HStack spacing={3} mb={2} flexWrap="wrap">
                <Badge colorScheme={tour.is_private ? 'purple' : 'green'}>
                  {tour.is_private ? 'Private Tour' : 'Public Tour'}
                </Badge>
                <Badge colorScheme={isTourRequest ? 'orange' : 'blue'}>
                  {isTourRequest ? 'Tourist Request' : 'Guide Tour'}
                </Badge>
                <Badge colorScheme="blue">
                  {tour.locations && tour.locations.length > 0 
                    ? getLocationsDisplayString(tour.locations, 30)
                    : tour.location || 'Location not specified'
                  }
                </Badge>
              </HStack>
            </Box>
            
            <Box textAlign={{ base: "left", md: "right" }}>
              <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" color="primary.600">
                ${tour.price}
                <Text as="span" fontSize={{ base: "sm", md: "md" }} fontWeight="normal" color="gray.500"> per person</Text>
              </Text>
            </Box>
          </Flex>
          
          <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={{ base: 6, md: 8 }}>
            <GridItem>
              {/* Tour details */}
              <Box mb={{ base: 6, md: 8 }}>
                <Text fontSize={{ base: "md", md: "lg" }} mb={4}>{tour.description}</Text>
                
                <VStack align="start" spacing={3} mt={6}>
                  <Flex align="center" flexWrap="wrap">
                    <Icon as={MdLocationOn} color="primary.500" mr={2} />
                    <Text fontWeight="medium">
                      {tour.locations && tour.locations.length > 1 ? 'Route:' : 'Location:'}
                    </Text>
                    <Text ml={2} wordBreak="break-word">
                      {tour.locations && tour.locations.length > 0 
                        ? getLocationsDisplayString(tour.locations, 60)
                        : tour.location || 'Location not specified'
                      }
                    </Text>
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
              
              {/* Show detailed itinerary if multiple locations */}
              {tour.locations && tour.locations.length > 1 && (
                <Box mb={8}>
                  <Heading as="h3" size="md" mb={4} color="gray.800">Tour Itinerary</Heading>
                  <Text fontSize="sm" color="gray.600" mb={4}>
                    You will be guided through these locations in the following order:
                  </Text>
                  <VStack spacing={3} align="stretch">
                    {sortLocationsByOrder(tour.locations).map((location, index) => (
                      <Box 
                        key={location.id}
                        p={4} 
                        bg="gray.50" 
                        borderRadius="md" 
                        border="1px solid" 
                        borderColor="gray.200"
                      >
                        <HStack align="start" spacing={3}>
                          <Badge colorScheme="primary" variant="solid" minW="24px" textAlign="center">
                            {index + 1}
                          </Badge>
                          <VStack align="start" spacing={1} flex="1">
                            <Text fontWeight="semibold" color="gray.800">
                              {location.name}
                            </Text>
                            {location.notes && (
                              <Text fontSize="sm" color="gray.600">
                                {location.notes}
                              </Text>
                            )}
                          </VStack>
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                </Box>
              )}
              
              {/* Show reviews section for ALL tours */}
              <Box mt={8}>
                <Heading as="h2" size="lg" mb={4}>Tour Reviews</Heading>
                
                <ReviewsProvider>
                  <ReviewsSummary 
                    averageRating={reviewSummary.averageRating} 
                    totalReviews={reviewSummary.totalReviews} 
                    ratingCounts={reviewSummary.ratingCounts}
                  />
                  
                  <ReviewForm 
                    targetId={id || ''}
                    targetType="tour"
                    tourId={id || ''}
                  />
                  
                  <Box mt={6}>
                    <ReviewsList 
                      targetId={id || ''}
                      targetType="tour"
                      showTourInfo={false}
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
                {isGuide && guide ? (
                  <VStack align="start" spacing={4}>
                    <Heading size="md">About Your Guide</Heading>
                    
                    <Flex direction="column" align="center" w="100%">
                      <Avatar
                        size="xl"
                        src={guide.avatar_url || DEFAULT_AVATAR_URL}
                        name={guide.full_name}
                        mb={2}
                      />
                      <Text fontWeight="bold">{guide.full_name}</Text>
                      
                      <HStack mt={1}>
                        <StarRating rating={reviewSummary.averageRating} size={16} />
                        <Text fontSize="sm" color="gray.500">
                          ({reviewSummary.totalReviews})
                        </Text>
                      </HStack>
                      
                      {guide.years_experience && (
                        <Text fontSize="sm" mt={1}>{guide.years_experience} years experience</Text>
                      )}
                      
                      <Button
                        as={RouterLink}
                        to={`/profile/${guide.id}`}
                        size="sm"
                        colorScheme="primary"
                        variant="outline"
                        mt={2}
                      >
                        View Full Profile
                      </Button>
                    </Flex>
                    
                    {guide.bio && (
                      <Box w="100%">
                        <Text fontSize="sm" mt={2}>{guide.bio}</Text>
                      </Box>
                    )}
                    
                    <Divider />
                  </VStack>
                ) : (
                  <Heading size="md" mb={4}>Tour Details</Heading>
                )}
                
                {canBook ? (
                  <Button 
                    colorScheme="primary" 
                    size="lg" 
                    width="100%" 
                    mt={4}
                    onClick={onOpen}
                  >
                    Book Now
                  </Button>
                ) : canOfferTour ? (
                  <Button 
                    colorScheme="orange" 
                    size="lg" 
                    width="100%" 
                    mt={4}
                    onClick={onOpen}
                  >
                    Offer This Tour
                  </Button>
                ) : (
                  <Button 
                    colorScheme="primary" 
                    size="lg" 
                    width="100%" 
                    mt={4}
                    isDisabled={true}
                    _hover={{ cursor: 'not-allowed' }}
                  >
                    {!user ? 'Sign in to View' : isOwnTour ? (isTourRequest ? 'Your Request' : 'Your Tour') : (isTourRequest ? 'Tourist Request' : 'Book Now')}
                  </Button>
                )}
                
                <Text fontSize="sm" textAlign="center" mt={2} color="gray.500">
                  No payment required to reserve
                </Text>
              </Box>
            </GridItem>
          </Grid>
        </Box>
        
        {/* Booking/Offer Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="md">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{canOfferTour ? 'Offer This Tour' : 'Book This Tour'}</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <BookingForm
                tourId={tour.id}
                tourTitle={tour.title}
                guideId={canOfferTour ? profile?.id || '' : tour.creator_id}
                touristId={canOfferTour ? tour.creator_id : profile?.id || ''}
                pricePerPerson={tour.price}
                maxCapacity={tour.capacity}
                availableDays={tour.days_available || []}
                isOffer={canOfferTour || false}
                onSuccess={() => {
                  onClose();
                  toast({
                    title: canOfferTour ? 'Tour offer submitted' : 'Booking request submitted',
                    description: canOfferTour 
                      ? 'Your tour offer has been sent to the tourist' 
                      : 'Your booking request has been sent to the guide',
                    status: 'success',
                    duration: 5000,
                    isClosable: true,
                  });
                }}
                onCancel={onClose}
              />
            </ModalBody>
          </ModalContent>
        </Modal>
      </Container>
    </BookingProvider>
  );
};

export default TourDetail;