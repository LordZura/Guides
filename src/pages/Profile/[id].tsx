import { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  HStack,
  Badge,
  Button,
  Flex,
  Avatar,
  Skeleton,
  SkeletonText,
  Alert,
  AlertIcon,
  Tab,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Divider,
  Icon,
  useToast,
} from '@chakra-ui/react';
import { MdLocationOn, MdLanguage, MdEvent } from 'react-icons/md';
import { FaExternalLinkAlt } from 'react-icons/fa';
import { getGuideProfile, GuideProfile, Review, TourWithStatus } from '../../lib/api';
import { useAuth } from '../../contexts/AuthProvider';
import { DEFAULT_AVATAR_URL } from '../../lib/supabaseClient';
import StarRating from '../../components/StarRating';
import ReviewItem from '../../components/ReviewItem';
import { useGuideRating } from '../../hooks/useGuideRating';

const ProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const { profile: currentUserProfile } = useAuth();
  const toast = useToast();
  
  const [guideProfile, setGuideProfile] = useState<GuideProfile | null>(null);
  const [tours, setTours] = useState<TourWithStatus[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use the live rating hook to get up-to-date rating data
  const { averageRating, reviewCount, isLoading: ratingLoading } = useGuideRating(id || '');
  
  // Debug: Add console.log to track Profile rating state
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.warn('Profile rating state updated:', { 
        guideId: id, 
        averageRating, 
        reviewCount, 
        ratingLoading,
        hasGuideProfile: !!guideProfile 
      });
    }
  }, [id, averageRating, reviewCount, ratingLoading, guideProfile]);
  
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await getGuideProfile(id);
        setGuideProfile(data.profile);
        setTours(data.tours);
        setReviews(data.reviews);
      } catch (err) {
        console.error('Error fetching guide profile:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load guide profile';
        setError(errorMessage);
        toast({
          title: 'Error loading profile',
          description: errorMessage,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfileData();
  }, [id, toast]);
  
  if (isLoading) {
    return (
      <Container maxW="container.lg" py={{ base: 4, md: 8 }} px={{ base: 4, md: 6 }}>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 6, md: 8 }}>
          {/* Profile sidebar skeleton */}
          <Box>
            <Flex direction="column" align="center" mb={{ base: 4, md: 6 }}>
              <Skeleton height={{ base: "120px", md: "150px" }} width={{ base: "120px", md: "150px" }} borderRadius="full" mb={4} />
              <SkeletonText noOfLines={2} spacing={4} width="full" />
            </Flex>
            <SkeletonText noOfLines={6} spacing={4} />
          </Box>
          
          {/* Main content skeleton */}
          <Box gridColumn={{ md: "span 2" }}>
            <SkeletonText noOfLines={1} spacing={4} height={{ base: "30px", md: "40px" }} mb={4} />
            <Skeleton height={{ base: "25px", md: "30px" }} mb={4} />
            <SkeletonText noOfLines={8} spacing={4} />
          </Box>
        </SimpleGrid>
      </Container>
    );
  }
  
  if (error || !guideProfile) {
    return (
      <Container maxW="container.lg" py={{ base: 4, md: 8 }} px={{ base: 4, md: 6 }}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {error || 'Guide not found'}
        </Alert>
      </Container>
    );
  }
  
  // Check if current user is the guide
  const isOwnProfile = currentUserProfile?.id === guideProfile.id;
  const canRequestTour = currentUserProfile && currentUserProfile.role === 'tourist' && !isOwnProfile;
  
  return (
    <Container maxW="container.lg" py={{ base: 4, md: 8 }} px={{ base: 4, md: 6 }}>
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 6, md: 8 }}>
        {/* Profile sidebar */}
        <Box>
          <VStack spacing={{ base: 4, md: 6 }} align="center" bg="white" p={{ base: 4, md: 6 }} borderRadius="md" boxShadow="sm">
            <Avatar 
              size={{ base: "xl", md: "2xl" }}
              name={guideProfile.full_name}
              src={guideProfile.avatar_url || DEFAULT_AVATAR_URL}
            />
            
            <VStack spacing={{ base: 1, md: 2 }} textAlign="center">
              <Heading size={{ base: "md", md: "lg" }}>{guideProfile.full_name}</Heading>
              <Badge colorScheme="green" fontSize={{ base: "sm", md: "md" }} px={{ base: 2, md: 2 }} py={1}>
                {guideProfile.role.charAt(0).toUpperCase() + guideProfile.role.slice(1)}
              </Badge>
              
              <StarRating rating={averageRating} size={{ base: 18, md: 24 }} />
              
              <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600">
                {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
              </Text>
              
              {guideProfile.completed_tours_count > 0 && (
                <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600">
                  {guideProfile.completed_tours_count} tours completed
                </Text>
              )}
            </VStack>
            
            <Divider />
            
            <VStack align="start" width="100%" spacing={{ base: 2, md: 3 }}>
              {guideProfile.location && (
                <HStack>
                  <Icon as={MdLocationOn} color="gray.500" />
                  <Text fontSize={{ base: "sm", md: "md" }}>{guideProfile.location}</Text>
                </HStack>
              )}
              
              {guideProfile.languages && guideProfile.languages.length > 0 && (
                <HStack alignItems="flex-start">
                  <Icon as={MdLanguage} color="gray.500" mt={1} />
                  <Text fontSize={{ base: "sm", md: "md" }}>{guideProfile.languages.join(', ')}</Text>
                </HStack>
              )}
              
              {guideProfile.years_experience && (
                <HStack>
                  <Icon as={MdEvent} color="gray.500" />
                  <Text fontSize={{ base: "sm", md: "md" }}>{guideProfile.years_experience} years experience</Text>
                </HStack>
              )}
            </VStack>
            
            {guideProfile.bio && (
              <>
                <Divider />
                <VStack align="start" width="100%">
                  <Heading size={{ base: "xs", md: "sm" }}>About</Heading>
                  <Text fontSize={{ base: "xs", md: "sm" }}>{guideProfile.bio}</Text>
                </VStack>
              </>
            )}
            
            {guideProfile.specialties && (
              <VStack align="start" width="100%">
                <Heading size={{ base: "xs", md: "sm" }}>Specialties</Heading>
                <Text fontSize={{ base: "xs", md: "sm" }}>{guideProfile.specialties}</Text>
              </VStack>
            )}
            
            {canRequestTour && (
              <Button 
                colorScheme="primary" 
                size={{ base: "sm", md: "md" }}
                width="full"
                leftIcon={<Icon as={MdEvent} />}
                onClick={() => {
                  toast({
                    title: "Coming soon!",
                    description: "Tour request functionality will be implemented in Subtask 3",
                    status: "info",
                    duration: 3000,
                    isClosable: true,
                  });
                }}
              >
                Request a Tour
              </Button>
            )}
          </VStack>
        </Box>
        
        {/* Main content */}
        <Box gridColumn={{ md: "span 2" }}>
          <Tabs colorScheme="primary" variant="enclosed" bg="white" boxShadow="sm" borderRadius="md">
            <TabList overflowX="auto" overflowY="hidden">
              <Tab fontWeight="medium" fontSize={{ base: "sm", md: "md" }} py={{ base: 3, md: 4 }} px={{ base: 3, md: 4 }} minW="fit-content">Tours</Tab>
              <Tab fontWeight="medium" fontSize={{ base: "sm", md: "md" }} py={{ base: 3, md: 4 }} px={{ base: 3, md: 4 }} minW="fit-content">Reviews ({reviewCount || 0})</Tab>
            </TabList>
            
            <TabPanels>
              {/* Tours panel */}
              <TabPanel p={{ base: 3, md: 6 }}>
                {tours.length === 0 ? (
                  <Box textAlign="center" py={{ base: 6, md: 8 }}>
                    <Text color="gray.500" fontSize={{ base: "sm", md: "md" }}>No tours available yet.</Text>
                  </Box>
                ) : (
                  <VStack spacing={{ base: 3, md: 4 }} align="stretch">
                    {tours.map(tour => (
                      <Box 
                        key={tour.id}
                        p={{ base: 3, md: 4 }}
                        borderWidth="1px"
                        borderRadius="md"
                        boxShadow="sm"
                      >
                        <Flex justify="space-between" align="center" mb={2} direction={{ base: "column", sm: "row" }} gap={{ base: 2, sm: 0 }}>
                          <Heading size={{ base: "sm", md: "md" }} textAlign={{ base: "center", sm: "left" }}>{tour.title}</Heading>
                          <Badge colorScheme={
                            tour.status === 'active' ? 'green' : 
                            tour.status === 'upcoming' ? 'blue' : 
                            tour.status === 'completed' ? 'gray' : 'red'
                          } fontSize={{ base: "xs", md: "sm" }} px={2} py={1}>
                            {tour.status}
                          </Badge>
                        </Flex>
                        
                        <Text noOfLines={2} mb={3} color="gray.600" fontSize={{ base: "sm", md: "md" }}>{tour.description}</Text>
                        
                        <HStack spacing={{ base: 2, md: 4 }} mb={3} wrap="wrap">
                          <Text fontSize={{ base: "xs", md: "sm" }}>{tour.location}</Text>
                          <Text fontSize={{ base: "xs", md: "sm" }}>{tour.duration} hours</Text>
                          <Text fontSize={{ base: "xs", md: "sm" }} fontWeight="bold">${tour.price}</Text>
                        </HStack>
                        
                        <Button 
                          as={RouterLink}
                          to={`/tours/${tour.id}`}
                          size={{ base: "xs", md: "sm" }}
                          rightIcon={<FaExternalLinkAlt />}
                          variant="outline"
                          fontSize={{ base: "xs", md: "sm" }}
                        >
                          View Details
                        </Button>
                      </Box>
                    ))}
                  </VStack>
                )}
              </TabPanel>
              
              {/* Reviews panel */}
              <TabPanel p={{ base: 3, md: 6 }}>
              {reviews.length === 0 ? (
                <Box textAlign="center" py={{ base: 6, md: 8 }}>
                  <Text color="gray.500" fontSize={{ base: "sm", md: "md" }}>No reviews yet.</Text>
                </Box>
              ) : (
                <VStack spacing={{ base: 3, md: 4 }} align="stretch">
                  {reviews.map(review => (
                    <ReviewItem 
                      key={review.id} 
                      id={review.id}
                      reviewer_name={review.reviewer_name}
                      reviewer_avatar={review.reviewer_avatar}
                      rating={review.rating}
                      comment={review.comment}
                      created_at={review.created_at}
                      tour_name={review.tour_name}
                      showTour={true}
                    />
                  ))}
                </VStack>
              )}
            </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </SimpleGrid>
    </Container>
  );
};

export default ProfilePage;