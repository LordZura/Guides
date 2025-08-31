import { useState } from 'react';
import {
  Box,
  Heading,
  Stack,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Checkbox,
  CheckboxGroup,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  Text,
  HStack,
  Input,
  Button,
  Divider,
  useBreakpointValue,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';

export interface FilterOptions {
  days?: number[];
  priceRange?: [number, number];
  languages?: string[];
  location?: string;
  rating?: number;
  reviewCount?: number;
}

export type FilterMode = 'guides' | 'tours';

interface FiltersProps {
  mode: FilterMode;
  onFilterChange: (filters: FilterOptions) => void;
  languages: { id: number; name: string; code: string }[];
}

const Filters = ({ mode, onFilterChange, languages }: FiltersProps) => {
  const [days, setDays] = useState<number[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([20, 10000]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [minRating, setMinRating] = useState<number>(0);
  const [minReviewCount, setMinReviewCount] = useState<number>(0);
  
  const isMobile = useBreakpointValue({ base: true, md: false });
  
  const dayOptions = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];
  
  const handleDayChange = (values: number[]) => {
    setDays(values.map(v => parseInt(v.toString())));
  };
  
  const handleLanguageChange = (values: string[]) => {
    setSelectedLanguages(values);
  };
  
  const handlePriceChange = (values: number[]) => {
    setPriceRange([values[0], values[1]]);
  };
  
  const applyFilters = () => {
    const filters: FilterOptions = {
      languages: selectedLanguages.length > 0 ? selectedLanguages : undefined,
      location: location.trim() || undefined,
    };

    if (mode === 'tours') {
      filters.days = days.length > 0 ? days : undefined;
      filters.priceRange = priceRange;
    } else if (mode === 'guides') {
      filters.rating = minRating > 0 ? minRating : undefined;
      filters.reviewCount = minReviewCount > 0 ? minReviewCount : undefined;
    }

    onFilterChange(filters);
  };
  
  const resetFilters = () => {
    setDays([]);
    setPriceRange([20, 10000]);
    setSelectedLanguages([]);
    setLocation('');
    setMinRating(0);
    setMinReviewCount(0);
    
    onFilterChange({});
  };
  
  return (
    <Box 
      bg="white" 
      p={4} 
      borderRadius="md" 
      boxShadow="sm"
      borderWidth="1px"
      borderColor="gray.200"
    >
      <Heading size="md" mb={4}>Filters</Heading>
      
      <Accordion defaultIndex={isMobile ? [] : [0, 1, 2, 3]} allowMultiple>
        {/* Available Days */}
        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box flex="1" textAlign="left" fontWeight="medium">
                Available Days
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <CheckboxGroup colorScheme="primary" value={days} onChange={handleDayChange}>
              <Stack spacing={2}>
                {dayOptions.map(day => (
                  <Checkbox key={day.value} value={day.value}>
                    {day.label}
                  </Checkbox>
                ))}
              </Stack>
            </CheckboxGroup>
          </AccordionPanel>
        </AccordionItem>
        
        {/* Price Range */}
        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box flex="1" textAlign="left" fontWeight="medium">
                Price Range
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <RangeSlider
              aria-label={['min', 'max']}
              defaultValue={[0, 500]}
              min={0}
              max={500}
              step={10}
              value={priceRange}
              onChange={handlePriceChange}
              colorScheme="primary"
            >
              <RangeSliderTrack>
                <RangeSliderFilledTrack />
              </RangeSliderTrack>
              <RangeSliderThumb index={0} />
              <RangeSliderThumb index={1} />
            </RangeSlider>
            <HStack justifyContent="space-between" mt={2}>
              <Text fontSize="sm">${priceRange[0]}</Text>
              <Text fontSize="sm">${priceRange[1]}</Text>
            </HStack>
          </AccordionPanel>
        </AccordionItem>
        
        {/* Languages */}
        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box flex="1" textAlign="left" fontWeight="medium">
                Languages
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <CheckboxGroup colorScheme="primary" value={selectedLanguages} onChange={handleLanguageChange}>
              <Stack spacing={2}>
                {languages.map(language => (
                  <Checkbox key={language.id} value={language.code}>
                    {language.name}
                  </Checkbox>
                ))}
              </Stack>
            </CheckboxGroup>
          </AccordionPanel>
        </AccordionItem>
        
        {/* Location */}
        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box flex="1" textAlign="left" fontWeight="medium">
                Location
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <HStack>
              <Input
                placeholder="City, Country, Region..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <Button colorScheme="primary" onClick={applyFilters}>
                <SearchIcon />
              </Button>
            </HStack>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
      
      <Divider my={4} />
      
      <HStack justifyContent="space-between">
        <Button size="sm" variant="outline" onClick={resetFilters}>
          Reset All
        </Button>
        <Button size="sm" colorScheme="primary" onClick={applyFilters}>
          Apply Filters
        </Button>
      </HStack>
    </Box>
  );
};

export default Filters;