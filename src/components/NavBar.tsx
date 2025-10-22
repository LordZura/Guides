// NavBar_improved.tsx
import { useEffect, useRef, useCallback, useState } from "react";
import type { ReactNode } from "react";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
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
  VisuallyHidden,
  type LinkProps,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  useColorModeValue,
  Tooltip,
} from "@chakra-ui/react";
import { HamburgerIcon, CloseIcon } from "@chakra-ui/icons";
import {
  FiSearch,
  FiChevronDown,
  FiHome,
  FiUser,
  FiPlusCircle,
  FiClock,
} from "react-icons/fi";
import { useAuth } from "../contexts/AuthProvider";
import { useModal } from "../contexts/ModalContext";
import NotificationBadge from "./NotificationBadge";
import SettingsModal from "./SettingsModal";

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
const EDGE_ZONE = 40; // px from right edge to allow opening swipe
const HORIZ_RATIO = 1.5; // must be this times larger than vertical movement

const BottomNav = ({ onNavigate }: { onNavigate: (to: string) => void }) => {
  const location = useLocation();
  const items = [
    { to: "/", label: "Home", icon: FiHome },
    { to: "/search", label: "Search", icon: FiSearch }, // <-- use FiSearch here
    { to: "/create", label: "Create", icon: FiPlusCircle, isPrimary: true },
    { to: "/history", label: "History", icon: FiClock },
    { to: "/profile", label: "Profile", icon: FiUser },
  ];

  return (
    <Box
      className="bottom-nav"
      position="fixed"
      bottom="env(safe-area-inset-bottom)"
      left={0}
      right={0}
      zIndex={1200}
      display={{ base: "block", md: "none" }}
      px={4}
      pb="env(safe-area-inset-bottom)"
    >
      <Flex
        mx="auto"
        maxW="container.md"
        bg={useColorModeValue("rgba(255,255,255,0.94)", "rgba(20,20,20,0.72)")}
        borderRadius="2xl"
        boxShadow="lg"
        align="center"
        justify="space-between"
        px={3}
        py={3}
        minH="64px"
        backdropFilter="blur(8px) saturate(120%)"
      >
        {items.map((it) => {
          const Icon = it.icon as any;
          const active = location.pathname === it.to;

          // primary button (center) has special treatment
          if (it.isPrimary) {
            return (
              <Box key={it.to} transform="translateY(-10px)">
                <Tooltip label={it.label} placement="top" hasArrow>
                  <IconButton
                    aria-label={it.label}
                    onClick={() => onNavigate(it.to)}
                    icon={<Icon size={20} />}
                    borderRadius="full"
                    boxShadow="md"
                    size="lg"
                    h="56px"
                    w="56px"
                    bgGradient="linear(to-b, secondary.400, secondary.600)"
                    color="white"
                    _hover={{ transform: "scale(1.03)" }}
                  />
                </Tooltip>
              </Box>
            );
          }

          return (
            <Button
              key={it.to}
              variant="ghost"
              onClick={() => onNavigate(it.to)}
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              minW="56px"
              px={3}
              py={1}
              fontSize="xs"
              color={active ? "secondary.600" : "gray.600"}
            >
              <Icon size={18} />
              <Text fontSize="10px" mt={1}>
                {it.label}
              </Text>
            </Button>
          );
        })}
      </Flex>
    </Box>
  );
};

const Navbar = () => {
  const { user, signOut } = useAuth();
  const { openAuthModal } = useModal();
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclosure();
  const [searchValue, setSearchValue] = useState("");

  const bg = useColorModeValue("rgba(255,255,255,0.86)", "rgba(10,10,10,0.6)");
  const border = useColorModeValue("transparent", "rgba(255,255,255,0.04)");

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
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

  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`, {
        state: { from: location.pathname },
      });
      setSearchValue("");
    }
  };

  const handleProfileClick = () => {
    if ((user as any)?.id) {
      navigate(`/profile/${(user as any).id}`);
    }
  };

  const handleSettingsClick = () => {
    onSettingsOpen();
  };

  const displayName =
    (user as any)?.name || (user as any)?.displayName || (user as any)?.email || "User";

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
      if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy) * HORIZ_RATIO) {
        // open if swipe left from right edge and drawer closed
        const screenWidth = window.innerWidth;
        if (!isOpenRef.current && dx < 0 && touchStartX.current >= screenWidth - EDGE_ZONE) {
          onOpen();
        }
        // close if swipe right when drawer open
        else if (isOpenRef.current && dx > 0) {
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
    <>
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
        borderBottomLeftRadius={{ base: 0, md: "12px" }}
        borderBottomRightRadius={{ base: 0, md: "12px" }}
        overflow="hidden"
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
                  bgGradient="linear(to-b, secondary.400, secondary.600)"
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
                    color="secondary.600"
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
            mx={{ base: 3, md: 4 }}
            flex="1"
            minW={0}
            maxW={{ base: "100%", md: "500px", lg: "600px" }}
          >
            <InputGroup w="100%">
              <InputLeftElement pointerEvents="none" w="3.25rem" h="100%" top="0">
                <Box h="100%" display="flex" alignItems="center" justifyContent="center" pl={1}>
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
                pl={{ base: "3.5rem", md: "3.5rem" }}
                pr="3"
                height="44px"
                transition="box-shadow 0.15s, border-color 0.15s, background 0.15s"
                _hover={{ boxShadow: "sm" }}
                _focus={{
                  boxShadow: "0 0 0 3px rgba(99, 102, 241, 0.12)",
                  borderColor: "secondary.400",
                  bg: inputBg,
                }}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch(searchValue);
                  }
                }}
              />
            </InputGroup>
          </Box>

          {/* Desktop nav */}
          <HStack
            spacing={2}
            display={{ base: "none", md: "flex" }}
            alignItems="center"
            ml="auto"
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
                  <MenuButton as={Button} rightIcon={<FiChevronDown />} variant="ghost" px={3} py={2} borderRadius="full">
                    <HStack spacing={3}>
                      <Avatar size="sm" name={displayName} />
                      <Text display={{ base: "none", md: "block" }} fontSize="sm" fontWeight="medium">
                        {displayName.split(" ")[0]}
                      </Text>
                    </HStack>
                  </MenuButton>
                  <MenuList>
                    <MenuItem onClick={handleProfileClick}>Profile</MenuItem>
                    <MenuItem onClick={handleSettingsClick}>Settings</MenuItem>
                    <MenuItem onClick={handleSignOut}>Sign Out</MenuItem>
                  </MenuList>
                </Menu>
              </>
            ) : (
              <Button onClick={handleGetStarted} colorScheme="secondary" variant="solid" size="sm" borderRadius="full" px={5}>
                Get Started
              </Button>
            )}
          </HStack>

          {/* Mobile menu button */}
          <IconButton
            aria-label="Toggle menu"
            display={{ base: "flex", md: "none" }}
            onClick={() => (isOpen ? onClose() : onOpen())}
            icon={isOpen ? <CloseIcon w={5} h={5} /> : <HamburgerIcon w={6} h={6} />}
            variant="ghost"
            ml="auto"
            mr={{ base: -4, md: 0 }}
            minW="44px"
            minH="44px"
          />
        </Flex>

        {/* Mobile Drawer (slides in from the right) */}
        <Drawer placement="right" onClose={onClose} isOpen={isOpen} size="xs">
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader borderBottomWidth="1px">Menu</DrawerHeader>
            <DrawerBody>
              <Stack spacing={3} pt={3}>
                {/* Mobile search — same improved layout */}
                <InputGroup w="100%">
                  <InputLeftElement pointerEvents="none" w="3.25rem" h="100%" top="0">
                    <Box h="100%" display="flex" alignItems="center" justifyContent="center" pl={1}>
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
                      boxShadow: "0 0 0 3px rgba(99, 102, 241, 0.12)",
                      borderColor: "secondary.400",
                      bg: inputBg,
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const q = (e.currentTarget as HTMLInputElement).value.trim();
                        if (q) {
                          handleSearch(q);
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
                      colorScheme="secondary"
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
                    colorScheme="secondary"
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

        {/* Settings Modal */}
        <SettingsModal isOpen={isSettingsOpen} onClose={onSettingsClose} />
      </Box>

      {/* Small bottom nav for mobile devices (mirrors the image style) */}
      <BottomNav onNavigate={(to) => navigate(to)} />
    </>
  );
};

export default Navbar;