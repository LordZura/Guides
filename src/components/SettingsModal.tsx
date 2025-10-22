import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  Text,
  Box,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Settings</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {prefersReducedMotion && (
              <Box 
                p={3} 
                bg="blue.50"
                borderRadius="md"
                borderLeft="4px"
                borderColor="secondary.500"
              >
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  Reduced Motion Enabled
                </Text>
                <Text fontSize="sm" color="gray.600">
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
