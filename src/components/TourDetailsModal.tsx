import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Box,
  Text,
  Badge,
  Flex,
  Icon,
  VStack,
  HStack,
  Avatar,
  Spacer,
  Skeleton,
  useToast,
  Divider,
} from '@chakra-ui/react';
import {
  MdAccessTime,
  MdCalendarToday,
  MdGroup,
  MdLocationOn,
} from 'react-icons/md';
import { supabase, DEFAULT_AVATAR_URL } from '../lib/supabaseClient';
import { Tour } from '../lib/types';
import { getLocationsDisplayString } from '../utils/tourLocations';
import { retrySupabaseQuery } from '../utils/supabaseRetry';
import StarRating from './StarRating';

interface TourDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tourId: string;
}

interface TourWithCreator extends Tour {
  creator_name?: string;
  creator_avatar?: string;
}

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const TourDetailsModal: React.FC<TourDetailsModalProps> = ({
  isOpen,
  onClose,
  tourId,
}) => {
  const [tour, setTour] = useState<TourWithCreator | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const toast = useToast();

  useEffect(() => {
    if (!isOpen) return;

    const fetchTour = async () => {
      try {
        setIsLoading(true);

        const { data: tourData, error: tourError } = await supabase
          .from('tours')
          .select('*')
          .eq('id', tourId)
          .single();

        if (tourError) throw tourError;

        // Fetch creator profile with retry
        let profileData = null;
        try {
          const profileResult = await retrySupabaseQuery(async () => {
            return await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('id', tourData.creator_id)
              .single();
          });

          if (profileResult.error) {
            profileData = { full_name: 'Unknown Guide', avatar_url: null };
          } else {
            profileData = profileResult.data;
          }
        } catch {
          profileData = { full_name: 'Unknown Guide', avatar_url: null };
        }

        // Ratings RPC
        const { data: ratingData, error: ratingError } = await supabase.rpc(
          'get_review_summary',
          {
            target_id_param: tourData.id,
            target_type_param: 'tour',
          }
        );

        if (
          !ratingError &&
          Array.isArray(ratingData) &&
          ratingData.length > 0
        ) {
          const summary = ratingData[0];
          setAverageRating(summary.average_rating || 0);
          setReviewCount(summary.total_reviews || 0);
        } else {
          setAverageRating(0);
          setReviewCount(0);
        }

        const profile = profileData as {
          full_name?: string;
          avatar_url?: string;
        } | null;
        setTour({
          ...tourData,
          creator_name: profile?.full_name || 'Unknown Guide',
          creator_avatar: profile?.avatar_url || null,
        });
      } catch (err) {
        console.error('Error fetching tour:', err);
        toast({
          title: 'Error loading tour',
          description: 'Could not load tour details',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTour();
  }, [tourId, isOpen, toast]);

  const isGuide = tour?.creator_role === 'guide';
  const availableDays = tour?.days_available
    ? DAYS_OF_WEEK.filter((_, index) => tour.days_available[index]).join(', ')
    : 'Not specified';

  const formattedPrice =
    typeof tour?.price === 'number'
      ? `$${tour.price}`
      : tour?.price
      ? String(tour.price)
      : '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Tour Details</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {isLoading ? (
            <Box>
              <Skeleton height="24px" width="60%" mb={3} />
              <Skeleton height="16px" width="40%" mb={4} />
              <Skeleton height="16px" width="100%" mb={2} />
              <Skeleton height="16px" width="90%" mb={4} />
              <Skeleton height="20px" width="30%" />
            </Box>
          ) : !tour ? (
            <Text>Tour not found or no longer available</Text>
          ) : (
            <Box>
              {/* Title */}
              <Text
                fontSize="2xl"
                fontWeight="bold"
                mb={3}
                color="gray.800"
                lineHeight="1.3"
                wordBreak="break-word"
                overflowWrap="anywhere"
                whiteSpace="normal"
              >
                {tour.title}
              </Text>

              {/* Creator / rating */}
              <Flex align="center" mb={4}>
                <Avatar
                  size="sm"
                  src={tour.creator_avatar || DEFAULT_AVATAR_URL}
                  name={tour.creator_name}
                  mr={3}
                  border="2px"
                  borderColor="primary.100"
                />
                <Box minW={0}>
                  <Text
                    fontSize="sm"
                    fontWeight="semibold"
                    color="gray.700"
                    noOfLines={1}
                    overflow="hidden"
                    textOverflow="ellipsis"
                  >
                    {tour.creator_name}
                  </Text>
                  {isGuide && (
                    <Flex align="center" mt={1}>
                      <StarRating rating={averageRating} size={14} />
                      <Text fontSize="xs" ml={2} color="gray.500" fontWeight="medium">
                        ({reviewCount} reviews)
                      </Text>
                    </Flex>
                  )}
                </Box>
              </Flex>

              {/* Badges */}
              <HStack spacing={2} mb={4} flexWrap="wrap">
                <Badge
                  colorScheme={tour.is_private ? 'purple' : 'green'}
                  fontSize="xs"
                  borderRadius="full"
                  px={3}
                  py={1}
                >
                  {tour.is_private ? 'Private' : 'Public'}
                </Badge>

                <Badge
                  colorScheme={isGuide ? 'blue' : 'orange'}
                  fontSize="xs"
                  borderRadius="full"
                  px={3}
                  py={1}
                >
                  {isGuide ? 'Guide Tour' : 'Tourist Request'}
                </Badge>

                <Badge
                  colorScheme={tour.is_active ? 'green' : 'gray'}
                  fontSize="xs"
                  borderRadius="full"
                  px={3}
                  py={1}
                >
                  {tour.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </HStack>

              <Divider my={4} />

              {/* Description */}
              <Box mb={4}>
                <Text fontWeight="semibold" mb={2} color="gray.700">
                  Description
                </Text>
                <Text
                  fontSize="sm"
                  color="gray.600"
                  lineHeight="1.6"
                  wordBreak="break-word"
                  overflowWrap="anywhere"
                  whiteSpace="normal"
                >
                  {tour.description}
                </Text>
              </Box>

              <Divider my={4} />

              {/* Details */}
              <VStack spacing={3} align="start" mb={4}>
                <Flex align="center" minW={0} w="100%">
                  <Icon as={MdLocationOn} color="primary.500" mr={3} boxSize="5" />
                  <Box minW={0} flex="1">
                    <Text fontSize="xs" color="gray.500" mb={1}>
                      Location
                    </Text>
                    <Text
                      fontSize="sm"
                      fontWeight="medium"
                      color="gray.700"
                      wordBreak="break-word"
                    >
                      {tour.locations && tour.locations.length > 0
                        ? getLocationsDisplayString(tour.locations, 60)
                        : tour.location || 'Location not specified'}
                    </Text>
                  </Box>
                </Flex>

                <Flex align="center">
                  <Icon as={MdAccessTime} color="primary.500" mr={3} boxSize="5" />
                  <Box>
                    <Text fontSize="xs" color="gray.500" mb={1}>
                      Duration
                    </Text>
                    <Text fontSize="sm" fontWeight="medium" color="gray.700">
                      {tour.duration} hour{tour.duration !== 1 ? 's' : ''}
                    </Text>
                  </Box>
                </Flex>

                <Flex align="center">
                  <Icon as={MdGroup} color="primary.500" mr={3} boxSize="5" />
                  <Box>
                    <Text fontSize="xs" color="gray.500" mb={1}>
                      Capacity
                    </Text>
                    <Text fontSize="sm" fontWeight="medium" color="gray.700">
                      Up to {tour.capacity} people
                    </Text>
                  </Box>
                </Flex>

                <Flex align="center">
                  <Icon as={MdCalendarToday} color="primary.500" mr={3} boxSize="5" />
                  <Box>
                    <Text fontSize="xs" color="gray.500" mb={1}>
                      Availability
                    </Text>
                    <Text
                      fontSize="sm"
                      fontWeight="medium"
                      color="gray.700"
                      wordBreak="break-word"
                    >
                      {availableDays}
                    </Text>
                  </Box>
                </Flex>
              </VStack>

              {tour.languages && tour.languages.length > 0 && (
                <>
                  <Divider my={4} />
                  <Box mb={4}>
                    <Text fontSize="sm" fontWeight="semibold" mb={2} color="gray.700">
                      Languages:
                    </Text>
                    <HStack spacing={2} flexWrap="wrap">
                      {tour.languages.map((lang, index) => (
                        <Badge
                          key={index}
                          colorScheme="primary"
                          fontSize="xs"
                          borderRadius="full"
                          px={3}
                          py={1}
                        >
                          {lang}
                        </Badge>
                      ))}
                    </HStack>
                  </Box>
                </>
              )}

              <Divider my={4} />

              {/* Footer with price and created date */}
              <Flex justify="space-between" align="center">
                <Text fontSize="sm" color="gray.500">
                  Created: {new Date(tour.created_at).toLocaleDateString()}
                </Text>

                <Spacer />

                {formattedPrice && (
                  <Badge
                    colorScheme="purple"
                    px={4}
                    py={2}
                    borderRadius="md"
                    fontWeight="semibold"
                    fontSize="md"
                  >
                    {formattedPrice}
                  </Badge>
                )}
              </Flex>
            </Box>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default TourDetailsModal;
