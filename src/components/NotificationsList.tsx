import { useState } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Badge,
  Avatar,
  Skeleton,
  Alert,
  AlertIcon,
  Divider,
  IconButton,
  Tooltip,
  useColorModeValue,
  Flex,
  Link,
  Center,
} from '@chakra-ui/react';
import { BellIcon, CheckIcon } from '@chakra-ui/icons';
import { Link as RouterLink } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import { DEFAULT_AVATAR_URL } from '../lib/supabaseClient';
import { formatDistanceToNow } from 'date-fns';

interface NotificationItemProps {
  notification: any;
  onMarkAsRead: (id: string) => void;
}

const NotificationItem = ({ notification, onMarkAsRead }: NotificationItemProps) => {
  const bgColor = useColorModeValue(
    notification.is_read ? 'gray.50' : 'blue.50',
    notification.is_read ? 'gray.700' : 'blue.900'
  );
  
  const borderColor = useColorModeValue(
    notification.is_read ? 'gray.200' : 'blue.200',
    notification.is_read ? 'gray.600' : 'blue.600'
  );

  const handleClick = () => {
    // Mark as read when clicking the notification
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
  };

  const content = (
    <Box
      p={4}
      bg={bgColor}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="md"
      cursor={notification.action_url ? 'pointer' : 'default'}
      onClick={notification.action_url ? undefined : handleClick}
      _hover={notification.action_url ? { bg: useColorModeValue('gray.100', 'gray.600') } : {}}
      transition="background-color 0.2s"
    >
      <HStack align="start" spacing={3}>
        <Avatar
          size="sm"
          name={notification.actor?.name || 'Unknown'}
          src={notification.actor?.avatar || DEFAULT_AVATAR_URL}
        />
        
        <VStack align="start" spacing={1} flex="1">
          <Text fontSize="sm" lineHeight="short">
            {notification.message}
          </Text>
          
          <HStack spacing={2}>
            <Text fontSize="xs" color="gray.500">
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </Text>
            
            {!notification.is_read && (
              <Badge colorScheme="blue" size="sm">
                New
              </Badge>
            )}
          </HStack>
        </VStack>
        
        {!notification.is_read && (
          <Tooltip label="Mark as read">
            <IconButton
              aria-label="Mark as read"
              icon={<CheckIcon />}
              size="sm"
              variant="ghost"
              colorScheme="blue"
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(notification.id);
              }}
            />
          </Tooltip>
        )}
      </HStack>
    </Box>
  );

  // If there's an action URL and notification type is not 'tour_rated', wrap in a Link
  if (notification.action_url && notification.type !== 'tour_rated') {
    return (
      <Link 
        as={RouterLink} 
        to={notification.action_url} 
        textDecoration="none"
        onClick={handleClick}
      >
        {content}
      </Link>
    );
  }

  return content;
};

const NotificationsList = () => {
  const { notifications, unreadCount, isLoading, error, markAsRead, markAllAsRead } = useNotifications();
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);

  const handleMarkAllAsRead = async () => {
    setIsMarkingAllRead(true);
    await markAllAsRead();
    setIsMarkingAllRead(false);
  };

  if (isLoading) {
    return (
      <VStack spacing={3} align="stretch">
        {[...Array(5)].map((_, i) => (
          <Box key={i} p={4} borderRadius="md" bg="gray.50">
            <HStack>
              <Skeleton borderRadius="full" boxSize="40px" />
              <VStack align="start" spacing={1} flex="1">
                <Skeleton height="16px" width="80%" />
                <Skeleton height="12px" width="40%" />
              </VStack>
            </HStack>
          </Box>
        ))}
      </VStack>
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

  if (notifications.length === 0) {
    return (
      <Center py={8}>
        <VStack spacing={3}>
          <BellIcon boxSize={8} color="gray.400" />
          <Text color="gray.500" textAlign="center">
            No notifications yet
          </Text>
          <Text fontSize="sm" color="gray.400" textAlign="center">
            You'll see updates about your bookings and tours here
          </Text>
        </VStack>
      </Center>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      {/* Header with mark all as read */}
      {unreadCount > 0 && (
        <Flex justify="space-between" align="center">
          <Text fontSize="sm" color="gray.600">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </Text>
          <Button
            size="sm"
            variant="ghost"
            colorScheme="blue"
            onClick={handleMarkAllAsRead}
            isLoading={isMarkingAllRead}
            leftIcon={<CheckIcon />}
          >
            Mark all read
          </Button>
        </Flex>
      )}

      {unreadCount > 0 && <Divider />}

      {/* Notifications list */}
      <VStack spacing={3} align="stretch">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkAsRead={markAsRead}
          />
        ))}
      </VStack>

      {/* Show hint if there are more notifications than displayed */}
      {notifications.length >= 50 && (
        <Box p={3} bg="gray.50" borderRadius="md" textAlign="center">
          <Text fontSize="sm" color="gray.600">
            Showing recent 50 notifications
          </Text>
        </Box>
      )}
    </VStack>
  );
};

export default NotificationsList;