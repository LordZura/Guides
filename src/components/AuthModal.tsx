// AuthProvider_and_AuthModal.tsx
// Contains: AuthProvider (with typed signUp/signIn/resend helpers) and an updated AuthModal

/*
  Requirements:
  - Uses supabase-js v2 client exported from ../lib/supabaseClient
  - signUp returns { data, error }
  - signIn returns { data, error }
  - Exposes resendConfirmation and resetPassword helpers
  - Updated AuthModal consumes signUp and signIn with proper types
*/

// -------------------- AuthProvider --------------------
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { User, Session } from '@supabase/supabase-js';

type SignUpParams = {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
  role?: string;
};

export type AuthResult = {
  data: { user?: User | null; session?: Session | null } | null;
  error: any | null;
};

export type AuthContextType = {
  currentUser: User | null;
  currentSession: Session | null;
  signUp: (email: string, password: string, fullName?: string, phone?: string, role?: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<{ error: any | null }>;
  resendConfirmation: (email: string) => Promise<{ data: any | null; error: any | null }>;
  resetPasswordForEmail: (email: string, redirectTo?: string) => Promise<{ data: any | null; error: any | null }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);

  useEffect(() => {
    // initialize from existing session
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setCurrentSession(data.session ?? null);
      setCurrentUser(data.session?.user ?? null);
    };
    init();

    // listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentSession(session ?? null);
      setCurrentUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (
    email: string,
    password: string,
    fullName?: string,
    phone?: string,
    role?: string
  ): Promise<AuthResult> => {
    // correct signUp signature for supabase-js v2
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName ?? null,
          phone: phone ?? null,
          role: role ?? null,
        }
      }
    });

    // If user created, optionally create profiles row
    if (!error && data?.user?.id) {
      try {
        await supabase
          .from('profiles')
          .insert([{
            id: data.user.id,
            full_name: fullName ?? null,
            phone: phone ?? null,
            role: role ?? 'tourist',
          }]);
      } catch (insertErr) {
        // attach profile error to returned value (or handle as you prefer)
        return { data, error: { message: 'Profile insert failed', details: insertErr } };
      }
    }

    return { data, error };
  };

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const resendConfirmation = async (email: string) => {
    // supabase.auth.resend returns { data, error }
    try {
      // @ts-ignore - supabase types for resend may vary; handle as any
      const resp = await supabase.auth.resend({ type: 'signup', email });
      return resp;
    } catch (err) {
      return { data: null, error: err };
    }
  };

  const resetPasswordForEmail = async (email: string, redirectTo?: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    return { data, error };
  };

  const value: AuthContextType = {
    currentUser,
    currentSession,
    signUp,
    signIn,
    signOut,
    resendConfirmation,
    resetPasswordForEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

// -------------------- Updated AuthModal --------------------
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

interface AuthModalProps {
  onClose: () => void;
}

export const AuthModal = ({ onClose }: AuthModalProps) => {
  const [tabIndex, setTabIndex] = React.useState(0);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [role, setRole] = React.useState<UserRole>('tourist');
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const { signIn, signUp, resendConfirmation } = useAuth();
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
      const { data, error } = await signIn(email, password);
      console.log('signIn result', { data, error });
      if (error) {
        // handle known supabase error shapes
        setError(error?.message ?? 'Sign in failed');
      } else {
        onClose();
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
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
      console.log('Attempting registration for:', email);
      const { data, error } = await signUp(email, password, fullName, phone, role);
      console.log('signUp result', { data, error });

      if (error) {
        setError(error?.message ?? 'Registration failed');
      } else {
        const sessionExists = !!data?.session;
        const user = data?.user;
        const confirmationSent = !!user?.confirmation_sent_at;
        const alreadyConfirmed = !!user?.confirmed_at;

        if (!sessionExists && confirmationSent && !alreadyConfirmed) {
          setError('Registration successful! Please check your email for a confirmation link.');
        } else if (!sessionExists && !confirmationSent) {
          setError('Registration successful — confirmation may be required. Please check your email.');
        } else {
          // user auto-signed in
          onClose();
          navigate('/dashboard');
        }

        setTabIndex(0);
      }
    } catch (err) {
      console.error('Unexpected registration error:', err);
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Enter your email to resend confirmation');
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await resendConfirmation(email);
      console.log('resendConfirmation', { data, error });
      if (error) setError(error?.message ?? 'Could not resend confirmation');
      else setError('Confirmation email resent — please check your inbox');
    } catch (err) {
      console.error(err);
      setError('Unexpected error while resending confirmation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} isCentered size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{tabIndex === 0 ? 'Welcome Back' : 'Create Account'}</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <Tabs index={tabIndex} onChange={setTabIndex} variant="line" colorScheme="primary" mb={4}>
            <TabList>
              <Tab fontWeight="medium" width="50%">Login</Tab>
              <Tab fontWeight="medium" width="50%">Register</Tab>
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
                  <Stack spacing={4}>
                    <FormControl isRequired>
                      <FormLabel htmlFor="email">Email</FormLabel>
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel htmlFor="password">Password</FormLabel>
                      <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </FormControl>

                    <Button type="submit" colorScheme="primary" width="full" mt={4} isLoading={isLoading}>
                      Sign In
                    </Button>

                    <Button variant="link" onClick={handleResend} isLoading={isLoading}>
                      Resend confirmation
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
                  <Stack spacing={4}>
                    <FormControl as="fieldset">
                      <FormLabel as="legend">I am a</FormLabel>
                      <RadioGroup value={role} onChange={(value) => setRole(value as UserRole)}>
                        <HStack spacing={6}>
                          <Radio value="tourist">Tourist</Radio>
                          <Radio value="guide">Guide</Radio>
                        </HStack>
                      </RadioGroup>
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel htmlFor="fullName">Full Name</FormLabel>
                      <Input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel htmlFor="regEmail">Email</FormLabel>
                      <Input id="regEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </FormControl>

                    <FormControl>
                      <FormLabel htmlFor="phone">Phone Number</FormLabel>
                      <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Example: +1234567890" />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel htmlFor="regPassword">Password</FormLabel>
                      <Input id="regPassword" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel htmlFor="confirmPassword">Confirm Password</FormLabel>
                      <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    </FormControl>

                    <Button type="submit" colorScheme="primary" width="full" mt={4} isLoading={isLoading}>
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
