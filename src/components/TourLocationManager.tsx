import { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Input,
  Textarea,
  Button,
  IconButton,
  Text,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Badge,
  useToast
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, DragHandleIcon } from '@chakra-ui/icons';
import { TourLocation } from '../lib/types';
import { 
  createTourLocation, 
  validateLocations, 
  sortLocationsByOrder,
  getLocationsDisplayString 
} from '../utils/tourLocations';

interface TourLocationManagerProps {
  locations: TourLocation[];
  onChange: (locations: TourLocation[]) => void;
  error?: string;
}

const TourLocationManager = ({ locations, onChange, error }: TourLocationManagerProps) => {
  const [editingLocation, setEditingLocation] = useState<string | null>(null);
  const toast = useToast();

  const sortedLocations = sortLocationsByOrder(locations);

  const addLocation = () => {
    const newLocation = createTourLocation('', '', sortedLocations.length + 1);
    onChange([...locations, newLocation]);
    setEditingLocation(newLocation.id);
  };

  const updateLocation = (id: string, field: keyof TourLocation, value: string | number) => {
    const updatedLocations = locations.map(loc => 
      loc.id === id ? { ...loc, [field]: value } : loc
    );
    onChange(updatedLocations);
  };

  const removeLocation = (id: string) => {
    if (locations.length <= 1) {
      toast({
        title: 'Cannot remove location',
        description: 'Tours must have at least one location',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const updatedLocations = locations
      .filter(loc => loc.id !== id)
      .map((loc, index) => ({ ...loc, order: index + 1 })); // Reorder after removal
    
    onChange(updatedLocations);
  };

  const moveLocation = (id: string, direction: 'up' | 'down') => {
    const currentIndex = sortedLocations.findIndex(loc => loc.id === id);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= sortedLocations.length) return;

    const reorderedLocations = [...sortedLocations];
    [reorderedLocations[currentIndex], reorderedLocations[newIndex]] = 
    [reorderedLocations[newIndex], reorderedLocations[currentIndex]];

    // Update orders
    const updatedLocations = reorderedLocations.map((loc, index) => ({
      ...loc,
      order: index + 1
    }));

    onChange(updatedLocations);
  };

  const { errors } = validateLocations(locations);

  return (
    <FormControl isInvalid={!!error || errors.length > 0}>
      <FormLabel>Tour Locations</FormLabel>
      <Text fontSize="sm" color="gray.600" mb={3}>
        Add multiple stops for your tour. Tourists will be guided through locations in the order shown.
      </Text>

      <VStack spacing={4} align="stretch">
        {sortedLocations.map((location, index) => (
          <Box 
            key={location.id}
            p={4} 
            border="1px solid" 
            borderColor="gray.200" 
            borderRadius="md"
            bg={editingLocation === location.id ? 'blue.50' : 'white'}
          >
            <HStack align="start" spacing={3}>
              <Badge colorScheme="blue" variant="solid" minW="24px" textAlign="center">
                {index + 1}
              </Badge>
              
              <VStack spacing={3} flex="1" align="stretch">
                <Input
                  placeholder="Location name (e.g., Mestia, Ushguli)"
                  value={location.name}
                  onChange={(e) => updateLocation(location.id, 'name', e.target.value)}
                  onFocus={() => setEditingLocation(location.id)}
                  onBlur={() => setEditingLocation(null)}
                  bg="white"
                />
                
                <Textarea
                  placeholder="Notes about this location (optional)"
                  value={location.notes || ''}
                  onChange={(e) => updateLocation(location.id, 'notes', e.target.value)}
                  onFocus={() => setEditingLocation(location.id)}
                  onBlur={() => setEditingLocation(null)}
                  rows={2}
                  bg="white"
                />
              </VStack>
              
              <VStack spacing={2}>
                <IconButton
                  aria-label="Move up"
                  icon={<DragHandleIcon />}
                  size="sm"
                  variant="ghost"
                  onClick={() => moveLocation(location.id, 'up')}
                  isDisabled={index === 0}
                />
                
                <IconButton
                  aria-label="Move down"
                  icon={<DragHandleIcon />}
                  size="sm"
                  variant="ghost"
                  onClick={() => moveLocation(location.id, 'down')}
                  isDisabled={index === sortedLocations.length - 1}
                  transform="rotate(180deg)"
                />
                
                <IconButton
                  aria-label="Remove location"
                  icon={<DeleteIcon />}
                  size="sm"
                  colorScheme="red"
                  variant="ghost"
                  onClick={() => removeLocation(location.id)}
                  isDisabled={locations.length <= 1}
                />
              </VStack>
            </HStack>
          </Box>
        ))}
        
        <Button
          leftIcon={<AddIcon />}
          onClick={addLocation}
          variant="outline"
          colorScheme="blue"
          size="sm"
        >
          Add Location
        </Button>
        
        {/* Preview */}
        {locations.length > 0 && (
          <Box p={3} bg="gray.50" borderRadius="md">
            <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
              Route Preview:
            </Text>
            <Text fontSize="sm" color="gray.600">
              {getLocationsDisplayString(locations, 100)}
            </Text>
          </Box>
        )}
      </VStack>
      
      {(error || errors.length > 0) && (
        <FormErrorMessage>
          {error || errors.join(', ')}
        </FormErrorMessage>
      )}
    </FormControl>
  );
};

export default TourLocationManager;