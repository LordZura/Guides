import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Text } from '@chakra-ui/react';
import { useAuth } from './contexts/AuthProvider';
import { useModal } from './contexts/ModalContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Explore from './pages/Explore';
import AuthModal from './components/AuthModal';

// Placeholder components for routes not implemented in Subtask 1
const About = () => <Box p={4} maxW="container.xl" mx="auto"><Box as="h1" fontSize="2xl" fontWeight="bold">About TourGuideHub</Box></Box>;
const Profile = () => <Box p={4} maxW="container.xl" mx="auto"><Box as="h1" fontSize="2xl" fontWeight="bold">Profile</Box></Box>;
const Chats = () => <Box p={4} maxW="container.xl" mx="auto"><Box as="h1" fontSize="2xl" fontWeight="bold">Chats</Box></Box>;

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/explore" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  const { isAuthModalOpen, closeAuthModal } = useModal();
  
  return (
    <Box minH="100vh" bg="gray.50">
      {/* Debug banner */}
      <Box bg="yellow.300" p={2} textAlign="center">
        <Text fontWeight="bold">DEBUG: If you see this, rendering is working</Text>
      </Box>
      
      <Navbar />
      
      <Box as="main" pt="16">
        <Routes>
          <Route path="/" element={<Navigate to="/explore" replace />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/about" element={<About />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/chats" element={
            <ProtectedRoute>
              <Chats />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/explore" replace />} />
        </Routes>
      </Box>
      
      {/* Render AuthModal directly */}
      {isAuthModalOpen && <AuthModal onClose={closeAuthModal} />}
    </Box>
  );
}

export default App;