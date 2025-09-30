import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  FormControl,
  FormLabel,
  Input,
  Button,
  RadioGroup,
  Radio,
  Stack,
  Alert,
  AlertIcon,
  HStack,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthProvider';

interface AuthModalProps {
  onClose: () => void;
}

const AuthModal = ({ onClose }: AuthModalProps) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('tourist');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    return phoneRegex.test(phone);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error?.message ?? 'Sign in failed');
      } else {
        onClose();
        navigate('/dashboard');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password || !confirmPassword || !fullName) {
      setError('Please fill in all required fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (phone && !validatePhoneNumber(phone)) {
      setError('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signUp(email, password, fullName, phone, role);
      if (error) {
        setError(error?.message ?? 'Registration failed');
      } else {
        setError('Registration successful! Please check your email for a confirmation link.');
        setTabIndex(0);
      }
    } catch {
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={true} 
      onClose={onClose} 
      isCentered 
      size={{ base: "full", sm: "md", md: "lg" }}
      motionPreset="slideInBottom"
    >
      <ModalOverlay />
      <ModalContent 
        mx={{ base: 0, sm: 4 }}
        my={{ base: 0, sm: 4 }}
        maxH={{ base: "100vh", sm: "90vh" }}
        overflowY="auto"
      >
        <ModalHeader fontSize={{ base: "xl", md: "2xl" }}>
          {tabIndex === 0 ? 'Welcome Back' : 'Create Account'}
        </ModalHeader>
        <ModalCloseButton size="lg" mt={2} mr={2} />
        <ModalBody pb={6}>
          <Tabs index={tabIndex} onChange={setTabIndex} variant="line" colorScheme="primary" mb={4}>
            <TabList>
              <Tab fontWeight="medium" width="50%" fontSize={{ base: "sm", md: "md" }}>Login</Tab>
              <Tab fontWeight="medium" width="50%" fontSize={{ base: "sm", md: "md" }}>Register</Tab>
            </TabList>
            <TabPanels>
              <TabPanel px={0}>
                {error && (
                  <Alert status="error" mb={4} borderRadius="md">
                    <AlertIcon />
                    {error}
                  </Alert>
                )}
                <form onSubmit={handleLogin}>
                  <Stack spacing={{ base: 4, md: 4 }}>
                    <FormControl isRequired>
                      <FormLabel htmlFor="email" fontSize={{ base: "sm", md: "md" }}>Email</FormLabel>
                      <Input 
                        id="email" 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        size="md"
                        minH="48px"
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel htmlFor="password" fontSize={{ base: "sm", md: "md" }}>Password</FormLabel>
                      <Input 
                        id="password" 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        size="md"
                        minH="48px"
                      />
                    </FormControl>
                    <Button 
                      type="submit" 
                      colorScheme="primary" 
                      width="full" 
                      mt={4} 
                      isLoading={isLoading} 
                      size="lg"
                      minH="48px"
                    >
                      Sign In
                    </Button>
                  </Stack>
                </form>
              </TabPanel>
              <TabPanel px={0}>
                {error && (
                  <Alert status="error" mb={4} borderRadius="md">
                    <AlertIcon />
                    {error}
                  </Alert>
                )}
                <form onSubmit={handleRegister}>
                  <Stack spacing={{ base: 4, md: 4 }}>
                    <FormControl as="fieldset">
                      <FormLabel as="legend" fontSize={{ base: "sm", md: "md" }}>I am a</FormLabel>
                      <RadioGroup value={role} onChange={(value) => setRole(value as UserRole)}>
                        <HStack spacing={{ base: 4, md: 6 }}>
                          <Radio value="tourist" size="md">Tourist</Radio>
                          <Radio value="guide" size="md">Guide</Radio>
                        </HStack>
                      </RadioGroup>
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel htmlFor="fullName" fontSize={{ base: "sm", md: "md" }}>Full Name</FormLabel>
                      <Input 
                        id="fullName" 
                        type="text" 
                        value={fullName} 
                        onChange={(e) => setFullName(e.target.value)} 
                        size="md"
                        minH="48px"
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel htmlFor="regEmail" fontSize={{ base: "sm", md: "md" }}>Email</FormLabel>
                      <Input 
                        id="regEmail" 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        size="md"
                        minH="48px"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel htmlFor="phone" fontSize={{ base: "sm", md: "md" }}>Phone Number</FormLabel>
                      <Input 
                        id="phone" 
                        type="tel" 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)} 
                        placeholder="Example: +1234567890" 
                        size="md"
                        minH="48px"
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel htmlFor="regPassword" fontSize={{ base: "sm", md: "md" }}>Password</FormLabel>
                      <Input 
                        id="regPassword" 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        minLength={6} 
                        size="md"
                        minH="48px"
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel htmlFor="confirmPassword" fontSize={{ base: "sm", md: "md" }}>Confirm Password</FormLabel>
                      <Input 
                        id="confirmPassword" 
                        type="password" 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        size="md"
                        minH="48px"
                      />
                    </FormControl>
                    <Button 
                      type="submit" 
                      colorScheme="primary" 
                      width="full" 
                      mt={4} 
                      isLoading={isLoading} 
                      size="lg"
                      minH="48px"
                    >
                      Create Account
                    </Button>
                  </Stack>
                </form>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default AuthModal;