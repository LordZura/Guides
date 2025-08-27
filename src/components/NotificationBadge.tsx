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
  Heading
} from '@chakra-ui/react';
import { BellIcon } from '@chakra-ui/icons';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationsList from './NotificationsList';

const NotificationBadge = () => {
  const { unreadCount } = useNotifications();
  const { isOpen, onToggle, onClose } = useDisclosure();

  // Cap display at 99+ for UX
  const displayCount = unreadCount > 99 ? '99+' : unreadCount.toString();

  return (
    <Popover 
      isOpen={isOpen} 
      onClose={onClose}
      placement="bottom-end"
      closeOnBlur={true}
      closeOnEsc={true}
    >
      <PopoverTrigger>
        <Box position="relative" display="inline-block">
          <IconButton
            aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
            icon={<BellIcon />}
            variant="ghost"
            size="md"
            onClick={onToggle}
            colorScheme={unreadCount > 0 ? 'blue' : 'gray'}
          />
          
          {unreadCount > 0 && (
            <Badge
              colorScheme="red"
              variant="solid"
              borderRadius="full"
              position="absolute"
              top="-1"
              right="-1"
              fontSize="xs"
              minW="18px"
              h="18px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {displayCount}
            </Badge>
          )}
        </Box>
      </PopoverTrigger>
      
      <PopoverContent w="400px" maxH="500px" overflow="hidden">
        <PopoverHeader>
          <Heading size="sm">Notifications</Heading>
        </PopoverHeader>
        <PopoverCloseButton />
        <PopoverBody p={0} maxH="450px" overflowY="auto">
          <Box p={4}>
            <NotificationsList />
          </Box>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBadge;