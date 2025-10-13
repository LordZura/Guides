import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Heading,
  Flex,
  Text,
  useToast,
  VStack,
  Divider,
  HStack,
  Select,
  Alert,
  AlertIcon,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  RangeSliderMark,
} from '@chakra-ui/react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthProvider';
import SearchableLanguageSelector from './SearchableLanguageSelector';
import TourLocationManager from './TourLocationManager';
import { TourLocation } from '../lib/types';

interface TouristTourRequestFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  title: string;
  description: string;
  locations: TourLocation[];
  duration: number; // In hours
  budget_range: [number, number];
  party_size: number;
  preferred_date: string;
  preferred_time: string;
  languages: string[];
  special_requirements: string;
  is_private: boolean;
}

interface FormErrors {
  title?: string;
  description?: string;
  locations?: string;
  duration?: string;
  budget_range?: string;
  party_size?: string;
  preferred_date?: string;
  languages?: string;
}

const TouristTourRequestForm = ({ onSuccess, onCancel }: TouristTourRequestFormProps) => {
  const { profile } = useAuth();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const initialFormData: FormData = {
    title: '',
    description: '',
    locations: [],
    duration: 4,
    budget_range: [100, 500],
    party_size: 2,
    preferred_date: '',
    preferred_time: '',
    languages: [],
    special_requirements: '',
    is_private: false,
  };
  
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  
  // Validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }
    
    if (formData.locations.length === 0) {
      newErrors.locations = 'At least one location is required';
    }
    
    if (formData.duration < 1 || formData.duration > 24) {
      newErrors.duration = 'Duration must be between 1 and 24 hours';
    }
    
    if (formData.party_size < 1 || formData.party_size > 20) {
      newErrors.party_size = 'Party size must be between 1 and 20 people';
    }
    
    if (!formData.preferred_date) {
      newErrors.preferred_date = 'Preferred date is required';
    } else {
      const selectedDate = new Date(formData.preferred_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.preferred_date = 'Preferred date must be in the future';
      }
    }
    
    if (formData.budget_range[0] >= formData.budget_range[1]) {
      newErrors.budget_range = 'Minimum budget must be less than maximum budget';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleNumberInputChange = (name: string, value: number) => {
    setFormData({ ...formData, [name]: value });
  };
  
  const handleLanguageChange = (languages: string[]) => {
    setFormData({ ...formData, languages });
  };
  
  const handleLocationChange = (locations: TourLocation[]) => {
    setFormData({ ...formData, locations });
  };
  
  const handleBudgetRangeChange = (values: number[]) => {
    setFormData({ ...formData, budget_range: [values[0], values[1]] });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (!profile) {
      toast({
        title: 'Authentication error',
        description: 'You must be logged in to post a tour request.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create the tour request with tourist-specific data
      const tourData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.locations[0]?.name || '', // Primary location for backward compatibility
        locations: formData.locations,
        duration: Math.floor(formData.duration),
        price: formData.budget_range[1], // Use max budget as the price
        capacity: formData.party_size,
        languages: formData.languages,
        days_available: [true, true, true, true, true, true, true], // Tourist is flexible by default
        is_private: Boolean(formData.is_private),
        creator_id: profile.id,
        creator_role: 'tourist',
        is_active: true,
        // Store additional tourist-specific data in a custom field or description
        tour_request_details: {
          budget_range: formData.budget_range,
          preferred_date: formData.preferred_date,
          preferred_time: formData.preferred_time,
          special_requirements: formData.special_requirements,
        }
      };
      
      const { error } = await supabase
        .from('tours')
        .insert([tourData])
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: 'Tour request posted successfully',
        description: 'Guides will be able to see your request and offer their services.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      onSuccess();
    } catch (err: unknown) {
      console.error('Error creating tour request:', err);
      toast({
        title: 'Error posting tour request',
        description: err instanceof Error ? err.message : 'Failed to post tour request. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };
  
  return (
    <Box>
      <Heading size="md" mb={6}>
        Post a Tour Request
      </Heading>
      
      <Alert status="info" mb={6} borderRadius="md">
        <AlertIcon />
        <Box>
          <Text fontSize="sm" fontWeight="medium">Tell guides what kind of tour you're looking for!</Text>
          <Text fontSize="sm">
            Local guides will see your request and can offer to create a personalized tour for you.
          </Text>
        </Box>
      </Alert>
      
      <form onSubmit={handleSubmit}>
        <VStack spacing={6} align="stretch">
          <FormControl isRequired isInvalid={!!errors.title}>
            <FormLabel>What kind of tour are you looking for?</FormLabel>
            <Input 
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Historical walking tour of downtown"
            />
            <FormErrorMessage>{errors.title}</FormErrorMessage>
          </FormControl>
          
          <FormControl isRequired isInvalid={!!errors.description}>
            <FormLabel>Describe your ideal tour</FormLabel>
            <Textarea 
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Tell guides what you're interested in seeing, learning about, or experiencing. The more details you provide, the better guides can tailor their offers to your interests."
              rows={5}
            />
            <FormErrorMessage>{errors.description}</FormErrorMessage>
          </FormControl>
          
          <TourLocationManager
            locations={formData.locations}
            onChange={handleLocationChange}
            error={errors.locations}
          />
          
          <Flex gap={4} direction={{ base: 'column', md: 'row' }}>
            <FormControl isRequired isInvalid={!!errors.duration}>
              <FormLabel>How long should the tour be?</FormLabel>
              <NumberInput 
                min={1} 
                max={24}
                value={formData.duration}
                onChange={(_, value) => handleNumberInputChange('duration', value)}
                size="sm"
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <Text fontSize="sm" color="gray.600">Hours</Text>
              <FormErrorMessage>{errors.duration}</FormErrorMessage>
            </FormControl>
            
            <FormControl isRequired isInvalid={!!errors.party_size}>
              <FormLabel>Party size</FormLabel>
              <NumberInput 
                min={1} 
                max={20}
                value={formData.party_size}
                onChange={(_, value) => handleNumberInputChange('party_size', value)}
                size="sm"
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <Text fontSize="sm" color="gray.600">People</Text>
              <FormErrorMessage>{errors.party_size}</FormErrorMessage>
            </FormControl>
          </Flex>
          
          <FormControl isRequired isInvalid={!!errors.budget_range}>
            <FormLabel>Budget range per person</FormLabel>
            <RangeSlider
              aria-label={['min', 'max']}
              value={formData.budget_range}
              onChange={handleBudgetRangeChange}
              min={20}
              max={1000}
              step={10}
            >
              <RangeSliderMark value={20} mt="2" ml="-2.5" fontSize="sm">
                $20
              </RangeSliderMark>
              <RangeSliderMark value={500} mt="2" ml="-2.5" fontSize="sm">
                $500
              </RangeSliderMark>
              <RangeSliderMark value={1000} mt="2" ml="-4" fontSize="sm">
                $1000
              </RangeSliderMark>
              <RangeSliderTrack>
                <RangeSliderFilledTrack />
              </RangeSliderTrack>
              <RangeSliderThumb index={0} />
              <RangeSliderThumb index={1} />
            </RangeSlider>
            <HStack justifyContent="space-between" mt={8}>
              <Text fontSize="sm" fontWeight="medium">${formData.budget_range[0]}</Text>
              <Text fontSize="sm" fontWeight="medium">${formData.budget_range[1]}</Text>
            </HStack>
            <FormErrorMessage>{errors.budget_range}</FormErrorMessage>
          </FormControl>
          
          <Flex gap={4} direction={{ base: 'column', md: 'row' }}>
            <FormControl isRequired isInvalid={!!errors.preferred_date}>
              <FormLabel>Preferred date</FormLabel>
              <Input 
                name="preferred_date"
                type="date"
                value={formData.preferred_date}
                onChange={handleInputChange}
                min={getTomorrowDate()}
              />
              <FormErrorMessage>{errors.preferred_date}</FormErrorMessage>
            </FormControl>
            
            <FormControl>
              <FormLabel>Preferred time (optional)</FormLabel>
              <Select 
                name="preferred_time"
                value={formData.preferred_time}
                onChange={handleInputChange}
                placeholder="Any time"
              >
                <option value="09:00">9:00 AM</option>
                <option value="10:00">10:00 AM</option>
                <option value="11:00">11:00 AM</option>
                <option value="12:00">12:00 PM</option>
                <option value="13:00">1:00 PM</option>
                <option value="14:00">2:00 PM</option>
                <option value="15:00">3:00 PM</option>
                <option value="16:00">4:00 PM</option>
                <option value="17:00">5:00 PM</option>
                <option value="18:00">6:00 PM</option>
              </Select>
            </FormControl>
          </Flex>
          
          <FormControl>
            <FormLabel>Preferred languages</FormLabel>
            <SearchableLanguageSelector 
              selectedLanguages={formData.languages}
              onChange={handleLanguageChange}
              placeholder="Select languages you'd prefer the guide to speak"
            />
          </FormControl>
          
          <FormControl>
            <FormLabel>Special requirements or requests</FormLabel>
            <Textarea 
              name="special_requirements"
              value={formData.special_requirements}
              onChange={handleInputChange}
              placeholder="Any accessibility needs, dietary restrictions, specific interests, or other special requests?"
              rows={3}
            />
          </FormControl>
          
          <Divider />
          
          <Flex justify="flex-end" gap={3}>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              colorScheme="primary"
              isLoading={isSubmitting}
              loadingText="Posting request..."
            >
              Post Tour Request
            </Button>
          </Flex>
        </VStack>
      </form>
    </Box>
  );
};

export default TouristTourRequestForm;