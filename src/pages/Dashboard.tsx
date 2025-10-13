import { useState } from "react";
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
  VStack,
  HStack,
  useBreakpointValue,
} from "@chakra-ui/react";
import { AddIcon, EditIcon } from "@chakra-ui/icons";
import { MdLanguage, MdLocationOn, MdPerson } from "react-icons/md";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthProvider";
import { ToursProvider } from "../contexts/ToursContext";
import { BookingProvider } from "../contexts/BookingContext";
import { PaymentStatsProvider } from "../contexts/PaymentStatsContext";
import { DEFAULT_AVATAR_URL } from "../lib/supabaseClient";
import ProfileEditor from "../components/ProfileEditor";
import TourForm from "../components/TourForm";
import ToursList from "../components/ToursList";
import BookingsList from "../components/BookingsList";
import PaymentTracker from "../components/PaymentTracker";

const Dashboard = () => {
  const { profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onClose: onCreateClose,
  } = useDisclosure();
  const cardBg = useColorModeValue("white", "gray.700");
  const toast = useToast();
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Track active tab index to optimize rendering
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  if (!profile) {
    return (
      <Container maxW="container.xl" p={4}>
        <Box bg="white" boxShadow="md" borderRadius="lg" p={6}>
          <Heading size="lg" mb={4}>
            Loading profile information...
          </Heading>
        </Box>
      </Container>
    );
  }

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleEditComplete = () => {
    setIsEditing(false);
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
      title: `${profile.role === "guide" ? "Tour" : "Tour request"} created`,
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
        <PaymentStatsProvider>
          <Container maxW="container.xl" p={{ base: 2, md: 4 }}>
            <Grid
              templateColumns={{
                base: "1fr",
                md: "280px 1fr",
                lg: "320px 1fr",
              }}
              gap={{ base: 4, md: 6 }}
              alignItems="start"
            >
              {/* Profile Sidebar */}
              <GridItem>
                <Card
                  bg={cardBg}
                  boxShadow="xl"
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor="gray.100"
                >
                  <CardHeader pb={4}>
                    <Flex direction="column" align="center" textAlign="center">
                      <Avatar
                        src={profile.avatar_url || DEFAULT_AVATAR_URL}
                        name={profile.full_name}
                        boxSize={{ base: "80px", md: "100px" }}
                        mb={4}
                        borderWidth="4px"
                        borderColor="primary.100"
                      />

                      <Heading 
                        size={{ base: "md", md: "lg" }} 
                        mb={2} 
                        color="gray.800"
                        fontSize={{ base: "lg", md: "xl" }}
                      >
                        {profile.full_name}
                      </Heading>

                      <Badge
                        colorScheme={
                          profile.role === "guide" ? "green" : "blue"
                        }
                        mt={2}
                        fontSize={{ base: "xs", md: "sm" }}
                        px={3}
                        py={1}
                        borderRadius="full"
                      >
                        {profile.role.charAt(0).toUpperCase() +
                          profile.role.slice(1)}
                      </Badge>

                      <Button
                        leftIcon={<EditIcon />}
                        size={{ base: "md", md: "sm" }}
                        variant="outline"
                        colorScheme="primary"
                        mt={4}
                        onClick={handleEditClick}
                        borderRadius="full"
                        px={{ base: 6, md: 4 }}
                        minH="48px"
                        _hover={{
                          transform: "translateY(-1px)",
                          boxShadow: "md",
                        }}
                        transition="all 0.2s"
                        fontSize={{ base: "md", md: "sm" }}
                        w="full"
                      >
                        Edit Profile
                      </Button>
                    </Flex>
                  </CardHeader>

                  <CardBody pt={4}>
                    <Stack spacing={{ base: 4, md: 4 }}>
                      {profile.phone && (
                        <Flex align="center">
                          <Icon
                            as={MdPerson}
                            color="primary.500"
                            mr={3}
                            boxSize="5"
                          />
                          <Text
                            fontSize={{ base: "md", md: "sm" }}
                            fontWeight="medium"
                            color="gray.700"
                          >
                            {profile.phone}
                          </Text>
                        </Flex>
                      )}

                      {profile.location && (
                        <Flex align="center">
                          <Icon
                            as={MdLocationOn}
                            color="primary.500"
                            mr={3}
                            boxSize="5"
                          />
                          <Text
                            fontSize={{ base: "md", md: "sm" }}
                            fontWeight="medium"
                            color="gray.700"
                          >
                            {profile.location}
                          </Text>
                        </Flex>
                      )}

                      {profile.languages && profile.languages.length > 0 && (
                        <Flex align="center">
                          <Icon
                            as={MdLanguage}
                            color="primary.500"
                            mr={3}
                            boxSize="5"
                          />
                          <Text
                            fontSize={{ base: "md", md: "sm" }}
                            fontWeight="medium"
                            color="gray.700"
                          >
                            {profile.languages.join(", ")}
                          </Text>
                        </Flex>
                      )}

                      {profile.bio && (
                        <Box>
                          <Text
                            fontWeight="semibold"
                            mb={2}
                            color="gray.700"
                            fontSize={{ base: "md", md: "sm" }}
                          >
                            Bio
                          </Text>
                          <Text 
                            fontSize={{ base: "md", md: "sm" }} 
                            color="gray.600" 
                            lineHeight="1.6"
                          >
                            {profile.bio}
                          </Text>
                        </Box>
                      )}

                      {/* Guide-specific fields */}
                      {profile.role === "guide" && profile.specialties && (
                        <Box>
                          <Text
                            fontWeight="semibold"
                            mb={2}
                            color="gray.700"
                            fontSize={{ base: "md", md: "sm" }}
                          >
                            Specialties
                          </Text>
                          <Text 
                            fontSize={{ base: "md", md: "sm" }} 
                            color="gray.600" 
                            lineHeight="1.6"
                          >
                            {profile.specialties}
                          </Text>
                        </Box>
                      )}

                      {/* Tourist-specific fields */}
                      {profile.role === "tourist" && profile.interests && (
                        <Box>
                          <Text 
                            fontWeight="medium" 
                            mb={1} 
                            fontSize={{ base: "md", md: "sm" }}
                          >
                            Interests
                          </Text>
                          <Text 
                            fontSize={{ base: "md", md: "sm" }}
                          >
                            {profile.interests}
                          </Text>
                        </Box>
                      )}

                      <Box pt={3} borderTopWidth="1px" borderColor="gray.100">
                        <Link
                          as={RouterLink}
                          to="/explore"
                          color="primary.600"
                          fontWeight="semibold"
                          _hover={{ color: "primary.700" }}
                          fontSize={{ base: "md", md: "sm" }}
                        >
                          Browse{" "}
                          {profile.role === "guide" ? "Tour Requests" : "Tours"}{" "}
                          →
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
                    <Flex
                      justify="space-between"
                      align="center"
                      mb={6}
                      direction={{ base: "column", sm: "row" }}
                      gap={{ base: 4, sm: 0 }}
                    >
                      <Heading
                        size={{ base: "lg", md: "lg" }}
                        color="gray.800"
                        textAlign={{ base: "center", sm: "left" }}
                        fontSize={{ base: "xl", md: "2xl" }}
                      >
                        {profile.role === "guide"
                          ? "Guide Dashboard"
                          : "Tourist Dashboard"}
                      </Heading>

                      <Button
                        leftIcon={<AddIcon />}
                        colorScheme="primary"
                        onClick={onCreateOpen}
                        size={{ base: "lg", md: "md" }}
                        borderRadius="full"
                        px={{ base: 8, md: 6 }}
                        minH="48px"
                        _hover={{
                          transform: "translateY(-1px)",
                          boxShadow: "lg",
                        }}
                        transition="all 0.2s"
                        fontSize={{ base: "md", md: "sm" }}
                        w={{ base: "full", sm: "auto" }}
                      >
                        {profile.role === "guide"
                          ? "Create Tour"
                          : "Post Tour Request"}
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
                      borderWidth="1px"
                      borderColor="gray.100"
                    >
                      <TabList
                        borderBottomColor="gray.200"
                        overflowX="auto"
                        overflowY="hidden"
                      >
                        <Tab
                          fontWeight="semibold"
                          py={{ base: 4, md: 3 }}
                          px={{ base: 6, md: 4 }}
                          _selected={{
                            color: "primary.600",
                            borderBottomColor: "primary.500",
                          }}
                          minW="fit-content"
                          fontSize={{ base: "md", md: "sm" }}
                          minH="48px"
                        >
                          My{" "}
                          {profile.role === "guide" ? "Tours" : "Tour Requests"}
                        </Tab>
                        <Tab
                          fontWeight="semibold"
                          py={{ base: 4, md: 3 }}
                          px={{ base: 6, md: 4 }}
                          _selected={{
                            color: "primary.600",
                            borderBottomColor: "primary.500",
                          }}
                          minW="fit-content"
                          fontSize={{ base: "md", md: "sm" }}
                          minH="48px"
                        >
                          My Bookings
                        </Tab>
                        {profile.role === "guide" && (
                          <Tab
                            fontWeight="semibold"
                            py={{ base: 4, md: 3 }}
                            px={{ base: 6, md: 4 }}
                            _selected={{
                              color: "primary.600",
                              borderBottomColor: "primary.500",
                            }}
                            minW="fit-content"
                            fontSize={{ base: "md", md: "sm" }}
                            minH="48px"
                          >
                            Payment Tracking
                          </Tab>
                        )}
                      </TabList>

                      <TabPanels minH={{ base: "auto", md: "400px" }}>
                        {/* Tours/Tour Requests Panel */}
                        <TabPanel p={{ base: 4, md: 4 }}>
                          {activeTabIndex === 0 && <ToursList />}
                        </TabPanel>

                        {/* Bookings Panel */}
                        <TabPanel p={{ base: 4, md: 4 }}>
                          {activeTabIndex === 1 && (
                            <BookingsList showTitle={false} />
                          )}
                        </TabPanel>

                        {/* Payment Tracking Panel - Guide Only */}
                        {profile.role === "guide" && (
                          <TabPanel p={{ base: 4, md: 4 }}>
                            {activeTabIndex === 2 && <PaymentTracker />}
                          </TabPanel>
                        )}
                      </TabPanels>
                    </Tabs>
                  </Box>
                )}
              </GridItem>
            </Grid>
          </Container>

          {/* Create Tour Modal */}
          <Modal
            isOpen={isCreateOpen}
            onClose={onCreateClose}
            size={{ base: "full", md: "xl" }}
            scrollBehavior="inside"
          >
            <ModalOverlay />
            <ModalContent
              borderRadius={{ base: "none", md: "xl" }}
              maxH={{ base: "100vh", md: "90vh" }}
              overflowY="auto"
              w={{ base: "100vw", md: "xl" }}
              maxW={{ base: "100vw", md: "xl" }}
              mx={{ base: 0, md: "auto" }}
              my={{ base: 0, md: 0 }}
            >
              <ModalCloseButton 
                size="lg" 
                mt={{ base: 2, md: 4 }} 
                mr={{ base: 2, md: 4 }}
                minH="48px"
                minW="48px"
              />
              <ModalBody pt={{ base: 16, md: 10 }} pb={6}>
                <TourForm
                  onSuccess={handleCreateSuccess}
                  onCancel={onCreateClose}
                />
              </ModalBody>
            </ModalContent>
          </Modal>
        </PaymentStatsProvider>
      </BookingProvider>
    </ToursProvider>
  );
};

export default Dashboard;