import { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Center,
  Icon,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { FaMap, FaEdit } from 'react-icons/fa'; 

type ExploreTab = 'guides' | 'tours' | 'posts';

const Explore = () => {
  const [tabIndex, setTabIndex] = useState(0);
  
  // No need for this if you're using tabIndex directly
  // Remove getTabType and activeTab if not used elsewhere
  
  return (
    <Container maxW="container.xl" px={4} py={8}>
      <Box bg="white" borderRadius="lg" overflow="hidden" boxShadow="md">
        <Box p={6} bgGradient="linear(to-r, primary.600, primary.700)" color="white">
          <Heading as="h1" size="lg" mb={2}>Explore TourGuideHub</Heading>
          <Text color="primary.100">Discover amazing guides, tours and travel stories</Text>
        </Box>
        
        <Tabs colorScheme="primary" onChange={setTabIndex} index={tabIndex}>
          <TabList>
            <Tab fontWeight="medium" py={4} px={6}>Guides</Tab>
            <Tab fontWeight="medium" py={4} px={6}>Tours</Tab>
            <Tab fontWeight="medium" py={4} px={6}>Posts</Tab>
          </TabList>
          
          <TabPanels>
            {/* Guides Tab */}
            <TabPanel p={6}>
              <Text color="gray.600" mb={6}>
                Find expert local guides to enhance your travel experience.
              </Text>
              
              <Center bg="gray.50" border="1px" borderColor="gray.100" borderRadius="lg" p={8}>
                <Box textAlign="center">
                  <Icon as={SearchIcon} w={12} h={12} color="gray.400" mb={4} />
                  <Text color="gray.500" fontWeight="medium">
                    Guide search functionality will be implemented in Subtask 3.
                  </Text>
                </Box>
              </Center>
            </TabPanel>
            
            {/* Tours Tab */}
            <TabPanel p={6}>
              <Text color="gray.600" mb={6}>
                Discover amazing tours curated by our expert guides.
              </Text>
              
              <Center bg="gray.50" border="1px" borderColor="gray.100" borderRadius="lg" p={8}>
                <Box textAlign="center">
                  <Icon as={FaMap} w={12} h={12} color="gray.400" mb={4} />
                  <Text color="gray.500" fontWeight="medium">
                    Tours search will be implemented in future phases.
                  </Text>
                </Box>
              </Center>
            </TabPanel>
            
            {/* Posts Tab */}
            <TabPanel p={6}>
              <Text color="gray.600" mb={6}>
                Read travel stories and tips from guides and fellow travelers.
              </Text>
              
              <Center bg="gray.50" border="1px" borderColor="gray.100" borderRadius="lg" p={8}>
                <Box textAlign="center">
                  <Icon as={FaEdit} w={12} h={12} color="gray.400" mb={4} />
                  <Text color="gray.500" fontWeight="medium">
                    Posts search will be implemented in future phases.
                  </Text>
                </Box>
              </Center>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Container>
  );
};

export default Explore;