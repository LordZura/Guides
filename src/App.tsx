import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@chakra-ui/react';
import { useAuth } from './contexts/AuthProvider';
import { useModal } from './contexts/ModalContext';
import Navbar from './components/NavBar';
import Dashboard from './pages/Dashboard';
import Explore from './pages/Explore';
import AuthModal from './components/AuthModal';
import TourDetail from './pages/TourDetails';
import ProfilePage from './pages/Profile/[id]';
import NotificationTestPanel from './components/NotificationTestPanel';

// Placeholder components for routes not implemented in Subtask 1
const About = () => <Box p={4} maxW="container.xl" mx="auto"><Box as="h1" fontSize="2xl" fontWeight="bold">About TourGuideHub</Box></Box>;

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <Box p={4} textAlign="center">Loading...</Box>;
  }
  
  if (!user) {
    return <Navigate to="/explore" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  const { isAuthModalOpen, closeAuthModal } = useModal();
  
  return (
    <Box minH="100vh" bg="transparent">

      
      <Navbar />
      
      <Box as="main" pt="20" minH="calc(100vh - 80px)">
        <Routes>
          <Route path="/" element={<Navigate to="/explore" replace />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/about" element={<About />} />
          <Route path="/test-notifications" element={<NotificationTestPanel />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          {/* Add route for tour details */}
          <Route path="/tours/:id" element={<TourDetail />} />
          {/* Add route for guide profiles */}
          <Route path="/profile/:id" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/explore" replace />} />
        </Routes>
      </Box>
      
      {/* Render AuthModal directly */}
      {isAuthModalOpen && <AuthModal onClose={closeAuthModal} />}
    </Box>
  );
}

export default App;