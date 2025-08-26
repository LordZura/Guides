import React, { useState } from 'react';
import {
  Box,
  Text,
  Stack,
  Button,
  Badge,
  Flex,
  Divider,
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
} from '@chakra-ui/react';
import { useBookings, Booking, BookingStatus } from '../contexts/BookingContext';
import BookingItem from './BookingItem';
import PaymentModal from './PaymentModal';
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

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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

  // Handlers for various booking actions
  const handleAccept = async (booking: Booking) => {
    setIsProcessing(true);
    try {
      const success = await updateBookingStatus(booking.id, 'accepted');
      if (success) {
        toast({
          title: 'Booking accepted',
          description: 'You have accepted the booking request',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (err) {
      console.error('Error accepting booking:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async (booking: Booking) => {
    setIsProcessing(true);
    try {
      const success = await updateBookingStatus(booking.id, 'declined');
      if (success) {
        toast({
          title: 'Booking declined',
          description: 'You have declined the booking request',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (err) {
      console.error('Error declining booking:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async (booking: Booking) => {
    setIsProcessing(true);
    try {
      const success = await updateBookingStatus(booking.id, 'cancelled');
      if (success) {
        toast({
          title: 'Booking cancelled',
          description: 'You have cancelled the booking',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (err) {
      console.error('Error cancelling booking:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsPaymentOpen(true);
  };

  const handlePaymentSuccess = async () => {
    if (!selectedBooking) return;
    
    setIsPaymentOpen(false);
    
    const success = await updateBookingStatus(selectedBooking.id, 'paid');
    if (success) {
      toast({
        title: 'Payment successful',
        description: 'Your payment has been processed',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleCompleteBooking = async (booking: Booking) => {
    setIsProcessing(true);
    try {
      const success = await updateBookingStatus(booking.id, 'completed');
      if (success) {
        toast({
          title: 'Tour marked as completed',
          description: 'The tour has been marked as completed',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (err) {
      console.error('Error completing booking:', err);
    } finally {
      setIsProcessing(false);
    }
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
                    onAccept={() => handleAccept(booking)}
                    onDecline={() => handleDecline(booking)}
                    onCancel={() => handleCancel(booking)}
                    isProcessing={isProcessing}
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
                    onComplete={() => handleCompleteBooking(booking)}
                    onCancel={() => handleCancel(booking)}
                    isProcessing={isProcessing}
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
                    isProcessing={isProcessing}
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
    </Box>
  );
};

export default BookingsList;