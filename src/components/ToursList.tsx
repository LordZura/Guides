import { useState } from 'react';
import {
  Box,
  Heading,
  Text,
  Stack,
  Badge,
  Button,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Skeleton,
  useToast,
  Card,
  CardBody,
  CardHeader,
  HStack,
} from '@chakra-ui/react';
import { 
  DeleteIcon, 
  EditIcon, 
  ViewIcon, 
  ChevronDownIcon, 
  CheckIcon, 
  WarningIcon 
} from '@chakra-ui/icons';
import { useTours, Tour } from '../contexts/ToursContext';
import { useAuth } from '../contexts/AuthProvider';
import TourForm from './TourForm';

const ToursList = () => {
  const { tours, isLoading, error, refreshTours, deleteTour, updateTourStatus } = useTours();
  const { profile } = useAuth();
  const toast = useToast();
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const { 
    isOpen: isDeleteOpen, 
    onOpen: onDeleteOpen, 
    onClose: onDeleteClose 
  } = useDisclosure();
  const { 
    isOpen: isEditOpen, 
    onOpen: onEditOpen, 
    onClose: onEditClose 
  } = useDisclosure();

  const handleEditClick = (tour: Tour) => {
    setSelectedTour(tour);
    onEditOpen();
  };

  const handleDeleteClick = (tour: Tour) => {
    setSelectedTour(tour);
    onDeleteOpen();
  };

  const handleStatusToggle = async (tour: Tour) => {
    await updateTourStatus(tour.id, !tour.is_active);
  };

  const confirmDelete = async () => {
    if (selectedTour) {
      await deleteTour(selectedTour.id);
      onDeleteClose();
    }
  };

  const handleEditSuccess = () => {
    onEditClose();
    refreshTours();
  };

  if (isLoading) {
    return (
      <Stack spacing={4}>
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardBody>
              <Skeleton height="24px" width="50%" mb={2} />
              <Skeleton height="16px" width="100%" mb={1} />
              <Skeleton height="16px" width="90%" mb={1} />
              <Skeleton height="16px" width="60%" mb={2} />
              <Flex justify="space-between">
                <Skeleton height="20px" width="100px" />
                <Skeleton height="32px" width="80px" />
              </Flex>
            </CardBody>
          </Card>
        ))}
      </Stack>
    );
  }

  if (error) {
    return (
      <Box p={4} bg="red.50" borderRadius="md">
        <Text color="red.500">{error}</Text>
        <Button mt={4} onClick={refreshTours} size="sm">
          Try Again
        </Button>
      </Box>
    );
  }

  if (tours.length === 0) {
    return (
      <Box p={8} textAlign="center" bg="gray.50" borderRadius="md">
        <Text mb={4}>You haven't created any {profile?.role === 'guide' ? 'tours' : 'tour requests'} yet.</Text>
        <Text mb={4}>Click the "{profile?.role === 'guide' ? 'Create Tour' : 'Post Tour Request'}" button above to get started.</Text>
      </Box>
    );
  }

  return (
    <Stack spacing={4}>
      {tours.map(tour => (
        <Card key={tour.id} variant="outline" borderColor={tour.is_active ? 'green.200' : 'gray.200'}>
          <CardHeader pb={0}>
            <Flex justify="space-between" align="flex-start">
              <Heading as="h3" size="md">{tour.title}</Heading>
              <Menu>
                <MenuButton
                  as={IconButton}
                  icon={<ChevronDownIcon />}
                  variant="ghost"
                  size="sm"
                  aria-label="Actions"
                />
                <MenuList>
                  <MenuItem icon={<ViewIcon />} onClick={() => toast({ 
                    title: "View details", 
                    description: "This feature will be available soon",
                    status: "info",
                    duration: 3000
                  })}>
                    View Details
                  </MenuItem>
                  <MenuItem icon={<EditIcon />} onClick={() => handleEditClick(tour)}>
                    Edit
                  </MenuItem>
                  <MenuItem icon={tour.is_active ? <WarningIcon /> : <CheckIcon />} onClick={() => handleStatusToggle(tour)}>
                    {tour.is_active ? 'Deactivate' : 'Activate'}
                  </MenuItem>
                  <MenuItem icon={<DeleteIcon />} color="red.500" onClick={() => handleDeleteClick(tour)}>
                    Delete
                  </MenuItem>
                </MenuList>
              </Menu>
            </Flex>
          </CardHeader>
          
          <CardBody>
            <HStack mb={2} wrap="wrap">
              <Badge colorScheme={tour.is_active ? 'green' : 'gray'}>
                {tour.is_active ? 'Active' : 'Inactive'}
              </Badge>
              <Badge colorScheme="blue">{tour.location}</Badge>
              <Badge colorScheme="purple">${tour.price}</Badge>
              <Badge colorScheme="orange">{tour.duration}h</Badge>
            </HStack>
            
            <Text noOfLines={2} mb={2}>{tour.description}</Text>
            
            <Text fontSize="sm" color="gray.500">
              Created: {new Date(tour.created_at).toLocaleDateString()}
            </Text>
          </CardBody>
        </Card>
      ))}

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Delete Tour</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Are you sure you want to delete "{selectedTour?.title}"?</Text>
            <Text mt={2} color="red.500" fontWeight="bold">This action cannot be undone.</Text>
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

      {/* Edit Tour Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody pt={10} pb={6}>
            {selectedTour && (
              <TourForm 
                tourId={selectedTour.id} 
                onSuccess={handleEditSuccess} 
                onCancel={onEditClose} 
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Stack>
  );
};

export default ToursList;