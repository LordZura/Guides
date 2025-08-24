import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Textarea,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Stack,
  Heading,
  Flex,
  Text,
  Badge,
  useToast,
  VStack,
  Divider,
  HStack,
  Checkbox,
} from '@chakra-ui/react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthProvider';

interface TourFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  tourId?: string; // For editing existing tours
}

interface FormData {
  title: string;
  description: string;
  location: string;
  duration: number; // In hours
  price: number;
  capacity: number;
  languages: string[];
  days_available: boolean[];
  is_private: boolean;
}

interface FormErrors {
  title?: string;
  description?: string;
  location?: string;
  duration?: string;
  price?: string;
  capacity?: string;
  languages?: string;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TourForm = ({ onSuccess, onCancel, tourId }: TourFormProps) => {
  const { profile } = useAuth();
  const toast = useToast();
  const [availableLanguages, setAvailableLanguages] = useState<{name: string, code: string}[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!tourId);
  
  const initialFormData: FormData = {
    title: '',
    description: '',
    location: '',
    duration: 2,
    price: 50,
    capacity: 10,
    languages: [],
    days_available: [false, false, false, false, false, false, false],
    is_private: false,
  };
  
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  
  // Load available languages
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const { data, error } = await supabase
          .from('languages')
          .select('name, code')
          .order('name');
        
        if (error) throw error;
        
        setAvailableLanguages(data || []);
      } catch (err) {
        console.error('Error fetching languages:', err);
        toast({
          title: 'Error loading languages',
          description: 'Could not load available languages. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };
    
    fetchLanguages();
  }, [toast]);
  
  // Load existing tour data if editing
  useEffect(() => {
    const fetchTourData = async () => {
      if (!tourId) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('tours')
          .select('*')
          .eq('id', tourId)
          .single();
        
        if (error) throw error;
        
        if (data) {
          setFormData({
            title: data.title || '',
            description: data.description || '',
            location: data.location || '',
            duration: data.duration || 2,
            price: data.price || 50,
            capacity: data.capacity || 10,
            languages: data.languages || [],
            days_available: data.days_available || [false, false, false, false, false, false, false],
            is_private: data.is_private || false,
          });
        }
      } catch (err) {
        console.error('Error fetching tour data:', err);
        toast({
          title: 'Error loading tour',
          description: 'Could not load the tour information. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTourData();
  }, [tourId, toast]);
  
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }
    
    if (formData.duration <= 0) {
      newErrors.duration = 'Duration must be greater than 0';
    }
    
    if (formData.price < 0) {
      newErrors.price = 'Price cannot be negative';
    }
    
    if (formData.capacity <= 0) {
      newErrors.capacity = 'Capacity must be greater than 0';
    }
    
    if (formData.languages.length === 0) {
      newErrors.languages = 'At least one language is required';
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
  
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // Handle multi-select for languages
    const options = Array.from(e.target.selectedOptions, option => option.value);
    setFormData({ ...formData, languages: options });
  };
  
  const handleDayToggle = (index: number) => {
    const newDaysAvailable = [...formData.days_available];
    newDaysAvailable[index] = !newDaysAvailable[index];
    setFormData({ ...formData, days_available: newDaysAvailable });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: 'Form contains errors',
        description: 'Please fix the errors before submitting.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    if (!profile) {
      toast({
        title: 'Authentication error',
        description: 'You must be logged in to create a tour.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const tourData = {
        ...formData,
        creator_id: profile.id,
        creator_role: profile.role,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      if (tourId) {
        // Update existing tour
        const { error } = await supabase
          .from('tours')
          .update({
            ...tourData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', tourId);
        
        if (error) throw error;
        
        toast({
          title: 'Tour updated',
          description: 'Your tour has been successfully updated.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        // Create new tour
        const { error } = await supabase
          .from('tours')
          .insert([tourData]);
        
        if (error) throw error;
        
        toast({
          title: 'Tour created',
          description: 'Your tour has been successfully created.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }
      
      onSuccess();
    } catch (err: any) {
      console.error('Error saving tour:', err);
      toast({
        title: 'Error saving tour',
        description: err.message || 'An unexpected error occurred. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <Box textAlign="center" py={10}>
        <Text>Loading tour information...</Text>
      </Box>
    );
  }
  
  return (
    <Box>
      <Heading size="md" mb={6}>
        {tourId ? 'Edit Tour' : profile?.role === 'guide' ? 'Create Tour' : 'Post Tour Request'}
      </Heading>
      
      <form onSubmit={handleSubmit}>
        <VStack spacing={6} align="stretch">
          <FormControl isRequired isInvalid={!!errors.title}>
            <FormLabel>Title</FormLabel>
            <Input 
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter a catchy title for your tour"
            />
            <FormErrorMessage>{errors.title}</FormErrorMessage>
          </FormControl>
          
          <FormControl isRequired isInvalid={!!errors.description}>
            <FormLabel>Description</FormLabel>
            <Textarea 
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe what makes your tour special"
              rows={5}
            />
            <FormErrorMessage>{errors.description}</FormErrorMessage>
          </FormControl>
          
          <FormControl isRequired isInvalid={!!errors.location}>
            <FormLabel>Location</FormLabel>
            <Input 
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="Where will this tour take place?"
            />
            <FormErrorMessage>{errors.location}</FormErrorMessage>
          </FormControl>
          
          <Flex gap={4} direction={{ base: 'column', md: 'row' }}>
            <FormControl isRequired isInvalid={!!errors.duration}>
              <FormLabel>Duration (hours)</FormLabel>
              <NumberInput 
                min={1} 
                max={24}
                value={formData.duration}
                onChange={(_, value) => handleNumberInputChange('duration', value)}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <FormErrorMessage>{errors.duration}</FormErrorMessage>
            </FormControl>
            
            <FormControl isRequired isInvalid={!!errors.price}>
              <FormLabel>Price ($)</FormLabel>
              <NumberInput 
                min={0} 
                max={10000}
                value={formData.price}
                onChange={(_, value) => handleNumberInputChange('price', value)}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <FormErrorMessage>{errors.price}</FormErrorMessage>
            </FormControl>
            
            <FormControl isRequired isInvalid={!!errors.capacity}>
              <FormLabel>Capacity</FormLabel>
              <NumberInput 
                min={1} 
                max={100}
                value={formData.capacity}
                onChange={(_, value) => handleNumberInputChange('capacity', value)}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <FormErrorMessage>{errors.capacity}</FormErrorMessage>
            </FormControl>
          </Flex>
          
          <FormControl isRequired isInvalid={!!errors.languages}>
            <FormLabel>Languages</FormLabel>
            <Select 
              multiple
              size="md"
              height="100px"
              name="languages"
              value={formData.languages}
              onChange={handleLanguageChange}
            >
              {availableLanguages.map(lang => (
                <option key={lang.code} value={lang.name}>
                  {lang.name}
                </option>
              ))}
            </Select>
            <FormErrorMessage>{errors.languages}</FormErrorMessage>
          </FormControl>
          
          <FormControl>
            <FormLabel>Days Available</FormLabel>
            <HStack wrap="wrap" spacing={3}>
              {DAYS_OF_WEEK.map((day, index) => (
                <Checkbox 
                  key={day} 
                  isChecked={formData.days_available[index]}
                  onChange={() => handleDayToggle(index)}
                >
                  {day}
                </Checkbox>
              ))}
            </HStack>
          </FormControl>
          
          <FormControl>
            <Checkbox 
              isChecked={formData.is_private}
              onChange={(e) => setFormData({...formData, is_private: e.target.checked})}
            >
              Private tour (by invitation only)
            </Checkbox>
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
            >
              {tourId ? 'Update Tour' : 'Create Tour'}
            </Button>
          </Flex>
        </VStack>
      </form>
    </Box>
  );
};

export default TourForm;