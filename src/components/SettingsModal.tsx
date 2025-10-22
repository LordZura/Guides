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
  Switch,
  VStack,
  Text,
  useColorMode,
  Divider,
  HStack,
  Icon,
  Badge,
  Box,
  useToast,
} from '@chakra-ui/react';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';
import { useEffect, useState } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const toast = useToast();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check user's motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleToggleTheme = () => {
    toggleColorMode();
    
    // Show subtle feedback (respects reduced motion)
    if (!prefersReducedMotion) {
      toast({
        title: colorMode === 'dark' ? '☀️ Light mode enabled' : '🌙 Dark mode enabled',
        status: 'success',
        duration: 1500,
        isClosable: false,
        position: 'bottom',
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Settings</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6} align="stretch">
            <FormControl display="flex" alignItems="center" justifyContent="space-between">
              <FormLabel htmlFor="theme-toggle" mb="0" flex="1">
                <VStack align="start" spacing={1}>
                  <HStack>
                    <Icon as={colorMode === 'dark' ? MoonIcon : SunIcon} />
                    <Text fontWeight="medium">Dark Mode</Text>
                    {colorMode === 'dark' && (
                      <Badge colorScheme="secondary" fontSize="xs">Active</Badge>
                    )}
                  </HStack>
                  <Text fontSize="sm" color="gray.500">
                    Toggle between light and dark themes
                  </Text>
                </VStack>
              </FormLabel>
              <Switch
                id="theme-toggle"
                isChecked={colorMode === 'dark'}
                onChange={handleToggleTheme}
                colorScheme="secondary"
                size="lg"
              />
            </FormControl>

            <Divider />
            
            {prefersReducedMotion && (
              <Box 
                p={3} 
                bg="blue.50" 
                _dark={{ bg: 'blue.900' }}
                borderRadius="md"
                borderLeft="4px"
                borderColor="secondary.500"
              >
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  Reduced Motion Enabled
                </Text>
                <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
                  Animations are minimized based on your system preferences.
                </Text>
              </Box>
            )}

            <Text fontSize="sm" color="gray.500">
              More settings coming soon! We're continuously improving your experience.
            </Text>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="secondary" mr={3} onClick={onClose}>
            Done
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SettingsModal;
