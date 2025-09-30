import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  Text,
  Button,
  Stack,
  IconButton,
  Collapse,
  Link,
  useDisclosure,
  HStack,
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthProvider';
import { useModal } from '../contexts/ModalContext';
import NotificationBadge from './NotificationBadge';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const { openAuthModal } = useModal();
  const navigate = useNavigate();
  const { isOpen, onToggle, onClose } = useDisclosure();

  const handleSignOut = async () => {
    await signOut();
    navigate('/explore');
    onClose(); // Close mobile menu after sign out
  };

  const handleLinkClick = () => {
    onClose(); // Close mobile menu after navigation
  };

  return (
    <Box
      as="nav"
      bg="white"
      boxShadow="md"
      position="fixed"
      top="0"
      w="100%"
      zIndex={1000}
      borderBottom="1px"
      borderColor="gray.200"
    >
      <Flex
        h="20"
        alignItems="center"
        justifyContent="space-between"
        maxW="container.xl"
        mx="auto"
        px={{ base: 3, md: 6 }}
      >
        <Flex align="center">
          <Link as={RouterLink} to="/" _hover={{ textDecoration: 'none' }}>
            <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="black" color="primary.600" letterSpacing="tight">
              TourGuideHub
            </Text>
          </Link>
        </Flex>

        {/* Desktop nav */}
        <Stack
          direction="row"
          spacing={2}
          display={{ base: "none", md: "flex" }}
          alignItems="center"
        >
          <Link as={RouterLink} to="/explore" px={4} py={2} borderRadius="lg" fontWeight="semibold" color="gray.700" _hover={{ bg: 'primary.50', color: 'primary.700', transform: 'translateY(-1px)' }} transition="all 0.2s">
            Explore
          </Link>
          <Link as={RouterLink} to="/guides" px={4} py={2} borderRadius="lg" fontWeight="semibold" color="gray.700" _hover={{ bg: 'primary.50', color: 'primary.700', transform: 'translateY(-1px)' }} transition="all 0.2s">
            Guides
          </Link>
          <Link as={RouterLink} to="/tours" px={4} py={2} borderRadius="lg" fontWeight="semibold" color="gray.700" _hover={{ bg: 'primary.50', color: 'primary.700', transform: 'translateY(-1px)' }} transition="all 0.2s">
            Tours
          </Link>
          <Link as={RouterLink} to="/posts" px={4} py={2} borderRadius="lg" fontWeight="semibold" color="gray.700" _hover={{ bg: 'primary.50', color: 'primary.700', transform: 'translateY(-1px)' }} transition="all 0.2s">
            Posts
          </Link>

          {user ? (
            <HStack spacing={2}>
              <NotificationBadge />
              <Link as={RouterLink} to="/dashboard" px={4} py={2} borderRadius="lg" fontWeight="semibold" color="gray.700" _hover={{ bg: 'primary.50', color: 'primary.700', transform: 'translateY(-1px)' }} transition="all 0.2s">
                Dashboard
              </Link>
              <Button
                ml={4}
                onClick={handleSignOut}
                colorScheme="primary"
                size="md"
                borderRadius="full"
                px={6}
                _hover={{ transform: 'translateY(-1px)', boxShadow: 'lg' }}
                transition="all 0.2s"
              >
                Sign Out
              </Button>
            </HStack>
          ) : (
            <Button
              ml={4}
              onClick={openAuthModal}
              colorScheme="primary"
              size="md"
              borderRadius="full"
              px={6}
              _hover={{ transform: 'translateY(-1px)', boxShadow: 'lg' }}
              transition="all 0.2s"
            >
              Get Started
            </Button>
          )}
        </Stack>

        {/* Mobile menu button */}
        <IconButton
          display={{ base: 'flex', md: 'none' }}
          onClick={onToggle}
          icon={isOpen ? <CloseIcon w={3} h={3} /> : <HamburgerIcon w={5} h={5} />}
          variant="ghost"
          aria-label="Toggle Navigation"
          aria-expanded={isOpen}
          minH="44px"
          minW="44px"
        />
      </Flex>

      {/* Mobile menu */}
      <Collapse in={isOpen} animateOpacity>
        <Box pb={6} px={6} display={{ md: 'none' }} bg="white" borderTop="1px" borderColor="gray.100">
          <Stack spacing={1} pt={4}>
            <Link as={RouterLink} to="/explore" onClick={handleLinkClick} px={4} py={3} _hover={{ bg: 'primary.50', borderRadius: 'lg' }} display="block" fontWeight="semibold" transition="all 0.2s" minH="48px">
              Explore
            </Link>
            <Link as={RouterLink} to="/guides" onClick={handleLinkClick} px={4} py={3} _hover={{ bg: 'primary.50', borderRadius: 'lg' }} display="block" fontWeight="semibold" transition="all 0.2s" minH="48px">
              Guides
            </Link>
            <Link as={RouterLink} to="/tours" onClick={handleLinkClick} px={4} py={3} _hover={{ bg: 'primary.50', borderRadius: 'lg' }} display="block" fontWeight="semibold" transition="all 0.2s" minH="48px">
              Tours
            </Link>
            <Link as={RouterLink} to="/posts" onClick={handleLinkClick} px={4} py={3} _hover={{ bg: 'primary.50', borderRadius: 'lg' }} display="block" fontWeight="semibold" transition="all 0.2s" minH="48px">
              Posts
            </Link>
            
            {user ? (
              <>
                <Link as={RouterLink} to="/dashboard" onClick={handleLinkClick} px={4} py={3} _hover={{ bg: 'primary.50', borderRadius: 'lg' }} display="block" fontWeight="semibold" transition="all 0.2s" minH="48px">
                  Dashboard
                </Link>
                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  justifyContent="flex-start"
                  w="full"
                  px={4}
                  py={3}
                  fontWeight="semibold"
                  color="primary.600"
                  _hover={{ bg: 'primary.50', borderRadius: 'lg' }}
                  transition="all 0.2s"
                  minH="48px"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <Button
                onClick={() => {
                  openAuthModal();
                  onClose();
                }}
                variant="ghost"
                justifyContent="flex-start"
                w="full"
                px={4}
                py={3}
                fontWeight="semibold"
                color="primary.600"
                _hover={{ bg: 'primary.50', borderRadius: 'lg' }}
                transition="all 0.2s"
                minH="48px"
              >
                Get Started
              </Button>
            )}
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
};

export default Navbar;