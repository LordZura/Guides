import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  HStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Code,
  Spinner,
  Badge,
  Link,
  OrderedList,
  ListItem,
  UnorderedList,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';
import { ExternalLinkIcon, CheckIcon } from '@chakra-ui/icons';
import { supabase } from '../lib/supabaseClient';

interface NetworkDiagnostic {
  canReachSupabase: boolean;
  bucketExists: boolean;
  error: string | null;
  networkBlocked: boolean;
}

const StorageDiagnosticEnhanced = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [networkDiag, setNetworkDiag] = useState<NetworkDiagnostic | null>(null);

  const runNetworkDiagnostic = async () => {
    setIsRunning(true);
    const diagnostic: NetworkDiagnostic = {
      canReachSupabase: false,
      bucketExists: false,
      error: null,
      networkBlocked: false
    };

    try {
      // Test basic connectivity
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        diagnostic.error = error.message;
        if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
          diagnostic.networkBlocked = true;
        }
      } else {
        diagnostic.canReachSupabase = true;
        diagnostic.bucketExists = buckets?.some(bucket => bucket.name === 'profile-images') || false;
      }
    } catch (err: any) {
      diagnostic.error = err.message;
      diagnostic.networkBlocked = true;
    }

    setNetworkDiag(diagnostic);
    setIsRunning(false);
  };

  useEffect(() => {
    runNetworkDiagnostic();
  }, []);

  const getStatusBadge = (condition: boolean, text: string) => (
    <Badge colorScheme={condition ? 'green' : 'red'} variant="solid">
      {condition ? '✅' : '❌'} {text}
    </Badge>
  );

  return (
    <Box maxW="container.lg" mx="auto" p={6}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="lg" mb={4}>🔍 Enhanced Storage Diagnostic</Heading>
          <Text color="gray.600">
            Comprehensive diagnosis for avatar upload issues with network-aware guidance
          </Text>
        </Box>

        {/* Quick Status */}
        <Alert status={networkDiag?.networkBlocked ? 'warning' : networkDiag?.bucketExists ? 'success' : 'error'}>
          <AlertIcon />
          <Box>
            <AlertTitle>
              {networkDiag?.networkBlocked 
                ? 'Network Restricted Environment Detected'
                : networkDiag?.bucketExists 
                  ? 'Storage Configuration OK'
                  : 'Storage Bucket Missing'
              }
            </AlertTitle>
            <AlertDescription>
              {networkDiag?.networkBlocked 
                ? 'Direct Supabase API access blocked. Manual bucket creation required.'
                : networkDiag?.bucketExists 
                  ? 'The profile-images bucket exists and is accessible.'
                  : 'The profile-images bucket does not exist and must be created.'
              }
            </AlertDescription>
          </Box>
        </Alert>

        {/* Configuration Display */}
        <Box bg="blue.50" p={4} borderRadius="md">
          <Heading size="md" mb={3}>📡 Current Configuration</Heading>
          <VStack align="start" spacing={2}>
            <Text><strong>Supabase URL:</strong> <Code>https://ghtdjwcqqcbfzaeiekhk.supabase.co</Code></Text>
            <Text><strong>Target Bucket:</strong> <Code>profile-images</Code></Text>
            <Text><strong>Upload Path:</strong> <Code>avatars/{`{user.id}_{timestamp}.{ext}`}</Code></Text>
            <Text><strong>Expected Public URL:</strong> <Code fontSize="sm">https://ghtdjwcqqcbfzaeiekhk.supabase.co/storage/v1/object/public/profile-images/avatars/{`{filename}`}</Code></Text>
          </VStack>
        </Box>

        {/* Status Overview */}
        <Box>
          <Heading size="md" mb={3}>🏥 Diagnostic Status</Heading>
          <HStack wrap="wrap" spacing={3}>
            {networkDiag && (
              <>
                {getStatusBadge(networkDiag.canReachSupabase, 'API Access')}
                {getStatusBadge(networkDiag.bucketExists, 'Bucket Exists')}
                {getStatusBadge(!networkDiag.networkBlocked, 'Network Open')}
              </>
            )}
          </HStack>
        </Box>

        <Tabs variant="enclosed">
          <TabList>
            <Tab>🛠️ Fix Instructions</Tab>
            <Tab>📊 Diagnostic Details</Tab>
            <Tab>🧪 Manual Testing</Tab>
          </TabList>

          <TabPanels>
            {/* Fix Instructions Tab */}
            <TabPanel>
              <VStack align="stretch" spacing={4}>
                {networkDiag?.networkBlocked ? (
                  <Alert status="warning">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Manual Bucket Creation Required</AlertTitle>
                      <AlertDescription>
                        Network restrictions prevent automatic bucket creation. Follow these steps:
                      </AlertDescription>
                    </Box>
                  </Alert>
                ) : null}

                <Box>
                  <Heading size="md" mb={3}>🎯 Step-by-Step Fix</Heading>
                  <OrderedList spacing={3}>
                    <ListItem>
                      <Text><strong>Access Supabase Dashboard:</strong></Text>
                      <Link 
                        href="https://supabase.com/dashboard/project/ghtdjwcqqcbfzaeiekhk" 
                        isExternal 
                        color="blue.500"
                      >
                        Open Supabase Project Dashboard <ExternalLinkIcon mx="2px" />
                      </Link>
                    </ListItem>
                    
                    <ListItem>
                      <Text><strong>Navigate to Storage:</strong></Text>
                      <Text fontSize="sm" color="gray.600">
                        Click "Storage" in the left sidebar, then "Buckets"
                      </Text>
                    </ListItem>
                    
                    <ListItem>
                      <Text><strong>Create Bucket:</strong></Text>
                      <Box bg="gray.50" p={3} borderRadius="md" mt={2}>
                        <UnorderedList spacing={1}>
                          <ListItem>Name: <Code>profile-images</Code></ListItem>
                          <ListItem>Public: <Badge colorScheme="green">✅ Enabled</Badge></ListItem>
                          <ListItem>File size limit: <Code>5 MB</Code></ListItem>
                          <ListItem>Allowed MIME types: <Code>image/*</Code></ListItem>
                        </UnorderedList>
                      </Box>
                    </ListItem>
                    
                    <ListItem>
                      <Text><strong>Verify Creation:</strong></Text>
                      <Button 
                        size="sm" 
                        colorScheme="blue" 
                        onClick={runNetworkDiagnostic}
                        isLoading={isRunning}
                        mt={2}
                      >
                        Re-run Diagnostic
                      </Button>
                    </ListItem>
                  </OrderedList>
                </Box>

                <Alert status="info">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>After Bucket Creation</AlertTitle>
                    <AlertDescription>
                      Test avatar upload in the Profile Editor. Images should display instead of placeholders.
                    </AlertDescription>
                  </Box>
                </Alert>
              </VStack>
            </TabPanel>

            {/* Diagnostic Details Tab */}
            <TabPanel>
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Heading size="md" mb={3}>🔍 Network Analysis</Heading>
                  {networkDiag ? (
                    <Box bg="gray.50" p={4} borderRadius="md">
                      <Text><strong>API Reachability:</strong> {networkDiag.canReachSupabase ? '✅ Connected' : '❌ Failed'}</Text>
                      <Text><strong>Network Status:</strong> {networkDiag.networkBlocked ? '⚠️ Blocked' : '✅ Open'}</Text>
                      <Text><strong>Bucket Status:</strong> {networkDiag.bucketExists ? '✅ Exists' : '❌ Missing'}</Text>
                      {networkDiag.error && (
                        <Text color="red.500"><strong>Error:</strong> {networkDiag.error}</Text>
                      )}
                    </Box>
                  ) : (
                    <Spinner />
                  )}
                </Box>

                <Box>
                  <Heading size="md" mb={3}>📝 Code Analysis</Heading>
                  <Accordion allowToggle>
                    <AccordionItem>
                      <AccordionButton>
                        <Box flex="1" textAlign="left">
                          ProfileEditor Upload Implementation
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                      <AccordionPanel pb={4}>
                        <Code display="block" whiteSpace="pre" p={4} bg="gray.900" color="white" borderRadius="md">
{`// File: src/components/ProfileEditor.tsx
const uploadAvatar = async () => {
  const fileName = \`\${user.id}_\${Date.now()}.\${fileExt}\`;
  const filePath = \`avatars/\${fileName}\`;
  
  const { error } = await supabase.storage
    .from('profile-images')  // ← Requires this bucket
    .upload(filePath, avatarFile);
  
  const { data } = supabase.storage
    .from('profile-images')
    .getPublicUrl(filePath);
  
  return data.publicUrl;
};`}
                        </Code>
                      </AccordionPanel>
                    </AccordionItem>
                  </Accordion>
                </Box>
              </VStack>
            </TabPanel>

            {/* Manual Testing Tab */}
            <TabPanel>
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Heading size="md" mb={3}>🧪 Manual Verification Steps</Heading>
                  <Alert status="info" mb={4}>
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Testing Checklist</AlertTitle>
                      <AlertDescription>
                        After creating the bucket, use these steps to verify the fix:
                      </AlertDescription>
                    </Box>
                  </Alert>
                  
                  <OrderedList spacing={3}>
                    <ListItem>
                      <Text><strong>Browser Console Test:</strong></Text>
                      <Code display="block" p={3} bg="gray.100" borderRadius="md" fontSize="sm" mt={2}>
{`// Run in browser console after bucket creation:
const list = await supabase.storage
  .from('profile-images')
  .list('avatars', { limit: 10 });
console.log('Files found:', list.data?.length || 0);`}
                      </Code>
                    </ListItem>
                    
                    <ListItem>
                      <Text><strong>Upload Test:</strong></Text>
                      <UnorderedList mt={2} ml={4}>
                        <ListItem>Navigate to Profile Editor</ListItem>
                        <ListItem>Upload a test avatar image</ListItem>
                        <ListItem>Verify no "Bucket not found" errors</ListItem>
                        <ListItem>Check that avatar displays (not placeholder)</ListItem>
                      </UnorderedList>
                    </ListItem>
                    
                    <ListItem>
                      <Text><strong>Network Verification:</strong></Text>
                      <UnorderedList mt={2} ml={4}>
                        <ListItem>Open DevTools → Network</ListItem>
                        <ListItem>Upload avatar</ListItem>
                        <ListItem>Verify POST to storage API returns 200</ListItem>
                        <ListItem>Verify GET for avatar image returns 200</ListItem>
                      </UnorderedList>
                    </ListItem>
                  </OrderedList>
                </Box>

                <Alert status="success">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Success Indicators</AlertTitle>
                    <AlertDescription>
                      ✅ No "Bucket not found" errors<br />
                      ✅ Avatar images display instead of placeholders<br />
                      ✅ HTTP 200 responses for upload and retrieval<br />
                      ✅ Diagnostic shows "Bucket Exists"
                    </AlertDescription>
                  </Box>
                </Alert>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Action Buttons */}
        <HStack>
          <Button 
            onClick={runNetworkDiagnostic}
            isLoading={isRunning}
            loadingText="Testing..."
            colorScheme="blue"
          >
            Re-run Diagnostic
          </Button>
          
          {networkDiag?.bucketExists && (
            <Badge colorScheme="green" p={2} borderRadius="md">
              <CheckIcon mr={1} /> Ready for Testing
            </Badge>
          )}
        </HStack>
      </VStack>
    </Box>
  );
};

export default StorageDiagnosticEnhanced;