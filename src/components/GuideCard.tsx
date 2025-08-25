import {
  Box,
  Image,
  Stack,
  Heading,
  Text,
  Badge,
  Button,
  Flex,
  Icon,
  useColorModeValue,
  HStack,
} from '@chakra-ui/react';
import { MdLocationOn, MdStar } from 'react-icons/md';
import { Link as RouterLink } from 'react-router-dom';
import { Profile, DEFAULT_AVATAR_URL } from '../lib/supabaseClient';

interface GuideCardProps {
  guide: Profile;
}

const GuideCard = ({ guide }: GuideCardProps) => {
  const cardBg = useColorModeValue('white', 'gray.700');
  
  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      boxShadow="md"
      bg={cardBg}
      transition="transform 0.2s"
      _hover={{ transform: 'translateY(-5px)', boxShadow: 'lg' }}
    >
      <Box position="relative" height="200px" overflow="hidden">
        <Image
          src={guide.avatar_url || DEFAULT_AVATAR_URL}
          alt={guide.full_name}
          objectFit="cover"
          width="100%"
          height="100%"
        />
        
        <Box
          position="absolute"
          bottom="0"
          left="0"
          right="0"
          bg="rgba(0,0,0,0.6)"
          p={3}
          color="white"
        >
          <Heading size="md" noOfLines={1}>{guide.full_name}</Heading>
          
          {guide.years_experience && (
            <Flex align="center" mt={1}>
              <Icon as={MdStar} color="yellow.400" mr={1} />
              <Text fontSize="sm">{guide.years_experience} years experience</Text>
            </Flex>
          )}
        </Box>
      </Box>
      
      <Box p={4}>
        <Stack spacing={3}>
          {guide.bio && (
            <Text fontSize="sm" noOfLines={2} color="gray.600">
              {guide.bio}
            </Text>
          )}
          
          <HStack flexWrap="wrap" spacing={2}>
            {guide.languages && guide.languages.map((lang: string, index: number) => (
              <Badge key={index} colorScheme="primary" fontSize="xs">
                {lang}
              </Badge>
            ))}
          </HStack>
          
          {guide.location && (
            <Flex align="center">
              <Icon as={MdLocationOn} color="gray.500" mr={1} />
              <Text fontSize="sm" color="gray.500">{guide.location}</Text>
            </Flex>
          )}
          
          {guide.specialties && (
            <Text fontSize="xs" color="gray.500">
              <strong>Specialties:</strong> {guide.specialties}
            </Text>
          )}
          
          <Button
            as={RouterLink}
            to={`/profile/${guide.id}`}
            colorScheme="primary"
            size="sm"
            width="100%"
          >
            View Profile
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default GuideCard;