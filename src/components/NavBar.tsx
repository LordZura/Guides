// src/components/NavBar.tsx
import React, { useEffect, useRef, useCallback } from "react";
import type { ReactNode } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Box,
  Flex,
  Text,
  Button,
  Stack,
  IconButton,
  Link,
  useDisclosure,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  InputGroup,
  InputLeftElement,
  Input,
  useColorModeValue,
  Spacer,
  VisuallyHidden,
  type LinkProps,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
} from "@chakra-ui/react";
import { HamburgerIcon, CloseIcon } from "@chakra-ui/icons";
import { FiSearch, FiChevronDown } from "react-icons/fi";
import { useAuth } from "../contexts/AuthProvider";
import { useModal } from "../contexts/ModalContext";
import NotificationBadge from "./NotificationBadge";

interface NavLinkProps extends LinkProps {
  to: string;
  children: ReactNode;
  onClick?: () => void;
}

const NavLink = ({ to, children, onClick, ...rest }: NavLinkProps) => (
  <Link
    as={RouterLink}
    to={to}
    onClick={onClick}
    px={{ base: 3, md: 4 }}
    py={{ base: 2, md: 2 }}
    borderRadius="lg"
    fontWeight="medium"
    display="block"
    _hover={{
      textDecoration: "none",
      transform: "translateY(-2px)",
    }}
    transition="all 0.15s ease"
    fontSize={{ base: "md", md: "sm" }}
    color="gray.700"
    {...rest}
  >
    {children}
  </Link>
);

const SWIPE_THRESHOLD = 50; // minimum px for a swipe to register
const EDGE_ZONE = 40; // px from left edge to allow opening swipe
const HORIZ_RATIO = 1.5; // must be this times larger than vertical movement

const Navbar = () => {
  const { user, signOut } = useAuth();
  const { openAuthModal } = useModal();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const bg = useColorModeValue("rgba(255,255,255,0.92)", "rgba(26,32,44,0.92)");
  const border = useColorModeValue("gray.200", "gray.700");

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      // avoid crashing if signOut fails
    } finally {
      navigate("/explore");
      onClose();
    }
  };

  const handleGetStarted = () => {
    openAuthModal();
    onClose();
  };

  const displayName =
    (user as any)?.name ||
    (user as any)?.displayName ||
    (user as any)?.email ||
    "User";

  const inputBg = useColorModeValue("white", "gray.800");
  const inputBorder = useColorModeValue("gray.200", "gray.700");

  /* ---------- swipe handling (open/close drawer) ---------- */
  const isOpenRef = useRef(isOpen);
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchActive = useRef(false);

  const onTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
    touchActive.current = true;
  }, []);

  const onTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!touchActive.current) return;
      if (e.changedTouches.length === 0) {
        touchActive.current = false;
        return;
      }
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStartX.current;
      const dy = t.clientY - touchStartY.current;

      // horizontal swipe check
      if (
        Math.abs(dx) > SWIPE_THRESHOLD &&
        Math.abs(dx) > Math.abs(dy) * HORIZ_RATIO
      ) {
        // open if swipe right from left edge and drawer closed
        if (!isOpenRef.current && dx > 0 && touchStartX.current <= EDGE_ZONE) {
          onOpen();
        }
        // close if swipe left when drawer open
        else if (isOpenRef.current && dx < 0) {
          onClose();
        }
      }

      touchActive.current = false;
    },
    [onOpen, onClose]
  );

  useEffect(() => {
    // attach to the document so swipe works regardless of where the touch starts
    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart as EventListener);
      document.removeEventListener("touchend", onTouchEnd as EventListener);
    };
  }, [onTouchStart, onTouchEnd]);

  /* ---------- UI ---------- */
  return (
    <Box
      as="nav"
      position="fixed"
      top="0"
      w="100%"
      zIndex={1100}
      backdropFilter="saturate(130%) blur(6px)"
      bg={bg}
      borderBottom="1px"
      borderColor={border}
      boxShadow="sm"
    >
      <Flex
        align="center"
        maxW="container.xl"
        mx="auto"
        px={{ base: 4, md: 6 }}
        h={{ base: 14, md: 16 }}
      >
        {/* Left: Logo */}
        <Flex align="center" minW="0">
          <Link as={RouterLink} to="/" _hover={{ textDecoration: "none" }}>
            <HStack spacing={3} alignItems="center">
              <Box
                aria-hidden
                w={{ base: 8, md: 10 }}
                h={{ base: 8, md: 10 }}
                borderRadius="md"
                bgGradient="linear(to-b, primary.400, primary.600)"
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="white"
                fontWeight="bold"
                boxShadow="md"
              >
                TG
              </Box>
              <Box overflow="hidden" minW={0}>
                <Text
                  fontSize={{ base: "lg", md: "2xl" }}
                  fontWeight="black"
                  color="primary.600"
                  letterSpacing="tight"
                  isTruncated
                >
                  TourGuideHub
                </Text>
                <VisuallyHidden>Go to homepage</VisuallyHidden>
              </Box>
            </HStack>
          </Link>
        </Flex>

        {/* Middle: search (hidden on very small screens) */}
        <Box
          display={{ base: "none", sm: "block" }}
          mx={6}
          flex="1"
          minW={0}
          maxW={{ base: "100%", md: "640px" }}
        >
          {/* InputGroup fills the available area, allowing the search to be as long as possible */}
          <InputGroup w="100%">
            {/* fixed-width left element keeps the icon centered and ensures predictable padding */}
            <InputLeftElement
              pointerEvents="none"
              w="3.25rem" // ~52px - predictable padding
              h="100%"
              top="0"
            >
              <Box
                h="100%"
                display="flex"
                alignItems="center"
                justifyContent="center"
                pl={1}
              >
                <FiSearch />
              </Box>
            </InputLeftElement>

            <Input
              placeholder="Search guides, tours, posts..."
              bg={inputBg}
              border="1px"
              borderColor={inputBorder}
              borderRadius="full"
              size="md"
              pl={{ base: "3.5rem", md: "3.5rem" }} // ensures text doesn't overlap icon
              pr="3"
              height="44px"
              transition="box-shadow 0.15s, border-color 0.15s, background 0.15s"
              _hover={{ boxShadow: "sm" }}
              _focus={{
                boxShadow: "0 0 0 3px rgba(99,102,241,0.12)", // subtle focus ring
                borderColor: "primary.400",
                bg: inputBg,
              }}
              _focusVisible={{
                boxShadow: "0 0 0 3px rgba(99,102,241,0.12)",
                borderColor: "primary.400",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const q = (e.currentTarget as HTMLInputElement).value.trim();
                  if (q) {
                    navigate(`/search?q=${encodeURIComponent(q)}`);
                  }
                }
              }}
            />
          </InputGroup>
        </Box>

        <Spacer />

        {/* Desktop nav */}
        <HStack
          spacing={2}
          display={{ base: "none", md: "flex" }}
          alignItems="center"
        >
          <NavLink to="/explore">Explore</NavLink>
          <NavLink to="/guides">Guides</NavLink>
          <NavLink to="/tours">Tours</NavLink>
          <NavLink to="/posts">Posts</NavLink>

          {user ? (
            <>
              <NotificationBadge />
              <NavLink to="/dashboard">Dashboard</NavLink>

              <Menu>
                <MenuButton
                  as={Button}
                  rightIcon={<FiChevronDown />}
                  variant="ghost"
                  px={3}
                  py={2}
                  borderRadius="full"
                >
                  <HStack spacing={3}>
                    <Avatar size="sm" name={displayName} />
                    <Text
                      display={{ base: "none", md: "block" }}
                      fontSize="sm"
                      fontWeight="medium"
                    >
                      {displayName.split(" ")[0]}
                    </Text>
                  </HStack>
                </MenuButton>
                <MenuList>
                  <MenuItem as={RouterLink} to="/profile">
                    Profile
                  </MenuItem>
                  <MenuItem as={RouterLink} to="/settings">
                    Settings
                  </MenuItem>
                  <MenuItem onClick={handleSignOut}>Sign Out</MenuItem>
                </MenuList>
              </Menu>
            </>
          ) : (
            <Button
              onClick={handleGetStarted}
              colorScheme="primary"
              variant="solid"
              size="sm"
              borderRadius="full"
              px={5}
            >
              Get Started
            </Button>
          )}
        </HStack>

        {/* Mobile menu button */}
        <IconButton
          aria-label="Toggle menu"
          display={{ base: "flex", md: "none" }}
          onClick={() => (isOpenRef.current ? onClose() : onOpen())}
          icon={
            isOpenRef.current ? (
              <CloseIcon w={5} h={5} />
            ) : (
              <HamburgerIcon w={6} h={6} />
            )
          }
          variant="ghost"
          ml={2}
          minW="44px"
          minH="44px"
        />
      </Flex>

      {/* Mobile Drawer (slides in from the left) */}
      <Drawer placement="left" onClose={onClose} isOpen={isOpen} size="xs">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">Menu</DrawerHeader>
          <DrawerBody>
            <Stack spacing={3} pt={3}>
              {/* Mobile search — same improved layout */}
              <InputGroup w="100%">
                <InputLeftElement
                  pointerEvents="none"
                  w="3.25rem"
                  h="100%"
                  top="0"
                >
                  <Box
                    h="100%"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    pl={1}
                  >
                    <FiSearch />
                  </Box>
                </InputLeftElement>

                <Input
                  placeholder="Search guides, tours..."
                  size="md"
                  bg={inputBg}
                  border="1px"
                  borderColor={inputBorder}
                  borderRadius="full"
                  pl={{ base: "3.5rem" }}
                  pr="3"
                  height="44px"
                  _focus={{
                    boxShadow: "0 0 0 3px rgba(99,102,241,0.12)",
                    borderColor: "primary.400",
                    bg: inputBg,
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const q = (
                        e.currentTarget as HTMLInputElement
                      ).value.trim();
                      if (q) {
                        navigate(`/search?q=${encodeURIComponent(q)}`);
                        onClose();
                      }
                    }
                  }}
                />
              </InputGroup>

              <NavLink to="/explore" onClick={onClose}>
                Explore
              </NavLink>
              <NavLink to="/guides" onClick={onClose}>
                Guides
              </NavLink>
              <NavLink to="/tours" onClick={onClose}>
                Tours
              </NavLink>
              <NavLink to="/posts" onClick={onClose}>
                Posts
              </NavLink>

              {user ? (
                <>
                  <HStack spacing={3} px={2} pt={2}>
                    <NotificationBadge />
                    <Avatar size="sm" name={displayName} />
                    <Box>
                      <Text fontSize="sm" fontWeight="semibold" lineHeight="1">
                        {displayName}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        Member
                      </Text>
                    </Box>
                  </HStack>

                  <Button
                    onClick={() => {
                      navigate("/dashboard");
                      onClose();
                    }}
                    variant="ghost"
                    justifyContent="flex-start"
                    w="full"
                    px={3}
                    py={3}
                    borderRadius="md"
                  >
                    Dashboard
                  </Button>

                  <Button
                    onClick={handleSignOut}
                    variant="outline"
                    justifyContent="flex-start"
                    w="full"
                    px={3}
                    py={3}
                    borderRadius="md"
                    colorScheme="primary"
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => {
                    handleGetStarted();
                  }}
                  variant="solid"
                  colorScheme="primary"
                  w="full"
                  px={3}
                  py={3}
                  borderRadius="md"
                >
                  Get Started
                </Button>
              )}
            </Stack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default Navbar;
