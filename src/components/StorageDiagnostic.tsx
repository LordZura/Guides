import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Code,
  Spinner,
  Badge,
  HStack,
  useToast
} from '@chakra-ui/react';
import { diagnoseStorageIssue, fixStorageIssue } from '../utils/storage-diagnostic';

interface DiagnosticResults {
  projectUrl: string;
  bucketsFound: string[];
  accessTests: Record<string, { success: boolean; error?: string; fileCount?: number }>;
  uploadTests: Record<string, { success: boolean; error?: string; path?: string }>;
  createTests: Record<string, { success: boolean; error?: string }>;
  errors: string[];
  recommendations: string[];
}

const StorageDiagnostic: React.FC = () => {
  const [results, setResults] = useState<DiagnosticResults | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const toast = useToast();

  const runDiagnostic = async () => {
    setIsRunning(true);
    try {
      const diagnosticResults = await diagnoseStorageIssue();
      setResults(diagnosticResults);
    } catch (error: any) {
      toast({
        title: 'Diagnostic Error',
        description: error.message || 'Failed to run diagnostic',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const runFix = async () => {
    setIsFixing(true);
    try {
      const success = await fixStorageIssue();
      if (success) {
        toast({
          title: 'Fix Applied',
          description: 'Storage issue has been resolved. Re-running diagnostic...',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        // Re-run diagnostic after fix
        setTimeout(runDiagnostic, 1000);
      } else {
        toast({
          title: 'Fix Failed',
          description: 'Could not automatically fix the storage issue',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Fix Error',
        description: error.message || 'Failed to apply fix',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsFixing(false);
    }
  };

  // Auto-run on component mount
  useEffect(() => {
    runDiagnostic();
  }, []);

  return (
    <Box maxW="container.lg" mx="auto" p={6}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="lg" mb={4}>🔍 Supabase Storage Diagnostic</Heading>
          <Text color="gray.600">
            Diagnose and fix the "Bucket not found" error when uploading avatar images.
          </Text>
        </Box>

        <HStack>
          <Button
            onClick={runDiagnostic}
            isLoading={isRunning}
            loadingText="Running Diagnostic"
            colorScheme="blue"
            leftIcon={isRunning ? <Spinner size="sm" /> : undefined}
          >
            Run Diagnostic
          </Button>
          
          {results && results.errors.length > 0 && (
            <Button
              onClick={runFix}
              isLoading={isFixing}
              loadingText="Applying Fix"
              colorScheme="green"
              leftIcon={isFixing ? <Spinner size="sm" /> : undefined}
            >
              Auto-Fix Issue
            </Button>
          )}
        </HStack>

        {results && (
          <VStack spacing={4} align="stretch">
            {/* Project Info */}
            <Box bg="blue.50" p={4} borderRadius="md">
              <Heading size="md" mb={2}>📡 Project Configuration</Heading>
              <Text><strong>URL:</strong> <Code>{results.projectUrl}</Code></Text>
              <Text><strong>Target Bucket:</strong> <Code>profile-images</Code></Text>
              <Text><strong>Upload Path:</strong> <Code>avatars/{`{filename}`}</Code></Text>
            </Box>

            {/* Buckets Found */}
            <Box>
              <Heading size="md" mb={2}>🗂️ Available Buckets</Heading>
              {results.bucketsFound.length > 0 ? (
                <HStack wrap="wrap">
                  {results.bucketsFound.map(bucket => (
                    <Badge key={bucket} colorScheme="blue" px={2} py={1}>
                      {bucket}
                    </Badge>
                  ))}
                </HStack>
              ) : (
                <Alert status="warning">
                  <AlertIcon />
                  <AlertTitle>No buckets found!</AlertTitle>
                  <AlertDescription>
                    The Supabase project has no storage buckets configured.
                  </AlertDescription>
                </Alert>
              )}
            </Box>

            {/* Access Tests */}
            {Object.keys(results.accessTests).length > 0 && (
              <Box>
                <Heading size="md" mb={2}>🔍 Bucket Access Tests</Heading>
                <VStack align="stretch" spacing={2}>
                  {Object.entries(results.accessTests).map(([bucket, test]) => (
                    <Alert key={bucket} status={test.success ? 'success' : 'error'}>
                      <AlertIcon />
                      <Box flex="1">
                        <AlertTitle>{bucket}</AlertTitle>
                        <AlertDescription>
                          {test.success 
                            ? `✅ Accessible (${test.fileCount} files)`
                            : `❌ ${test.error}`
                          }
                        </AlertDescription>
                      </Box>
                    </Alert>
                  ))}
                </VStack>
              </Box>
            )}

            {/* Upload Tests */}
            {Object.keys(results.uploadTests).length > 0 && (
              <Box>
                <Heading size="md" mb={2}>📤 Upload Tests</Heading>
                <VStack align="stretch" spacing={2}>
                  {Object.entries(results.uploadTests).map(([path, test]) => (
                    <Alert key={path} status={test.success ? 'success' : 'error'}>
                      <AlertIcon />
                      <Box flex="1">
                        <AlertTitle>{path}</AlertTitle>
                        <AlertDescription>
                          {test.success 
                            ? `✅ Upload successful: ${test.path}`
                            : `❌ ${test.error}`
                          }
                        </AlertDescription>
                      </Box>
                    </Alert>
                  ))}
                </VStack>
              </Box>
            )}

            {/* Create Tests */}
            {Object.keys(results.createTests).length > 0 && (
              <Box>
                <Heading size="md" mb={2}>🛠️ Bucket Creation Tests</Heading>
                <VStack align="stretch" spacing={2}>
                  {Object.entries(results.createTests).map(([bucket, test]) => (
                    <Alert key={bucket} status={test.success ? 'success' : 'error'}>
                      <AlertIcon />
                      <Box flex="1">
                        <AlertTitle>{bucket}</AlertTitle>
                        <AlertDescription>
                          {test.success 
                            ? `✅ Created successfully`
                            : `❌ ${test.error}`
                          }
                        </AlertDescription>
                      </Box>
                    </Alert>
                  ))}
                </VStack>
              </Box>
            )}

            {/* Errors */}
            {results.errors.length > 0 && (
              <Alert status="error">
                <AlertIcon />
                <Box flex="1">
                  <AlertTitle>Errors Encountered</AlertTitle>
                  <AlertDescription>
                    <VStack align="flex-start" spacing={1}>
                      {results.errors.map((error, index) => (
                        <Text key={index} fontSize="sm">• {error}</Text>
                      ))}
                    </VStack>
                  </AlertDescription>
                </Box>
              </Alert>
            )}

            {/* Recommendations */}
            {results.recommendations.length > 0 && (
              <Box bg="green.50" p={4} borderRadius="md">
                <Heading size="md" mb={2}>💡 Recommendations</Heading>
                <VStack align="flex-start" spacing={2}>
                  {results.recommendations.map((rec, index) => (
                    <Text key={index} fontSize="sm">{rec}</Text>
                  ))}
                </VStack>
              </Box>
            )}

            {/* Success Status */}
            {results.accessTests['profile-images']?.success && results.uploadTests['profile-images/avatars/']?.success && (
              <Alert status="success">
                <AlertIcon />
                <Box flex="1">
                  <AlertTitle>✅ Issue Resolved!</AlertTitle>
                  <AlertDescription>
                    The "profile-images" bucket is now accessible and upload functionality is working. 
                    Avatar uploads should now work correctly in the ProfileEditor component.
                  </AlertDescription>
                </Box>
              </Alert>
            )}
          </VStack>
        )}
      </VStack>
    </Box>
  );
};

export default StorageDiagnostic;