import { useState } from 'react';
import {
  Box, 
  Container, 
  Heading, 
  Text, 
  Flex, 
  Stack, 
  Avatar,
  Badge,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  Grid,
  GridItem,
  Card,
  CardHeader,
  CardBody,
  useColorModeValue,
  Icon,
  Link,
  useToast,
} from '@chakra-ui/react';
import { AddIcon, EditIcon } from '@chakra-ui/icons';
import { MdLanguage, MdLocationOn, MdPerson } from 'react-icons/md';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider';
import { ToursProvider } from '../contexts/ToursContext';
import { BookingProvider } from '../contexts/BookingContext';
import { DEFAULT_AVATAR_URL, Profile } from '../lib/supabaseClient';
import ProfileEditor from '../components/ProfileEditor';
import TourForm from '../components/TourForm';
import ToursList from '../components/ToursList';
import BookingsList from '../components/BookingsList';

const Dashboard = () => {
  const { profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const cardBg = useColorModeValue('white', 'gray.700');
  const toast = useToast();
  
  // Track active tab index to optimize rendering
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  if (!profile) {
    return (
      <Container maxW="container.xl" p={4}>
        <Box bg="white" boxShadow="md" borderRadius="lg" p={6}>
          <Heading size="lg" mb={4}>Loading profile information...</Heading>
        </Box>
      </Container>
    );
  }

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleEditComplete = (updatedProfile: Profile) => {
    setIsEditing(false);
    // Instead of forcing a page reload, we just show a success toast
    toast({
      title: "Profile updated",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const handleCreateSuccess = () => {
    onCreateClose();
    toast({
      title: `${profile.role === 'guide' ? 'Tour' : 'Tour request'} created`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };
  
  const handleTabChange = (index: number) => {
    setActiveTabIndex(index);
  };

  return (
    <ToursProvider>
      <BookingProvider>
        <Container maxW="container.xl" p={4}>
          <Grid 
            templateColumns={{ base: "1fr", lg: "300px 1fr" }}
            gap={6}
          >
            {/* Profile Sidebar */}
            <GridItem>
              <Card bg={cardBg} boxShadow="md" borderRadius="lg">
                <CardHeader>
                  <Flex direction="column" align="center" textAlign="center">
                    <Avatar 
                      src={profile.avatar_url || DEFAULT_AVATAR_URL} 
                      name={profile.full_name}
                      size="xl"
                      mb={4}
                    />
                    
                    <Heading size="md">{profile.full_name}</Heading>
                    
                    <Badge 
                      colorScheme={profile.role === 'guide' ? 'green' : 'blue'} 
                      mt={2}
                    >
                      {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                    </Badge>
                    
                    <Button 
                      leftIcon={<EditIcon />} 
                      size="sm" 
                      variant="outline" 
                      colorScheme="primary"
                      mt={4}
                      onClick={handleEditClick}
                    >
                      Edit Profile
                    </Button>
                  </Flex>
                </CardHeader>
                
                <CardBody>
                  <Stack spacing={4}>
                    {profile.phone && (
                      <Flex align="center">
                        <Icon as={MdPerson} color="primary.500" mr={2} />
                        <Text fontSize="sm">{profile.phone}</Text>
                      </Flex>
                    )}
                    
                    {profile.location && (
                      <Flex align="center">
                        <Icon as={MdLocationOn} color="primary.500" mr={2} />
                        <Text fontSize="sm">{profile.location}</Text>
                      </Flex>
                    )}
                    
                    {profile.languages && profile.languages.length > 0 && (
                      <Flex align="center">
                        <Icon as={MdLanguage} color="primary.500" mr={2} />
                        <Text fontSize="sm">{profile.languages.join(', ')}</Text>
                      </Flex>
                    )}
                    
                    {profile.bio && (
                      <Box>
                        <Text fontWeight="medium" mb={1}>Bio</Text>
                        <Text fontSize="sm">{profile.bio}</Text>
                      </Box>
                    )}
                    
                    {/* Guide-specific fields */}
                    {profile.role === 'guide' && profile.specialties && (
                      <Box>
                        <Text fontWeight="medium" mb={1}>Specialties</Text>
                        <Text fontSize="sm">{profile.specialties}</Text>
                      </Box>
                    )}
                    
                    {/* Tourist-specific fields */}
                    {profile.role === 'tourist' && profile.interests && (
                      <Box>
                        <Text fontWeight="medium" mb={1}>Interests</Text>
                        <Text fontSize="sm">{profile.interests}</Text>
                      </Box>
                    )}
                    
                    <Box>
                      <Link as={RouterLink} to="/explore" color="primary.500">
                        Browse {profile.role === 'guide' ? 'Tour Requests' : 'Tours'}
                      </Link>
                    </Box>
                  </Stack>
                </CardBody>
              </Card>
            </GridItem>
            
            {/* Main Content Area */}
            <GridItem>
              {isEditing ? (
                <ProfileEditor onSave={handleEditComplete} />
              ) : (
                <Box>
                  <Flex justify="space-between" align="center" mb={6}>
                    <Heading size="lg">
                      {profile.role === 'guide' ? 'Guide Dashboard' : 'Tourist Dashboard'}
                    </Heading>
                    
                    <Button 
                      leftIcon={<AddIcon />} 
                      colorScheme="primary"
                      onClick={onCreateOpen}
                    >
                      {profile.role === 'guide' ? 'Create Tour' : 'Post Tour Request'}
                    </Button>
                  </Flex>
                  
                  <Tabs 
                    colorScheme="primary" 
                    variant="enclosed"
                    onChange={handleTabChange}
                    index={activeTabIndex}
                  >
                    <TabList>
                      <Tab>My {profile.role === 'guide' ? 'Tours' : 'Tour Requests'}</Tab>
                      <Tab>My Bookings</Tab>
                    </TabList>
                    
                    <TabPanels>
                      {/* Tours/Tour Requests Panel */}
                      <TabPanel px={0}>
                        {activeTabIndex === 0 && <ToursList />}
                      </TabPanel>
                      
                      {/* Bookings Panel */}
                      <TabPanel px={0}>
                        {activeTabIndex === 1 && <BookingsList showTitle={false} />}
                      </TabPanel>
                    </TabPanels>
                  </Tabs>
                </Box>
              )}
            </GridItem>
          </Grid>
        </Container>
        
        {/* Create Tour Modal */}
        <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalCloseButton />
            <ModalBody pt={10} pb={6}>
              <TourForm onSuccess={handleCreateSuccess} onCancel={onCreateClose} />
            </ModalBody>
          </ModalContent>
        </Modal>
      </BookingProvider>
    </ToursProvider>
  );
};

export default Dashboard;