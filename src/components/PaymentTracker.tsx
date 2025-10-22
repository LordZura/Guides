import React from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  HStack,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { MdAccountBalanceWallet, MdPending, MdCheckCircle, MdTrendingUp } from 'react-icons/md';
import { usePaymentStats } from '../contexts/PaymentStatsContext';

const PaymentTracker: React.FC = () => {
  const { paymentStats, isLoading, error } = usePaymentStats();
  const cardBg = 'white';
  const statBg = 'gray.50';

  if (isLoading) {
    return (
      <Card bg={cardBg}>
        <CardBody>
          <HStack justify="center" p={8}>
            <Spinner size="lg" />
            <Text>Loading payment statistics...</Text>
          </HStack>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card bg={cardBg}>
        <CardBody>
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card bg={cardBg}>
      <CardHeader>
        <Heading size="md" display="flex" alignItems="center">
          <Icon as={MdAccountBalanceWallet} mr={2} color="green.500" />
          Payment Overview
        </Heading>
      </CardHeader>
      <CardBody>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
          <Stat bg={statBg} p={4} borderRadius="md">
            <StatLabel display="flex" alignItems="center">
              <Icon as={MdTrendingUp} mr={1} color="blue.500" />
              Total Earnings
            </StatLabel>
            <StatNumber color="blue.600">
              ${paymentStats.totalEarnings.toFixed(2)}
            </StatNumber>
            <StatHelpText>
              All time earnings
            </StatHelpText>
          </Stat>

          <Stat bg={statBg} p={4} borderRadius="md">
            <StatLabel display="flex" alignItems="center">
              <Icon as={MdPending} mr={1} color="orange.500" />
              Pending Payments
            </StatLabel>
            <StatNumber color="orange.600">
              ${paymentStats.pendingEarnings.toFixed(2)}
            </StatNumber>
            <StatHelpText>
              From {paymentStats.paidBookingsCount} paid tour{paymentStats.paidBookingsCount !== 1 ? 's' : ''}
            </StatHelpText>
          </Stat>

          <Stat bg={statBg} p={4} borderRadius="md">
            <StatLabel display="flex" alignItems="center">
              <Icon as={MdCheckCircle} mr={1} color="green.500" />
              Completed Earnings
            </StatLabel>
            <StatNumber color="green.600">
              ${(paymentStats.totalEarnings - paymentStats.pendingEarnings).toFixed(2)}
            </StatNumber>
            <StatHelpText>
              From {paymentStats.completedBookingsCount} completed tour{paymentStats.completedBookingsCount !== 1 ? 's' : ''}
            </StatHelpText>
          </Stat>

          <Stat bg={statBg} p={4} borderRadius="md">
            <StatLabel>Tour Bookings</StatLabel>
            <StatNumber>
              {paymentStats.paidBookingsCount + paymentStats.completedBookingsCount}
            </StatNumber>
            <StatHelpText>
              <Text as="span" color="orange.500">{paymentStats.paidBookingsCount} pending</Text>
              {' • '}
              <Text as="span" color="green.500">{paymentStats.completedBookingsCount} completed</Text>
            </StatHelpText>
          </Stat>
        </SimpleGrid>

        {paymentStats.paidBookingsCount > 0 && (
          <Box mt={6} p={4} bg="orange.50" borderRadius="md" borderLeft="4px solid" borderColor="orange.400">
            <Text fontSize="sm" color="orange.700">
              <strong>Note:</strong> Pending payments will be automatically released 24 hours after the tour start time 
              if tourists don't manually mark tours as completed.
            </Text>
          </Box>
        )}
      </CardBody>
    </Card>
  );
};

export default PaymentTracker;