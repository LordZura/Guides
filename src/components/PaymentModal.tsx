import React, { useState } from 'react';
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
} from '@chakra-ui/react';
import { Booking } from '../contexts/BookingContext';

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

  // Current year and next 10 years for expiry date selection
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i);

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
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Complete Payment</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Alert status="info" mb={4} borderRadius="md">
            <AlertIcon />
            <Text fontSize="sm">
              This is a mock payment form. No real payment will be processed.
            </Text>
          </Alert>

          <Box mb={4}>
            <Text fontWeight="bold">{booking.tour_title}</Text>
            <Text fontSize="sm">Date: {new Date(booking.booking_date).toLocaleDateString()}</Text>
            <Text fontSize="sm">Time: {booking.preferred_time}</Text>
            <Text fontSize="sm">Party size: {booking.party_size} {booking.party_size === 1 ? 'person' : 'people'}</Text>
            
            <Divider my={3} />
            
            <HStack justifyContent="space-between">
              <Text>Total</Text>
              <Text fontWeight="bold">${booking.total_price.toFixed(2)}</Text>
            </HStack>
          </Box>

          <VStack spacing={4}>
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
                  <Text color="red.500" fontSize="sm">Expiry date is required</Text>
                )}
              </FormControl>

              <FormControl isRequired isInvalid={!!errors.cvv}>
                <FormLabel>CVV</FormLabel>
                <Input
                  placeholder="123"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  maxLength={4}
                  type="password"
                />
                {errors.cvv && <Text color="red.500" fontSize="sm">{errors.cvv}</Text>}
              </FormControl>
            </HStack>
            
            {isProcessing && (
              <Box width="100%" mt={2}>
                <Progress value={progress} size="sm" colorScheme="primary" borderRadius="full" />
                <Text fontSize="xs" textAlign="center" mt={1}>
                  Processing payment...
                </Text>
              </Box>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" mr={3} onClick={onClose} isDisabled={isProcessing}>
            Cancel
          </Button>
          <Button 
            colorScheme="primary" 
            onClick={handlePayment}
            isLoading={isProcessing}
            loadingText="Processing..."
          >
            Pay ${booking.total_price.toFixed(2)}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PaymentModal;