import { useState } from 'react';
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
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthProvider';
import AuthModal from './AuthModal';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { isOpen, onToggle } = useDisclosure();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/explore');
  };

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  return (
    <Box
      as="nav"
      bg="white"
      boxShadow="sm"
      position="fixed"
      w="100%"
      zIndex={10}
    >
      <Flex
        h="16"
        alignItems="center"
        justifyContent="space-between"
        maxW="container.xl"
        mx="auto"
        px={4}
      >
        <Flex align="center">
          <Link as={RouterLink} to="/" _hover={{ textDecoration: 'none' }}>
            <Text fontSize="xl" fontWeight="extrabold" color="primary.500">
              TourGuideHub
            </Text>
          </Link>
        </Flex>

        {/* Desktop nav */}
        <Stack
          direction="row"
          spacing={1}
          display={{ base: "none", md: "flex" }}
          alignItems="center"
        >
          <Link as={RouterLink} to="/explore" px={3} py={2} borderRadius="md" fontWeight="medium" color="gray.700" _hover={{ bg: 'primary.50', color: 'primary.700' }}>
            Explore
          </Link>
          <Link as={RouterLink} to="/guides" px={3} py={2} borderRadius="md" fontWeight="medium" color="gray.700" _hover={{ bg: 'primary.50', color: 'primary.700' }}>
            Guides
          </Link>
          <Link as={RouterLink} to="/tours" px={3} py={2} borderRadius="md" fontWeight="medium" color="gray.700" _hover={{ bg: 'primary.50', color: 'primary.700' }}>
            Tours
          </Link>
          <Link as={RouterLink} to="/posts" px={3} py={2} borderRadius="md" fontWeight="medium" color="gray.700" _hover={{ bg: 'primary.50', color: 'primary.700' }}>
            Posts
          </Link>

          {user ? (
            <>
              <Link as={RouterLink} to="/dashboard" px={3} py={2} borderRadius="md" fontWeight="medium" color="gray.700" _hover={{ bg: 'primary.50', color: 'primary.700' }}>
                Dashboard
              </Link>
              <Button
                ml={4}
                onClick={handleSignOut}
                colorScheme="primary"
                size="md"
              >
                Sign Out
              </Button>
            </>
          ) : (
            <Button
              ml={4}
              onClick={toggleModal}
              colorScheme="primary"
              size="md"
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
        />
      </Flex>

      {/* Mobile menu */}
      <Collapse in={isOpen} animateOpacity>
        <Box pb={4} display={{ md: 'none' }}>
          <Stack spacing={4} pt={2}>
            <Link as={RouterLink} to="/explore" px={4} py={2} _hover={{ bg: 'primary.50' }} display="block" fontWeight="medium">
              Explore
            </Link>
            <Link as={RouterLink} to="/guides" px={4} py={2} _hover={{ bg: 'primary.50' }} display="block" fontWeight="medium">
              Guides
            </Link>
            <Link as={RouterLink} to="/tours" px={4} py={2} _hover={{ bg: 'primary.50' }} display="block" fontWeight="medium">
              Tours
            </Link>
            <Link as={RouterLink} to="/posts" px={4} py={2} _hover={{ bg: 'primary.50' }} display="block" fontWeight="medium">
              Posts
            </Link>
            
            {user ? (
              <>
                <Link as={RouterLink} to="/dashboard" px={4} py={2} _hover={{ bg: 'primary.50' }} display="block" fontWeight="medium">
                  Dashboard
                </Link>
                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  justifyContent="flex-start"
                  w="full"
                  px={4}
                  fontWeight="medium"
                  color="primary.600"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <Button
                onClick={toggleModal}
                variant="ghost"
                justifyContent="flex-start"
                w="full"
                px={4}
                fontWeight="medium"
                color="primary.600"
              >
                Get Started
              </Button>
            )}
          </Stack>
        </Box>
      </Collapse>

      {/* Auth Modal */}
      {isModalOpen && <AuthModal onClose={toggleModal} />}
    </Box>
  );
};

export default Navbar;