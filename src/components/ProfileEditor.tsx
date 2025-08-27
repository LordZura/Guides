import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Textarea,
  Heading,
  Flex,
  Text,
  Avatar,
  useToast,
  VStack,
  Divider,
  FormHelperText,
  IconButton,
} from '@chakra-ui/react';
import { CheckIcon, CloseIcon, EditIcon } from '@chakra-ui/icons';
import { supabase, Profile, DEFAULT_AVATAR_URL } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthProvider';
import SearchableLanguageSelector from './SearchableLanguageSelector';

interface ProfileEditorProps {
  onSave: (updatedProfile: Profile) => void;
}

interface FormData {
  full_name: string;
  phone: string;
  bio: string;
  location: string;
  languages: string[];
  interests: string; // For tourists
  years_experience: number; // For guides
  specialties: string; // For guides
}

interface FormErrors {
  full_name?: string;
  phone?: string;
  bio?: string;
  location?: string;
}

const ProfileEditor = ({ onSave }: ProfileEditorProps) => {
  const { profile: currentProfile, user } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  const initialFormData: FormData = {
    full_name: currentProfile?.full_name || '',
    phone: currentProfile?.phone || '',
    bio: currentProfile?.bio || '',
    location: currentProfile?.location || '',
    languages: currentProfile?.languages || [],
    interests: currentProfile?.interests || '',
    years_experience: currentProfile?.years_experience || 0,
    specialties: currentProfile?.specialties || '',
  };
  
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  
  // Set initial avatar
  useEffect(() => {
    if (currentProfile?.avatar_url) {
      setAvatarUrl(currentProfile.avatar_url);
    }
  }, [currentProfile]);
  
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }
    
    if (formData.phone) {
      const phoneRegex = /^\+?[0-9]{10,15}$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleLanguageChange = (languages: string[]) => {
    setFormData({ ...formData, languages });
  };
  
  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Maximum file size is 2MB',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload an image file',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      
      setAvatarFile(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user) return currentProfile?.avatar_url || null;
    
    try {
      setIsUploading(true);
      
      // Create a unique filename
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, avatarFile);
      
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);
      
      return data.publicUrl;
    } catch (err) {
      console.error('Error uploading avatar:', err);
      toast({
        title: 'Upload failed',
        description: 'Could not upload avatar. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return currentProfile?.avatar_url || null;
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: 'Form contains errors',
        description: 'Please fix the errors before submitting.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    if (!currentProfile || !user) {
      toast({
        title: 'Authentication error',
        description: 'You must be logged in to update your profile.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // First upload avatar if changed
      const newAvatarUrl = await uploadAvatar();
      
      const updatedProfileData = {
        ...formData,
        avatar_url: newAvatarUrl,
        updated_at: new Date().toISOString(),
      };
      
      // Update profile in database
      const { data, error } = await supabase
        .from('profiles')
        .update(updatedProfileData)
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Return the updated profile to parent component
      onSave(data as Profile);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      toast({
        title: 'Error saving profile',
        description: err.message || 'An unexpected error occurred. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!currentProfile) {
    return <Text>Loading profile information...</Text>;
  }
  
  return (
    <Box bg="white" p={6} borderRadius="lg" boxShadow="md">
      <Heading size="lg" mb={6}>Edit Profile</Heading>
      
      <form onSubmit={handleSubmit}>
        <VStack spacing={6} align="stretch">
          {/* Avatar upload */}
          <Box textAlign="center">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            
            <Flex direction="column" align="center">
              <Box position="relative" cursor="pointer" onClick={handleAvatarClick}>
                <Avatar 
                  size="2xl" 
                  src={avatarUrl || DEFAULT_AVATAR_URL}
                  name={formData.full_name}
                  mb={2}
                />
                <IconButton
                  aria-label="Edit avatar"
                  icon={<EditIcon />}
                  size="sm"
                  colorScheme="primary"
                  position="absolute"
                  bottom="10px"
                  right="0"
                  borderRadius="full"
                  isLoading={isUploading}
                />
              </Box>
              <Text fontSize="sm" color="gray.500" mt={2}>
                {isUploading ? 'Uploading...' : 'Click to change profile picture'}
              </Text>
            </Flex>
          </Box>
          
          <FormControl isRequired isInvalid={!!errors.full_name}>
            <FormLabel>Full Name</FormLabel>
            <Input 
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
            />
            <FormErrorMessage>{errors.full_name}</FormErrorMessage>
          </FormControl>
          
          <FormControl isInvalid={!!errors.phone}>
            <FormLabel>Phone Number</FormLabel>
            <Input 
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="e.g. +1234567890"
            />
            <FormHelperText>Include country code (optional)</FormHelperText>
            <FormErrorMessage>{errors.phone}</FormErrorMessage>
          </FormControl>
          
          <FormControl>
            <FormLabel>Bio</FormLabel>
            <Textarea 
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Tell us about yourself"
              rows={4}
            />
          </FormControl>
          
          <FormControl>
            <FormLabel>Location</FormLabel>
            <Input 
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="Where are you based?"
            />
          </FormControl>
          
          <SearchableLanguageSelector
            selectedLanguages={formData.languages}
            onChange={handleLanguageChange}
            label="Languages"
            placeholder="Search and select languages..."
            helperText="Select the languages you speak"
          />
          
          {/* Guide-specific fields */}
          {currentProfile.role === 'guide' && (
            <>
              <FormControl>
                <FormLabel>Years of Experience</FormLabel>
                <Input 
                  type="number"
                  name="years_experience"
                  value={formData.years_experience}
                  onChange={handleInputChange}
                  min={0}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Specialties</FormLabel>
                <Textarea 
                  name="specialties"
                  value={formData.specialties}
                  onChange={handleInputChange}
                  placeholder="What are your specialties as a guide?"
                  rows={3}
                />
              </FormControl>
            </>
          )}
          
          {/* Tourist-specific fields */}
          {currentProfile.role === 'tourist' && (
            <FormControl>
              <FormLabel>Interests</FormLabel>
              <Textarea 
                name="interests"
                value={formData.interests}
                onChange={handleInputChange}
                placeholder="What are you interested in exploring?"
                rows={3}
              />
            </FormControl>
          )}
          
          <Divider />
          
          <Flex justify="flex-end" gap={3}>
            <Button 
              leftIcon={<CloseIcon />}
              variant="outline" 
              onClick={() => onSave(currentProfile)}
            >
              Cancel
            </Button>
            <Button 
              leftIcon={<CheckIcon />}
              type="submit" 
              colorScheme="primary"
              isLoading={isSubmitting || isUploading}
            >
              Save Changes
            </Button>
          </Flex>
        </VStack>
      </form>
    </Box>
  );
};

export default ProfileEditor;