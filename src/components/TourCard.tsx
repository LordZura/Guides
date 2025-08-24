import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  Badge,
  Stack,
  HStack,
  Flex,
  Icon,
  Skeleton,
} from '@chakra-ui/react';
import { MdLocationOn, MdDateRange, MdAttachMoney, MdLanguage } from 'react-icons/md';
import { supabase } from '../lib/supabaseClient';

// Helper function to convert day number to name
const getDayName = (dayNum: number) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayNum];
};

interface TourCardProps {
  tourId: string;
}

interface Tour {
  id: string;
  title: string;
  description: string;
  average_price: number;
  location: string;
  creator_id: string;
  creator_role: 'guide' | 'tourist';
  capacity: number | null;
  is_active: boolean;
}

interface Language {
  name: string;
  code: string;
}

// See GuideCard note: Supabase nested select shape can be object or array
type LanguageJoin =
  | { languages?: { name?: unknown; code?: unknown } | Array<{ name?: unknown; code?: unknown }> }
  | Record<string, unknown>;

const TourCard = ({ tourId }: TourCardProps) => {
  const [tour, setTour] = useState<Tour | null>(null);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [creatorName, setCreatorName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTourDetails = async () => {
      setIsLoading(true);

      try {
        // Fetch tour details
        const { data: tourData, error: tourError } = await supabase
          .from('tours')
          .select('*')
          .eq('id', tourId)
          .single();

        if (tourError) throw tourError;
        setTour(tourData as unknown as Tour);

        // Fetch tour languages
        const { data: languageData, error: languageError } = await supabase
          .from('tour_languages')
          .select(`
            languages (
              name,
              code
            )
          `)
          .eq('tour_id', tourId);

        if (languageError) throw languageError;

        // Normalize nested response: object or array -> Language[]
        const tourLanguages: Language[] = (languageData as LanguageJoin[] | null | undefined)?.flatMap(
          (item) => {
            const nested = (item as LanguageJoin).languages as
              | { name?: unknown; code?: unknown }
              | Array<{ name?: unknown; code?: unknown }>
              | undefined;

            if (!nested) return [];

            if (Array.isArray(nested)) {
              return nested
                .filter((l) => l && typeof l === 'object')
                .map((l) => ({
                  name: String(l.name ?? ''),
                  code: String(l.code ?? ''),
                }))
                .filter((l) => l.name && l.code);
            }

            if (typeof nested === 'object') {
              const obj = nested as { name?: unknown; code?: unknown };
              const name = String(obj.name ?? '');
              const code = String(obj.code ?? '');
              return name && code ? [{ name, code }] : [];
            }

            return [];
          }
        ) ?? [];

        setLanguages(tourLanguages);

        // Fetch available days
        const { data: daysData, error: daysError } = await supabase
          .from('tour_available_days')
          .select('day_of_week')
          .eq('tour_id', tourId);

        if (daysError) throw daysError;

        const days = (daysData ?? []).map((item: any) => getDayName(Number(item.day_of_week)));
        setAvailableDays(days);

        // Fetch creator name
        if (tourData) {
          const { data: creatorData, error: creatorError } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', (tourData as any).creator_id)
            .single();

          if (creatorError) throw creatorError;
          setCreatorName((creatorData as any)?.full_name || 'Unknown');
        }
      } catch (error) {
        console.error('Error fetching tour details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTourDetails();
  }, [tourId]);

  if (isLoading) {
    return (
      <Box borderWidth="1px" borderRadius="lg" overflow="hidden" p={4} boxShadow="md" bg="white">
        <Skeleton height="32px" width="70%" mb={2} />
        <Skeleton height="20px" width="40%" mb={2} />
        <Skeleton height="100px" mb={3} />
        <Stack spacing={2}>
          <Skeleton height="20px" width="60%" />
          <Skeleton height="20px" width="80%" />
          <Skeleton height="20px" width="50%" />
        </Stack>
      </Box>
    );
  }

  if (!tour) {
    return (
      <Box p={4} borderWidth="1px" borderRadius="lg" bg="red.50">
        <Text>Tour not found or unavailable.</Text>
      </Box>
    );
  }

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      boxShadow="md"
      bg="white"
      transition="transform 0.3s, box-shadow 0.3s"
      _hover={{ transform: 'translateY(-5px)', boxShadow: 'lg' }}
    >
      <Link to={`/tours/${tour.id}`}>
        <Box p={4}>
          <Flex justify="space-between">
            <Heading as="h3" size="md" noOfLines={1}>
              {tour.title}
            </Heading>
            <Badge colorScheme={tour.creator_role === 'guide' ? 'green' : 'blue'}>
              {tour.creator_role === 'guide' ? 'By Guide' : 'By Tourist'}
            </Badge>
          </Flex>

          <Text color="gray.500" fontSize="sm" mb={2}>
            by {creatorName}
          </Text>

          <Text color="gray.600" noOfLines={3} mb={3}>
            {tour.description}
          </Text>

          <Stack spacing={2}>
            <HStack>
              <Icon as={MdLocationOn} color="primary.500" />
              <Text fontSize="sm" color="gray.700">{tour.location}</Text>
            </HStack>

            <HStack>
              <Icon as={MdAttachMoney} color="primary.500" />
              <Text fontSize="sm" color="gray.700">${tour.average_price} average</Text>
            </HStack>

            <HStack alignItems="flex-start">
              <Icon as={MdDateRange} color="primary.500" mt={1} />
              <Box>
                <Text fontSize="sm" color="gray.700" fontWeight="medium">Available on:</Text>
                <HStack flexWrap="wrap" mt={1}>
                  {availableDays.map((day, index) => (
                    <Badge key={index} colorScheme="primary" variant="outline" fontSize="xs">
                      {day}
                    </Badge>
                  ))}
                  {availableDays.length === 0 && (
                    <Text fontSize="xs" color="gray.500">No specific days available</Text>
                  )}
                </HStack>
              </Box>
            </HStack>

            <HStack alignItems="flex-start">
              <Icon as={MdLanguage} color="primary.500" mt={1} />
              <Box>
                <Text fontSize="sm" color="gray.700" fontWeight="medium">Languages:</Text>
                <HStack flexWrap="wrap" mt={1}>
                  {languages.map((lang, index) => (
                    <Badge key={`${lang.code}-${index}`} colorScheme="primary" variant="solid" fontSize="xs">
                      {lang.name}
                    </Badge>
                  ))}
                  {languages.length === 0 && (
                    <Text fontSize="xs" color="gray.500">No specific languages</Text>
                  )}
                </HStack>
              </Box>
            </HStack>
          </Stack>
        </Box>
      </Link>
    </Box>
  );
};

export default TourCard;