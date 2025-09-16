import { useState } from 'react';
import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Textarea,
  Select,
  VStack,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { FaBookmark } from 'react-icons/fa';
import { useTourTemplates } from '../contexts/TourTemplateContext';
import { TourTemplateData } from '../lib/types';

interface SaveAsTemplateProps {
  tourData: TourTemplateData;
  buttonProps?: {
    size?: string;
    variant?: string;
    colorScheme?: string;
  };
}

const SaveAsTemplate = ({ tourData, buttonProps = {} }: SaveAsTemplateProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { saveAsTemplate, categories } = useTourTemplates();
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: tourData.title || '',
    description: '',
    category: 'general'
  });
  
  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
  }>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Template name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Template name must be at least 3 characters';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      const success = await saveAsTemplate(
        formData.name.trim(),
        formData.description.trim(),
        tourData,
        formData.category
      );

      if (success) {
        onClose();
        // Reset form
        setFormData({
          name: tourData.title || '',
          description: '',
          category: 'general'
        });
        setErrors({});
      }
    } catch {
      toast({
        title: 'Error saving template',
        description: 'An unexpected error occurred. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setErrors({});
  };

  return (
    <>
      <Button
        leftIcon={<FaBookmark />}
        onClick={onOpen}
        size={buttonProps.size || 'md'}
        variant={buttonProps.variant || 'outline'}
        colorScheme={buttonProps.colorScheme || 'primary'}
        {...buttonProps}
      >
        Save as Template
      </Button>

      <Modal isOpen={isOpen} onClose={handleClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Save as Template</ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired isInvalid={!!errors.name}>
                <FormLabel>Template Name</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter a name for your template"
                />
                <FormErrorMessage>{errors.name}</FormErrorMessage>
              </FormControl>

              <FormControl isRequired isInvalid={!!errors.description}>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what makes this template useful"
                  rows={3}
                />
                <FormErrorMessage>{errors.description}</FormErrorMessage>
              </FormControl>

              <FormControl>
                <FormLabel>Category</FormLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {categories.filter(cat => cat !== 'all').map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                  <option value="custom">Custom</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleClose}>
              Cancel
            </Button>
            <Button
              colorScheme="primary"
              onClick={handleSave}
              isLoading={isSubmitting}
              loadingText="Saving..."
            >
              Save Template
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default SaveAsTemplate;