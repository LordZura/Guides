import { useState } from 'react';
import {
  Box,
  Text,
  Stack,
  Heading,
  Badge,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useToast,
  Flex,
  Icon,
  Divider,
  Link,
} from '@chakra-ui/react';
import { ChevronDownIcon, DeleteIcon, EditIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { MdLocationOn, MdAttachMoney, MdDateRange, MdLanguage } from 'react-icons/md';
import { Link as RouterLink } from 'react-router-dom';
import { TourWithLanguages, useTours } from '../contexts/ToursContext';
import TourForm from './TourForm';

const getDayName = (dayNum: number) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayNum];
};

const ToursList = () => {
  const { userTours, isLoading, error, deleteTour, refreshTours } = useTours();
  const [selectedTour, setSelectedTour] = useState<TourWithLanguages | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const toast = useToast();

  const handleEditClick = (tour: TourWithLanguages) => {
    setSelectedTour(tour);
    onEditOpen();
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    onDeleteOpen();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    
    try {
      const result = await deleteTour(deleteId);
      
      if (result.success) {
        toast({
          title: 'Tour deleted',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: 'Error deleting tour',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      onDeleteClose();
      setDeleteId(null);
    }
  };

  const handleEditSuccess = () => {
    onEditClose();
    setSelectedTour(null);
    refreshTours();
  };

  if (isLoading) {
    return (
      <Box p={4} textAlign="center">
        <Text>Loading your tours...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4} bg="red.50" borderRadius="md">
        <Text color="red.500">Error loading tours: {error}</Text>
      </Box>
    );
  }

  if (userTours.length === 0) {
    return (
      <Box p={6} textAlign="center" bg="gray.50" borderRadius="md">
        <Text mb={4}>You haven't created any tours yet.</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Stack spacing={4}>
        {userTours.map(tour => (
          <Box 
            key={tour.id} 
            p={4} 
            borderWidth="1px" 
            borderRadius="lg" 
            bg="white"
            boxShadow="sm"
            _hover={{ boxShadow: 'md' }}
          >
            <Flex justify="space-between" mb={2}>
              <Heading as="h3" size="md" noOfLines={1}>
                {tour.title}
              </Heading>
              
              <Menu>
                <MenuButton 
                  as={IconButton}
                  aria-label="Options"
                  icon={<ChevronDownIcon />}
                  variant="ghost"
                  size="sm"
                />
                <MenuList>
                  <MenuItem icon={<EditIcon />} onClick={() => handleEditClick(tour)}>
                    Edit
                  </MenuItem>
                  <MenuItem icon={<DeleteIcon />} onClick={() => handleDeleteClick(tour.id)}>
                    Delete
                  </MenuItem>
                  <MenuItem icon={<ExternalLinkIcon />} as={RouterLink} to={`/tours/${tour.id}`}>
                    View Details
                  </MenuItem>
                </MenuList>
              </Menu>
            </Flex>
            
            <Text color="gray.600" noOfLines={2} mb={3}>
              {tour.description}
            </Text>
            
            <Divider mb={3} />
            
            <Stack spacing={2}>
              <HStack>
                <Icon as={MdLocationOn} color="primary.500" />
                <Text fontSize="sm" color="gray.700">{tour.location}</Text>
              </HStack>
              
              <HStack>
                <Icon as={MdAttachMoney} color="primary.500" />
                <Text fontSize="sm" color="gray.700">${tour.average_price} average</Text>
                {tour.capacity && (
                  <Badge ml={2} colorScheme="green">Capacity: {tour.capacity}</Badge>
                )}
              </HStack>
              
              {tour.available_days && tour.available_days.length > 0 && (
                <HStack alignItems="flex-start">
                  <Icon as={MdDateRange} color="primary.500" mt={1} />
                  <Box>
                    <Text fontSize="sm" color="gray.700" fontWeight="medium">Available on:</Text>
                    <HStack flexWrap="wrap" mt={1}>
                      {tour.available_days.map((day, index) => (
                        <Badge key={index} colorScheme="primary" variant="outline" fontSize="xs">
                          {getDayName(day)}
                        </Badge>
                      ))}
                    </HStack>
                  </Box>
                </HStack>
              )}
              
              {tour.languages && tour.languages.length > 0 && (
                <HStack alignItems="flex-start">
                  <Icon as={MdLanguage} color="primary.500" mt={1} />
                  <Box>
                    <Text fontSize="sm" color="gray.700" fontWeight="medium">Languages:</Text>
                    <HStack flexWrap="wrap" mt={1}>
                      {tour.languages.map((lang, index) => (
                        <Badge key={index} colorScheme="primary" variant="solid" fontSize="xs">
                          {lang}
                        </Badge>
                      ))}
                    </HStack>
                  </Box>
                </HStack>
              )}
            </Stack>
          </Box>
        ))}
      </Stack>
      
      {/* Edit Tour Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody pt={10} pb={6}>
            {selectedTour && (
              <TourForm 
                tour={selectedTour} 
                onSuccess={handleEditSuccess} 
                onCancel={onEditClose} 
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Deletion</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            Are you sure you want to delete this tour? This action cannot be undone.
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onDeleteClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={confirmDelete}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ToursList;