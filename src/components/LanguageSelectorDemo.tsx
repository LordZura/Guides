import { useState } from 'react';
import { Box, Heading, VStack, Text } from '@chakra-ui/react';
import SearchableLanguageSelector from './SearchableLanguageSelector';

const LanguageSelectorDemo = () => {
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  return (
    <Box p={8} maxW="600px" mx="auto">
      <VStack spacing={6} align="stretch">
        <Heading size="lg">Language Selector Demo</Heading>
        
        <Text>
          This demo shows the improved language selector that will be used in 
          tour creation and profile editing forms.
        </Text>
        
        <SearchableLanguageSelector
          selectedLanguages={selectedLanguages}
          onChange={setSelectedLanguages}
          label="Demo Language Selector"
          placeholder="Search and select languages..."
          helperText="Try searching for languages and selecting multiple options"
        />
        
        <Box p={4} bg="gray.100" borderRadius="md">
          <Text fontWeight="bold">Selected Languages:</Text>
          <Text>{selectedLanguages.length > 0 ? selectedLanguages.join(', ') : 'None selected'}</Text>
        </Box>
      </VStack>
    </Box>
  );
};

export default LanguageSelectorDemo;