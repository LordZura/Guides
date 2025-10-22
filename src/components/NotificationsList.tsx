// src/components/NotificationsList.tsx
import { useState } from "react";
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
  Flex,
  Link,
  Center,
} from "@chakra-ui/react";
import { BellIcon, CheckIcon } from "@chakra-ui/icons";
import { Link as RouterLink } from "react-router-dom";
import {
  useNotifications,
  Notification,
} from "../contexts/NotificationContext";
import { DEFAULT_AVATAR_URL } from "../lib/supabaseClient";
import { formatDistanceToNow } from "date-fns";

interface NotificationsListProps {
  onClose?: () => void;
}

// Accept functions that return void or Promise<void|boolean> (your implementation returns Promise<boolean>)
interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (_id: string) => void | Promise<void | boolean>;
  onClose?: () => void;
}

const NotificationItem = ({
  notification,
  onMarkAsRead,
  onClose,
}: NotificationItemProps) => {
  const bgColor = notification.is_read ? "gray.50" : "blue.50";
  const borderColor = notification.is_read ? "gray.200" : "blue.200";

  // Clicking non-linked notification should mark it read then optionally close parent UI
  const handleNonLinkClick = async () => {
    if (!notification.is_read) {
      try {
        await onMarkAsRead(notification.id);
      } catch {
        // ignore errors here; upstream should surface them if needed
      }
    }
    if (onClose) onClose();
  };

  // Clicking a RouterLink (navigation) should mark as read, then allow navigation to proceed.
  // We don't need the event param here — removing it avoids unused-var warnings.
  const handleLinkClick = async () => {
    if (!notification.is_read) {
      try {
        await onMarkAsRead(notification.id);
      } catch {
        // ignore
      }
    }
    if (onClose) onClose();
    // RouterLink will handle the actual navigation
  };

  const content = (
    <Box
      p={4}
      bg={bgColor}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="md"
      cursor={notification.action_url ? "pointer" : "default"}
      onClick={notification.action_url ? undefined : handleNonLinkClick}
      _hover={notification.action_url ? { bg: "gray.100" } : {}}
      transition="background-color 0.2s"
    >
      <HStack align="start" spacing={3}>
        <Avatar
          size="sm"
          name={notification.actor?.name || "Unknown"}
          src={notification.actor?.avatar || DEFAULT_AVATAR_URL}
        />

        <VStack align="start" spacing={1} flex="1">
          <Text fontSize="sm" lineHeight="short">
            {notification.message}
          </Text>

          <HStack spacing={2}>
            <Text fontSize="xs" color="gray.500">
              {formatDistanceToNow(new Date(notification.created_at), {
                addSuffix: true,
              })}
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
              onClick={async (e) => {
                // stop click bubbling to parent containers
                e.stopPropagation();
                e.preventDefault();
                try {
                  await onMarkAsRead(notification.id);
                } catch {
                  // ignore
                }
                if (onClose) onClose();
              }}
            />
          </Tooltip>
        )}
      </HStack>
    </Box>
  );

  // If there's an action URL and notification type is not 'tour_rated', wrap in a Link
  if (notification.action_url && notification.type !== "tour_rated") {
    return (
      <Link
        as={RouterLink}
        to={notification.action_url}
        textDecoration="none"
        onClick={handleLinkClick}
      >
        {content}
      </Link>
    );
  }

  return content;
};

export default function NotificationsList({ onClose }: NotificationsListProps) {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);

  const handleMarkAllAsRead = async () => {
    setIsMarkingAllRead(true);
    try {
      await markAllAsRead();
    } finally {
      setIsMarkingAllRead(false);
      if (onClose) onClose();
    }
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
            {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
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
            onClose={onClose}
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
}
