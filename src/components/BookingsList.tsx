import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  Stack,
  Button,
  Flex,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Skeleton,
  Alert,
  AlertIcon,
  Heading,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { useBookings, Booking, BookingStatus } from '../contexts/BookingContext';
import BookingItem from './BookingItem';
import PaymentModal from './PaymentModal';
import ReviewForm from './ReviewForm';
import { useAuth } from '../contexts/AuthProvider';

interface BookingsListProps {
  showTitle?: boolean;
}

const BookingsList: React.FC<BookingsListProps> = ({ showTitle = true }) => {
  const { 
    incomingBookings, 
    outgoingBookings, 
    isLoading, 
    error,
    updateBookingStatus, 
    refreshBookings 
  } = useBookings();
  const { profile } = useAuth();
  const toast = useToast();
  const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure();
  const { isOpen: isReviewOpen, onOpen: onReviewOpen, onClose: onReviewClose } = useDisclosure();
  
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionType, setActionType] = useState<'accept' | 'decline' | 'cancel' | 'complete' | null>(null);

  useEffect(() => {
    // Refresh bookings every 30 seconds to check for updates
    const interval = setInterval(() => {
      refreshBookings();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [refreshBookings]);

  if (!profile) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        Authentication required
      </Alert>
    );
  }

  const isGuide = profile.role === 'guide';
  const bookings = isGuide ? incomingBookings : outgoingBookings;

  // Filter bookings by status
  const pendingBookings = bookings.filter(b => b.status === 'requested');
  const upcomingBookings = bookings.filter(b => ['accepted', 'paid'].includes(b.status));
  const pastBookings = bookings.filter(b => ['completed', 'declined', 'cancelled'].includes(b.status));

  // Open confirmation modal for an action
  const openConfirmationModal = (booking: Booking, type: 'accept' | 'decline' | 'cancel' | 'complete') => {
    setSelectedBooking(booking);
    setActionType(type);
    onConfirmOpen();
  };

  // Get confirmation message based on action type
  const getConfirmationMessage = () => {
    if (!selectedBooking || !actionType) return '';
    
    switch (actionType) {
      case 'accept':
        return `Are you sure you want to accept the booking request from ${selectedBooking.tourist_name}?`;
      case 'decline':
        return `Are you sure you want to decline the booking request from ${selectedBooking.tourist_name}?`;
      case 'cancel':
        return 'Are you sure you want to cancel this booking? This action cannot be undone.';
      case 'complete':
        return 'Are you sure you want to mark this tour as completed?';
      default:
        return '';
    }
  };

  // Handle the confirmed action
  const handleConfirmedAction = async () => {
    if (!selectedBooking || !actionType) return;
    
    setIsProcessing(true);
    
    let success = false;
    let newStatus: BookingStatus;
    
    switch (actionType) {
      case 'accept':
        newStatus = 'accepted';
        success = await updateBookingStatus(selectedBooking.id, newStatus);
        if (success) {
          toast({
            title: 'Booking accepted',
            description: 'You have accepted the booking request',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        }
        break;
      
      case 'decline':
        newStatus = 'declined';
        success = await updateBookingStatus(selectedBooking.id, newStatus);
        if (success) {
          toast({
            title: 'Booking declined',
            description: 'You have declined the booking request',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        }
        break;
      
      case 'cancel':
        newStatus = 'cancelled';
        success = await updateBookingStatus(selectedBooking.id, newStatus);
        if (success) {
          toast({
            title: 'Booking cancelled',
            description: 'You have cancelled the booking',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        }
        break;
      
      case 'complete':
        newStatus = 'completed';
        success = await updateBookingStatus(selectedBooking.id, newStatus);
        if (success) {
          toast({
            title: 'Tour marked as completed',
            description: 'The tour has been marked as completed',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        }
        break;
    }
    
    setIsProcessing(false);
    onConfirmClose();
    
    if (!success) {
      toast({
        title: 'Action failed',
        description: `Failed to ${actionType} the booking. Please try again.`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handler for payment button click
  const handlePaymentClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsPaymentOpen(true);
  };

  // Handler for successful payment
  const handlePaymentSuccess = async () => {
    if (!selectedBooking) return;
    
    setIsPaymentOpen(false);
    
    // Wait a short delay to give the UI time to update
    setTimeout(async () => {
      setIsProcessing(true);
      const success = await updateBookingStatus(selectedBooking.id, 'paid');
      setIsProcessing(false);
      
      if (success) {
        toast({
          title: 'Payment successful',
          description: 'Your payment has been processed and your booking is confirmed',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Payment status update failed',
          description: 'Your payment was processed, but updating the booking status failed',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
      }
    }, 500);
  };

  // Handler for review button click
  const handleReviewClick = (booking: Booking) => {
    setSelectedBooking(booking);
    onReviewOpen();
  };

  // Handler for successful review submission
  const handleReviewSuccess = () => {
    onReviewClose();
    toast({
      title: 'Review submitted',
      description: 'Thank you for your review!',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  if (isLoading) {
    return (
      <Box>
        {showTitle && <Heading size="md" mb={4}>Bookings</Heading>}
        <Stack spacing={4}>
          {[1, 2, 3].map(i => (
            <Box key={i} p={4} borderWidth="1px" borderRadius="md" boxShadow="sm">
              <Skeleton height="20px" width="40%" mb={2} />
              <Skeleton height="16px" width="60%" mb={1} />
              <Skeleton height="16px" width="30%" mb={3} />
              <Flex justify="space-between">
                <Skeleton height="20px" width="30%" />
                <Skeleton height="30px" width="100px" />
              </Flex>
            </Box>
          ))}
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  if (bookings.length === 0) {
    return (
      <Box>
        {showTitle && <Heading size="md" mb={4}>Bookings</Heading>}
        <Box p={4} bg="gray.50" borderRadius="md" textAlign="center">
          <Text>No bookings found.</Text>
          {isGuide ? (
            <Text fontSize="sm" mt={2}>When tourists request to book your tours, they will appear here.</Text>
          ) : (
            <Text fontSize="sm" mt={2}>Book a tour to get started!</Text>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {showTitle && <Heading size="md" mb={4}>Bookings</Heading>}
      
      <Tabs colorScheme="primary" variant="enclosed">
        <TabList>
          <Tab>Pending ({pendingBookings.length})</Tab>
          <Tab>Upcoming ({upcomingBookings.length})</Tab>
          <Tab>Past ({pastBookings.length})</Tab>
        </TabList>

        <TabPanels>
          {/* Pending Bookings */}
          <TabPanel px={0}>
            {pendingBookings.length === 0 ? (
              <Box p={4} bg="gray.50" borderRadius="md" textAlign="center">
                <Text>No pending bookings.</Text>
              </Box>
            ) : (
              <Stack spacing={4}>
                {pendingBookings.map(booking => (
                  <BookingItem
                    key={booking.id}
                    booking={booking}
                    isGuide={isGuide}
                    onAccept={() => openConfirmationModal(booking, 'accept')}
                    onDecline={() => openConfirmationModal(booking, 'decline')}
                    onCancel={() => openConfirmationModal(booking, 'cancel')}
                    isProcessing={isProcessing && selectedBooking?.id === booking.id}
                  />
                ))}
              </Stack>
            )}
          </TabPanel>

          {/* Upcoming Bookings */}
          <TabPanel px={0}>
            {upcomingBookings.length === 0 ? (
              <Box p={4} bg="gray.50" borderRadius="md" textAlign="center">
                <Text>No upcoming bookings.</Text>
              </Box>
            ) : (
              <Stack spacing={4}>
                {upcomingBookings.map(booking => (
                  <BookingItem
                    key={booking.id}
                    booking={booking}
                    isGuide={isGuide}
                    onPayment={() => handlePaymentClick(booking)}
                    onComplete={() => openConfirmationModal(booking, 'complete')}
                    onCancel={() => openConfirmationModal(booking, 'cancel')}
                    isProcessing={isProcessing && selectedBooking?.id === booking.id}
                  />
                ))}
              </Stack>
            )}
          </TabPanel>

          {/* Past Bookings */}
          <TabPanel px={0}>
            {pastBookings.length === 0 ? (
              <Box p={4} bg="gray.50" borderRadius="md" textAlign="center">
                <Text>No past bookings.</Text>
              </Box>
            ) : (
              <Stack spacing={4}>
                {pastBookings.map(booking => (
                  <BookingItem
                    key={booking.id}
                    booking={booking}
                    isGuide={isGuide}
                    onReview={() => handleReviewClick(booking)}
                    isProcessing={isProcessing && selectedBooking?.id === booking.id}
                  />
                ))}
              </Stack>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Payment Modal */}
      {selectedBooking && (
        <PaymentModal
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          booking={selectedBooking}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Confirmation Modal */}
      <Modal isOpen={isConfirmOpen} onClose={onConfirmClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Action</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>{getConfirmationMessage()}</Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onConfirmClose} isDisabled={isProcessing}>
              Cancel
            </Button>
            <Button 
              colorScheme={actionType === 'accept' || actionType === 'complete' ? 'green' : 'red'} 
              onClick={handleConfirmedAction}
              isLoading={isProcessing}
            >
              Confirm
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Review Modal */}
      <Modal isOpen={isReviewOpen} onClose={onReviewClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Write a Review</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedBooking && (
              <ReviewForm
                targetId={selectedBooking.guide_id}
                targetType="guide"
                tourId={selectedBooking.tour_id}
                onSuccess={handleReviewSuccess}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default BookingsList;