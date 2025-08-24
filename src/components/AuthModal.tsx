import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useAuth } from '../contexts/AuthProvider';
import { UserRole } from '../lib/supabaseClient';
import { supabase } from '../lib/supabaseClient';

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
        setError(error.message);
      } else {
        onClose();
        navigate('/dashboard');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Inside AuthModal.tsx, update the handleRegister function

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
      console.log('Attempting registration for:', email);

      // IMPORTANT: destructure data and error
      const { data, error } = await signUp(email, password, fullName, phone, role);

      if (error) {
        console.error('Registration error:', error);

        if (error.message?.includes('network') || error.message?.includes('fetch')) {
          setError('Network error: Please check your internet connection and try again.');
        } else if (error.message?.includes('already registered')) {
          setError('This email is already registered. Please try signing in instead.');
        } else if (error.message?.includes('foreign key constraint')) {
          setError('Account created but profile setup failed. Please try signing in to complete setup.');
        } else {
          setError(error.message || 'Registration failed. Please try again.');
        }
      } else {
        // data may be undefined/null in edge cases — guard with optional chaining
        const sessionExists = !!data?.session; // when null => confirmation required
        const user = data?.user;
        // you can inspect confirmation fields if you want:
        const confirmationSent = !!user?.confirmation_sent_at;
        const alreadyConfirmed = !!user?.confirmed_at;

        if (!sessionExists && confirmationSent && !alreadyConfirmed) {
          setError('Registration successful! Please check your email for a confirmation link.');
        } else if (!sessionExists && !confirmationSent) {
          // uncommon, but handle gracefully
          setError('Registration successful — confirmation may be required. Please check your email.');
        } else {
          // session exists -> user auto-signed-in
          setError('Registration successful! You are signed in.');
          onClose();
          navigate('/dashboard');
        }

        setTabIndex(0); // switch to login tab (optional)
      }
    } catch (err) {
      console.error('Unexpected registration error:', err);
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Modal isOpen={true} onClose={onClose} isCentered size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {tabIndex === 0 ? 'Welcome Back' : 'Create Account'}
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody pb={6}>
          <Tabs index={tabIndex} onChange={setTabIndex} variant="line" colorScheme="primary" mb={4}>
            <TabList>
              <Tab fontWeight="medium" width="50%">Login</Tab>
              <Tab fontWeight="medium" width="50%">Register</Tab>
            </TabList>
            
            <TabPanels>
              {/* Login Panel */}
              <TabPanel px={0}>
                {error && (
                  <Alert status="error" mb={4} borderRadius="md">
                    <AlertIcon />
                    {error}
                  </Alert>
                )}
                
                <form onSubmit={handleLogin}>
                  <Stack spacing={4}>
                    <FormControl isRequired>
                      <FormLabel htmlFor="email">Email</FormLabel>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </FormControl>
                    
                    <FormControl isRequired>
                      <FormLabel htmlFor="password">Password</FormLabel>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </FormControl>
                    
                    <Button
                      type="submit"
                      colorScheme="primary"
                      width="full"
                      mt={4}
                      isLoading={isLoading}
                    >
                      Sign In
                    </Button>
                  </Stack>
                </form>
              </TabPanel>
              
              {/* Register Panel */}
              <TabPanel px={0}>
                {error && (
                  <Alert status="error" mb={4} borderRadius="md">
                    <AlertIcon />
                    {error}
                  </Alert>
                )}
                
                <form onSubmit={handleRegister}>
                  <Stack spacing={4}>
                    <FormControl as="fieldset">
                      <FormLabel as="legend">I am a</FormLabel>
                      <RadioGroup value={role} onChange={value => setRole(value as UserRole)}>
                        <HStack spacing={6}>
                          <Radio value="tourist">Tourist</Radio>
                          <Radio value="guide">Guide</Radio>
                        </HStack>
                      </RadioGroup>
                    </FormControl>
                    
                    <FormControl isRequired>
                      <FormLabel htmlFor="fullName">Full Name</FormLabel>
                      <Input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </FormControl>
                    
                    <FormControl isRequired>
                      <FormLabel htmlFor="regEmail">Email</FormLabel>
                      <Input
                        id="regEmail"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel htmlFor="phone">Phone Number</FormLabel>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Example: +1234567890"
                      />
                    </FormControl>
                    
                    <FormControl isRequired>
                      <FormLabel htmlFor="regPassword">Password</FormLabel>
                      <Input
                        id="regPassword"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={6}
                      />
                    </FormControl>
                    
                    <FormControl isRequired>
                      <FormLabel htmlFor="confirmPassword">Confirm Password</FormLabel>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </FormControl>
                    
                    <Button
                      type="submit"
                      colorScheme="primary"
                      width="full"
                      mt={4}
                      isLoading={isLoading}
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