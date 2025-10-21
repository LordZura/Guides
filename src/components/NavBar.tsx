import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  Text,
  Button,
  Stack,
  IconButton,
  Link,
  HStack,
  VStack,
  Avatar,
  Input,
  InputGroup,
  InputLeftElement,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  useDisclosure,
  useBreakpointValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Spacer,
  chakra,
} from '@chakra-ui/react';

import {
  HamburgerIcon,
  CloseIcon,
  SearchIcon,
  BellIcon,
} from '@chakra-ui/icons';

import { useAuth } from '../contexts/AuthProvider';
import { useModal } from '../contexts/ModalContext';
import NotificationBadge from './NotificationBadge';

// A compact, touch-friendly, accessible responsive navbar.
// Key improvements vs. original:
// - Drawer-based mobile navigation (bigger tap targets, full-height scrollable menu)
// - Subtle glass/blur header for modern look
// - Compact search on desktop, search input inside drawer for mobile
// - Clear visual grouping & consistent touch sizes
// - Avatar + menu for user actions and notifications

const NavLink = ({ to, children, onClick }) => (
  <Link
    as={RouterLink}
    to={to}
    onClick={onClick}
    px={{ base: 3, md: 4 }}
    py={{ base: 3, md: 2 }}
    borderRadius="md"
    fontWeight="600"
    color="gray.700"
    _hover={{ bg: 'primary.50', color: 'primary.700', transform: 'translateY(-1px)' }}
    transition="all 0.18s"
    display="block"
    fontSize={{ base: 'md', md: 'sm' }}
  >
    {children}
  </Link>
);

const Navbar = () => {
  const { user, signOut } = useAuth();
  const { openAuthModal } = useModal();
  const navigate = useNavigate();

  // Use a drawer on mobile for nicer UX
  const {
    isOpen: isDrawerOpen,
    onOpen: onDrawerOpen,
    onClose: onDrawerClose,
  } = useDisclosure();

  const showSearchInline = useBreakpointValue({ base: false, md: true });

  const handleSignOut = async () => {
    await signOut();
    navigate('/explore');
    onDrawerClose();
  };

  const handleGetStarted = () => {
    openAuthModal();
    onDrawerClose();
  };

  return (
    <Box
      as="nav"
      position="fixed"
      top={0}
      left={0}
      right={0}
      zIndex={1000}
      px={{ base: 3, md: 6 }}
      py={{ base: 2, md: 3 }}
      backdropFilter="saturate(120%) blur(6px)"
      bg={{ base: 'rgba(255,255,255,0.86)', md: 'rgba(255,255,255,0.75)' }}
      borderBottomWidth="1px"
      borderColor="gray.100"
      boxShadow="sm"
    >
      <Flex
        align="center"
        maxW="container.xl"
        mx="auto"
        gap={3}
      >
        {/* Left: Brand */}
        <HStack spacing={3} align="center">
          <Link as={RouterLink} to="/" _hover={{ textDecoration: 'none' }}>
            <HStack spacing={2} align="center">
              <Box
                aria-hidden
                w={{ base: 8, md: 10 }}
                h={{ base: 8, md: 10 }}
                borderRadius="lg"
                display="flex"
                alignItems="center"
                justifyContent="center"
                bgGradient="linear(to-br, primary.500, primary.600)"
                color="white"
                fontWeight="700"
                boxShadow="md"
              >
                TG
              </Box>
              <Text
                fontSize={{ base: 'lg', md: '2xl' }}
                fontWeight="extrabold"
                color="primary.600"
                letterSpacing="tight"
                display={{ base: 'none', md: 'block' }}
              >
                TourGuideHub
              </Text>
            </HStack>
          </Link>
        </HStack>

        {/* Center: Desktop nav + search */}
        <Flex align="center" flex={1} display={{ base: 'none', md: 'flex' }}>
          <HStack spacing={1} ml={6}>
            <NavLink to="/explore">Explore</NavLink>
            <NavLink to="/guides">Guides</NavLink>
            <NavLink to="/tours">Tours</NavLink>
            <NavLink to="/posts">Posts</NavLink>
          </HStack>

          <Spacer />

          {showSearchInline && (
            <InputGroup maxW="360px" mr={4}>
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search places, guides..."
                size="sm"
                bg="gray.50"
                borderRadius="md"
                _placeholder={{ color: 'gray.400' }}
              />
            </InputGroup>
          )}

          <HStack spacing={3}>
            <NotificationBadge />

            {user ? (
              <Menu>
                <MenuButton as={Button} variant="ghost" px={0} minW={0}>
                  <HStack spacing={3} align="center">
                    <Avatar size="sm" name={user.displayName || user.email} src={user.photoURL} />
                    <chakra.span display={{ base: 'none', md: 'block' }} fontWeight={600} color="gray.700">
                      {user.displayName ? user.displayName.split(' ')[0] : 'Me'}
                    </chakra.span>
                  </HStack>
                </MenuButton>
                <MenuList>
                  <MenuItem as={RouterLink} to="/dashboard">Dashboard</MenuItem>
                  <MenuItem onClick={() => navigate('/profile')}>Profile</MenuItem>
                  <MenuItem onClick={handleSignOut}>Sign Out</MenuItem>
                </MenuList>
              </Menu>
            ) : (
              <Button
                onClick={openAuthModal}
                colorScheme="primary"
                size="sm"
                borderRadius="full"
                px={5}
              >
                Get Started
              </Button>
            )}
          </HStack>
        </Flex>

        {/* Mobile actions */}
        <HStack spacing={2} display={{ base: 'flex', md: 'none' }} ml="auto">
          <IconButton
            aria-label="Search"
            icon={<SearchIcon />}
            variant="ghost"
            onClick={onDrawerOpen}
            size="md"
            minW="44px"
          />

          <IconButton
            aria-label="Open menu"
            icon={<HamburgerIcon w={6} h={6} />}
            variant="ghost"
            onClick={onDrawerOpen}
            size="md"
            minW="44px"
          />
        </HStack>
      </Flex>

      {/* Mobile Drawer */}
      <Drawer placement="right" onClose={onDrawerClose} isOpen={isDrawerOpen} size="xs">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">Menu</DrawerHeader>
          <DrawerBody p={0}>
            <VStack spacing={0} align="stretch">
              {/* Optional search at top on mobile */}
              <Box px={4} py={3} borderBottomWidth="1px">
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.400" />
                  </InputLeftElement>
                  <Input placeholder="Search places, guides..." size="md" />
                </InputGroup>
              </Box>

              <Stack spacing={0} pt={2}>
                <NavLink to="/explore" onClick={onDrawerClose}>Explore</NavLink>
                <NavLink to="/guides" onClick={onDrawerClose}>Guides</NavLink>
                <NavLink to="/tours" onClick={onDrawerClose}>Tours</NavLink>
                <NavLink to="/posts" onClick={onDrawerClose}>Posts</NavLink>
              </Stack>

              <Box borderTopWidth="1px" pt={3} px={4}>
                {user ? (
                  <VStack align="stretch" spacing={3}>
                    <HStack justify="space-between">
                      <HStack spacing={3}>
                        <Avatar size="md" name={user.displayName || user.email} src={user.photoURL} />
                        <VStack spacing={0} align="start">
                          <Text fontWeight={700}>{user.displayName || (user.email || 'User')}</Text>
                          <Text fontSize="sm" color="gray.500">Member</Text>
                        </VStack>
                      </HStack>
                      <NotificationBadge />
                    </HStack>

                    <Button as={RouterLink} to="/dashboard" onClick={onDrawerClose} variant="ghost" justifyContent="flex-start">
                      Dashboard
                    </Button>

                    <Button onClick={handleSignOut} colorScheme="primary" width="full">
                      Sign Out
                    </Button>
                  </VStack>
                ) : (
                  <VStack spacing={3} align="stretch">
                    <Button onClick={handleGetStarted} colorScheme="primary" width="full">
                      Get Started
                    </Button>
                    <Button as={RouterLink} to="/explore" onClick={onDrawerClose} variant="ghost" justifyContent="flex-start">
                      Continue as guest
                    </Button>
                  </VStack>
                )}
              </Box>

              <Box py={4} px={4} borderTopWidth="1px">
                <HStack justify="space-between">
                  <Text fontSize="sm" color="gray.500">© {new Date().getFullYear()} TourGuideHub</Text>
                  <HStack spacing={3}>
                    <Link as={RouterLink} to="/about" onClick={onDrawerClose} fontSize="sm">About</Link>
                    <Link as={RouterLink} to="/help" onClick={onDrawerClose} fontSize="sm">Help</Link>
                  </HStack>
                </HStack>
              </Box>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default Navbar;
