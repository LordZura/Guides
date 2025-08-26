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

  // Current year and next 10 years for expiry date selection
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i);

  // Process payment (mock implementation)
  const handlePayment = () => {
    // Basic validation
    if (!cardNumber || !cardName || !expiryMonth || !expiryYear || !cvv) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all payment details',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      onPaymentSuccess();
      
      toast({
        title: 'Payment successful',
        description: 'Your payment has been processed successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }, 1500);
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
            <FormControl isRequired>
              <FormLabel>Card Number</FormLabel>
              <Input
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                maxLength={16}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Cardholder Name</FormLabel>
              <Input
                placeholder="John Doe"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
              />
            </FormControl>

            <HStack spacing={4} width="100%">
              <FormControl isRequired>
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
              </FormControl>

              <FormControl isRequired>
                <FormLabel>CVV</FormLabel>
                <Input
                  placeholder="123"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  maxLength={3}
                  type="password"
                />
              </FormControl>
            </HStack>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button 
            colorScheme="primary" 
            onClick={handlePayment}
            isLoading={isProcessing}
          >
            Pay ${booking.total_price.toFixed(2)}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PaymentModal;