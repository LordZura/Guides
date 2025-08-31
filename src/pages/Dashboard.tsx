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
import { DEFAULT_AVATAR_URL } from '../lib/supabaseClient';
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

  const handleEditComplete = () => {
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
        <Container maxW="container.xl" p={6}>
          <Grid 
            templateColumns={{ base: "1fr", lg: "320px 1fr" }}
            gap={8}
          >
            {/* Profile Sidebar */}
            <GridItem>
              <Card bg={cardBg} boxShadow="xl" borderRadius="xl" border="1px" borderColor="gray.100">
                <CardHeader pb={4}>
                  <Flex direction="column" align="center" textAlign="center">
                    <Avatar 
                      src={profile.avatar_url || DEFAULT_AVATAR_URL} 
                      name={profile.full_name}
                      size="2xl"
                      mb={6}
                      border="4px"
                      borderColor="primary.100"
                    />
                    
                    <Heading size="lg" mb={2} color="gray.800">{profile.full_name}</Heading>
                    
                    <Badge 
                      colorScheme={profile.role === 'guide' ? 'green' : 'blue'} 
                      mt={2}
                      fontSize="sm"
                      px={4}
                      py={1}
                      borderRadius="full"
                    >
                      {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                    </Badge>
                    
                    <Button 
                      leftIcon={<EditIcon />} 
                      size="md" 
                      variant="outline" 
                      colorScheme="primary"
                      mt={6}
                      onClick={handleEditClick}
                      borderRadius="full"
                      px={6}
                      _hover={{ transform: 'translateY(-1px)', boxShadow: 'md' }}
                      transition="all 0.2s"
                    >
                      Edit Profile
                    </Button>
                  </Flex>
                </CardHeader>
                
                <CardBody pt={4}>
                  <Stack spacing={5}>
                    {profile.phone && (
                      <Flex align="center">
                        <Icon as={MdPerson} color="primary.500" mr={3} boxSize="5" />
                        <Text fontSize="sm" fontWeight="medium" color="gray.700">{profile.phone}</Text>
                      </Flex>
                    )}
                    
                    {profile.location && (
                      <Flex align="center">
                        <Icon as={MdLocationOn} color="primary.500" mr={3} boxSize="5" />
                        <Text fontSize="sm" fontWeight="medium" color="gray.700">{profile.location}</Text>
                      </Flex>
                    )}
                    
                    {profile.languages && profile.languages.length > 0 && (
                      <Flex align="center">
                        <Icon as={MdLanguage} color="primary.500" mr={3} boxSize="5" />
                        <Text fontSize="sm" fontWeight="medium" color="gray.700">{profile.languages.join(', ')}</Text>
                      </Flex>
                    )}
                    
                    {profile.bio && (
                      <Box>
                        <Text fontWeight="semibold" mb={2} color="gray.700">Bio</Text>
                        <Text fontSize="sm" color="gray.600" lineHeight="1.5">{profile.bio}</Text>
                      </Box>
                    )}
                    
                    {/* Guide-specific fields */}
                    {profile.role === 'guide' && profile.specialties && (
                      <Box>
                        <Text fontWeight="semibold" mb={2} color="gray.700">Specialties</Text>
                        <Text fontSize="sm" color="gray.600" lineHeight="1.5">{profile.specialties}</Text>
                      </Box>
                    )}
                    
                    {/* Tourist-specific fields */}
                    {profile.role === 'tourist' && profile.interests && (
                      <Box>
                        <Text fontWeight="medium" mb={1}>Interests</Text>
                        <Text fontSize="sm">{profile.interests}</Text>
                      </Box>
                    )}
                    
                    <Box pt={4} borderTop="1px" borderColor="gray.100">
                      <Link as={RouterLink} to="/explore" color="primary.600" fontWeight="semibold" _hover={{ color: 'primary.700' }}>
                        Browse {profile.role === 'guide' ? 'Tour Requests' : 'Tours'} →
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
                  <Flex justify="space-between" align="center" mb={8}>
                    <Heading size="xl" color="gray.800">
                      {profile.role === 'guide' ? 'Guide Dashboard' : 'Tourist Dashboard'}
                    </Heading>
                    
                    <Button 
                      leftIcon={<AddIcon />} 
                      colorScheme="primary"
                      onClick={onCreateOpen}
                      size="lg"
                      borderRadius="full"
                      px={8}
                      _hover={{ transform: 'translateY(-1px)', boxShadow: 'lg' }}
                      transition="all 0.2s"
                    >
                      {profile.role === 'guide' ? 'Create Tour' : 'Post Tour Request'}
                    </Button>
                  </Flex>
                  
                  <Tabs 
                    colorScheme="primary" 
                    variant="enclosed"
                    onChange={handleTabChange}
                    index={activeTabIndex}
                    bg="white"
                    borderRadius="xl"
                    boxShadow="lg"
                    border="1px"
                    borderColor="gray.100"
                  >
                    <TabList borderBottomColor="gray.200">
                      <Tab fontWeight="semibold" py={4} px={6} _selected={{ color: 'primary.600', borderBottomColor: 'primary.500' }}>My {profile.role === 'guide' ? 'Tours' : 'Tour Requests'}</Tab>
                      <Tab fontWeight="semibold" py={4} px={6} _selected={{ color: 'primary.600', borderBottomColor: 'primary.500' }}>My Bookings</Tab>
                    </TabList>
                    
                    <TabPanels>
                      {/* Tours/Tour Requests Panel */}
                      <TabPanel p={6}>
                        {activeTabIndex === 0 && <ToursList />}
                      </TabPanel>
                      
                      {/* Bookings Panel */}
                      <TabPanel p={6}>
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
          <ModalContent borderRadius="xl">
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