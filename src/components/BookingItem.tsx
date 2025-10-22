import React from 'react';
import {
  Box,
  Flex,
  Text,
  Badge,
  Button,
  Avatar,
  HStack,
  Icon,
  Tooltip,
  Stack,
} from '@chakra-ui/react';
import { 
  MdAccessTime, 
  MdCalendarToday, 
  MdGroup, 
  MdLocationOn, 
  MdPayment, 
  MdCheckCircle,
  MdCancel,
  MdInfo,
  MdStar
} from 'react-icons/md';
import { format } from 'date-fns';
import { Booking } from '../contexts/BookingContext';
import { DEFAULT_AVATAR_URL } from '../lib/supabaseClient';

// Type for dynamic tour data
type TourData = { title: string } | string;
type LocationData = { location: string } | string;

interface BookingItemProps {
  booking: Booking;
  isGuide: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
  onCancel?: () => void;
  onPayment?: () => void;
  onComplete?: () => void;
  onReview?: () => void;
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
  onReview,
  isProcessing = false
}) => {
  const bg = 'white';
  const borderColor = 'gray.200';

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested': return 'yellow';
      case 'offered': return 'orange';
      case 'accepted': return 'blue';
      case 'paid': return 'green';
      case 'completed': return 'purple';
      case 'declined':
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  // Get status description for tooltip
  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'requested': return 'Your booking request is waiting for guide approval';
      case 'offered': return 'A guide has offered to provide your requested tour';
      case 'accepted': return 'The guide has accepted your booking. Payment is required to confirm.';
      case 'paid': return 'Your booking is confirmed and paid. Enjoy your tour!';
      case 'completed': return 'This tour has been completed.';
      case 'declined': return 'The guide has declined this booking request.';
      case 'cancelled': return 'This booking has been cancelled.';
      default: return '';
    }
  };

  // Safely display tour title and location
  const tourTitle = typeof booking.tour_title === 'object' 
    ? (booking.tour_title as TourData & { title: string })?.title || 'Unknown Tour'
    : booking.tour_title || 'Unknown Tour';
    
  const tourLocation = typeof booking.tour_location === 'object'
    ? (booking.tour_location as LocationData & { location: string })?.location || 'Unknown Location'
    : booking.tour_location || 'Unknown Location';

  // Determine what actions to show based on status and role
  const showAcceptDecline = isGuide && booking.status === 'requested';
  const showAcceptDeclineOffer = !isGuide && booking.status === 'offered'; // Tourist can accept/decline offers
  const showCancel = !isGuide && ['requested', 'accepted'].includes(booking.status);
  const showPayment = !isGuide && booking.status === 'accepted';
  const showComplete = !isGuide && booking.status === 'paid';
  const showReview = !isGuide && booking.status === 'completed';

  return (
    <Box
      p={{ base: 4, md: 6 }}
      borderWidth="1px"
      borderRadius="xl"
      borderColor={borderColor}
      bg={bg}
      boxShadow="lg"
      transition="all 0.3s ease"
      _hover={{
        boxShadow: "2xl",
        borderColor: "primary.200",
      }}
      minW={0}
      maxW="100%"
      boxSizing="border-box"
    >
      {/* Title and Status */}
      <Flex justify="space-between" align="flex-start" mb={4} minW={0}>
        <Box minW={0} flex="1">
          <Text
            fontWeight="semibold"
            fontSize={{ base: "md", md: "lg" }}
            mb={2}
            color="gray.800"
            lineHeight="1.3"
            wordBreak="break-word"
            overflowWrap="anywhere"
            whiteSpace="normal"
          >
            {tourTitle}
          </Text>
          <Tooltip label={getStatusDescription(booking.status)}>
            <Badge
              colorScheme={getStatusColor(booking.status)}
              display="inline-flex"
              alignItems="center"
              fontSize="xs"
              borderRadius="full"
              px={3}
              py={1}
            >
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              <Icon as={MdInfo} ml={1} />
            </Badge>
          </Tooltip>
        </Box>
      </Flex>

      {/* Tour Details */}
      <Stack spacing={3} mb={6}>
        <Flex align="center" minW={0}>
          <Icon as={MdLocationOn} color="primary.500" mr={3} boxSize="4" />
          <Text
            fontSize="sm"
            fontWeight="medium"
            color="gray.700"
            noOfLines={1}
            overflow="hidden"
            textOverflow="ellipsis"
          >
            {tourLocation}
          </Text>
        </Flex>
        <Flex align="center">
          <Icon as={MdCalendarToday} color="primary.500" mr={3} boxSize="4" />
          <Text fontSize="sm" fontWeight="medium" color="gray.700">
            {formatDate(booking.booking_date)}
          </Text>
        </Flex>
        <Flex align="center">
          <Icon as={MdAccessTime} color="primary.500" mr={3} boxSize="4" />
          <Text fontSize="sm" fontWeight="medium" color="gray.700">
            {booking.preferred_time}
          </Text>
        </Flex>
        <Flex align="center">
          <Icon as={MdGroup} color="primary.500" mr={3} boxSize="4" />
          <Text fontSize="sm" fontWeight="medium" color="gray.700">
            {booking.party_size} {booking.party_size === 1 ? 'person' : 'people'}
          </Text>
        </Flex>
      </Stack>

      {booking.notes && (
        <Box
          bg="gray.50"
          p={3}
          borderRadius="md"
          mb={6}
          borderLeft="3px solid"
          borderColor="primary.300"
        >
          <Text
            fontSize="sm"
            color="gray.600"
            lineHeight="1.5"
            wordBreak="break-word"
            overflowWrap="anywhere"
            whiteSpace="normal"
          >
            {booking.notes}
          </Text>
        </Box>
      )}

      {/* Footer with person info and price */}
      <Flex
        justify="space-between"
        align={{ base: "start", sm: "center" }}
        pt={4}
        borderTop="1px"
        borderColor="gray.100"
        direction={{ base: "column", sm: "row" }}
        gap={{ base: 3, sm: 0 }}
        minW={0}
        mb={4}
      >
        <HStack>
          <Avatar
            size="sm"
            name={isGuide ? booking.tourist_name : booking.guide_name}
            src={isGuide ? booking.tourist_avatar : booking.guide_avatar || DEFAULT_AVATAR_URL}
            border="2px"
            borderColor="primary.100"
          />
          <Text fontSize="sm" fontWeight="medium" color="gray.700">
            {isGuide ? booking.tourist_name : booking.guide_name}
          </Text>
        </HStack>

        <Badge
          colorScheme="purple"
          px={4}
          py={2}
          borderRadius="md"
          fontWeight="semibold"
          fontSize={{ base: "sm", md: "md" }}
        >
          ${booking.total_price.toFixed(2)}
        </Badge>
      </Flex>

      {/* Action buttons */}
      <Flex
        gap={2}
        flexWrap="wrap"
        justify={{ base: "stretch", sm: "flex-start" }}
        direction={{ base: "column", sm: "row" }}
      >
        {showAcceptDecline && (
          <>
            <Button
              size="sm"
              colorScheme="green"
              leftIcon={<MdCheckCircle />}
              onClick={onAccept}
              isLoading={isProcessing}
              borderRadius="full"
              px={6}
              minH="44px"
              flex={{ base: "1", sm: "0 0 auto" }}
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
              borderRadius="full"
              px={6}
              minH="44px"
              flex={{ base: "1", sm: "0 0 auto" }}
            >
              Decline
            </Button>
          </>
        )}

        {showAcceptDeclineOffer && (
          <>
            <Button
              size="sm"
              colorScheme="green"
              leftIcon={<MdCheckCircle />}
              onClick={onAccept}
              isLoading={isProcessing}
              borderRadius="full"
              px={6}
              minH="44px"
              flex={{ base: "1", sm: "0 0 auto" }}
            >
              Accept Offer
            </Button>
            <Button
              size="sm"
              colorScheme="red"
              variant="outline"
              leftIcon={<MdCancel />}
              onClick={onDecline}
              isLoading={isProcessing}
              borderRadius="full"
              px={6}
              minH="44px"
              flex={{ base: "1", sm: "0 0 auto" }}
            >
              Decline Offer
            </Button>
          </>
        )}

        {showPayment && (
          <Button
            size="sm"
            colorScheme="blue"
            leftIcon={<MdPayment />}
            onClick={onPayment}
            borderRadius="full"
            px={6}
            minH="44px"
            flex={{ base: "1", sm: "0 0 auto" }}
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
            borderRadius="full"
            px={6}
            minH="44px"
            flex={{ base: "1", sm: "0 0 auto" }}
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
            borderRadius="full"
            px={6}
            minH="44px"
            flex={{ base: "1", sm: "0 0 auto" }}
          >
            Cancel
          </Button>
        )}

        {showReview && (
          <Button
            size="sm"
            colorScheme="yellow"
            leftIcon={<MdStar />}
            onClick={onReview}
            borderRadius="full"
            px={6}
            minH="44px"
            flex={{ base: "1", sm: "0 0 auto" }}
          >
            Write Review
          </Button>
        )}
      </Flex>
    </Box>
  );
};

export default BookingItem;