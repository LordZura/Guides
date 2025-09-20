import { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  Text,
  Heading,
  Badge,
  Grid,
  Skeleton,
  Select,
  Flex,
  Icon,
  useColorModeValue,
  Alert,
  AlertIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { FaStar, FaUsers } from 'react-icons/fa';
import { MdLocationOn, MdAccessTime, MdAttachMoney } from 'react-icons/md';
import { useTourTemplates } from '../contexts/TourTemplateContext';
import { TourTemplateData } from '../lib/types';
import { getLocationsDisplayString } from '../utils/tourLocations';

interface TourTemplatePickerProps {
  onSelectTemplate: (_templateData: TourTemplateData) => void;
  onSkip: () => void;
}

const TourTemplatePicker = ({ onSelectTemplate, onSkip }: TourTemplatePickerProps) => {
  const {
    systemTemplates,
    userTemplates,
    isLoading,
    error,
    categories,
    selectedCategory,
    setSelectedCategory,
    useTemplate
  } = useTourTemplates();
  
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleSelectTemplate = async (templateId: string) => {
    setSelectedTemplateId(templateId);
    onOpen();
  };

  const confirmSelection = async () => {
    if (!selectedTemplateId) return;
    
    const templateData = await useTemplate(selectedTemplateId);
    if (templateData) {
      onSelectTemplate(templateData);
    }
    onClose();
  };

  const filteredTemplates = [...systemTemplates, ...userTemplates].filter(template => 
    selectedCategory === 'all' || template.category === selectedCategory
  );

  const selectedTemplate = selectedTemplateId 
    ? filteredTemplates.find(t => t.id === selectedTemplateId)
    : null;

  if (isLoading) {
    return (
      <Box p={6}>
        <Heading size="lg" mb={6}>Choose a Template</Heading>
        <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={6}>
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} height="200px" borderRadius="lg" />
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={6}>
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg" mb={2}>Choose a Template</Heading>
          <Text color="gray.600">
            Start with a pre-built template or create from scratch
          </Text>
        </Box>
        <Button variant="outline" onClick={onSkip}>
          Start from Scratch
        </Button>
      </Flex>

      {/* Category filter */}
      <HStack spacing={4} mb={6}>
        <Text fontWeight="medium">Category:</Text>
        <Select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          width="200px"
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </Select>
      </HStack>

      {/* Templates grid */}
      <Grid templateColumns="repeat(auto-fill, minmax(320px, 1fr))" gap={6}>
        {filteredTemplates.map((template) => (
          <Box
            key={template.id}
            bg={cardBg}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="lg"
            p={5}
            cursor="pointer"
            transition="all 0.2s"
            _hover={{
              borderColor: 'primary.300',
              transform: 'translateY(-2px)',
              boxShadow: 'lg'
            }}
            onClick={() => handleSelectTemplate(template.id)}
          >
            <VStack align="start" spacing={3}>
              <HStack justify="space-between" width="100%">
                <HStack spacing={2}>
                  <Icon as={FaStar} color="primary.500" />
                  <Badge
                    colorScheme={template.is_system_template ? 'green' : 'blue'}
                    variant="subtle"
                  >
                    {template.is_system_template ? 'System' : 'My Template'}
                  </Badge>
                </HStack>
                
                {template.usage_count > 0 && (
                  <HStack spacing={1}>
                    <Icon as={FaUsers} color="gray.400" boxSize="3" />
                    <Text fontSize="xs" color="gray.500">
                      {template.usage_count}
                    </Text>
                  </HStack>
                )}
              </HStack>

              <Box>
                <Heading size="md" mb={1} noOfLines={1}>
                  {template.name}
                </Heading>
                <Text fontSize="sm" color="gray.600" noOfLines={2}>
                  {template.description}
                </Text>
              </Box>

              <VStack spacing={2} align="start" width="100%">
                <HStack>
                  <Icon as={MdLocationOn} color="primary.500" boxSize="4" />
                  <Text fontSize="sm" noOfLines={1}>
                    {getLocationsDisplayString(template.template_data.locations, 30)}
                  </Text>
                </HStack>
                
                <HStack>
                  <Icon as={MdAccessTime} color="primary.500" boxSize="4" />
                  <Text fontSize="sm">
                    {template.template_data.duration} hours
                  </Text>
                </HStack>
                
                <HStack>
                  <Icon as={MdAttachMoney} color="primary.500" boxSize="4" />
                  <Text fontSize="sm">
                    ${template.template_data.price}
                  </Text>
                </HStack>
              </VStack>

              <Button
                colorScheme="primary"
                size="sm"
                width="100%"
                leftIcon={<FaStar />}
              >
                Use This Template
              </Button>
            </VStack>
          </Box>
        ))}
      </Grid>

      {filteredTemplates.length === 0 && (
        <Box textAlign="center" py={8}>
          <Text color="gray.500" mb={4}>
            No templates found in this category
          </Text>
          <Button variant="outline" onClick={() => setSelectedCategory('all')}>
            Show All Templates
          </Button>
        </Box>
      )}

      {/* Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Template Selection</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedTemplate && (
              <VStack align="start" spacing={4}>
                <Box>
                  <Heading size="md" mb={2}>
                    {selectedTemplate.name}
                  </Heading>
                  <Text color="gray.600">
                    {selectedTemplate.description}
                  </Text>
                </Box>

                <Box>
                  <Text fontWeight="medium" mb={2}>Template includes:</Text>
                  <VStack align="start" spacing={1} pl={4}>
                    <Text fontSize="sm">• Title: {selectedTemplate.template_data.title}</Text>
                    <Text fontSize="sm">• Duration: {selectedTemplate.template_data.duration} hours</Text>
                    <Text fontSize="sm">• Price: ${selectedTemplate.template_data.price}</Text>
                    <Text fontSize="sm">• Capacity: {selectedTemplate.template_data.capacity} people</Text>
                    <Text fontSize="sm">
                      • Locations: {getLocationsDisplayString(selectedTemplate.template_data.locations)}
                    </Text>
                    <Text fontSize="sm">
                      • Languages: {selectedTemplate.template_data.languages.join(', ')}
                    </Text>
                  </VStack>
                </Box>

                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <Text fontSize="sm">
                    This will pre-fill your tour form. You can edit all fields before saving.
                  </Text>
                </Alert>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="primary" onClick={confirmSelection}>
              Use Template
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default TourTemplatePicker;