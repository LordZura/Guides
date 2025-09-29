import React, { useState } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Badge,
  Code,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Divider,
  SimpleGrid,
  Collapse,
  useDisclosure
} from '@chakra-ui/react';
import { CheckIcon, WarningIcon, InfoIcon } from '@chakra-ui/icons';
import { universalListFiles, checkBucketAccess, ensureStoragePolicies, type UniversalListResult } from '../utils/universal-storage';

interface DiagnosticResults {
  bucketAccess: Record<string, { exists: boolean; accessible: boolean; error?: string }>;
  fileListings: Record<string, UniversalListResult>;
  policies: { applied: boolean; error?: string };
  timestamp: string;
}

const UniversalStorageDiagnostic: React.FC = () => {
  const [results, setResults] = useState<DiagnosticResults | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const { isOpen: showDetails, onToggle: toggleDetails } = useDisclosure();

  const runDiagnostic = async () => {
    setIsRunning(true);
    console.log('🔍 Running Universal Storage Diagnostic...');

    const diagnosticResults: DiagnosticResults = {
      bucketAccess: {},
      fileListings: {},
      policies: { applied: false },
      timestamp: new Date().toISOString()
    };

    const bucketsToTest = ['profile-images', 'avatars'];

    // Test bucket access
    for (const bucketName of bucketsToTest) {
      console.log(`Testing access to "${bucketName}" bucket...`);
      const accessResult = await checkBucketAccess(bucketName);
      diagnosticResults.bucketAccess[bucketName] = accessResult;

      if (accessResult.accessible) {
        // Test universal file listing
        console.log(`Performing universal file listing for "${bucketName}"...`);
        const listResult = await universalListFiles(bucketName, ['avatars', ''], { limit: 20 });
        diagnosticResults.fileListings[bucketName] = listResult;
      }
    }

    // Ensure policies
    if (diagnosticResults.bucketAccess['profile-images']?.accessible) {
      console.log('Ensuring storage policies...');
      try {
        const policyResult = await ensureStoragePolicies('profile-images');
        diagnosticResults.policies = { applied: policyResult };
      } catch (error) {
        diagnosticResults.policies = { 
          applied: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    }

    setResults(diagnosticResults);
    setIsRunning(false);
    console.log('✅ Universal Storage Diagnostic completed');
  };

  const renderBucketStatus = (bucketName: string, access: { exists: boolean; accessible: boolean; error?: string }) => (
    <Box key={bucketName} p={4} borderWidth={1} borderRadius="md" bg={access.accessible ? 'green.50' : 'red.50'}>
      <HStack justify="space-between" mb={2}>
        <Text fontWeight="bold">{bucketName}</Text>
        <Badge colorScheme={access.accessible ? 'green' : 'red'}>
          {access.accessible ? 'Accessible' : 'Inaccessible'}
        </Badge>
      </HStack>
      
      <VStack align="start" spacing={1}>
        <HStack>
          {access.exists ? <CheckIcon color="green.500" /> : <WarningIcon color="red.500" />}
          <Text fontSize="sm">Bucket {access.exists ? 'exists' : 'does not exist'}</Text>
        </HStack>
        
        <HStack>
          {access.accessible ? <CheckIcon color="green.500" /> : <WarningIcon color="red.500" />}
          <Text fontSize="sm">Access {access.accessible ? 'granted' : 'denied'}</Text>
        </HStack>
        
        {access.error && (
          <Text fontSize="xs" color="red.500" mt={1}>
            Error: {access.error}
          </Text>
        )}
      </VStack>
    </Box>
  );

  const renderFileListings = (bucketName: string, listing: UniversalListResult) => (
    <Box key={`${bucketName}-files`} p={4} borderWidth={1} borderRadius="md" bg="blue.50">
      <HStack justify="space-between" mb={2}>
        <Text fontWeight="bold">Files in {bucketName}</Text>
        <Badge colorScheme="blue">{listing.totalFound} files</Badge>
      </HStack>
      
      <VStack align="start" spacing={2}>
        <HStack>
          <InfoIcon color="blue.500" />
          <Text fontSize="sm">Found in path: <Code>{listing.foundInPath || 'root'}</Code></Text>
        </HStack>
        
        {listing.totalFound > 0 && (
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2}>Sample files:</Text>
            <SimpleGrid columns={1} spacing={2} maxH="200px" overflowY="auto">
              {listing.files.slice(0, 10).map((file, index) => (
                <HStack key={index} p={2} bg="white" borderRadius="sm" fontSize="xs">
                  <Text flex={1} isTruncated>{file.name}</Text>
                  {listing.publicUrls[file.name] && (
                    <Button
                      size="xs"
                      colorScheme="blue"
                      variant="outline"
                      onClick={() => window.open(listing.publicUrls[file.name], '_blank')}
                    >
                      View
                    </Button>
                  )}
                </HStack>
              ))}
            </SimpleGrid>
          </Box>
        )}
      </VStack>
    </Box>
  );

  return (
    <Box maxW="4xl" mx="auto" p={6}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Text fontSize="2xl" fontWeight="bold" mb={2}>
            Universal Storage Diagnostic
          </Text>
          <Text color="gray.600">
            Tests universal file listing that works with both nested folders and root storage patterns.
            This diagnostic ensures your storage setup works regardless of where files are stored.
          </Text>
        </Box>

        <HStack>
          <Button
            colorScheme="blue"
            onClick={runDiagnostic}
            isLoading={isRunning}
            loadingText="Running diagnostic..."
            leftIcon={isRunning ? <Spinner size="sm" /> : undefined}
          >
            Run Universal Diagnostic
          </Button>
          
          {results && (
            <Button variant="outline" onClick={toggleDetails}>
              {showDetails ? 'Hide' : 'Show'} Details
            </Button>
          )}
        </HStack>

        {results && (
          <VStack spacing={4} align="stretch">
            <Alert status="info">
              <AlertIcon />
              <Box>
                <AlertTitle>Diagnostic completed!</AlertTitle>
                <AlertDescription>
                  Results from {new Date(results.timestamp).toLocaleString()}
                </AlertDescription>
              </Box>
            </Alert>

            {/* Bucket Access Results */}
            <Box>
              <Text fontSize="lg" fontWeight="bold" mb={4}>
                Bucket Access Test
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {Object.entries(results.bucketAccess).map(([bucketName, access]) =>
                  renderBucketStatus(bucketName, access)
                )}
              </SimpleGrid>
            </Box>

            {/* File Listings */}
            {Object.keys(results.fileListings).length > 0 && (
              <Box>
                <Text fontSize="lg" fontWeight="bold" mb={4}>
                  Universal File Listings
                </Text>
                <SimpleGrid columns={1} spacing={4}>
                  {Object.entries(results.fileListings).map(([bucketName, listing]) =>
                    renderFileListings(bucketName, listing)
                  )}
                </SimpleGrid>
              </Box>
            )}

            {/* Storage Policies */}
            <Box>
              <Text fontSize="lg" fontWeight="bold" mb={4}>
                Storage Policies
              </Text>
              <Box p={4} borderWidth={1} borderRadius="md" bg={results.policies.applied ? 'green.50' : 'yellow.50'}>
                <HStack>
                  {results.policies.applied ? <CheckIcon color="green.500" /> : <InfoIcon color="yellow.500" />}
                  <Text>
                    {results.policies.applied 
                      ? 'Storage policies configured' 
                      : 'Manual policy configuration required'
                    }
                  </Text>
                </HStack>
                {results.policies.error && (
                  <Text fontSize="sm" color="red.500" mt={2}>
                    {results.policies.error}
                  </Text>
                )}
              </Box>
            </Box>

            <Collapse in={showDetails}>
              <Divider />
              <Box>
                <Text fontSize="lg" fontWeight="bold" mb={4}>
                  Technical Details
                </Text>
                <Code p={4} borderRadius="md" display="block" whiteSpace="pre-wrap" fontSize="xs">
                  {JSON.stringify(results, null, 2)}
                </Code>
              </Box>
            </Collapse>

            {/* Recommendations */}
            <Alert status="success">
              <AlertIcon />
              <Box>
                <AlertTitle>Next Steps:</AlertTitle>
                <AlertDescription>
                  <VStack align="start" spacing={1} mt={2}>
                    {results.bucketAccess['profile-images']?.accessible ? (
                      <Text>✅ profile-images bucket is working correctly</Text>
                    ) : (
                      <Text>❌ Create profile-images bucket in Supabase dashboard</Text>
                    )}
                    {Object.values(results.fileListings).some(l => l.totalFound > 0) ? (
                      <Text>✅ Files found and accessible via universal listing</Text>
                    ) : (
                      <Text>ℹ️ No files found (upload some files to test)</Text>
                    )}
                    <Text>
                      🔒 Add SELECT policy: CREATE POLICY allow_list ON storage.objects FOR SELECT USING (bucket_id = 'profile-images');
                    </Text>
                  </VStack>
                </AlertDescription>
              </Box>
            </Alert>
          </VStack>
        )}
      </VStack>
    </Box>
  );
};

export default UniversalStorageDiagnostic;