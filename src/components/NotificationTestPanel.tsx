import { useState } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Badge,
  Select,
  Heading,
  Divider,
  Alert,
  AlertIcon,
  useToast,
} from '@chakra-ui/react';
import { BellIcon } from '@chakra-ui/icons';
import { createMockNotification, createTestNotifications, testNotificationCreation } from '../utils/notificationTest';
import NotificationsList from './NotificationsList';
import { Notification } from '../contexts/NotificationContext';

const NotificationTestPanel = () => {
  const [testNotifications, setTestNotifications] = useState<Notification[]>([]);
  const [selectedType, setSelectedType] = useState<string>('booking_created');
  const toast = useToast();

  const notificationTypes = [
    'booking_created',
    'booking_paid', 
    'tour_rated',
    'tour_updated',
    'tour_cancelled'
  ];

  const addTestNotification = () => {
    const newNotification = createMockNotification(selectedType);
    setTestNotifications(prev => [newNotification, ...prev]);
    
    toast({
      title: 'Test Notification Added',
      description: `Added ${selectedType} notification`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const loadSampleData = () => {
    const sampleNotifications = createTestNotifications();
    setTestNotifications(sampleNotifications);
    
    toast({
      title: 'Sample Data Loaded',
      description: `Loaded ${sampleNotifications.length} sample notifications`,
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  const clearNotifications = () => {
    setTestNotifications([]);
    toast({
      title: 'Notifications Cleared',
      status: 'warning',
      duration: 2000,
      isClosable: true,
    });
  };

  const runConsoleTest = () => {
    testNotificationCreation();
    toast({
      title: 'Console Test Complete',
      description: 'Check browser console for test results',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const markAsRead = (notificationId: string) => {
    setTestNotifications(prev =>
      prev.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      )
    );
  };

  const markAllAsRead = async () => {
    setTestNotifications(prev =>
      prev.map(n => ({ ...n, is_read: true }))
    );
    return true;
  };

  const unreadCount = testNotifications.filter(n => !n.is_read).length;

  return (
    <Box p={6} maxW="800px" mx="auto">
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="lg" mb={2}>
            <HStack>
              <BellIcon />
              <Text>Notification System Test Panel</Text>
            </HStack>
          </Heading>
          <Text color="gray.600">
            Test notification functionality without requiring external database connections.
          </Text>
        </Box>

        <Alert status="info">
          <AlertIcon />
          This panel demonstrates notifications working locally to verify the UI and logic are correct.
        </Alert>

        <Box p={4} borderWidth="1px" borderRadius="md">
          <Heading size="md" mb={4}>Test Controls</Heading>
          <VStack spacing={4} align="stretch">
            <HStack>
              <Select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} flex="1">
                {notificationTypes.map(type => (
                  <option key={type} value={type}>
                    {type.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </Select>
              <Button onClick={addTestNotification} colorScheme="blue">
                Add Test Notification
              </Button>
            </HStack>
            
            <HStack>
              <Button onClick={loadSampleData} variant="outline">
                Load Sample Data
              </Button>
              <Button onClick={runConsoleTest} variant="outline">
                Run Console Test
              </Button>
              <Button onClick={clearNotifications} variant="outline" colorScheme="red">
                Clear All
              </Button>
            </HStack>
          </VStack>
        </Box>

        <Box>
          <HStack justify="space-between" align="center" mb={4}>
            <Heading size="md">
              Notifications
              {unreadCount > 0 && (
                <Badge ml={2} colorScheme="red" variant="solid">
                  {unreadCount} unread
                </Badge>
              )}
            </Heading>
            <Text fontSize="sm" color="gray.500">
              Total: {testNotifications.length}
            </Text>
          </HStack>
          
          <Divider mb={4} />
          
          {testNotifications.length === 0 ? (
            <Box p={8} textAlign="center" color="gray.500">
              <BellIcon boxSize={8} mb={3} />
              <Text>No test notifications yet</Text>
              <Text fontSize="sm">Use the controls above to add some test data</Text>
            </Box>
          ) : (
            <Box>
              {/* Mock the notification context for testing */}
              <TestNotificationDisplay 
                notifications={testNotifications}
                unreadCount={unreadCount}
                markAsRead={markAsRead}
                markAllAsRead={markAllAsRead}
              />
            </Box>
          )}
        </Box>
      </VStack>
    </Box>
  );
};

// Component to display notifications using the actual NotificationsList logic
const TestNotificationDisplay = ({ 
  notifications, 
  unreadCount, 
  markAsRead, 
  markAllAsRead 
}: {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => Promise<boolean>;
}) => {
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);

  const handleMarkAllAsRead = async () => {
    setIsMarkingAllRead(true);
    await markAllAsRead();
    setIsMarkingAllRead(false);
  };

  return (
    <VStack spacing={4} align="stretch">
      {/* Mimic the NotificationsList header */}
      {unreadCount > 0 && (
        <HStack justify="space-between" align="center">
          <Text fontSize="sm" color="gray.600">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </Text>
          <Button
            size="sm"
            variant="ghost"
            colorScheme="blue"
            onClick={handleMarkAllAsRead}
            isLoading={isMarkingAllRead}
          >
            Mark all read
          </Button>
        </HStack>
      )}

      {unreadCount > 0 && <Divider />}

      {/* Display notifications */}
      <VStack spacing={3} align="stretch">
        {notifications.map((notification) => (
          <TestNotificationItem
            key={notification.id}
            notification={notification}
            onMarkAsRead={markAsRead}
          />
        ))}
      </VStack>
    </VStack>
  );
};

// Individual notification item component 
const TestNotificationItem = ({ 
  notification, 
  onMarkAsRead 
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}) => {
  const bgColor = notification.is_read ? 'gray.50' : 'blue.50';
  const borderColor = notification.is_read ? 'gray.200' : 'blue.200';

  return (
    <Box
      p={4}
      bg={bgColor}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="md"
      cursor={notification.action_url ? 'pointer' : 'default'}
    >
      <VStack align="start" spacing={2}>
        <HStack justify="space-between" w="full">
          <Text fontSize="sm" fontWeight={notification.is_read ? 'normal' : 'semibold'}>
            {notification.message}
          </Text>
          {!notification.is_read && (
            <Button
              size="xs"
              variant="ghost"
              colorScheme="blue"
              onClick={() => onMarkAsRead(notification.id)}
            >
              Mark read
            </Button>
          )}
        </HStack>
        
        <HStack spacing={2}>
          <Text fontSize="xs" color="gray.500">
            {new Date(notification.created_at).toLocaleString()}
          </Text>
          {!notification.is_read && (
            <Badge colorScheme="blue" size="sm">
              New
            </Badge>
          )}
          {notification.action_url && (
            <Badge colorScheme="green" size="sm">
              Has Action
            </Badge>
          )}
        </HStack>
        
        {notification.action_url && (
          <Text fontSize="xs" color="blue.600">
            Action: {notification.action_url}
          </Text>
        )}
      </VStack>
    </Box>
  );
};

export default NotificationTestPanel;