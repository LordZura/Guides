import {
  Box, 
  Container, 
  Heading, 
  Text, 
  Flex, 
  Stack, 
  Avatar,
  Badge
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthProvider';
import { DEFAULT_AVATAR_URL } from '../lib/supabaseClient';

const Dashboard = () => {
  const { profile } = useAuth();

  if (!profile) {
    return (
      <Container maxW="container.xl" p={4}>
        <Box bg="white" boxShadow="md" borderRadius="lg" p={6}>
          <Heading size="lg" mb={4}>Loading profile information...</Heading>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" p={4}>
      <Box bg="white" boxShadow="md" borderRadius="lg" p={6}>
        <Heading size="lg" mb={4}>Dashboard</Heading>
        
        <Flex direction={{ base: 'column', md: 'row' }} gap={6}>
          <Box flexShrink={0}>
            <Avatar 
              src={profile.avatar_url || DEFAULT_AVATAR_URL} 
              name={profile.full_name}
              size="xl"
            />
          </Box>
          
          <Stack spacing={3}>
            <Heading size="md">{profile.full_name}</Heading>
            <Badge colorScheme={profile.role === 'guide' ? 'green' : 'blue'} alignSelf="flex-start">
              {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
            </Badge>
            
            {profile.phone && (
              <Text color="gray.600">
                <Text as="span" fontWeight="semibold">Phone:</Text> {profile.phone}
              </Text>
            )}
            
            <Box mt={2}>
              <Heading size="sm" mb={2}>Welcome to TourGuideHub!</Heading>
              <Text color="gray.700">
                This is your dashboard where you'll see your activity, bookings, and recommendations.
                More features will be implemented in upcoming phases.
              </Text>
            </Box>
          </Stack>
        </Flex>
      </Box>
    </Container>
  );
};

export default Dashboard;