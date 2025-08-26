import React from 'react';
import {
  Box,
  Flex,
  Text,
  Badge,
  Button,
  Avatar,
  HStack,
  VStack,
  Divider,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';
import { 
  MdAccessTime, 
  MdCalendarToday, 
  MdGroup, 
  MdLocationOn, 
  MdPayment, 
  MdCheckCircle,
  MdCancel
} from 'react-icons/md';
import { format } from 'date-fns';
import { Booking } from '../contexts/BookingContext';
import { DEFAULT_AVATAR_URL } from '../lib/supabaseClient';

interface BookingItemProps {
  booking: Booking;
  isGuide: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
  onCancel?: () => void;
  onPayment?: () => void;
  onComplete?: () => void;
  isProcessing?: boolean;
}

const BookingItem: React.FC<BookingItemProps> = ({
  booking,
  isGuide,
  onAccept,
  onDecline,
  onCancel,
  onPayment,
  onComplete,
  isProcessing = false
}) => {
  const bg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested': return 'yellow';
      case 'accepted': return 'blue';
      case 'paid': return 'green';
      case 'completed': return 'purple';
      case 'declined':
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  // Determine what actions to show based on status and role
  const showAcceptDecline = isGuide && booking.status === 'requested';
  const showCancel = !isGuide && ['requested', 'accepted'].includes(booking.status);
  const showPayment = !isGuide && booking.status === 'accepted';
  const showComplete = isGuide && booking.status === 'paid';

  return (
    <Box
      p={4}
      borderWidth="1px"
      borderRadius="md"
      borderColor={borderColor}
      bg={bg}
      boxShadow="sm"
    >
      <Flex justify="space-between" align="center" mb={3}>
        <HStack>
          <Badge colorScheme={getStatusColor(booking.status)}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </Badge>
          <Text fontWeight="medium">{booking.tour_title}</Text>
        </HStack>
        <Text fontWeight="bold">${booking.total_price.toFixed(2)}</Text>
      </Flex>

      <HStack spacing={4} mb={3}>
        <Flex align="center">
          <Icon as={MdLocationOn} color="gray.500" mr={1} />
          <Text fontSize="sm">{booking.tour_location}</Text>
        </Flex>
        <Flex align="center">
          <Icon as={MdCalendarToday} color="gray.500" mr={1} />
          <Text fontSize="sm">{formatDate(booking.booking_date)}</Text>
        </Flex>
        <Flex align="center">
          <Icon as={MdAccessTime} color="gray.500" mr={1} />
          <Text fontSize="sm">{booking.preferred_time}</Text>
        </Flex>
        <Flex align="center">
          <Icon as={MdGroup} color="gray.500" mr={1} />
          <Text fontSize="sm">{booking.party_size} {booking.party_size === 1 ? 'person' : 'people'}</Text>
        </Flex>
      </HStack>

      {booking.notes && (
        <Box bg="gray.50" p={2} borderRadius="md" mb={3}>
          <Text fontSize="sm">{booking.notes}</Text>
        </Box>
      )}

      <Divider my={3} />

      <Flex justify="space-between" align="center">
        {/* Person info (tourist or guide) */}
        <HStack>
          <Avatar
            size="sm"
            name={isGuide ? booking.tourist_name : booking.guide_name}
            src={isGuide ? booking.tourist_avatar : booking.guide_avatar || DEFAULT_AVATAR_URL}
          />
          <Text fontSize="sm">
            {isGuide ? booking.tourist_name : booking.guide_name}
          </Text>
        </HStack>

        {/* Action buttons */}
        <HStack spacing={2}>
          {showAcceptDecline && (
            <>
              <Button
                size="sm"
                colorScheme="green"
                leftIcon={<MdCheckCircle />}
                onClick={onAccept}
                isLoading={isProcessing}
              >
                Accept
              </Button>
              <Button
                size="sm"
                colorScheme="red"
                variant="outline"
                leftIcon={<MdCancel />}
                onClick={onDecline}
                isLoading={isProcessing}
              >
                Decline
              </Button>
            </>
          )}

          {showPayment && (
            <Button
              size="sm"
              colorScheme="blue"
              leftIcon={<MdPayment />}
              onClick={onPayment}
            >
              Pay Now
            </Button>
          )}

          {showComplete && (
            <Button
              size="sm"
              colorScheme="purple"
              leftIcon={<MdCheckCircle />}
              onClick={onComplete}
              isLoading={isProcessing}
            >
              Mark Completed
            </Button>
          )}

          {showCancel && (
            <Button
              size="sm"
              colorScheme="red"
              variant="outline"
              leftIcon={<MdCancel />}
              onClick={onCancel}
              isLoading={isProcessing}
            >
              Cancel
            </Button>
          )}
        </HStack>
      </Flex>
    </Box>
  );
};

export default BookingItem;