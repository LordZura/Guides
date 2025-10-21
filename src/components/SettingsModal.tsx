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
} from '@chakra-ui/react';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const { colorMode, toggleColorMode } = useColorMode();

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
                  </HStack>
                  <Text fontSize="sm" color="gray.500">
                    Toggle between light and dark themes
                  </Text>
                </VStack>
              </FormLabel>
              <Switch
                id="theme-toggle"
                isChecked={colorMode === 'dark'}
                onChange={toggleColorMode}
                colorScheme="primary"
                size="lg"
              />
            </FormControl>

            <Divider />

            <Text fontSize="sm" color="gray.500">
              More settings coming soon! We're continuously improving your experience.
            </Text>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="primary" mr={3} onClick={onClose}>
            Done
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SettingsModal;
