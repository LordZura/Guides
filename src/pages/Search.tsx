import { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  Grid,
  Center,
  Spinner,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@chakra-ui/react';
import { GuideProfile } from '../lib/types';
import { supabase } from '../lib/supabaseClient';
import GuideCard from '../components/GuideCard';
import TourCard from '../components/TourCard';

interface Tour {
  id: string;
  title: string;
  description: string;
  location: string;
  price: number;
  duration: number;
  capacity: number;
  languages: string[];
  is_private: boolean;
  is_active: boolean;
  creator_id: string;
  creator_role: string;
  days_available: boolean[];
  created_at: string;
  updated_at: string;
}

const Search = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const query = searchParams.get('q') || '';
  
  const [guides, setGuides] = useState<GuideProfile[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [isLoadingGuides, setIsLoadingGuides] = useState(true);
  const [isLoadingTours, setIsLoadingTours] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine which tab to show based on the current route
  const [tabIndex, setTabIndex] = useState(() => {
    const path = location.state?.from || location.pathname;
    if (path.includes('/tours')) return 1;
    return 0; // Default to guides
  });

  useEffect(() => {
    const fetchGuides = async () => {
      if (!query) {
        setGuides([]);
        setIsLoadingGuides(false);
        return;
      }

      try {
        setIsLoadingGuides(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'guide')
          .or(`full_name.ilike.%${query}%,bio.ilike.%${query}%`);
          
        if (error) throw error;
        setGuides(data || []);
      } catch (err) {
        console.error('Error fetching guides:', err);
        setError('Failed to search guides. Please try again later.');
      } finally {
        setIsLoadingGuides(false);
      }
    };
    
    fetchGuides();
  }, [query]);

  useEffect(() => {
    const fetchTours = async () => {
      if (!query) {
        setTours([]);
        setIsLoadingTours(false);
        return;
      }

      try {
        setIsLoadingTours(true);
        const { data, error } = await supabase
          .from('tours')
          .select('*')
          .eq('is_active', true)
          .or(`title.ilike.%${query}%,description.ilike.%${query}%,location.ilike.%${query}%`);
          
        if (error) throw error;
        setTours(data || []);
      } catch (err) {
        console.error('Error fetching tours:', err);
        setError('Failed to search tours. Please try again later.');
      } finally {
        setIsLoadingTours(false);
      }
    };
    
    fetchTours();
  }, [query]);

  if (!query) {
    return (
      <Container maxW="container.xl" px={4} py={8}>
        <Box bg="white" borderRadius="lg" overflow="hidden" boxShadow="md" p={6}>
          <Heading as="h1" size="xl" mb={2}>Search</Heading>
          <Text color="gray.600">
            Enter a search term to find guides, tours, and more.
          </Text>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" px={4} py={8}>
      <Box bg="white" borderRadius="lg" overflow="hidden" boxShadow="md" p={6}>
        <Heading as="h1" size="xl" mb={2}>
          Search Results for "{query}"
        </Heading>
        <Text color="gray.600" mb={6}>
          Found {guides.length} guide(s) and {tours.length} tour(s)
        </Text>

        <Tabs index={tabIndex} onChange={setTabIndex} colorScheme="primary">
          <TabList>
            <Tab>Guides ({guides.length})</Tab>
            <Tab>Tours ({tours.length})</Tab>
          </TabList>

          <TabPanels>
            <TabPanel px={0}>
              {isLoadingGuides ? (
                <Center py={10}>
                  <Spinner size="xl" color="primary.500" />
                </Center>
              ) : error ? (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  {error}
                </Alert>
              ) : guides.length === 0 ? (
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  No guides found matching "{query}". Try different keywords!
                </Alert>
              ) : (
                <Grid
                  templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
                  gap={6}
                  mt={4}
                >
                  {guides.map(guide => (
                    <GuideCard key={guide.id} guide={guide} />
                  ))}
                </Grid>
              )}
            </TabPanel>

            <TabPanel px={0}>
              {isLoadingTours ? (
                <Center py={10}>
                  <Spinner size="xl" color="primary.500" />
                </Center>
              ) : error ? (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  {error}
                </Alert>
              ) : tours.length === 0 ? (
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  No tours found matching "{query}". Try different keywords!
                </Alert>
              ) : (
                <Grid
                  templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
                  gap={6}
                  mt={4}
                >
                  {tours.map(tour => (
                    <TourCard key={tour.id} tourId={tour.id} />
                  ))}
                </Grid>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Container>
  );
};

export default Search;
