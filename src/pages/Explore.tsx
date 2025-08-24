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
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
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
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { FaMap, FaEdit, FaFilter } from 'react-icons/fa'; 
import { supabase, Profile } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthProvider';
import GuideCard from '../components/GuideCard';
import TourCard from '../components/TourCard';

interface FilterOptions {
  language?: string;
  location?: string;
  priceRange?: [number, number];
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
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [isFiltering, setIsFiltering] = useState<boolean>(false);
  
  // Fetch guides with no filters
  const fetchGuides = async (filters: FilterOptions = {}) => {
    setIsLoadingGuides(true);
    setError(null);
    
    try {
      console.log("Fetching guides with role='guide'", filters);
      
      // Build the query
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('role', 'guide');
      
      // Apply filters if provided
      if (filters.language && filters.language.trim() !== '') {
        // Using containedBy instead of contains since we're looking for profiles that have the selected language
        query = query.contains('languages', [filters.language]);
      }
      
      if (filters.location && filters.location.trim() !== '') {
        query = query.eq('location', filters.location);
      }
      
      // Add debugging output before executing the query
      console.log("Supabase query:", query);
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Supabase error fetching guides:", error);
        throw error;
      }
      
      console.log("Guides fetched:", data?.length, data);
      
      // If no guides are found, log a more specific message
      if (!data || data.length === 0) {
        console.log("No guides found with the current filters.");
      }
      
      setGuides(data || []);
    } catch (err: any) {
      console.error("Error fetching guides:", err);
      setError(err.message);
      toast({
        title: "Error fetching guides",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
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
      
      console.log(`Fetching tours with creator_role='${oppositeRole}'`, filters);
      
      // Build the query
      let query = supabase
        .from('tours')
        .select('id')
        .eq('creator_role', oppositeRole)
        .eq('is_active', true);
      
      // Apply filters if provided
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
      
      console.log("Tours fetched:", data?.length, data);
      setTours(data?.map(tour => tour.id) || []);
    } catch (err: any) {
      console.error("Error fetching tours:", err);
      setError(err.message);
      toast({
        title: "Error fetching tours",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoadingTours(false);
      setIsFiltering(false);
    }
  };
  
  // Fetch filter options
  const fetchFilterOptions = async () => {
    try {
      // Fetch languages
      const { data: languageData } = await supabase
        .from('languages')
        .select('name')
        .order('name');
      
      setLanguages((languageData || []).map(lang => lang.name));
      
      // Fetch distinct locations from tours
      const { data: locationData } = await supabase
        .from('tours')
        .select('location')
        .order('location');
      
      // Get unique locations
      const uniqueLocations = Array.from(new Set((locationData || []).map(tour => tour.location)));
      setLocations(uniqueLocations);
      
    } catch (err) {
      console.error("Error fetching filter options:", err);
      toast({
        title: "Error loading filters",
        description: "Could not load filter options. Please try again later.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  useEffect(() => {
    fetchGuides();
    fetchTours();
    fetchFilterOptions();
  }, [profile]);
  
  const applyFilters = () => {
    setIsFiltering(true);
    
    // Prepare filter object
    const filters: FilterOptions = {
      language: selectedLanguage || undefined,
      location: selectedLocation || undefined,
      priceRange: priceRange.every(val => val !== 0) ? priceRange : undefined
    };
    
    console.log("Applying filters:", filters);
    
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
    setPriceRange([0, 1000]);
    
    // Fetch data without filters
    if (tabIndex === 0) {
      fetchGuides();
    } else if (tabIndex === 1) {
      fetchTours();
    }
    
    onClose();
  };
  
  return (
    <Container maxW="container.xl" px={4} py={8}>
      <Box bg="white" borderRadius="lg" overflow="hidden" boxShadow="md">
        <Box p={6} bgGradient="linear(to-r, primary.600, primary.700)" color="white">
          <Heading as="h1" size="lg" mb={2}>Explore TourGuideHub</Heading>
          <Text color="primary.100">Discover amazing guides, tours and travel stories</Text>
          
          {isMobile && (
            <Button 
              leftIcon={<FaFilter />} 
              variant="outline" 
              colorScheme="whiteAlpha"
              mt={4}
              onClick={onOpen}
            >
              Filters
            </Button>
          )}
        </Box>
        
        <Flex>
          {/* Filters - desktop */}
          {!isMobile && (
            <Box width="250px" p={4} borderRightWidth="1px">
              <Heading size="md" mb={4}>Filters</Heading>
              
              <Stack spacing={4}>
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
                
                <FormControl>
                  <FormLabel>Price Range</FormLabel>
                  <RangeSlider 
                    min={0} 
                    max={1000} 
                    step={50}
                    value={priceRange}
                    onChange={(val) => setPriceRange(val as [number, number])}
                  >
                    <RangeSliderTrack>
                      <RangeSliderFilledTrack />
                    </RangeSliderTrack>
                    <RangeSliderThumb index={0} />
                    <RangeSliderThumb index={1} />
                  </RangeSlider>
                  <Flex justify="space-between" mt={1}>
                    <Text fontSize="sm">${priceRange[0]}</Text>
                    <Text fontSize="sm">${priceRange[1]}</Text>
                  </Flex>
                </FormControl>
                
                <Flex gap={2}>
                  <Button 
                    colorScheme="primary" 
                    flex="1"
                    onClick={applyFilters}
                    isLoading={isFiltering}
                  >
                    Apply
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
            </Box>
          )}
          
          {/* Main content */}
          <Box flex="1">
            <Tabs colorScheme="primary" onChange={setTabIndex} index={tabIndex}>
              <TabList>
                <Tab fontWeight="medium" py={4} px={6}>Guides</Tab>
                <Tab fontWeight="medium" py={4} px={6}>Tours</Tab>
                <Tab fontWeight="medium" py={4} px={6}>Posts</Tab>
              </TabList>
              
              <TabPanels>
                {/* Guides Tab */}
                <TabPanel p={6}>
                  <Text color="gray.600" mb={6}>
                    Find expert local guides to enhance your travel experience.
                  </Text>
                  
                  {isLoadingGuides ? (
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                      {[1, 2, 3].map(i => (
                        <Box key={i} borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="md">
                          <Skeleton height="200px" />
                          <Box p={4}>
                            <Skeleton height="20px" width="70%" mb={2} />
                            <Skeleton height="15px" mb={3} />
                            <Skeleton height="15px" width="90%" mb={1} />
                            <Skeleton height="15px" width="60%" mb={3} />
                            <Skeleton height="30px" width="50%" />
                          </Box>
                        </Box>
                      ))}
                    </SimpleGrid>
                  ) : error ? (
                    <Box p={4} bg="red.50" borderRadius="md">
                      <Text color="red.500">{error}</Text>
                    </Box>
                  ) : guides.length === 0 ? (
                    <Center bg="gray.50" border="1px" borderColor="gray.100" borderRadius="lg" p={8}>
                      <Box textAlign="center">
                        <Icon as={SearchIcon} w={12} h={12} color="gray.400" mb={4} />
                        <Text color="gray.500" fontWeight="medium">
                          No guides available yet.
                        </Text>
                        <Text color="gray.400" fontSize="sm" mt={2}>
                          Check back later or try different search criteria.
                        </Text>
                      </Box>
                    </Center>
                  ) : (
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                      {guides.map(guide => (
                        <GuideCard key={guide.id} guide={guide} />
                      ))}
                    </SimpleGrid>
                  )}
                </TabPanel>
                
                {/* Tours Tab */}
                <TabPanel p={6}>
                  <Text color="gray.600" mb={6}>
                    {profile?.role === 'tourist' 
                      ? "Discover amazing tours curated by our expert guides."
                      : "Browse tour requests from tourists looking for guides."}
                  </Text>
                  
                  {isLoadingTours ? (
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                      {[1, 2, 3, 4].map(i => (
                        <Box key={i} borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="md">
                          <Box p={4}>
                            <Skeleton height="20px" width="70%" mb={2} />
                            <Skeleton height="15px" width="40%" mb={3} />
                            <Skeleton height="15px" mb={1} />
                            <Skeleton height="15px" mb={1} />
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
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                      {tours.map(tourId => (
                        <TourCard key={tourId} tourId={tourId} />
                      ))}
                    </SimpleGrid>
                  )}
                </TabPanel>
                
                {/* Posts Tab */}
                <TabPanel p={6}>
                  <Text color="gray.600" mb={6}>
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
              
              <FormControl>
                <FormLabel>Price Range</FormLabel>
                <RangeSlider 
                  min={0} 
                  max={1000} 
                  step={50}
                  value={priceRange}
                  onChange={(val) => setPriceRange(val as [number, number])}
                >
                  <RangeSliderTrack>
                    <RangeSliderFilledTrack />
                  </RangeSliderTrack>
                  <RangeSliderThumb index={0} />
                  <RangeSliderThumb index={1} />
                </RangeSlider>
                <Flex justify="space-between" mt={1}>
                  <Text fontSize="sm">${priceRange[0]}</Text>
                  <Text fontSize="sm">${priceRange[1]}</Text>
                </Flex>
              </FormControl>
              
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