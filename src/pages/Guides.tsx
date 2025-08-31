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
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItemOption,
  MenuOptionGroup,
  Select,
} from '@chakra-ui/react';
import { SearchIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { GuideProfile } from '../lib/types';
import { supabase } from '../lib/supabaseClient';
import GuideCard from '../components/GuideCard';

interface Language {
  id: string;
  name: string;
  code: string;
}

const Guides = () => {
  const [guides, setGuides] = useState<GuideProfile[]>([]);
  const [filteredGuides, setFilteredGuides] = useState<GuideProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<string>('name_asc');
  const [languages, setLanguages] = useState<Language[]>([]);
  
  useEffect(() => {
    const fetchGuides = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'guide');
          
        if (error) throw error;
        setGuides(data || []);
        setFilteredGuides(data || []);
      } catch (err) {
        console.error('Error fetching guides:', err);
        setError('Failed to load guides. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    const fetchLanguages = async () => {
      try {
        const { data, error } = await supabase
          .from('languages')
          .select('*')
          .order('name');
          
        if (error) throw error;
        setLanguages(data || []);
      } catch (err) {
        console.error('Error fetching languages:', err);
      }
    };
    
    fetchGuides();
    fetchLanguages();
  }, []);
  
  useEffect(() => {
    // Filter guides based on search term and selected languages
    let result = [...guides];
    
    if (searchTerm) {
      result = result.filter(guide => 
        guide.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (guide.bio && guide.bio.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (selectedLanguages.length > 0) {
      // This would need to be a more complex query with language filtering
      // For now, we'll assume all guides are shown since we don't have language data yet
    }
    
    // Sort guides based on selected sort option
    switch (sortOption) {
      case 'name_asc':
        result.sort((a, b) => a.full_name.localeCompare(b.full_name));
        break;
      case 'name_desc':
        result.sort((a, b) => b.full_name.localeCompare(a.full_name));
        break;
      case 'rating_desc':
        // This would need to be sorted by rating when we have that data
        break;
      case 'price_asc':
        // This would need to be sorted by price when we have that data
        break;
      case 'price_desc':
        // This would need to be sorted by price when we have that data
        break;
    }
    
    setFilteredGuides(result);
  }, [guides, searchTerm, selectedLanguages, sortOption]);
  
  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    // The filtering is already handled by the useEffect
  };
  
  const handleLanguageChange = (values: string[]) => {
    setSelectedLanguages(values);
  };
  
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOption(e.target.value);
  };
  
  return (
    <Container maxW="container.xl" px={4} py={8}>
      <Box bg="white" borderRadius="lg" overflow="hidden" boxShadow="md" p={6}>
        <Heading as="h1" size="xl" mb={2}>Find Your Perfect Guide</Heading>
        <Text color="gray.600" mb={6}>
          Connect with knowledgeable local guides to enhance your travel experience
        </Text>
        
        <HStack spacing={4} mb={8} wrap="wrap">
          {/* Search */}
          <Box flex="1" minW={{ base: "100%", md: "320px" }}>
            <form onSubmit={handleSearch}>
              <InputGroup>
                <Input
                  placeholder="Search guides by name or bio..."
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
          
          {/* Language Filter */}
          <Box>
            <Menu closeOnSelect={false}>
              <MenuButton as={Button} rightIcon={<ChevronDownIcon />} variant="outline">
                Languages {selectedLanguages.length > 0 && `(${selectedLanguages.length})`}
              </MenuButton>
              <MenuList minWidth="240px">
                <MenuOptionGroup title="Select Languages" type="checkbox" value={selectedLanguages} onChange={(values) => handleLanguageChange(values as string[])}>
                  {languages.map(lang => (
                    <MenuItemOption key={lang.id} value={lang.code}>
                      {lang.name}
                    </MenuItemOption>
                  ))}
                </MenuOptionGroup>
              </MenuList>
            </Menu>
          </Box>
          
          {/* Sort */}
          <Box>
            <Select value={sortOption} onChange={handleSortChange}>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
              <option value="rating_desc">Top Rated</option>
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
        ) : filteredGuides.length === 0 ? (
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            No guides found matching your criteria. Try adjusting your filters!
          </Alert>
        ) : (
          <Grid
            templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
            gap={6}
          >
            {filteredGuides.map(guide => (
              <GuideCard key={guide.id} guide={guide} />
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default Guides;