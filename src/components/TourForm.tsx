import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Stack,
  Checkbox,
  CheckboxGroup,
  HStack,
  Text,
  useToast,
  Select,
  Flex,
  FormHelperText,
  Heading,
  Code,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthProvider';
import { useTours, TourWithLanguages } from '../contexts/ToursContext';
import { supabase } from '../lib/supabaseClient';

interface TourFormProps {
  tour?: TourWithLanguages;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const TourForm = ({ tour, onSuccess, onCancel }: TourFormProps) => {
  const { profile } = useAuth();
  const { createTour, updateTour } = useTours();
  const toast = useToast();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(50);
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState<number | null>(null);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<Array<{ id: number; name: string; code: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  
  const isEditMode = !!tour;
  
  useEffect(() => {
    // If editing, populate form with tour data
    if (tour) {
      setTitle(tour.title);
      setDescription(tour.description);
      setPrice(tour.average_price);
      setLocation(tour.location);
      setCapacity(tour.capacity);
      setSelectedDays(tour.available_days || []);
      setSelectedLanguages(tour.languages || []);
      
      console.log("Editing tour:", tour);
    }
    
    // Fetch available languages
    const fetchLanguages = async () => {
      try {
        const { data, error } = await supabase
          .from('languages')
          .select('*')
          .order('name');
          
        if (error) throw error;
        
        console.log("Available languages:", data);
        setAvailableLanguages(data || []);
      } catch (error) {
        console.error('Error fetching languages:', error);
      }
    };
    
    fetchLanguages();
  }, [tour]);
  
  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];
  
  const handleDayChange = (values: number[]) => {
    setSelectedDays(values.map(v => parseInt(v.toString())));
  };
  
  const handleLanguageChange = (values: string[]) => {
    setSelectedLanguages(values);
  };
  
  const handleSubmit = async () => {
    if (!title || !description || !location) {
      toast({
        title: 'Please fill in all required fields',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsLoading(true);
    setDebugInfo(null);
    
    try {
      console.log("Starting tour submission with data:", {
        title,
        description,
        price,
        location,
        capacity,
        selectedDays,
        selectedLanguages
      });
      
      const tourData = {
        title,
        description,
        average_price: price,
        location,
        capacity: capacity,
        available_days: selectedDays,
        languages: selectedLanguages,
      };
      
      let result;
      
      if (isEditMode && tour) {
        console.log(`Updating tour ${tour.id}`);
        result = await updateTour(tour.id, tourData);
      } else {
        console.log("Creating new tour");
        result = await createTour(tourData);
      }
      
      console.log("Tour operation result:", result);
      
      if (result.success) {
        toast({
          title: isEditMode ? 'Tour updated' : 'Tour created',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        if (onSuccess) onSuccess();
      } else {
        throw new Error(result.error || "Unknown error occurred");
      }
    } catch (error: any) {
      console.error('Tour operation error:', error);
      
      // Set debug info
      setDebugInfo(JSON.stringify(error, null, 2));
      
      toast({
        title: isEditMode ? 'Error updating tour' : 'Error creating tour',
        description: error.message || "An unexpected error occurred",
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Box bg="white" borderRadius="lg" p={6} boxShadow="md">
      <Heading as="h2" size="md" mb={6}>
        {isEditMode ? 'Edit Tour' : `Create a New ${profile?.role === 'guide' ? 'Tour' : 'Tour Request'}`}
      </Heading>
      
      <Stack spacing={4}>
        <FormControl isRequired>
          <FormLabel>Title</FormLabel>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={profile?.role === 'guide' 
              ? "e.g., Historic City Center Walking Tour" 
              : "e.g., Looking for Food Tour in Rome"}
          />
        </FormControl>
        
        <FormControl isRequired>
          <FormLabel>Description</FormLabel>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={profile?.role === 'guide'
              ? "Describe what visitors will experience on your tour..."
              : "Describe what kind of experience you're looking for..."}
            rows={5}
          />
        </FormControl>
        
        <HStack spacing={4} align="flex-start">
          <FormControl isRequired>
            <FormLabel>Average Price (USD)</FormLabel>
            <NumberInput
              value={price}
              onChange={(_, value) => setPrice(value)}
              min={0}
              max={10000}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            <FormHelperText>
              {profile?.role === 'guide' 
                ? "The average price per person" 
                : "Your expected budget per person"}
            </FormHelperText>
          </FormControl>
          
          <FormControl>
            <FormLabel>Capacity</FormLabel>
            <NumberInput
              value={capacity || ''}
              onChange={(_, value) => setCapacity(value || null)}
              min={1}
              max={100}
            >
              <NumberInputField placeholder="Optional" />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            <FormHelperText>
              {profile?.role === 'guide'
                ? "Maximum number of people" 
                : "Preferred group size"}
            </FormHelperText>
          </FormControl>
        </HStack>
        
        <FormControl isRequired>
          <FormLabel>Location</FormLabel>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, Country, or Region"
          />
        </FormControl>
        
        <FormControl>
          <FormLabel>Available Days</FormLabel>
          <CheckboxGroup colorScheme="primary" value={selectedDays} onChange={handleDayChange}>
            <Flex wrap="wrap">
              {daysOfWeek.map(day => (
                <Box key={day.value} width={{ base: '50%', md: '33%' }} p={1}>
                  <Checkbox value={day.value}>
                    {day.label}
                  </Checkbox>
                </Box>
              ))}
            </Flex>
          </CheckboxGroup>
        </FormControl>
        
        <FormControl>
          <FormLabel>Languages</FormLabel>
          <Select 
            placeholder="Select languages"
            onChange={(e) => {
              const value = e.target.value;
              if (value && !selectedLanguages.includes(value)) {
                setSelectedLanguages([...selectedLanguages, value]);
              }
            }}
          >
            {availableLanguages
              .filter(lang => !selectedLanguages.includes(lang.name))
              .map(lang => (
                <option key={lang.id} value={lang.name}>
                  {lang.name}
                </option>
              ))}
          </Select>
          
          {selectedLanguages.length > 0 && (
            <Box mt={2}>
              <Text fontWeight="medium" mb={1}>Selected languages:</Text>
              <Flex wrap="wrap" gap={2}>
                {selectedLanguages.map(lang => (
                  <Box 
                    key={lang}
                    bg="primary.100" 
                    color="primary.700" 
                    px={2} 
                    py={1} 
                    borderRadius="md"
                    display="flex"
                    alignItems="center"
                  >
                    {lang}
                    <Button
                      size="xs"
                      variant="unstyled"
                      ml={1}
                      fontWeight="bold"
                      onClick={() => setSelectedLanguages(selectedLanguages.filter(l => l !== lang))}
                    >
                      ×
                    </Button>
                  </Box>
                ))}
              </Flex>
            </Box>
          )}
        </FormControl>
        
        {/* Debug information */}
        {debugInfo && (
          <Box mt={4} p={3} bg="red.50" borderRadius="md">
            <Text fontWeight="bold" mb={2}>Debug Information:</Text>
            <Code colorScheme="red" p={2} borderRadius="md" width="100%" overflowX="auto">
              {debugInfo}
            </Code>
          </Box>
        )}
        
        <HStack spacing={4} justifyContent="flex-end" pt={4}>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            colorScheme="primary" 
            onClick={handleSubmit}
            isLoading={isLoading}
            loadingText={isEditMode ? "Updating" : "Creating"}
          >
            {isEditMode ? 'Update Tour' : 'Create Tour'}
          </Button>
        </HStack>
      </Stack>
    </Box>
  );
};

export default TourForm;