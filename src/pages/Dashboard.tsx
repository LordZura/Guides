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

/**
 * Responsive Dashboard
 *
 * Fixes applied:
 * - Ensure grid and flex children can shrink: minW={0} where appropriate.
 * - Use responsive size props for avatars, paddings, fonts.
 * - Use maxW="100%" and boxSizing="border-box" on major containers to prevent overflow.
 * - Ensure long text wraps with wordBreak and overflowWrap.
 * - Make Buttons full width on base screens to avoid layout breaking.
 * - Constrain ModalContent width on small screens and allow scrollBehavior="inside".
 * - Tabs: allow horizontal scroll on very small screens and wrap on small/medium screens.
 * - TabPanels/TabPanel set minW={0} so inner lists/cards can shrink.
 */

const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onClose: onCreateClose,
  } = useDisclosure();
  const cardBg = useColorModeValue("white", "gray.700");
  const toast = useToast();

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
          <Container
            maxW="container.xl"
            p={{ base: 3, md: 6 }}
            // ensure container doesn't cause overflow
            boxSizing="border-box"
          >
            <Grid
              // responsive columns: single column on mobile, narrow sidebar on md+, flexible on lg
              templateColumns={{
                base: "1fr",
                md: "minmax(220px, 320px) 1fr",
                lg: "280px 1fr",
              }}
              gap={{ base: 4, md: 6 }}
              alignItems="start"
            >
              {/* Profile Sidebar */}
              <GridItem
                // allow shrinking on small screens
                minW={0}
                w="100%"
                boxSizing="border-box"
              >
                <Card
                  bg={cardBg}
                  boxShadow="xl"
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor="gray.100"
                  // make sure the card doesn't overflow parent width
                  w="100%"
                  maxW="100%"
                  boxSizing="border-box"
                >
                  <CardHeader pb={4}>
                    <Flex
                      direction="column"
                      align="center"
                      textAlign="center"
                      minW={0}
                    >
                      <Avatar
                        src={profile.avatar_url || DEFAULT_AVATAR_URL}
                        name={profile.full_name}
                        // responsive avatar sizes
                        boxSize={{ base: "64px", md: "88px", lg: "100px" }}
                        mb={4}
                        borderWidth="4px"
                        borderColor="primary.100"
                      />

                      <Heading
                        // allow heading to wrap and shrink
                        size={{ base: "md", md: "lg" }}
                        mb={2}
                        color="gray.800"
                        fontSize={{ base: "lg", md: "xl" }}
                        noOfLines={2}
                        wordBreak="break-word"
                      >
                        {profile.full_name}
                      </Heading>

                      <Badge
                        colorScheme={profile.role === "guide" ? "green" : "blue"}
                        mt={2}
                        fontSize={{ base: "xs", md: "sm" }}
                        px={3}
                        py={1}
                        borderRadius="full"
                        whiteSpace="nowrap"
                      >
                        {profile.role.charAt(0).toUpperCase() +
                          profile.role.slice(1)}
                      </Badge>

                      <Button
                        leftIcon={<EditIcon />}
                        // responsive button sizes - full width on base to avoid layout issues
                        size={{ base: "md", md: "sm" }}
                        variant="outline"
                        colorScheme="primary"
                        mt={4}
                        onClick={handleEditClick}
                        borderRadius="full"
                        px={{ base: 6, md: 4 }}
                        minH="44px"
                        _hover={{
                          transform: "translateY(-1px)",
                          boxShadow: "md",
                        }}
                        transition="all 0.15s"
                        fontSize={{ base: "md", md: "sm" }}
                        w={{ base: "100%", md: "full" }}
                      >
                        Edit Profile
                      </Button>
                    </Flex>
                  </CardHeader>

                  <CardBody pt={4}>
                    <Stack spacing={{ base: 3, md: 4 }} minW={0}>
                      {profile.phone && (
                        <Flex align="center" minW={0}>
                          <Icon
                            as={MdPerson}
                            color="primary.500"
                            mr={3}
                            boxSize={{ base: "4", md: "5" }}
                          />
                          <Text
                            fontSize={{ base: "sm", md: "sm" }}
                            fontWeight="medium"
                            color="gray.700"
                            noOfLines={1}
                            overflow="hidden"
                            textOverflow="ellipsis"
                          >
                            {profile.phone}
                          </Text>
                        </Flex>
                      )}

                      {profile.location && (
                        <Flex align="center" minW={0}>
                          <Icon
                            as={MdLocationOn}
                            color="primary.500"
                            mr={3}
                            boxSize={{ base: "4", md: "5" }}
                          />
                          <Text
                            fontSize={{ base: "sm", md: "sm" }}
                            fontWeight="medium"
                            color="gray.700"
                            noOfLines={1}
                            overflow="hidden"
                            textOverflow="ellipsis"
                          >
                            {profile.location}
                          </Text>
                        </Flex>
                      )}

                      {profile.languages && profile.languages.length > 0 && (
                        <Flex align="center" minW={0}>
                          <Icon
                            as={MdLanguage}
                            color="primary.500"
                            mr={3}
                            boxSize={{ base: "4", md: "5" }}
                          />
                          <Text
                            fontSize={{ base: "sm", md: "sm" }}
                            fontWeight="medium"
                            color="gray.700"
                            // allow languages to wrap if needed
                            wordBreak="break-word"
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
                            fontSize={{ base: "sm", md: "sm" }}
                          >
                            Bio
                          </Text>
                          <Text
                            fontSize={{ base: "sm", md: "sm" }}
                            color="gray.600"
                            lineHeight="1.5"
                            wordBreak="break-word"
                            // limit height a bit on mobile so the sidebar stays compact
                            maxH={{ base: "6rem", md: "none" }}
                            overflowY="auto"
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
                            fontSize={{ base: "sm", md: "sm" }}
                          >
                            Specialties
                          </Text>
                          <Text
                            fontSize={{ base: "sm", md: "sm" }}
                            color="gray.600"
                            lineHeight="1.5"
                            wordBreak="break-word"
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
                            fontSize={{ base: "sm", md: "sm" }}
                          >
                            Interests
                          </Text>
                          <Text
                            fontSize={{ base: "sm", md: "sm" }}
                            wordBreak="break-word"
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
                          fontSize={{ base: "sm", md: "sm" }}
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
              <GridItem minW={0} w="100%" boxSizing="border-box">
                {isEditing ? (
                  <ProfileEditor onSave={handleEditComplete} />
                ) : (
                  <Box minW={0}>
                    <Flex
                      justify="space-between"
                      align="center"
                      mb={6}
                      direction={{ base: "column", sm: "row" }}
                      gap={{ base: 4, sm: 0 }}
                    >
                      <Heading
                        size={{ base: "md", md: "lg" }}
                        color="gray.800"
                        textAlign={{ base: "center", sm: "left" }}
                        fontSize={{ base: "lg", md: "2xl" }}
                        noOfLines={2}
                        wordBreak="break-word"
                      >
                        {profile.role === "guide"
                          ? "Guide Dashboard"
                          : "Tourist Dashboard"}
                      </Heading>

                      <Button
                        leftIcon={<AddIcon />}
                        colorScheme="primary"
                        onClick={onCreateOpen}
                        size={{ base: "md", md: "md" }}
                        borderRadius="full"
                        px={{ base: 6, md: 6 }}
                        minH="44px"
                        _hover={{
                          transform: "translateY(-1px)",
                          boxShadow: "lg",
                        }}
                        transition="all 0.15s"
                        fontSize={{ base: "md", md: "sm" }}
                        // full width on small screens so it doesn't cause overflow
                        w={{ base: "100%", sm: "auto" }}
                        isFullWidth={{ base: true, sm: false } as any}
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
                      // ensure the tabs container won't overflow
                      w="100%"
                      boxSizing="border-box"
                    >
                      <TabList
                        borderBottomColor="gray.200"
                        overflowX={{ base: "auto", md: "hidden" }}
                        overflowY="hidden"
                        flexWrap={{ base: "nowrap", md: "wrap" }}
                        // allow the TabList to shrink when available
                        minW={0}
                        css={{
                          "&::-webkit-scrollbar": {
                            height: "6px",
                          },
                          "&::-webkit-scrollbar-thumb": {
                            background: "rgba(0, 0, 0, 0.2)",
                            borderRadius: "6px",
                          },
                        }}
                      >
                        <Tab
                          fontWeight="semibold"
                          py={{ base: 3, md: 3 }}
                          px={{ base: 4, md: 4 }}
                          _selected={{
                            color: "primary.600",
                            borderBottomColor: "primary.500",
                          }}
                          minW={{ base: "auto", md: 0 }}
                          // allow tab to shrink
                          minH="44px"
                          whiteSpace="nowrap"
                          flex={{ base: "0 0 auto", md: "1 1 auto" }}
                          overflow="hidden"
                          textOverflow="ellipsis"
                        >
                          My{" "}
                          {profile.role === "guide" ? "Tours" : "Tour Requests"}
                        </Tab>

                        <Tab
                          fontWeight="semibold"
                          py={{ base: 3, md: 3 }}
                          px={{ base: 4, md: 4 }}
                          _selected={{
                            color: "primary.600",
                            borderBottomColor: "primary.500",
                          }}
                          minW={{ base: "auto", md: 0 }}
                          minH="44px"
                          whiteSpace="nowrap"
                          flex={{ base: "0 0 auto", md: "1 1 auto" }}
                          overflow="hidden"
                          textOverflow="ellipsis"
                        >
                          My Bookings
                        </Tab>

                        {profile.role === "guide" && (
                          <Tab
                            fontWeight="semibold"
                            py={{ base: 3, md: 3 }}
                            px={{ base: 4, md: 4 }}
                            _selected={{
                              color: "primary.600",
                              borderBottomColor: "primary.500",
                            }}
                            minW={{ base: "auto", md: 0 }}
                            minH="44px"
                            whiteSpace="nowrap"
                            flex={{ base: "0 0 auto", md: "1 1 auto" }}
                            overflow="hidden"
                            textOverflow="ellipsis"
                          >
                            Payment Tracking
                          </Tab>
                        )}
                      </TabList>

                      <TabPanels
                        minH={{ base: "auto", md: "300px" }}
                        maxW="100%"
                        overflowX="hidden"
                        // ensure TabPanels shrink properly
                        boxSizing="border-box"
                        minW={0}
                      >
                        {/* Tours/Tour Requests Panel */}
                        <TabPanel
                          p={{ base: 4, md: 4 }}
                          maxW="100%"
                          overflowX="auto"
                          minW={0}
                        >
                          {/* Render only when active to reduce layout thrash */}
                          {activeTabIndex === 0 && (
                            <Box minW={0}>
                              <ToursList />
                            </Box>
                          )}
                        </TabPanel>

                        {/* Bookings Panel */}
                        <TabPanel
                          p={{ base: 4, md: 4 }}
                          maxW="100%"
                          overflowX="auto"
                          minW={0}
                        >
                          {activeTabIndex === 1 && (
                            <Box minW={0}>
                              <BookingsList showTitle={false} />
                            </Box>
                          )}
                        </TabPanel>

                        {/* Payment Tracking Panel - Guide Only */}
                        {profile.role === "guide" && (
                          <TabPanel
                            p={{ base: 4, md: 4 }}
                            maxW="100%"
                            overflowX="auto"
                            minW={0}
                          >
                            {activeTabIndex === 2 && (
                              <Box minW={0}>
                                <PaymentTracker />
                              </Box>
                            )}
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
            size="full"
            scrollBehavior="inside"
          >
            <ModalOverlay />
            <ModalContent
              // Constrain the modal so content fits on smaller screens
              borderRadius={{ base: "none", md: "xl" }}
              maxH={{ base: "100vh", md: "90vh" }}
              overflowY="auto"
              w={{ base: "100vw", md: "xl" }}
              maxW={{ base: "100vw", md: "xl" }}
              mx={{ base: 0, md: "auto" }}
              my={0}
              boxSizing="border-box"
            >
              <ModalCloseButton
                size="lg"
                mt={{ base: 2, md: 4 }}
                mr={{ base: 2, md: 4 }}
                minH="44px"
                minW="44px"
              />
              <ModalBody pt={{ base: 16, md: 10 }} pb={6}>
                <Box minW={0}>
                  <TourForm onSuccess={handleCreateSuccess} onCancel={onCreateClose} />
                </Box>
              </ModalBody>
            </ModalContent>
          </Modal>
        </PaymentStatsProvider>
      </BookingProvider>
    </ToursProvider>
  );
};

export default Dashboard;
