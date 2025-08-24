import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Flex,
  Image,
  Heading,
  Text,
  Badge,
  Stack,
  HStack,
  Skeleton,
} from '@chakra-ui/react';
import { StarIcon } from '@chakra-ui/icons';
import { supabase, DEFAULT_AVATAR_URL, Profile } from '../lib/supabaseClient';

interface Language {
  name: string;
  code: string;
}

interface GuideCardProps {
  guide: Profile;
}

// Supabase nested select can return either a single object or an array.
// Normalize both shapes safely.
type LanguageJoin =
  | { languages?: { name?: unknown; code?: unknown } | Array<{ name?: unknown; code?: unknown }> }
  | Record<string, unknown>;

const GuideCard = ({ guide }: GuideCardProps) => {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [averagePrice, setAveragePrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Placeholder for ratings - stubbed
  const rating = 4.5;

  useEffect(() => {
    const fetchGuideDetails = async () => {
      setIsLoading(true);

      try {
        // Fetch languages this guide offers
        const { data: languageData, error: languageError } = await supabase
          .from('guide_languages')
          .select(`
            languages (
              name,
              code
            )
          `)
          .eq('guide_id', guide.id);

        if (languageError) throw languageError;

        // Normalize nested response: object or array -> Language[]
        const normalizedLanguages: Language[] = (languageData as LanguageJoin[] | null | undefined)?.flatMap(
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

        setLanguages(normalizedLanguages);

        // Calculate average price from guide's tours
        const { data: tourData, error: tourError } = await supabase
          .from('tours')
          .select('average_price')
          .eq('creator_id', guide.id)
          .eq('creator_role', 'guide')
          .eq('is_active', true);

        if (tourError) throw tourError;

        if (tourData && tourData.length > 0) {
          const total = tourData.reduce((sum, t: any) => sum + Number(t?.average_price ?? 0), 0);
          const avg = total / tourData.length;
          setAveragePrice(Number.isFinite(avg) ? Math.round(avg) : null);
        } else {
          setAveragePrice(null);
        }
      } catch (error) {
        console.error('Error fetching guide details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGuideDetails();
  }, [guide.id]);

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
      <Link to={`/guides/${guide.id}`}>
        <Box position="relative" height="200px" overflow="hidden">
          <Image
            src={(guide as any).avatar_url || DEFAULT_AVATAR_URL}
            alt={(guide as any).full_name}
            objectFit="cover"
            width="100%"
            height="100%"
            fallback={<Skeleton height="200px" width="100%" />}
          />
        </Box>

        <Box p={4}>
          <Flex justify="space-between" align="center">
            <Heading as="h3" size="md" noOfLines={1}>
              {(guide as any).full_name}
            </Heading>

            <HStack spacing={1}>
              <StarIcon color="yellow.400" />
              <Text fontWeight="bold">{rating}</Text>
            </HStack>
          </Flex>

          <Text color="gray.600" fontSize="sm" mt={1} noOfLines={2}>
            {(guide as any).bio || 'No bio available'}
          </Text>

          <Stack mt={3}>
            {isLoading ? (
              <Skeleton height="24px" width="70%" />
            ) : (
              <HStack flexWrap="wrap">
                {languages.slice(0, 3).map((lang, index) => (
                  <Badge key={`${lang.code}-${index}`} colorScheme="blue" mr={1} mb={1}>
                    {lang.name}
                  </Badge>
                ))}
                {languages.length > 3 && (
                  <Badge colorScheme="gray">+{languages.length - 3} more</Badge>
                )}
              </HStack>
            )}
          </Stack>

          {isLoading ? (
            <Skeleton height="24px" width="40%" mt={2} />
          ) : (
            <Text mt={2} fontWeight="bold" color="primary.600">
              {averagePrice ? `Avg. $${averagePrice}/tour` : 'Price not available'}
            </Text>
          )}
        </Box>
      </Link>
    </Box>
  );
};

export default GuideCard;