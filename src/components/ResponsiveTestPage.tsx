/**
 * Responsive Design Test Page
 * 
 * This component helps test and validate responsive design implementation.
 * It displays the current viewport size and provides helpful diagnostic information.
 */

import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Code,
  Divider,
  List,
  ListItem,
  ListIcon,
  Button,
} from '@chakra-ui/react';
import { CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';

interface ViewportInfo {
  width: number;
  height: number;
  deviceType: string;
  breakpoint: string;
}

const ResponsiveTestPage = () => {
  const [viewport, setViewport] = useState<ViewportInfo>({
    width: 0,
    height: 0,
    deviceType: '',
    breakpoint: '',
  });

  const [diagnostics, setDiagnostics] = useState({
    overflowElements: 0,
    smallTouchTargets: 0,
  });

  useEffect(() => {
    const updateViewport = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      let deviceType = 'Desktop';
      let breakpoint = '2xl';

      if (width < 480) {
        deviceType = 'Mobile (Small)';
        breakpoint = 'base';
      } else if (width < 768) {
        deviceType = 'Mobile (Large)';
        breakpoint = 'sm';
      } else if (width < 992) {
        deviceType = 'Tablet';
        breakpoint = 'md';
      } else if (width < 1280) {
        deviceType = 'Desktop (Small)';
        breakpoint = 'lg';
      } else if (width < 1536) {
        deviceType = 'Desktop';
        breakpoint = 'xl';
      }

      setViewport({ width, height, deviceType, breakpoint });
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);

    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  const runDiagnostics = () => {
    // Check for horizontal overflow
    const allElements = document.querySelectorAll('*');
    let overflowCount = 0;
    
    allElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width > window.innerWidth) {
        overflowCount++;
      }
    });

    // Check for small touch targets
    const selectors = [
      'button',
      'a',
      'input[type="button"]',
      'input[type="submit"]',
      '[role="button"]',
    ];
    
    const interactive = document.querySelectorAll(selectors.join(','));
    let smallCount = 0;
    
    interactive.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width < 44 || rect.height < 44) {
        smallCount++;
      }
    });

    setDiagnostics({
      overflowElements: overflowCount,
      smallTouchTargets: smallCount,
    });
  };

  const getBreakpointColor = (bp: string) => {
    switch (bp) {
      case 'base': return 'red';
      case 'sm': return 'orange';
      case 'md': return 'yellow';
      case 'lg': return 'green';
      case 'xl': return 'blue';
      case '2xl': return 'purple';
      default: return 'gray';
    }
  };

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2}>Responsive Design Test Page</Heading>
          <Text color="gray.600">
            This page helps validate mobile responsiveness. Resize your browser window to test different breakpoints.
          </Text>
        </Box>

        <Divider />

        {/* Current Viewport Info */}
        <Box bg="white" p={6} borderRadius="lg" boxShadow="md">
          <Heading size="md" mb={4}>Current Viewport</Heading>
          <VStack align="start" spacing={3}>
            <HStack>
              <Text fontWeight="semibold">Size:</Text>
              <Code fontSize="lg">{viewport.width} × {viewport.height}</Code>
            </HStack>
            <HStack>
              <Text fontWeight="semibold">Device Type:</Text>
              <Badge colorScheme="blue" fontSize="md" px={3} py={1}>
                {viewport.deviceType}
              </Badge>
            </HStack>
            <HStack>
              <Text fontWeight="semibold">Chakra Breakpoint:</Text>
              <Badge 
                colorScheme={getBreakpointColor(viewport.breakpoint)} 
                fontSize="md" 
                px={3} 
                py={1}
              >
                {viewport.breakpoint}
              </Badge>
            </HStack>
          </VStack>
        </Box>

        {/* Breakpoint Reference */}
        <Box bg="white" p={6} borderRadius="lg" boxShadow="md">
          <Heading size="md" mb={4}>Chakra UI Breakpoints</Heading>
          <VStack align="stretch" spacing={2}>
            <HStack justify="space-between">
              <Text><Badge colorScheme="red">base</Badge> 0px - 479px</Text>
              <Text fontSize="sm" color="gray.600">Mobile (Small)</Text>
            </HStack>
            <HStack justify="space-between">
              <Text><Badge colorScheme="orange">sm</Badge> 480px - 767px</Text>
              <Text fontSize="sm" color="gray.600">Mobile (Large)</Text>
            </HStack>
            <HStack justify="space-between">
              <Text><Badge colorScheme="yellow">md</Badge> 768px - 991px</Text>
              <Text fontSize="sm" color="gray.600">Tablet</Text>
            </HStack>
            <HStack justify="space-between">
              <Text><Badge colorScheme="green">lg</Badge> 992px - 1279px</Text>
              <Text fontSize="sm" color="gray.600">Desktop (Small)</Text>
            </HStack>
            <HStack justify="space-between">
              <Text><Badge colorScheme="blue">xl</Badge> 1280px - 1535px</Text>
              <Text fontSize="sm" color="gray.600">Desktop</Text>
            </HStack>
            <HStack justify="space-between">
              <Text><Badge colorScheme="purple">2xl</Badge> 1536px+</Text>
              <Text fontSize="sm" color="gray.600">Large Desktop</Text>
            </HStack>
          </VStack>
        </Box>

        {/* Diagnostics */}
        <Box bg="white" p={6} borderRadius="lg" boxShadow="md">
          <HStack justify="space-between" mb={4}>
            <Heading size="md">Responsive Diagnostics</Heading>
            <Button colorScheme="primary" onClick={runDiagnostics}>
              Run Diagnostics
            </Button>
          </HStack>
          
          {diagnostics.overflowElements === 0 && diagnostics.smallTouchTargets === 0 ? (
            <Text color="gray.600">Click "Run Diagnostics" to check for common responsive issues.</Text>
          ) : (
            <List spacing={3}>
              <ListItem>
                <HStack>
                  <ListIcon 
                    as={diagnostics.overflowElements === 0 ? CheckCircleIcon : WarningIcon} 
                    color={diagnostics.overflowElements === 0 ? 'green.500' : 'orange.500'} 
                  />
                  <Text>
                    {diagnostics.overflowElements === 0 
                      ? 'No horizontal overflow detected' 
                      : `${diagnostics.overflowElements} elements may cause horizontal overflow`
                    }
                  </Text>
                </HStack>
              </ListItem>
              <ListItem>
                <HStack>
                  <ListIcon 
                    as={diagnostics.smallTouchTargets === 0 ? CheckCircleIcon : WarningIcon} 
                    color={diagnostics.smallTouchTargets === 0 ? 'green.500' : 'orange.500'} 
                  />
                  <Text>
                    {diagnostics.smallTouchTargets === 0 
                      ? 'All touch targets meet 44px minimum' 
                      : `${diagnostics.smallTouchTargets} touch targets below 44px`
                    }
                  </Text>
                </HStack>
              </ListItem>
            </List>
          )}
        </Box>

        {/* Target Viewports */}
        <Box bg="white" p={6} borderRadius="lg" boxShadow="md">
          <Heading size="md" mb={4}>Target Test Viewports</Heading>
          <Text color="gray.600" mb={4}>
            These are the recommended viewport sizes for testing:
          </Text>
          <VStack align="stretch" spacing={2}>
            <HStack justify="space-between">
              <Text>360 × 800</Text>
              <Badge>Small Android</Badge>
            </HStack>
            <HStack justify="space-between">
              <Text>375 × 812</Text>
              <Badge>iPhone X/11/12/13</Badge>
            </HStack>
            <HStack justify="space-between">
              <Text>390 × 844</Text>
              <Badge>iPhone 12/13 Pro</Badge>
            </HStack>
            <HStack justify="space-between">
              <Text>412 × 915</Text>
              <Badge>Large Android</Badge>
            </HStack>
            <HStack justify="space-between">
              <Text>768 × 1024</Text>
              <Badge>iPad Portrait</Badge>
            </HStack>
            <HStack justify="space-between">
              <Text>1024 × 1366</Text>
              <Badge>iPad Pro</Badge>
            </HStack>
          </VStack>
        </Box>

        {/* Testing Checklist */}
        <Box bg="white" p={6} borderRadius="lg" boxShadow="md">
          <Heading size="md" mb={4}>Testing Checklist</Heading>
          <List spacing={2}>
            <ListItem>✅ Navigation menu works on mobile</ListItem>
            <ListItem>✅ Hero sections scale properly</ListItem>
            <ListItem>✅ Forms are usable on mobile</ListItem>
            <ListItem>✅ Cards and grids stack properly</ListItem>
            <ListItem>✅ Modals and drawers open full-screen on mobile</ListItem>
            <ListItem>✅ Images scale and load properly</ListItem>
            <ListItem>✅ No horizontal scrolling</ListItem>
            <ListItem>✅ Touch targets meet 44-48px minimum</ListItem>
            <ListItem>✅ Typography is readable on all screens</ListItem>
            <ListItem>✅ Proper spacing and padding on mobile</ListItem>
          </List>
        </Box>
      </VStack>
    </Container>
  );
};

export default ResponsiveTestPage;
