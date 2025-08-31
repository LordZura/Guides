import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Textarea,
  VStack,
  HStack,
  Text,
  Select,
  Alert,
  AlertIcon,
  Progress,
  useToast,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthProvider';
import { useBookings, BookingStatus } from '../contexts/BookingContext';

interface BookingFormProps {
  tourId: string;
  tourTitle: string;
  guideId: string;
  touristId?: string;
  pricePerPerson: number;
  maxCapacity: number;
  availableDays: boolean[];
  isOffer?: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

const timeSlots = [
  "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", 
  "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", 
  "04:00 PM", "05:00 PM", "06:00 PM"
];

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const BookingForm = ({
  tourId,
  tourTitle,
  guideId,
  touristId,
  pricePerPerson,
  maxCapacity,
  availableDays,
  isOffer = false,
  onSuccess,
  onCancel
}: BookingFormProps) => {
  const { profile } = useAuth();
  const { createBooking } = useBookings();
  const toast = useToast();

  const [partySize, setPartySize] = useState<number>(1);
  const [bookingDate, setBookingDate] = useState<string>('');
  const [preferredTime, setPreferredTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitProgress, setSubmitProgress] = useState<number>(0);

  // Calculate total price
  const totalPrice = partySize * pricePerPerson;

  // Get available days indexes that are true
  const availableDayIndexes = availableDays
    .map((isAvailable, index) => isAvailable ? index : -1)
    .filter(index => index !== -1);

  // Format date as YYYY-MM-DD for input
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get today and tomorrow dates
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = formatDateForInput(tomorrow);

  // Validate the form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!bookingDate) {
      newErrors.bookingDate = 'Please select a date';
    }

    if (!preferredTime) {
      newErrors.preferredTime = 'Please select a preferred time';
    }

    if (partySize <= 0) {
      newErrors.partySize = 'Party size must be at least 1';
    } else if (partySize > maxCapacity) {
      newErrors.partySize = `Maximum party size is ${maxCapacity}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if selected date is valid (matches available days)
  const isDateValid = (dateString: string): boolean => {
    if (!dateString) return false;
    
    const date = new Date(dateString);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ...
    const adjustedDayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to our 0 = Monday index
    
    return availableDayIndexes.includes(adjustedDayIndex);
  };

  // Handle date change and validate if it's an available day
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    setBookingDate(dateValue);
    
    if (dateValue && !isDateValid(dateValue)) {
      setErrors(prev => ({
        ...prev,
        bookingDate: `This tour is not available on this day. Available days: ${availableDayIndexes.map(i => daysOfWeek[i]).join(', ')}`
      }));
    } else {
      setErrors(prev => {
        const { bookingDate: _, ...rest } = prev;
        return rest;
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitProgress(0);

    if (!validateForm()) {
      return;
    }

    if (!profile) {
      toast({
        title: 'Authentication required',
        description: 'You must be logged in to book a tour',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const bookingData = {
        tour_id: tourId,
        tourist_id: isOffer ? touristId || '' : profile.id,
        guide_id: isOffer ? profile.id : guideId,
        status: (isOffer ? 'offered' : 'requested') as BookingStatus,
        party_size: partySize,
        booking_date: bookingDate,
        preferred_time: preferredTime,
        notes: notes || null,
        total_price: totalPrice,
      };

      // Set up progress simulation
      const progressInterval = setInterval(() => {
        setSubmitProgress(prev => {
          const newProgress = prev + 15;
          if (newProgress >= 90) {
            clearInterval(progressInterval);
            return 90; // Cap at 90% until complete
          }
          return newProgress;
        });
      }, 300);
      
      // Add a timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out. Please try again.')), 15000);
      });
      
      const bookingPromise = createBooking(bookingData);
      
      // Race between the booking creation and timeout
      const result = await Promise.race([bookingPromise, timeoutPromise]) as {
        success: boolean;
        error?: string;
        booking?: any;
      };

      clearInterval(progressInterval);
      setSubmitProgress(100);

      if (!result.success) {
        console.error('Error returned from createBooking:', result.error);
        setSubmitError(result.error || 'Failed to create booking');
        throw new Error(result.error || 'Failed to create booking');
      }

      toast({
        title: 'Booking request submitted',
        description: 'Your booking request has been sent to the guide',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onSuccess();
    } catch (err: any) {
      console.error('Error in submit handler:', err);
      setSubmitError(err.message || 'An unexpected error occurred');
      toast({
        title: 'Error creating booking',
        description: err.message || 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      <form onSubmit={handleSubmit}>
        <VStack spacing={4} align="stretch">
          <Text fontWeight="bold" fontSize="lg">{tourTitle}</Text>
          
          {isOffer && (
            <Text fontSize="sm" color="orange.600" fontStyle="italic">
              You are offering to provide this tour to the tourist who requested it.
            </Text>
          )}
          
          {availableDayIndexes.length > 0 ? (
            <Text fontSize="sm">
              Available on: {availableDayIndexes.map(i => daysOfWeek[i]).join(', ')}
            </Text>
          ) : (
            <Alert status="warning">
              <AlertIcon />
              No available days specified for this tour.
            </Alert>
          )}

          {submitError && (
            <Alert status="error">
              <AlertIcon />
              {submitError}
            </Alert>
          )}

          <FormControl isRequired isInvalid={!!errors.bookingDate}>
            <FormLabel>Date</FormLabel>
            <Input
              type="date"
              value={bookingDate}
              onChange={handleDateChange}
              min={minDate}
              bg="white"
              border="2px"
              borderColor="gray.200"
              borderRadius="md"
              px={4}
              py={3}
              fontSize="md"
              _hover={{
                borderColor: "primary.300",
                bg: "gray.50"
              }}
              _focus={{
                borderColor: "primary.500",
                boxShadow: "0 0 0 1px var(--chakra-colors-primary-500)",
                bg: "white"
              }}
              _invalid={{
                borderColor: "red.300",
                boxShadow: "0 0 0 1px var(--chakra-colors-red-300)"
              }}
              sx={{
                '::-webkit-calendar-picker-indicator': {
                  backgroundColor: 'var(--chakra-colors-primary-500)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  padding: '4px',
                  transition: 'all 0.2s'
                },
                '::-webkit-calendar-picker-indicator:hover': {
                  backgroundColor: 'var(--chakra-colors-primary-600)',
                  transform: 'scale(1.1)'
                }
              }}
            />
            <FormErrorMessage>{errors.bookingDate}</FormErrorMessage>
          </FormControl>

          <FormControl isRequired isInvalid={!!errors.preferredTime}>
            <FormLabel>Preferred Time</FormLabel>
            <Select
              placeholder="Select time"
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              bg="white"
              border="2px"
              borderColor="gray.200"
              borderRadius="md"
              px={4}
              py={3}
              fontSize="md"
              _hover={{
                borderColor: "primary.300",
                bg: "gray.50"
              }}
              _focus={{
                borderColor: "primary.500",
                boxShadow: "0 0 0 1px var(--chakra-colors-primary-500)",
                bg: "white"
              }}
              _invalid={{
                borderColor: "red.300",
                boxShadow: "0 0 0 1px var(--chakra-colors-red-300)"
              }}
            >
              {timeSlots.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </Select>
            <FormErrorMessage>{errors.preferredTime}</FormErrorMessage>
          </FormControl>

          <FormControl isRequired isInvalid={!!errors.partySize}>
            <FormLabel>Number of People</FormLabel>
            <NumberInput
              min={1}
              max={maxCapacity}
              value={partySize}
              onChange={(_, valueAsNumber) => setPartySize(valueAsNumber)}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            <FormErrorMessage>{errors.partySize}</FormErrorMessage>
          </FormControl>

          <FormControl>
            <FormLabel>Special Requests or Notes</FormLabel>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests or additional information for the guide..."
              rows={3}
            />
          </FormControl>

          <Box p={4} borderWidth="1px" borderRadius="md" bg="gray.50">
            <Text fontWeight="medium">Price Summary</Text>
            <HStack justify="space-between" mt={2}>
              <Text>${pricePerPerson} × {partySize} {partySize === 1 ? 'person' : 'people'}</Text>
              <Text>${totalPrice.toFixed(2)}</Text>
            </HStack>
            <Text fontSize="xs" color="gray.500" mt={2}>
              {isOffer 
                ? 'The tourist will be notified of your offer and can accept or decline.' 
                : 'Payment will be processed after the guide accepts your booking request.'
              }
            </Text>
          </Box>
          
          {isSubmitting && submitProgress > 0 && (
            <Box>
              <Progress 
                value={submitProgress} 
                size="xs" 
                colorScheme="green" 
                borderRadius="full"
              />
              <Text fontSize="xs" textAlign="center" mt={1}>
                {submitProgress < 100 ? 'Sending booking request...' : 'Request completed!'}
              </Text>
            </Box>
          )}

          <HStack justify="flex-end" spacing={3} pt={2}>
            <Button variant="outline" onClick={onCancel} isDisabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              colorScheme="primary"
              isLoading={isSubmitting}
              loadingText={isOffer ? "Sending Offer..." : "Submitting..."}
            >
              {isOffer ? "Send Offer" : "Submit Request"}
            </Button>
          </HStack>
        </VStack>
      </form>
    </Box>
  );
};

export default BookingForm;