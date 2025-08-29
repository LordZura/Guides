import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Text,
  VStack,
  HStack,
  Box,
  Divider,
  Alert,
  AlertIcon,
  Progress,
  useToast,
  UnorderedList,
  ListItem,
  Icon,
} from '@chakra-ui/react';
import { MdSecurity, MdSchedule } from 'react-icons/md';
import { Booking } from '../contexts/BookingContext';
import { 
  validatePaymentTiming, 
  getPaymentDeadlineMessage, 
  getCompletionDeadlineMessage 
} from '../utils/paymentUtils';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  onPaymentSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  booking,
  onPaymentSuccess
}) => {
  const toast = useToast();
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentValidation, setPaymentValidation] = useState<ReturnType<typeof validatePaymentTiming> | null>(null);

  // Current year and next 10 years for expiry date selection
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i);

  // Validate payment timing when modal opens
  useEffect(() => {
    if (isOpen) {
      const validation = validatePaymentTiming(booking.booking_date, booking.preferred_time);
      setPaymentValidation(validation);
      
      // If payment cannot be made, show error toast and close modal
      if (!validation.canPay) {
        toast({
          title: 'Payment Unavailable',
          description: validation.error,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        onClose();
        return;
      }
    }
  }, [isOpen, booking, toast, onClose]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!cardNumber.trim()) {
      newErrors.cardNumber = 'Card number is required';
    } else if (!/^\d{16}$/.test(cardNumber.replace(/\s/g, ''))) {
      newErrors.cardNumber = 'Card number must be 16 digits';
    }

    if (!cardName.trim()) {
      newErrors.cardName = 'Cardholder name is required';
    }

    if (!expiryMonth) {
      newErrors.expiryMonth = 'Expiry month is required';
    }

    if (!expiryYear) {
      newErrors.expiryYear = 'Expiry year is required';
    }

    if (!cvv.trim()) {
      newErrors.cvv = 'CVV is required';
    } else if (!/^\d{3,4}$/.test(cvv)) {
      newErrors.cvv = 'CVV must be 3 or 4 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Process payment (mock implementation)
  const handlePayment = () => {
    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    // Simulate payment processing with progress updates
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // Simulate payment completion
    setTimeout(() => {
      clearInterval(interval);
      setIsProcessing(false);
      setProgress(100);
      
      onPaymentSuccess();
      
      toast({
        title: 'Payment successful',
        description: 'Your payment has been processed successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }, 2500);
  };

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {showPaymentForm ? 'Complete Payment' : 'Payment Information'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {!showPaymentForm ? (
            // Payment explanation
            <VStack spacing={6} align="stretch">
              <Box>
                <Text fontWeight="bold" fontSize="lg" mb={2}>How Payment Works</Text>
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <Text fontSize="sm">
                    Your payment will be securely held until your tour is completed.
                  </Text>
                </Alert>
              </Box>

              <Box>
                <Text fontWeight="medium" mb={3} display="flex" alignItems="center">
                  <Icon as={MdSecurity} mr={2} color="blue.500" />
                  Payment Process:
                </Text>
                <UnorderedList spacing={2} ml={6}>
                  <ListItem>Your payment is processed immediately but held securely</ListItem>
                  <ListItem>Funds are not released to the guide until tour completion</ListItem>
                  <ListItem>You confirm tour completion, then payment is released</ListItem>
                  <ListItem>If you don't confirm, payment is automatically released after 48 hours</ListItem>
                </UnorderedList>
              </Box>

              <Box>
                <Text fontWeight="medium" mb={3} display="flex" alignItems="center">
                  <Icon as={MdSchedule} mr={2} color="orange.500" />
                  Important Deadlines:
                </Text>
                <VStack align="stretch" spacing={2}>
                  <Alert status="warning" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <Text fontSize="sm" fontWeight="medium">
                        {getPaymentDeadlineMessage(booking.booking_date, booking.preferred_time)}
                      </Text>
                    </Box>
                  </Alert>
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <Text fontSize="sm">
                        {getCompletionDeadlineMessage(booking.booking_date, booking.preferred_time)}
                      </Text>
                    </Box>
                  </Alert>
                </VStack>
              </Box>

              <Box bg="gray.50" p={4} borderRadius="md">
                <Text fontWeight="bold" mb={2}>Booking Summary:</Text>
                <Text fontWeight="medium">{booking.tour_title}</Text>
                <Text fontSize="sm">Date: {new Date(booking.booking_date).toLocaleDateString()}</Text>
                <Text fontSize="sm">Time: {booking.preferred_time || 'Not specified'}</Text>
                <Text fontSize="sm">Party size: {booking.party_size} {booking.party_size === 1 ? 'person' : 'people'}</Text>
                <Divider my={2} />
                <HStack justifyContent="space-between">
                  <Text fontWeight="medium">Total Amount:</Text>
                  <Text fontWeight="bold" fontSize="lg" color="blue.600">${booking.total_price.toFixed(2)}</Text>
                </HStack>
              </Box>

              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <Text fontSize="sm">
                  <strong>Note:</strong> This is a mock payment system for demonstration purposes. 
                  No actual payment will be processed.
                </Text>
              </Alert>
            </VStack>
          ) : (
            // Payment form
            <VStack spacing={4}>
              <Alert status="info" mb={4} borderRadius="md">
                <AlertIcon />
                <Text fontSize="sm">
                  This is a mock payment form. No real payment will be processed.
                </Text>
              </Alert>

              <FormControl isRequired isInvalid={!!errors.cardNumber}>
                <FormLabel>Card Number</FormLabel>
                <Input
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  maxLength={19}
                />
                {errors.cardNumber && <Text color="red.500" fontSize="sm">{errors.cardNumber}</Text>}
              </FormControl>

              <FormControl isRequired isInvalid={!!errors.cardName}>
                <FormLabel>Cardholder Name</FormLabel>
                <Input
                  placeholder="John Doe"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                />
                {errors.cardName && <Text color="red.500" fontSize="sm">{errors.cardName}</Text>}
              </FormControl>

              <HStack spacing={4} width="100%">
                <FormControl isRequired isInvalid={!!errors.expiryMonth || !!errors.expiryYear}>
                  <FormLabel>Expiry Date</FormLabel>
                  <HStack>
                    <Select
                      placeholder="MM"
                      value={expiryMonth}
                      onChange={(e) => setExpiryMonth(e.target.value)}
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <option key={month} value={month.toString().padStart(2, '0')}>
                          {month.toString().padStart(2, '0')}
                        </option>
                      ))}
                    </Select>
                    <Select
                      placeholder="YYYY"
                      value={expiryYear}
                      onChange={(e) => setExpiryYear(e.target.value)}
                    >
                      {years.map(year => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </Select>
                  </HStack>
                  {(errors.expiryMonth || errors.expiryYear) && (
                    <Text color="red.500" fontSize="sm">
                      {errors.expiryMonth || errors.expiryYear}
                    </Text>
                  )}
                </FormControl>

                <FormControl isRequired isInvalid={!!errors.cvv}>
                  <FormLabel>CVV</FormLabel>
                  <Input
                    placeholder="123"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    maxLength={4}
                  />
                  {errors.cvv && <Text color="red.500" fontSize="sm">{errors.cvv}</Text>}
                </FormControl>
              </HStack>

              {isProcessing && (
                <Box width="100%">
                  <Progress value={progress} colorScheme="blue" borderRadius="md" />
                  <Text textAlign="center" fontSize="sm" mt={2}>
                    Processing payment... {progress}%
                  </Text>
                </Box>
              )}
            </VStack>
          )}
        </ModalBody>

        <ModalFooter>
          {!showPaymentForm ? (
            <HStack spacing={3}>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={() => setShowPaymentForm(true)}
                disabled={!paymentValidation?.canPay}
              >
                Proceed to Payment
              </Button>
            </HStack>
          ) : (
            <HStack spacing={3}>
              <Button
                variant="outline"
                onClick={() => setShowPaymentForm(false)}
                isDisabled={isProcessing}
              >
                Back
              </Button>
              <Button
                colorScheme="blue"
                onClick={handlePayment}
                isLoading={isProcessing}
                loadingText="Processing..."
              >
                Pay ${booking.total_price.toFixed(2)}
              </Button>
            </HStack>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PaymentModal;