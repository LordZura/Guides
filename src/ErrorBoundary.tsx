import { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Heading, Text, Code, VStack } from '@chakra-ui/react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Component Error:", error);
    console.error("Component Stack:", errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box p={5} bg="red.50" border="1px solid" borderColor="red.200" borderRadius="md" m={5}>
          <VStack align="start" spacing={3}>
            <Heading size="md" color="red.500">Something went wrong!</Heading>
            <Text>The application encountered an error:</Text>
            <Code p={3} width="100%" bg="red.50" color="red.800" overflowX="auto">
              {this.state.error?.toString()}
            </Code>
          </VStack>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;