import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Stack,
  Avatar,
  AvatarBadge,
  IconButton,
  useToast,
  Text,
  VStack,
  HStack,
  Select,
  Checkbox,
  CheckboxGroup,
  Flex,
  Code,
} from '@chakra-ui/react';
import { EditIcon, CloseIcon } from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthProvider';
import { supabase, DEFAULT_AVATAR_URL, Profile } from '../lib/supabaseClient';

interface ProfileEditorProps {
  onSave?: () => void;
}

const ProfileEditor = ({ onSave }: ProfileEditorProps) => {
  const { user, profile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<Array<{ id: number; name: string; code: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setBio(profile.bio || '');
      setInterests(profile.interests || '');
      setAvatarUrl(profile.avatar_url || '');
      
      console.log("Current profile:", profile);
    }

    // Fetch user's languages
    const fetchUserLanguages = async () => {
      if (user && profile?.role === 'guide') {
        try {
          const { data, error } = await supabase
            .from('guide_languages')
            .select('languages(id, name, code)')
            .eq('guide_id', user.id);

          if (error) throw error;
          
          console.log("Guide languages data:", data);

          const userLangs = data?.map(item => {
            const lang = item.languages as any;
            return lang?.name;
          }).filter(Boolean) || [];
          
          setLanguages(userLangs);
        } catch (error) {
          console.error('Error fetching user languages:', error);
        }
      }
    };

    // Fetch available languages
    const fetchAvailableLanguages = async () => {
      try {
        const { data, error } = await supabase
          .from('languages')
          .select('*')
          .order('name');

        if (error) throw error;
        
        console.log("Available languages:", data);
        setAvailableLanguages(data || []);
      } catch (error) {
        console.error('Error fetching languages:', error);
      }
    };

    fetchUserLanguages();
    fetchAvailableLanguages();
  }, [user, profile]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setAvatar(files[0]);
      // Create a preview URL
      setAvatarUrl(URL.createObjectURL(files[0]));
    }
  };

  const uploadAvatar = async () => {
    if (!avatar || !user) return null;
    
    const fileExt = avatar.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    
    try {
      console.log("Starting avatar upload:", fileName);
      
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatar);
      
      if (uploadError) throw uploadError;
      
      console.log("Upload successful, data:", data);
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      console.log("Public URL:", urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return null;
    }
  };

  const handleLanguageChange = (values: string[]) => {
    setLanguages(values);
  };

  const saveProfile = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to update your profile",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsLoading(true);
    setDebugInfo(null);
    
    try {
      console.log("Starting profile update for user:", user.id);
      
      // Upload avatar if changed
      let avatarUrlToSave = profile?.avatar_url || null;
      if (avatar) {
        const newAvatarUrl = await uploadAvatar();
        if (newAvatarUrl) {
          avatarUrlToSave = newAvatarUrl;
        }
      }
      
      // Update profile
      const updates = {
        full_name: fullName,
        phone: phone || null,
        bio: bio || null,
        interests: interests || null,
        avatar_url: avatarUrlToSave,
        updated_at: new Date().toISOString(),
      };
      
      console.log("Updating profile with data:", updates);
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select();
      
      if (error) {
        console.error("Error updating profile:", error);
        throw error;
      }
      
      console.log("Profile updated successfully:", data);
      
      // Update languages for guides
      if (profile?.role === 'guide') {
        // First, delete existing language associations
        console.log("Deleting existing guide languages");
        const { error: deleteError } = await supabase
          .from('guide_languages')
          .delete()
          .eq('guide_id', user.id);
        
        if (deleteError) {
          console.error("Error deleting guide languages:", deleteError);
          throw deleteError;
        }
        
        // Then, add the selected languages
        if (languages.length > 0) {
          // Find language IDs
          console.log("Selected languages:", languages);
          console.log("Available languages:", availableLanguages);
          
          const languageIds = availableLanguages
            .filter(lang => languages.includes(lang.name))
            .map(lang => ({
              guide_id: user.id,
              language_id: lang.id
            }));
          
          console.log("Language IDs to insert:", languageIds);
          
          if (languageIds.length > 0) {
            const { data: insertData, error: insertError } = await supabase
              .from('guide_languages')
              .insert(languageIds)
              .select();
            
            if (insertError) {
              console.error("Error inserting guide languages:", insertError);
              throw insertError;
            }
            
            console.log("Guide languages inserted:", insertData);
          }
        }
      }
      
      toast({
        title: 'Profile updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Force reload profile through context
      if (onSave) onSave();
      
    } catch (error: any) {
      console.error("Profile update error:", error);
      
      // Set debug info for troubleshooting
      setDebugInfo(JSON.stringify(error, null, 2));
      
      toast({
        title: 'Error updating profile',
        description: error.message || "An unexpected error occurred",
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <Box bg="white" borderRadius="lg" p={6} boxShadow="md">
      <VStack spacing={6} align="stretch">
        <Text fontSize="xl" fontWeight="bold">Edit Profile</Text>
        
        {/* Avatar */}
        <Box textAlign="center">
          <Avatar 
            size="xl" 
            src={avatarUrl || DEFAULT_AVATAR_URL} 
            name={fullName} 
            mb={4}
            cursor="pointer"
            onClick={handleAvatarClick}
          >
            <AvatarBadge
              as={IconButton}
              size="sm"
              rounded="full"
              top="-10px"
              colorScheme="primary"
              aria-label="Edit avatar"
              icon={<EditIcon />}
            />
          </Avatar>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            accept="image/*"
          />
          <Text fontSize="sm" color="gray.500">Click avatar to change profile picture</Text>
        </Box>
        
        <Stack spacing={4}>
          {/* Basic Information */}
          <FormControl isRequired>
            <FormLabel>Full Name</FormLabel>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
            />
          </FormControl>
          
          <FormControl>
            <FormLabel>Phone Number</FormLabel>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Your phone number (optional)"
            />
          </FormControl>
          
          {/* Bio - Different for guides and tourists */}
          <FormControl>
            <FormLabel>Bio</FormLabel>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={profile.role === 'guide' 
                ? "Tell tourists about your experience and expertise..."
                : "Share a bit about yourself as a traveler..."}
              rows={4}
            />
          </FormControl>
          
          {/* Interests - Only for tourists */}
          {profile.role === 'tourist' && (
            <FormControl>
              <FormLabel>Travel Interests</FormLabel>
              <Textarea
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="What types of places or activities interest you?"
                rows={3}
              />
            </FormControl>
          )}
          
          {/* Languages - Only for guides */}
          {profile.role === 'guide' && (
            <FormControl>
              <FormLabel>Languages You Speak</FormLabel>
              <Box maxH="200px" overflowY="auto" p={2} borderWidth="1px" borderRadius="md">
                <CheckboxGroup colorScheme="primary" value={languages} onChange={handleLanguageChange}>
                  <Flex wrap="wrap">
                    {availableLanguages.map(lang => (
                      <Box key={lang.id} width="50%" p={1}>
                        <Checkbox value={lang.name}>
                          {lang.name}
                        </Checkbox>
                      </Box>
                    ))}
                  </Flex>
                </CheckboxGroup>
              </Box>
              <Text fontSize="sm" color="gray.500" mt={1}>
                Select all languages you can communicate in
              </Text>
            </FormControl>
          )}
        </Stack>
        
        {/* Debug information */}
        {debugInfo && (
          <Box mt={4} p={3} bg="red.50" borderRadius="md">
            <Text fontWeight="bold" mb={2}>Debug Information:</Text>
            <Code colorScheme="red" p={2} borderRadius="md" width="100%" overflowX="auto">
              {debugInfo}
            </Code>
          </Box>
        )}
        
        <HStack spacing={4} justifyContent="flex-end">
          <Button variant="outline" onClick={() => window.history.back()}>
            Cancel
          </Button>
          <Button 
            colorScheme="primary" 
            onClick={saveProfile}
            isLoading={isLoading}
            loadingText="Saving"
          >
            Save Changes
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default ProfileEditor;