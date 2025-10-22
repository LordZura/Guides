// src/components/NotificationBadge.tsx
import {
  IconButton,
  Badge,
  Box,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverCloseButton,
  useDisclosure,
  Heading,
  Portal, // <- import Portal
} from '@chakra-ui/react';
import { BellIcon } from '@chakra-ui/icons';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationsList from './NotificationsList';

const NotificationBadge = () => {
  const { unreadCount = 0 } = useNotifications();
  const { isOpen, onToggle, onClose } = useDisclosure();

  const displayCount = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <Popover
      isOpen={isOpen}
      onClose={onClose}
      placement="bottom-end"
      closeOnBlur
      closeOnEsc
      // NOTE: do NOT pass `usePortal` here if your Chakra type defs don't include it.
    >
      <PopoverTrigger>
        <Box position="relative" display="inline-block">
          <IconButton
            aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            icon={<BellIcon />}
            variant="ghost"
            size="md"
            onClick={onToggle}
          />

          {unreadCount > 0 && (
            <Badge
              colorScheme="red"
              variant="solid"
              borderRadius="full"
              position="absolute"
              top="0"
              right="0"
              transform="translate(35%,-35%)"
              fontSize="xs"
              minW="18px"
              h="18px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              title={`${unreadCount} unread notifications`}
            >
              {displayCount}
            </Badge>
          )}
        </Box>
      </PopoverTrigger>

      {/* Use Portal component to render PopoverContent in document body (avoids clipping). */}
      <Portal>
        <PopoverContent
          w={{ base: 'calc(100vw - 32px)', sm: '380px', md: '400px' }}
          maxW="400px"
          maxH="500px"
          overflow="hidden"
          zIndex="popover"
        >
          <PopoverHeader borderBottomWidth="1px" px={4} py={3}>
            <Heading size="sm">Notifications</Heading>
          </PopoverHeader>
          <PopoverCloseButton />
          <PopoverBody p={0} maxH="450px" overflowY="auto">
            <Box p={4}>
              {/* Pass onClose so NotificationsList can close the popover after navigation */}
              <NotificationsList onClose={onClose} />
            </Box>
          </PopoverBody>
        </PopoverContent>
      </Portal>
    </Popover>
  );
};

export default NotificationBadge;
