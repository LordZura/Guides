import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Text,
  Badge,
  Button,
  Flex,
  Icon,
  Skeleton,
  HStack,
  VStack,
  useToast,
  Avatar,
  Spacer,
} from "@chakra-ui/react";
import {
  MdAccessTime,
  MdCalendarToday,
  MdGroup,
  MdLocationOn,
} from "react-icons/md";
import { Link as RouterLink } from "react-router-dom";
import { supabase, DEFAULT_AVATAR_URL } from "../lib/supabaseClient";
import { Tour } from "../lib/types";
import { getLocationsDisplayString } from "../utils/tourLocations";
import { retrySupabaseQuery } from "../utils/supabaseRetry";
import StarRating from "./StarRating";

/**
 * TourCard (detailed)
 * - Title wraps across multiple lines
 * - Price moved to bottom-right footer badge
 * - Defensive layout props added
 */

interface TourCardProps {
  tourId: string;
}

interface TourWithCreator extends Tour {
  creator_name?: string;
  creator_avatar?: string;
}

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const TourCard: React.FC<TourCardProps> = ({ tourId }) => {
  const [tour, setTour] = useState<TourWithCreator | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const cardBg = "white";
  const textColor = "gray.800";
  const mutedColor = "gray.600";
  const borderColor = "gray.200";
  const toast = useToast();

  useEffect(() => {
    const fetchTour = async () => {
      try {
        setIsLoading(true);

        const { data: tourData, error: tourError } = await supabase
          .from("tours")
          .select("*")
          .eq("id", tourId)
          .single();

        if (tourError) throw tourError;

        // Fetch creator profile with retry
        let profileData = null;
        try {
          const profileResult = await retrySupabaseQuery(async () => {
            return await supabase
              .from("profiles")
              .select("full_name, avatar_url")
              .eq("id", tourData.creator_id)
              .single();
          });

          if (profileResult.error) {
            profileData = { full_name: "Unknown Guide", avatar_url: null };
          } else {
            profileData = profileResult.data;
          }
        } catch {
          profileData = { full_name: "Unknown Guide", avatar_url: null };
        }

        // Ratings RPC
        const { data: ratingData, error: ratingError } = await supabase.rpc(
          "get_review_summary",
          {
            target_id_param: tourData.id,
            target_type_param: "tour",
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
          creator_name: profile?.full_name || "Unknown Guide",
          creator_avatar: profile?.avatar_url || null,
        });
      } catch (err) {
        console.error("Error fetching tour:", err);
        toast({
          title: "Error loading tour",
          description: "Could not load tour details",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTour();
  }, [tourId, toast]);

  if (isLoading) {
    return (
      <Box
        borderWidth="1px"
        borderRadius="lg"
        overflow="hidden"
        boxShadow="md"
        bg={cardBg}
        p={{ base: 3, md: 4 }}
      >
        <Skeleton height="24px" width="60%" mb={2} />
        <Skeleton height="16px" width="40%" mb={4} />
        <Skeleton height="16px" width="100%" mb={2} />
        <Skeleton height="16px" width="90%" mb={4} />
        <Flex
          justify="space-between"
          direction={{ base: "column", sm: "row" }}
          gap={{ base: 2, sm: 0 }}
        >
          <Skeleton height="20px" width={{ base: "100%", sm: "30%" }} />
          <Skeleton height="36px" width={{ base: "100%", sm: "30%" }} />
        </Flex>
      </Box>
    );
  }

  if (!tour) {
    return (
      <Box
        borderWidth="1px"
        borderRadius="lg"
        overflow="hidden"
        boxShadow="md"
        bg={cardBg}
        p={{ base: 3, md: 4 }}
      >
        <Text>Tour not found or no longer available</Text>
      </Box>
    );
  }

  const availableDays = tour.days_available
    ? DAYS_OF_WEEK.filter((_, index) => tour.days_available[index]).join(", ")
    : "Not specified";

  const isGuide = tour.creator_role === "guide";
  const formattedPrice =
    typeof tour.price === "number"
      ? `$${tour.price}`
      : tour.price
      ? String(tour.price)
      : "";

  return (
    <Box
      borderWidth="1px"
      borderRadius="xl"
      overflow="hidden"
      boxShadow="lg"
      bg={cardBg}
      transition="all 0.3s ease"
      _hover={{
        boxShadow: "2xl",
        borderColor: "secondary.200",
      }}
      borderColor={borderColor}
      position="relative"
      minW={0}
      maxW="100%"
      boxSizing="border-box"
    >
      <Box p={{ base: 4, md: 6 }}>
        {/* Title (wraps) */}
        <Heading
          as="h3"
          size={{ base: "md", md: "lg" }}
          mb={3}
          color={textColor}
          lineHeight="1.3"
          // allow multi-line paragraph-like title
          wordBreak="break-word"
          overflowWrap="anywhere"
          whiteSpace="normal"
        >
          {tour.title}
        </Heading>

        {/* Creator / rating */}
        <Flex align="center" mb={4}>
          <Avatar
            size="sm"
            src={tour.creator_avatar || DEFAULT_AVATAR_URL}
            name={tour.creator_name}
            mr={3}
            border="2px"
            borderColor="secondary.100"
          />
          <Box minW={0}>
            <Text
              fontSize="sm"
              fontWeight="semibold"
              color={textColor}
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

        {/* Description */}
        <Text
          fontSize="sm"
          mb={6}
          color={mutedColor}
          lineHeight="1.5"
          wordBreak="break-word"
          overflowWrap="anywhere"
          whiteSpace="normal"
        >
          {tour.description}
        </Text>

        {/* Details */}
        <VStack spacing={3} align="start" mb={6}>
          <Flex align="center" minW={0}>
            <Icon as={MdLocationOn} color="secondary.500" mr={3} boxSize="4" />
            <Text
              fontSize="sm"
              fontWeight="medium"
              color={textColor}
              noOfLines={1}
              overflow="hidden"
              textOverflow="ellipsis"
            >
              {tour.locations && tour.locations.length > 0
                ? getLocationsDisplayString(tour.locations, 40)
                : tour.location || "Location not specified"}
            </Text>
          </Flex>

          <Flex align="center">
            <Icon as={MdAccessTime} color="secondary.500" mr={3} boxSize="4" />
            <Text fontSize="sm" fontWeight="medium" color={textColor}>
              {tour.duration} hour{tour.duration !== 1 ? "s" : ""}
            </Text>
          </Flex>

          <Flex align="center">
            <Icon as={MdGroup} color="secondary.500" mr={3} boxSize="4" />
            <Text fontSize="sm" fontWeight="medium" color={textColor}>
              Up to {tour.capacity} people
            </Text>
          </Flex>

          <Flex align="center">
            <Icon as={MdCalendarToday} color="secondary.500" mr={3} boxSize="4" />
            <Text
              fontSize="sm"
              noOfLines={1}
              fontWeight="medium"
              color={textColor}
            >
              Available: {availableDays}
            </Text>
          </Flex>
        </VStack>

        {tour.languages && tour.languages.length > 0 && (
          <Box mb={6}>
            <Text fontSize="sm" fontWeight="semibold" mb={2} color={textColor}>
              Languages:
            </Text>
            <HStack spacing={2} flexWrap="wrap">
              {tour.languages.map((lang, index) => (
                <Badge
                  key={index}
                  colorScheme="secondary"
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
        )}

        {/* Footer: left = meta / badges, right = price badge */}
        <Flex
          justify="space-between"
          align={{ base: "start", sm: "center" }}
          pt={2}
          borderTop="1px"
          borderColor={borderColor}
          direction={{ base: "column", sm: "row" }}
          gap={{ base: 3, sm: 0 }}
          minW={0}
        >
          <HStack spacing={2} flexWrap="wrap" minW={0}>
            <Badge
              colorScheme={tour.is_private ? "purple" : "green"}
              fontSize="xs"
              borderRadius="full"
              px={3}
              py={1}
            >
              {tour.is_private ? "Private" : "Public"}
            </Badge>

            <Badge
              colorScheme={isGuide ? "blue" : "orange"}
              fontSize="xs"
              borderRadius="full"
              px={3}
              py={1}
            >
              {isGuide ? "Guide Tour" : "Tourist Request"}
            </Badge>

            <Text fontSize="sm" color="gray.500" ml={1}>
              Created: {new Date(tour.created_at).toLocaleDateString()}
            </Text>
          </HStack>

          <Spacer />

          <Box textAlign="right" minW={0}>
            {formattedPrice ? (
              <Badge
                colorScheme="purple"
                px={4}
                py={2}
                borderRadius="md"
                fontWeight="semibold"
                fontSize={{ base: "sm", md: "md" }}
              >
                {formattedPrice}
              </Badge>
            ) : null}

            <Button
              as={RouterLink}
              to={`/tours/${tour.id}`}
              colorScheme="secondary"
              size="md"
              borderRadius="full"
              px={6}
              fontWeight="semibold"
              ml={{ base: 0, sm: 4 }}
              mt={{ base: 3, sm: 0 }}
              width={{ base: "100%", sm: "auto" }}
              minH="44px"
            >
              View Details
            </Button>
          </Box>
        </Flex>
      </Box>
    </Box>
  );
};

export default TourCard;
