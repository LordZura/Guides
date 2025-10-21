import React, { useState, useEffect } from 'react';
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
  InputGroup,
  Input,
  InputRightElement,
  IconButton,
  HStack,
  Select,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { supabase } from '../lib/supabaseClient';
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

const Tours = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [filteredTours, setFilteredTours] = useState<Tour[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<string>('created_desc');
  
  useEffect(() => {
    const fetchTours = async () => {
      try {
        const { data, error } = await supabase
          .from('tours')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setTours(data || []);
        setFilteredTours(data || []);
      } catch (err) {
        console.error('Error fetching tours:', err);
        setError('Failed to load tours. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTours();
  }, []);
  
  useEffect(() => {
    // Filter tours based on search term
    let result = [...tours];
    
    if (searchTerm) {
      result = result.filter(tour => 
        tour.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (tour.description && tour.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tour.location && tour.location.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Sort tours based on selected sort option
    switch (sortOption) {
      case 'title_asc':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'title_desc':
        result.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'price_asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'created_desc':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'created_asc':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
    }
    
    setFilteredTours(result);
  }, [tours, searchTerm, sortOption]);
  
  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    // The filtering is already handled by the useEffect
  };
  
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOption(e.target.value);
  };
  
  return (
    <Container maxW="container.xl" px={4} py={8}>
      <Box bg="white" borderRadius="lg" overflow="hidden" boxShadow="md" p={6}>
        <Heading as="h1" size="xl" mb={2}>Discover Amazing Tours</Heading>
        <Text color="gray.600" mb={6}>
          Browse and book exciting tours led by experienced guides
        </Text>
        
        <HStack spacing={4} mb={8} wrap="wrap">
          {/* Search */}
          <Box flex="1" minW={{ base: "100%", md: "320px" }}>
            <form onSubmit={handleSearch}>
              <InputGroup>
                <Input
                  placeholder="Search tours by title, description, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <InputRightElement>
                  <IconButton
                    aria-label="Search"
                    icon={<SearchIcon />}
                    variant="ghost"
                    type="submit"
                  />
                </InputRightElement>
              </InputGroup>
            </form>
          </Box>
          
          {/* Sort */}
          <Box>
            <Select value={sortOption} onChange={handleSortChange}>
              <option value="created_desc">Newest First</option>
              <option value="created_asc">Oldest First</option>
              <option value="title_asc">Title (A-Z)</option>
              <option value="title_desc">Title (Z-A)</option>
              <option value="price_asc">Price (Low to High)</option>
              <option value="price_desc">Price (High to Low)</option>
            </Select>
          </Box>
        </HStack>
        
        {isLoading ? (
          <Center py={10}>
            <Spinner size="xl" color="primary.500" />
          </Center>
        ) : error ? (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        ) : filteredTours.length === 0 ? (
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            No tours found matching your criteria. Try adjusting your filters!
          </Alert>
        ) : (
          <Grid
            templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
            gap={6}
          >
            {filteredTours.map(tour => (
              <TourCard key={tour.id} tourId={tour.id} />
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default Tours;
