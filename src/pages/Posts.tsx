import {
  Box,
  Container,
  Heading,
  Text,
  Center,
  Icon,
} from '@chakra-ui/react';
import { FaNewspaper } from 'react-icons/fa';

const Posts = () => {
  return (
    <Container maxW="container.xl" px={4} py={8}>
      <Box bg="white" borderRadius="lg" overflow="hidden" boxShadow="md" p={12}>
        <Center flexDirection="column" py={12}>
          <Icon as={FaNewspaper} boxSize={20} color="gray.300" mb={6} />
          <Heading as="h1" size="xl" mb={4}>Posts</Heading>
          <Text color="gray.600" textAlign="center" maxW="md">
            Community posts and discussions coming soon! Stay tuned for updates from guides and tourists.
          </Text>
        </Center>
      </Box>
    </Container>
  );
};

export default Posts;
