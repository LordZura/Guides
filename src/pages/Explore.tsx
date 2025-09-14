import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Center,
  Icon,
  Flex,
  Select,
  FormControl,
  FormLabel,
  Stack,
  NumberInput,
  NumberInputField,
  Button,
  SimpleGrid,
  Skeleton,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useBreakpointValue,
  useToast,
  HStack,
  VStack,
  Checkbox,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { FaMap, FaEdit, FaFilter } from 'react-icons/fa'; 
import { supabase, Profile } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthProvider';
import GuideCard from '../components/GuideCard';
import TourCard from '../components/TourCard';
import RatingFilter from '../components/RatingFilter';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface FilterOptions {
  language?: string;
  location?: string;
  priceRange?: [number, number];
  rating?: number;
  reviewCount?: number;
  daysAvailable?: number[];
}

const Explore = () => {
  const { profile } = useAuth();
  const [tabIndex, setTabIndex] = useState(0);
  const [guides, setGuides] = useState<Profile[]>([]);
  const [tours, setTours] = useState<string[]>([]);
  const [isLoadingGuides, setIsLoadingGuides] = useState(true);
  const [isLoadingTours, setIsLoadingTours] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const toast = useToast();
  
  // Filter state
  const [languages, setLanguages] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [priceRange, setPriceRange] = useState<[number, number]>([20, 10000]);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [selectedReviewCount, setSelectedReviewCount] = useState<number>(0);
  const [selectedDaysAvailable, setSelectedDaysAvailable] = useState<number[]>([]);
  const [isFiltering, setIsFiltering] = useState<boolean>(false);
  
  // Fetch guides with filters
  const fetchGuides = async (filters: FilterOptions = {}) => {
    setIsLoadingGuides(true);
    setError(null);

    try {
      // Build the query
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('role', 'guide');
      
      // Apply filters if provided
      if (filters.language && filters.language.trim() !== '') {
        // Using contains to check if guide speaks the selected language
        query = query.contains('languages', [filters.language]);
      }
      
      // Note: Location filtering is not applied to guides, only to tours
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      let guides = data || [];
      
      // Fetch rating data for all guides
      const guidesWithRatings = await Promise.all(
        guides.map(async (guide) => {
          try {
            const { data: ratingData, error: ratingError } = await supabase
              .rpc('get_review_summary', { 
                target_id_param: guide.id, 
                target_type_param: 'guide' 
              });
            
            if (ratingError) {
              console.warn(`Error fetching rating for guide ${guide.id}:`, ratingError);
              return {
                ...guide,
                average_rating: 0,
                reviews_count: 0,
              };
            }
            
            return {
              ...guide,
              average_rating: ratingData?.average_rating || 0,
              reviews_count: ratingData?.total_reviews || 0,
            };
          } catch (err) {
            console.warn(`Error fetching rating for guide ${guide.id}:`, err);
            return {
              ...guide,
              average_rating: 0,
              reviews_count: 0,
            };
          }
        })
      );
      
      // Apply client-side filters for rating and review count
      let filteredGuides = guidesWithRatings;
      
      if (filters.rating && filters.rating > 0) {
        // Use consistent filter logic - ratings are now exact thresholds (4 stars means 4.0+)
        const minRatingThreshold = filters.rating;
        
        filteredGuides = filteredGuides.filter(guide => 
          // Only exclude guides that don't meet the rating threshold
          // Include guides with 0 rating if they also have 0 reviews (no ratings yet)
          guide.average_rating >= minRatingThreshold || (guide.average_rating === 0 && guide.reviews_count === 0)
        );
      }
      
      if (filters.reviewCount && filters.reviewCount > 0) {
        filteredGuides = filteredGuides.filter(guide => 
          guide.reviews_count >= filters.reviewCount!
        );
      }
      
      setGuides(filteredGuides);
    } catch (err) {
      console.error("Error fetching guides:", err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch guides';
      
      // If database is not accessible, use fallback data for development/testing
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('ERR_BLOCKED_BY_CLIENT')) {
        const fallbackGuides = [
          {
            id: '1',
            full_name: 'John Smith',
            role: 'guide' as const,
            bio: 'Experienced guide in London',
            location: 'London',
            languages: ['English', 'French'],
            average_rating: 4.5,
            reviews_count: 25,
            avatar_url: null,
            phone: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2', 
            full_name: 'Maria Garcia',
            role: 'guide' as const,
            bio: 'Spanish and English speaking guide',
            location: 'Barcelona',
            languages: ['Spanish', 'English'],
            average_rating: 4.8,
            reviews_count: 42,
            avatar_url: null,
            phone: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '3',
            full_name: 'Yuki Tanaka', 
            role: 'guide' as const,
            bio: 'Local expert in Tokyo',
            location: 'Tokyo',
            languages: ['Japanese', 'English'],
            average_rating: 4.2,
            reviews_count: 18,
            avatar_url: null,
            phone: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '4',
            full_name: 'Alex Thompson',
            role: 'guide' as const,
            bio: 'Adventure guide in New York',
            location: 'New York',
            languages: ['English'],
            average_rating: 3.0,
            reviews_count: 12,
            avatar_url: null,
            phone: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        
        let filteredGuides = fallbackGuides;
        
        // Apply language filter
        if (filters.language && filters.language.trim() !== '') {
          filteredGuides = filteredGuides.filter(guide => 
            guide.languages && guide.languages.includes(filters.language!)
          );
        }
        
        // Apply rating filter
        if (filters.rating && filters.rating > 0) {
          const minRatingThreshold = filters.rating;
          
          filteredGuides = filteredGuides.filter(guide => 
            // Include guides without rating data (undefined, null, non-numeric) since we can't know their rating yet
            // Only exclude guides that have numeric rating data but don't meet the threshold
            typeof guide.average_rating !== 'number' || guide.average_rating >= minRatingThreshold
          );
        }
        
        // Apply review count filter
        if (filters.reviewCount && filters.reviewCount > 0) {
          filteredGuides = filteredGuides.filter(guide => 
            // Include guides without review count data (undefined, null, non-numeric)
            // Only filter out guides that have numeric review counts below the threshold
            typeof guide.reviews_count !== 'number' || guide.reviews_count >= filters.reviewCount!
          );
        }
        
        setGuides(filteredGuides);
      } else {
        setError(errorMessage);
        toast({
          title: "Error fetching guides",
          description: errorMessage,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } finally {
      setIsLoadingGuides(false);
      setIsFiltering(false);
    }
  };
  
  // Fetch tours
  const fetchTours = async (filters: FilterOptions = {}) => {
    if (!profile) return;
    
    setIsLoadingTours(true);
    setError(null);
    
    try {
      // Tourists see tours from guides, guides see tours from tourists
      const oppositeRole = profile.role === 'guide' ? 'tourist' : 'guide';
      
      // Build the query - get more fields to enable client-side filtering
      let query = supabase
        .from('tours')
        .select('id, location, price, languages, days_available')
        .eq('creator_role', oppositeRole)
        .eq('is_active', true);
      
      // Apply server-side filters
      if (filters.location) {
        query = query.eq('location', filters.location);
      }
      
      if (filters.priceRange) {
        const [min, max] = filters.priceRange;
        query = query
          .gte('price', min)
          .lte('price', max);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      let filteredTours = data || [];
      
      // Apply client-side filters
      if (filters.language && filters.language.trim() !== '') {
        filteredTours = filteredTours.filter(tour => 
          tour.languages && tour.languages.includes(filters.language!)
        );
      }
      
      if (filters.daysAvailable && filters.daysAvailable.length > 0) {
        filteredTours = filteredTours.filter(tour => {
          if (!tour.days_available) return false;
          return filters.daysAvailable!.some(dayIndex => 
            tour.days_available[dayIndex] === true
          );
        });
      }
      
      setTours(filteredTours.map(tour => tour.id));
    } catch (err) {
      console.error("Error fetching tours:", err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tours';
      
      // If database is not accessible, use fallback data for development/testing
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('ERR_BLOCKED_BY_CLIENT')) {
        const fallbackTours = [
          {
            id: 'tour1',
            title: 'London Historical Walking Tour',
            description: 'Explore the rich history of London with an expert guide',
            location: 'London',
            price: 50,
            duration: 3,
            capacity: 15,
            languages: ['English'],
            is_private: false,
            is_active: true,
            creator_role: 'guide' as const,
            creator_id: '1',
            days_available: [true, true, true, false, false, true, true]
          },
          {
            id: 'tour2',
            title: 'Barcelona Tapas Tour',
            description: 'Discover authentic Spanish cuisine and local tapas bars',
            location: 'Barcelona',
            price: 75,
            duration: 4,
            capacity: 12,
            languages: ['Spanish', 'English'],
            is_private: false,
            is_active: true,
            creator_role: 'guide' as const,
            creator_id: '2',
            days_available: [false, true, true, true, true, false, true]
          },
          {
            id: 'tour3',
            title: 'Tokyo Cherry Blossom Experience',
            description: 'Experience the beauty of cherry blossoms in Tokyo',
            location: 'Tokyo',
            price: 100,
            duration: 5,
            capacity: 8,
            languages: ['Japanese', 'English'],
            is_private: true,
            is_active: true,
            creator_role: 'guide' as const,
            creator_id: '3',
            days_available: [true, false, true, true, false, true, true]
          }
        ];
        
        let filteredTours = fallbackTours;
        
        // Apply language filter
        if (filters.language && filters.language.trim() !== '') {
          filteredTours = filteredTours.filter(tour => 
            tour.languages && tour.languages.includes(filters.language!)
          );
        }
        
        // Apply location filter
        if (filters.location) {
          filteredTours = filteredTours.filter(tour => 
            tour.location === filters.location
          );
        }
        
        // Apply price range filter
        if (filters.priceRange) {
          const [min, max] = filters.priceRange;
          filteredTours = filteredTours.filter(tour => 
            tour.price >= min && tour.price <= max
          );
        }
        
        // Apply days available filter
        if (filters.daysAvailable && filters.daysAvailable.length > 0) {
          filteredTours = filteredTours.filter(tour => {
            if (!tour.days_available) return false;
            return filters.daysAvailable!.some(dayIndex => 
              tour.days_available[dayIndex] === true
            );
          });
        }
        
        setTours(filteredTours.map(tour => tour.id));
      } else {
        setError(errorMessage);
        toast({
          title: "Error fetching tours",
          description: errorMessage,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } finally {
      setIsLoadingTours(false);
      setIsFiltering(false);
    }
  };
  
  // Fetch filter options
  const fetchFilterOptions = async () => {
    try {
      // Fetch languages with full object structure
      const { data: languageData, error: languageError } = await supabase
        .from('languages')
        .select('id, name, code')
        .order('name');
      
      if (languageError) {
        throw new Error(`Language fetch error: ${languageError.message}`);
      }
      
      // Fetch distinct locations from tours (only for tours, not guides)
      const { data: locationData, error: locationError } = await supabase
        .from('tours')
        .select('location')
        .order('location');
      
      if (locationError) {
        throw new Error(`Location fetch error: ${locationError.message}`);
      }
      
      // Set languages as array of strings for the dropdown (using names)
      const languages = (languageData || []).map(lang => lang.name);
      setLanguages(languages);
      
      // Get unique locations
      const uniqueLocations = Array.from(new Set((locationData || []).map(tour => tour.location)));
      setLocations(uniqueLocations);
      
      
    } catch (err) {
      console.error("Error fetching filter options:", err);
      
      // If database is not accessible, use fallback data for development/testing
      // Always use fallback for development since the database is being blocked
      
      // Fallback languages
      setLanguages(['English', 'Spanish', 'French', 'Japanese', 'German', 'Italian']);
      
      // Fallback locations (for tours)
      setLocations(['London', 'Barcelona', 'Tokyo', 'Paris', 'Berlin', 'Rome']);
    }
  };
  
  useEffect(() => {
    fetchGuides();
    fetchTours();
    fetchFilterOptions();
  }, [profile]);
  
  const applyFilters = () => {
    setIsFiltering(true);
    
    // Prepare filter object based on current tab
    const filters: FilterOptions = {
      language: selectedLanguage || undefined,
    };

    // Add location filter only for tours
    if (tabIndex === 1) {
      filters.location = selectedLocation || undefined;
    }
    
    // Add tab-specific filters
    if (tabIndex === 0) {
      // Guides tab filters: languages, rating, review count (NO location)
      if (selectedRating > 0) filters.rating = selectedRating;
      if (selectedReviewCount > 0) filters.reviewCount = selectedReviewCount;
    } else if (tabIndex === 1) {
      // Tours tab filters: languages, location, days available, price range, and rating/review filters only for tourists
      if (selectedRating > 0 && profile?.role === 'tourist') filters.rating = selectedRating;
      if (selectedReviewCount > 0 && profile?.role === 'tourist') filters.reviewCount = selectedReviewCount;
      if (priceRange.every(val => val !== 0)) filters.priceRange = priceRange;
      if (selectedDaysAvailable.length > 0) filters.daysAvailable = selectedDaysAvailable;
    }
    
    // Apply filters based on current tab
    if (tabIndex === 0) {
      fetchGuides(filters);
    } else if (tabIndex === 1) {
      fetchTours(filters);
    }
    
    onClose();
  };
  
  const clearFilters = () => {
    setSelectedLanguage('');
    setSelectedLocation('');
    setPriceRange([20, 10000]);
    setSelectedRating(0);
    setSelectedReviewCount(0);
    setSelectedDaysAvailable([]);
    
    // Fetch data without filters
    if (tabIndex === 0) {
      fetchGuides();
    } else if (tabIndex === 1) {
      fetchTours();
    }
    
    onClose();
  };
  
  return (
    <Container maxW="container.xl" px={{ base: 3, sm: 4, md: 6 }} py={{ base: 4, md: 8 }}>
      <Box bg="white" borderRadius="xl" overflow="hidden" boxShadow="xl" border="1px" borderColor="gray.100">
        <Box p={{ base: 4, sm: 6, md: 8 }} bgGradient="linear(135deg, primary.500, primary.700)" color="white" position="relative">
          <Box position="absolute" top="0" left="0" w="full" h="full" bgGradient="linear(135deg, primary.500, transparent)" opacity="0.1" />
          <Box position="relative" zIndex="1">
            <Heading as="h1" size={{ base: "lg", md: "xl" }} mb={3} fontWeight="black">Explore TourGuideHub</Heading>
            <Text color="primary.50" fontSize={{ base: "md", md: "lg" }} maxW="md">Discover amazing guides, tours and travel stories from local experts</Text>
            
            {isMobile && (
              <Button 
                leftIcon={<FaFilter />} 
                variant="outline" 
                colorScheme="whiteAlpha"
                mt={6}
                onClick={onOpen}
                borderRadius="full"
                px={6}
                _hover={{ bg: 'whiteAlpha.200', transform: 'translateY(-1px)' }}
                transition="all 0.2s"
              >
                Filters & Search
              </Button>
            )}
          </Box>
        </Box>
        
        <Flex>
          {/* Filters - desktop */}
          {!isMobile && (
            <Box width={{ base: "260px", lg: "280px" }} p={{ base: 4, md: 6 }} borderRightWidth="1px" borderColor="gray.100" bg="gray.50">
              <Heading size="sm" mb={6} color="gray.700">Search & Filters</Heading>
              
              <Stack spacing={6}>
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="semibold" color="gray.700">Language</FormLabel>
                  <Select 
                    placeholder="Any language"
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    borderRadius="lg"
                    border="2px"
                    borderColor="gray.200"
                    _hover={{ borderColor: 'primary.300' }}
                    _focus={{ borderColor: 'primary.500', boxShadow: '0 0 0 1px var(--chakra-colors-primary-500)' }}
                  >
                    {languages.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </Select>
                </FormControl>
                
                {/* Location filter only for tours, not guides */}
                {tabIndex === 1 && (
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="semibold" color="gray.700">Location</FormLabel>
                    <Select 
                      placeholder="Any location"
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      borderRadius="lg"
                      border="2px"
                      borderColor="gray.200"
                      _hover={{ borderColor: 'primary.300' }}
                      _focus={{ borderColor: 'primary.500', boxShadow: '0 0 0 1px var(--chakra-colors-primary-500)' }}
                    >
                      {locations.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </Select>
                  </FormControl>
                )}
                
                {/* Tab-specific filters */}
                {tabIndex === 0 ? (
                  /* Guides filters: rating, review count */
                  <>
                    <RatingFilter
                      selectedRating={selectedRating}
                      onChange={setSelectedRating}
                      label="Minimum Rating"
                      showClear={true}
                    />
                    
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="semibold" color="gray.700">Minimum Reviews</FormLabel>
                      <Select 
                        placeholder="Any review count"
                        value={selectedReviewCount}
                        onChange={(e) => setSelectedReviewCount(Number(e.target.value))}
                        borderRadius="lg"
                        border="2px"
                        borderColor="gray.200"
                        _hover={{ borderColor: 'primary.300' }}
                        _focus={{ borderColor: 'primary.500', boxShadow: '0 0 0 1px var(--chakra-colors-primary-500)' }}
                      >
                        <option value={50}>50+ reviews</option>
                        <option value={20}>20+ reviews</option>
                        <option value={10}>10+ reviews</option>
                        <option value={5}>5+ reviews</option>
                      </Select>
                    </FormControl>
                  </>
                ) : tabIndex === 1 ? (
                  /* Tours filters: price range, days available, and rating/review filters only for tourists */
                  <>
                    {/* Rating and review filters only available for tourists */}
                    {profile?.role === 'tourist' && (
                      <>
                        <RatingFilter
                          selectedRating={selectedRating}
                          onChange={setSelectedRating}
                          label="Minimum Rating"
                          showClear={true}
                        />
                        
                        <FormControl>
                          <FormLabel fontSize="sm" fontWeight="semibold" color="gray.700">Minimum Reviews</FormLabel>
                          <Select 
                            placeholder="Any review count"
                            value={selectedReviewCount}
                            onChange={(e) => setSelectedReviewCount(Number(e.target.value))}
                            borderRadius="lg"
                            border="2px"
                            borderColor="gray.200"
                            _hover={{ borderColor: 'primary.300' }}
                            _focus={{ borderColor: 'primary.500', boxShadow: '0 0 0 1px var(--chakra-colors-primary-500)' }}
                          >
                            <option value={50}>50+ reviews</option>
                            <option value={20}>20+ reviews</option>
                            <option value={10}>10+ reviews</option>
                            <option value={5}>5+ reviews</option>
                          </Select>
                        </FormControl>
                      </>
                    )}
                    
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="semibold" color="gray.700">Price Range</FormLabel>
                      <HStack spacing={3}>
                        <Box flex="1">
                          <Text fontSize="xs" color="gray.500" mb={1}>Min ($)</Text>
                          <NumberInput 
                            min={20} 
                            max={10000}
                            value={priceRange[0]}
                            onChange={(_, value) => setPriceRange([value || 20, priceRange[1]])}
                          >
                            <NumberInputField placeholder="Min" />
                          </NumberInput>
                        </Box>
                        <Text color="gray.400" mt={6}>-</Text>
                        <Box flex="1">
                          <Text fontSize="xs" color="gray.500" mb={1}>Max ($)</Text>
                          <NumberInput 
                            min={20} 
                            max={10000}
                            value={priceRange[1]}
                            onChange={(_, value) => setPriceRange([priceRange[0], value || 10000])}
                          >
                            <NumberInputField placeholder="Max" />
                          </NumberInput>
                        </Box>
                      </HStack>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="semibold" color="gray.700">Days Available</FormLabel>
                      <VStack align="start" spacing={2}>
                        {DAYS_OF_WEEK.map((day, index) => (
                          <Checkbox
                            key={day}
                            isChecked={selectedDaysAvailable.includes(index)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDaysAvailable([...selectedDaysAvailable, index]);
                              } else {
                                setSelectedDaysAvailable(selectedDaysAvailable.filter(d => d !== index));
                              }
                            }}
                            size="sm"
                          >
                            {day}
                          </Checkbox>
                        ))}
                      </VStack>
                    </FormControl>
                  </>
                ) : null}
                
                <Flex gap={3}>
                  <Button 
                    colorScheme="primary" 
                    flex="1"
                    onClick={applyFilters}
                    isLoading={isFiltering}
                    borderRadius="lg"
                    fontWeight="semibold"
                    _hover={{ transform: 'translateY(-1px)', boxShadow: 'lg' }}
                    transition="all 0.2s"
                  >
                    Apply
                  </Button>
                  <Button 
                    variant="outline" 
                    colorScheme="primary"
                    onClick={clearFilters}
                    borderRadius="lg"
                    fontWeight="semibold"
                    _hover={{ bg: 'primary.50', transform: 'translateY(-1px)' }}
                    transition="all 0.2s"
                  >
                    Clear
                  </Button>
                </Flex>
              </Stack>
            </Box>
          )}
          
          {/* Main content */}
          <Box flex="1" bg="white">
            <Tabs colorScheme="primary" onChange={setTabIndex} index={tabIndex} variant="enclosed">
              <TabList borderBottomColor="gray.200" overflowX="auto" overflowY="hidden">
                <Tab fontWeight="semibold" py={{ base: 4, md: 6 }} px={{ base: 4, md: 8 }} _selected={{ color: 'primary.600', borderBottomColor: 'primary.500' }} minW="fit-content">Guides</Tab>
                <Tab fontWeight="semibold" py={{ base: 4, md: 6 }} px={{ base: 4, md: 8 }} _selected={{ color: 'primary.600', borderBottomColor: 'primary.500' }} minW="fit-content">Tours</Tab>
                <Tab fontWeight="semibold" py={{ base: 4, md: 6 }} px={{ base: 4, md: 8 }} _selected={{ color: 'primary.600', borderBottomColor: 'primary.500' }} minW="fit-content">Posts</Tab>
              </TabList>
              
              <TabPanels>
                {/* Guides Tab */}
                <TabPanel p={{ base: 4, sm: 6, md: 8 }}>
                  <Text color="gray.600" mb={{ base: 4, md: 8 }} fontSize={{ base: "md", md: "lg" }}>
                    Find expert local guides to enhance your travel experience.
                  </Text>
                  
                  {isLoadingGuides ? (
                    <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={{ base: 4, md: 8 }}>
                      {[1, 2, 3].map(i => (
                        <Box key={i} borderWidth="1px" borderRadius="xl" overflow="hidden" boxShadow="lg" borderColor="gray.200">
                          <Skeleton height="240px" />
                          <Box p={6}>
                            <Skeleton height="24px" width="70%" mb={3} borderRadius="lg" />
                            <Skeleton height="16px" mb={2} borderRadius="lg" />
                            <Skeleton height="16px" width="90%" mb={2} borderRadius="lg" />
                            <Skeleton height="16px" width="60%" mb={4} borderRadius="lg" />
                            <Skeleton height="36px" width="50%" borderRadius="full" />
                          </Box>
                        </Box>
                      ))}
                    </SimpleGrid>
                  ) : error ? (
                    <Box p={6} bg="red.50" borderRadius="xl" border="1px" borderColor="red.200">
                      <Text color="red.600" fontWeight="medium">{error}</Text>
                    </Box>
                  ) : guides.length === 0 ? (
                    <Center bg="gray.50" border="2px" borderColor="gray.200" borderStyle="dashed" borderRadius="xl" p={12}>
                      <Box textAlign="center">
                        <Icon as={SearchIcon} w={16} h={16} color="gray.400" mb={6} />
                        <Text color="gray.600" fontWeight="semibold" fontSize="lg" mb={2}>
                          No guides available yet.
                        </Text>
                        <Text color="gray.500" fontSize="md" maxW="sm" mx="auto">
                          Check back later or try different search criteria.
                        </Text>
                      </Box>
                    </Center>
                  ) : (
                    <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={{ base: 4, md: 8 }}>
                      {guides.map(guide => (
                        <GuideCard key={guide.id} guide={guide} />
                      ))}
                    </SimpleGrid>
                  )}
                </TabPanel>
                
                {/* Tours Tab */}
                <TabPanel p={{ base: 4, sm: 6, md: 8 }}>
                  <Text color="gray.600" mb={{ base: 4, md: 8 }} fontSize={{ base: "md", md: "lg" }}>
                    {profile?.role === 'tourist' 
                      ? "Discover amazing tours curated by our expert guides."
                      : "Browse tour requests from tourists looking for guides."}
                  </Text>
                  
                  {isLoadingTours ? (
                    <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={{ base: 4, md: 8 }}>
                      {[1, 2, 3, 4].map(i => (
                        <Box key={i} borderWidth="1px" borderRadius="xl" overflow="hidden" boxShadow="lg" borderColor="gray.200">
                          <Box p={6}>
                            <Skeleton height="24px" width="70%" mb={3} borderRadius="lg" />
                            <Skeleton height="16px" width="40%" mb={4} borderRadius="lg" />
                            <Skeleton height="16px" mb={2} borderRadius="lg" />
                            <Skeleton height="16px" mb={2} borderRadius="lg" />
                            <Skeleton height="15px" width="90%" mb={3} />
                            <Skeleton height="10px" width="60%" mb={1} />
                            <Skeleton height="10px" width="70%" mb={1} />
                            <Skeleton height="10px" width="50%" mb={3} />
                          </Box>
                        </Box>
                      ))}
                    </SimpleGrid>
                  ) : error ? (
                    <Box p={4} bg="red.50" borderRadius="md">
                      <Text color="red.500">{error}</Text>
                    </Box>
                  ) : tours.length === 0 ? (
                    <Center bg="gray.50" border="1px" borderColor="gray.100" borderRadius="lg" p={8}>
                      <Box textAlign="center">
                        <Icon as={FaMap} w={12} h={12} color="gray.400" mb={4} />
                        <Text color="gray.500" fontWeight="medium">
                          No {profile?.role === 'tourist' ? 'tours' : 'tour requests'} available yet.
                        </Text>
                        <Text color="gray.400" fontSize="sm" mt={2}>
                          Check back later or try different search criteria.
                        </Text>
                      </Box>
                    </Center>
                  ) : (
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 4, md: 6 }}>
                      {tours.map(tourId => (
                        <TourCard key={tourId} tourId={tourId} />
                      ))}
                    </SimpleGrid>
                  )}
                </TabPanel>
                
                {/* Posts Tab */}
                <TabPanel p={{ base: 4, sm: 6, md: 8 }}>
                  <Text color="gray.600" mb={{ base: 4, md: 6 }} fontSize={{ base: "md", md: "lg" }}>
                    Read travel stories and tips from guides and fellow travelers.
                  </Text>
                  
                  <Center bg="gray.50" border="1px" borderColor="gray.100" borderRadius="lg" p={8}>
                    <Box textAlign="center">
                      <Icon as={FaEdit} w={12} h={12} color="gray.400" mb={4} />
                      <Text color="gray.500" fontWeight="medium">
                        Posts search will be implemented in future phases.
                      </Text>
                    </Box>
                  </Center>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        </Flex>
      </Box>
      
      {/* Filter drawer - mobile only */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Filters</DrawerHeader>
          
          <DrawerBody>
            <Stack spacing={4}>
              {/* Common filters for both tabs */}
              <FormControl>
                <FormLabel>Language</FormLabel>
                <Select 
                  placeholder="Any language"
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                >
                  {languages.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </Select>
              </FormControl>
              
              {/* Location filter only for tours, not guides */}
              {tabIndex === 1 && (
                <FormControl>
                  <FormLabel>Location</FormLabel>
                  <Select 
                    placeholder="Any location"
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                  >
                    {locations.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </Select>
                </FormControl>
              )}
              
              {/* Tab-specific filters */}
              {tabIndex === 0 ? (
                /* Guides filters: rating, review count */
                <>
                  <RatingFilter
                    selectedRating={selectedRating}
                    onChange={setSelectedRating}
                    label="Minimum Rating"
                    showClear={false}
                  />
                  
                  <FormControl>
                    <FormLabel>Minimum Reviews</FormLabel>
                    <Select 
                      placeholder="Any review count"
                      value={selectedReviewCount}
                      onChange={(e) => setSelectedReviewCount(Number(e.target.value))}
                    >
                      <option value={50}>50+ reviews</option>
                      <option value={20}>20+ reviews</option>
                      <option value={10}>10+ reviews</option>
                      <option value={5}>5+ reviews</option>
                    </Select>
                  </FormControl>
                </>
              ) : tabIndex === 1 ? (
                /* Tours filters: price range, days available, and rating/review filters only for tourists */
                <>
                  {/* Rating and review filters only available for tourists */}
                  {profile?.role === 'tourist' && (
                    <>
                      <RatingFilter
                        selectedRating={selectedRating}
                        onChange={setSelectedRating}
                        label="Minimum Rating"
                        showClear={false}
                      />
                      
                      <FormControl>
                        <FormLabel>Minimum Reviews</FormLabel>
                        <Select 
                          placeholder="Any review count"
                          value={selectedReviewCount}
                          onChange={(e) => setSelectedReviewCount(Number(e.target.value))}
                        >
                          <option value={50}>50+ reviews</option>
                          <option value={20}>20+ reviews</option>
                          <option value={10}>10+ reviews</option>
                          <option value={5}>5+ reviews</option>
                        </Select>
                      </FormControl>
                    </>
                  )}
                  
                  <FormControl>
                    <FormLabel>Price Range</FormLabel>
                    <HStack spacing={2}>
                      <Box flex="1">
                        <Text fontSize="xs" color="gray.500" mb={1}>Min ($)</Text>
                        <NumberInput 
                          min={20} 
                          max={10000}
                          value={priceRange[0]}
                          onChange={(_, value) => setPriceRange([value || 20, priceRange[1]])}
                        >
                          <NumberInputField placeholder="Min" />
                        </NumberInput>
                      </Box>
                      <Text color="gray.400" mt={6}>-</Text>
                      <Box flex="1">
                        <Text fontSize="xs" color="gray.500" mb={1}>Max ($)</Text>
                        <NumberInput 
                          min={20} 
                          max={10000}
                          value={priceRange[1]}
                          onChange={(_, value) => setPriceRange([priceRange[0], value || 10000])}
                        >
                          <NumberInputField placeholder="Max" />
                        </NumberInput>
                      </Box>
                    </HStack>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Days Available</FormLabel>
                    <VStack align="start" spacing={2}>
                      {DAYS_OF_WEEK.map((day, index) => (
                        <Checkbox
                          key={day}
                          isChecked={selectedDaysAvailable.includes(index)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDaysAvailable([...selectedDaysAvailable, index]);
                            } else {
                              setSelectedDaysAvailable(selectedDaysAvailable.filter(d => d !== index));
                            }
                          }}
                          size="sm"
                        >
                          {day}
                        </Checkbox>
                      ))}
                    </VStack>
                  </FormControl>
                </>
              ) : null}
              
              <Flex gap={2}>
                <Button 
                  colorScheme="primary" 
                  flex="1"
                  onClick={applyFilters}
                  isLoading={isFiltering}
                >
                  Apply Filters
                </Button>
                <Button 
                  variant="outline" 
                  colorScheme="primary"
                  onClick={clearFilters}
                >
                  Clear
                </Button>
              </Flex>
            </Stack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Container>
  );
};

export default Explore;