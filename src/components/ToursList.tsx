import React, { useState } from 'react';
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
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Skeleton,
  useToast,
  Card,
  CardBody,
  CardHeader,
  Wrap,
  WrapItem,
  Spacer,
} from '@chakra-ui/react';
import {
  DeleteIcon,
  EditIcon,
  ViewIcon,
  ChevronDownIcon,
  CheckIcon,
  WarningIcon,
} from '@chakra-ui/icons';
import { useTours, Tour } from '../contexts/ToursContext';
import { useAuth } from '../contexts/AuthProvider';
import TourForm from './TourForm';
import TourDetailsModal from './TourDetailsModal';

/**
 * ToursList (updated)
 * - Title wraps to multiple lines (no single-line collision with price)
 * - Price moved to bottom-right (footer)
 * - Badges use Wrap/WrapItem so they flow to next line on small screens
 * - Defensive layout: minW={0}, maxW="100%", wordBreak/overflowWrap applied
 */

const ToursList: React.FC = () => {
  const { tours, isLoading, error, refreshTours, deleteTour, updateTourStatus } = useTours();
  const { profile } = useAuth();
  const toast = useToast();
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);

  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();

  const {
    isOpen: isDetailsOpen,
    onOpen: onDetailsOpen,
    onClose: onDetailsClose,
  } = useDisclosure();

  const handleViewDetailsClick = (tour: Tour) => {
    setSelectedTour(tour);
    onDetailsOpen();
  };

  const handleEditClick = (tour: Tour) => {
    setSelectedTour(tour);
    onEditOpen();
  };

  const handleDeleteClick = (tour: Tour) => {
    setSelectedTour(tour);
    onDeleteOpen();
  };

  const handleStatusToggle = async (tour: Tour) => {
    try {
      await updateTourStatus(tour.id, !tour.is_active);
    } catch {
      toast({ title: 'Status update failed', status: 'error' });
    }
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
          <Card key={i} w="100%" maxW="100%" minW={0}>
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

  if (!tours || tours.length === 0) {
    return (
      <Box p={8} textAlign="center" bg="gray.50" borderRadius="md">
        <Text mb={4}>You haven't created any {profile?.role === 'guide' ? 'tours' : 'tour requests'} yet.</Text>
        <Text mb={4}>Click the "{profile?.role === 'guide' ? 'Create Tour' : 'Post Tour Request'}" button above to get started.</Text>
      </Box>
    );
  }

  return (
    <Stack spacing={4} minW={0}>
      {tours.map(tour => {
        const formattedPrice = tour.price === undefined || tour.price === null ? '' : (typeof tour.price === 'number' ? `$${tour.price}` : String(tour.price));

        return (
          <Card
            key={tour.id}
            variant="outline"
            borderColor={tour.is_active ? 'green.200' : 'gray.200'}
            w="100%"
            maxW="100%"
            minW={0}
            boxSizing="border-box"
          >
            <CardHeader pb={0} px={{ base: 3, md: 4 }}>
              <Flex align="flex-start" minW={0} w="100%">
                <Box minW={0} flex="1 1 auto">
                  <Heading
                    as="h3"
                    size="md"
                    // allow multi-line wrapping
                    wordBreak="break-word"
                    overflowWrap="anywhere"
                    whiteSpace="normal"
                    lineHeight="1.15"
                  >
                    {tour.title}
                  </Heading>
                </Box>

                <Menu>
                  <MenuButton
                    as={IconButton}
                    icon={<ChevronDownIcon />}
                    variant="ghost"
                    size="sm"
                    aria-label="Actions"
                    ml={3}
                  />
                  <MenuList>
                    <MenuItem
                      icon={<ViewIcon />}
                      onClick={() => handleViewDetailsClick(tour)}
                    >
                      View Details
                    </MenuItem>
                    <MenuItem icon={<EditIcon />} onClick={() => handleEditClick(tour)}>
                      Edit
                    </MenuItem>
                    <MenuItem
                      icon={tour.is_active ? <WarningIcon /> : <CheckIcon />}
                      onClick={() => handleStatusToggle(tour)}
                    >
                      {tour.is_active ? 'Deactivate' : 'Activate'}
                    </MenuItem>
                    <MenuItem icon={<DeleteIcon />} color="red.500" onClick={() => handleDeleteClick(tour)}>
                      Delete
                    </MenuItem>
                  </MenuList>
                </Menu>
              </Flex>
            </CardHeader>

            <CardBody px={{ base: 3, md: 4 }} py={3} minW={0}>
              {/* Badges / meta row - use Wrap so badges can flow */}
              <Wrap spacing={2} mb={3} align="center" shouldWrapChildren>
                <WrapItem>
                  <Badge colorScheme={tour.is_active ? 'green' : 'gray'}>{tour.is_active ? 'Active' : 'Inactive'}</Badge>
                </WrapItem>
                {tour.location && (
                  <WrapItem>
                    <Badge colorScheme="blue">{tour.location}</Badge>
                  </WrapItem>
                )}
                {typeof tour.price !== 'undefined' && (
                  <WrapItem display={{ base: 'none', md: 'inline-block' }}>
                    {/* keep a small price badge visible on md+ near top if you like; mobile will show bottom price */}
                    <Badge colorScheme="purple">${tour.price}</Badge>
                  </WrapItem>
                )}
                {tour.duration && (
                  <WrapItem>
                    <Badge colorScheme="orange">{tour.duration}h</Badge>
                  </WrapItem>
                )}
              </Wrap>

              {/* Description - allow it to wrap naturally (paragraph-like) */}
              <Text mb={2} wordBreak="break-word" overflowWrap="anywhere" whiteSpace="normal" color="gray.700">
                {tour.description}
              </Text>

              {/* Footer: created date left, price bottom-right */}
              <Flex mt={4} align="center" minW={0}>
                <Box>
                  <Text fontSize="sm" color="gray.500">
                    Created: {new Date(tour.created_at).toLocaleDateString()}
                  </Text>
                </Box>

                <Spacer />

                {/* Price is bottom-right */}
                <Box textAlign="right" minW={0}>
                  {formattedPrice ? (
                    <Badge colorScheme="purple" px={3} py={1} borderRadius="md" fontWeight="semibold" fontSize={{ base: 'sm', md: 'md' }}>
                      {formattedPrice}
                    </Badge>
                  ) : null}
                </Box>
              </Flex>
            </CardBody>
          </Card>
        );
      })}

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody p={5}>
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

      {/* Tour Details Modal */}
      {selectedTour && (
        <TourDetailsModal
          isOpen={isDetailsOpen}
          onClose={onDetailsClose}
          tourId={selectedTour.id}
        />
      )}
    </Stack>
  );
};

export default ToursList;
