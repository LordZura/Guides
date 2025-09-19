import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "./AuthProvider";
import { useToast } from "@chakra-ui/react";
import { useNotifications } from "./NotificationContext";
import {
  shouldAutoComplete,
  validatePaymentTiming,
} from "../utils/paymentUtils";

export type BookingStatus =
  | "requested"
  | "offered"
  | "accepted"
  | "declined"
  | "paid"
  | "completed"
  | "cancelled";

export interface Booking {
  id: string;
  tour_id: string;
  tourist_id: string;
  guide_id: string;
  status: BookingStatus;
  party_size: number;
  booking_date: string;
  preferred_time: string;
  notes: string | null;
  total_price: number;
  created_at: string;
  updated_at: string;

  // Joined fields
  tour_title?: string;
  tour_location?: string;
  tourist_name?: string;
  tourist_avatar?: string;
  guide_name?: string;
  guide_avatar?: string;
}

interface BookingContextType {
  incomingBookings: Booking[];
  outgoingBookings: Booking[];
  isLoading: boolean;
  error: string | null;
  createBooking: (
    bookingData: Partial<Booking>
  ) => Promise<{ success: boolean; error?: string; booking?: Booking }>;
  updateBookingStatus: (
    bookingId: string,
    status: BookingStatus
  ) => Promise<boolean>;
  refreshBookings: () => Promise<void>;
  hasCompletedTour: (tourId: string) => Promise<boolean>;
  hasCompletedGuideBooking: (guideId: string) => Promise<boolean>;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider = ({ children }: { children: ReactNode }) => {
  const { user, profile } = useAuth();
  const { createNotification } = useNotifications();
  const [incomingBookings, setIncomingBookings] = useState<Booking[]>([]);
  const [outgoingBookings, setOutgoingBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  // Fetch bookings when user profile changes
  useEffect(() => {
    if (profile) {
      refreshBookings();
    }
  }, [profile]);

  // Fetch user's bookings
  const refreshBookings = async () => {
    if (!user || !profile) {
      setIncomingBookings([]);
      setOutgoingBookings([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Determine which bookings to fetch based on user role
      if (profile.role === "guide") {
        // Guides see bookings for their tours
        const { data, error: fetchError } = await supabase
          .from("bookings")
          .select(
            `
            *,
            tours!tour_id(title, location),
            profiles!tourist_id(full_name, avatar_url)
          `
          )
          .eq("guide_id", user.id)
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;

        // Transform the data to match the expected format
        const transformedData =
          data?.map((booking) => ({
            ...booking,
            tour_title: booking.tours?.title || "Unknown Tour",
            tour_location: booking.tours?.location || "Unknown Location",
            tourist_name: booking.profiles?.full_name || "Unknown Tourist",
            tourist_avatar: booking.profiles?.avatar_url || null,
          })) || [];

        setIncomingBookings(transformedData);
        setOutgoingBookings([]);
      } else {
        // Tourists see both outgoing and incoming bookings
        const { data, error: fetchError } = await supabase
          .from("bookings")
          .select(
            `
            *,
            tours!tour_id(title, location, creator_role),
            profiles!guide_id(full_name, avatar_url)
          `
          )
          .eq("tourist_id", user.id)
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;

        // Transform the data to match the expected format
        const transformedData =
          data?.map((booking) => ({
            ...booking,
            tour_title: booking.tours?.title || "Unknown Tour",
            tour_location: booking.tours?.location || "Unknown Location",
            guide_name: booking.profiles?.full_name || "Unknown Guide",
            guide_avatar: booking.profiles?.avatar_url || null,
          })) || [];

        // Separate incoming and outgoing based on booking status and tour creator
        const incoming = transformedData.filter(
          (booking) => booking.status === "offered" // Guide offers to provide tourist's tour request
        );
        const outgoing = transformedData.filter(
          (booking) => booking.status !== "offered" // Tourist's bookings for guide tours
        );

        setIncomingBookings(incoming);
        setOutgoingBookings(outgoing);
      }
    } catch (err: any) {
      console.error("Error fetching bookings:", err);
      setError(err.message || "Failed to load bookings");
      toast({
        title: "Error loading bookings",
        description: err.message || "An unexpected error occurred",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new booking
  const createBooking = async (bookingData: Partial<Booking>) => {
    if (!user) {
      return {
        success: false,
        error: "You must be logged in to book a tour",
      };
    }

    try {
      // Remove manual timestamp setting - let database handle with DEFAULT NOW()
      const finalBookingData = {
        ...bookingData,
        // Remove created_at and updated_at - database will handle these
      };

      const { data, error } = await supabase
        .from("bookings")
        .insert(finalBookingData)
        .select()
        .single();

      if (error) {
        console.error("Supabase booking insert error:", error);
        throw error;
      }

      // Create notification for the appropriate party
      if (data) {
        try {
          // Get tour title for notification message
          const { data: tourData } = await supabase
            .from("tours")
            .select("title")
            .eq("id", data.tour_id)
            .single();

          // For 'offered' status, notify the tourist. For 'requested' status, notify the guide
          const isOffer = data.status === "offered";
          const recipientId = isOffer ? data.tourist_id : data.guide_id;
          const message = isOffer
            ? `A guide offered to provide '${
                tourData?.title || "the tour"
              }' you requested for ${data.booking_date}`
            : `${user.user_metadata?.full_name || "Someone"} booked '${
                tourData?.title || "your tour"
              }' for ${data.booking_date}`;

          await createNotification({
            type: "booking_created",
            actor_id: user.id,
            recipient_id: recipientId,
            target_type: "booking",
            target_id: data.id,
            message: message,
            action_url: "/dashboard/my-bookings",
          });
        } catch (notificationError) {
          // Don't fail booking creation if notification fails
          console.warn(
            "Failed to create booking notification:",
            notificationError
          );
        }
      }

      // Update local state based on booking type
      if (data.status === "offered") {
        // For offers, guide is offering, so it goes to guide's outgoing
        if (profile?.role === "guide") {
          setOutgoingBookings((prev) => [data as Booking, ...prev]);
        } else {
          // Tourist should see offers in incoming
          setIncomingBookings((prev) => [data as Booking, ...prev]);
        }
      } else {
        // For requests, tourist is requesting, so it goes to tourist's outgoing
        if (profile?.role === "tourist") {
          setOutgoingBookings((prev) => [data as Booking, ...prev]);
        } else {
          // Guide should see requests in incoming
          setIncomingBookings((prev) => [data as Booking, ...prev]);
        }
      }

      return {
        success: true,
        booking: data as Booking,
      };
    } catch (err: any) {
      console.error("Error creating booking:", err);
      // Log detailed error information for debugging
      if (err.details) console.error("Error details:", err.details);
      if (err.hint) console.error("Error hint:", err.hint);

      return {
        success: false,
        error: err.message || "Failed to create booking",
      };
    }
  };

  // Update booking status - FIXED with better error handling and debugging
  const updateBookingStatus = async (
    bookingId: string,
    status: BookingStatus
  ) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to update a booking",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    if (!bookingId) {
      console.error("Invalid booking ID: empty or undefined");
      toast({
        title: "Error updating booking",
        description: "Invalid booking ID",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    try {
      console.log(`Updating booking ${bookingId} to status: ${status}`);
      console.log(`Current user: ${user.id}, Role: ${profile?.role}`);

      // For debugging: verify the booking exists and the user has permission
      const { data: bookingCheck, error: checkError } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .single();

      if (checkError) {
        console.error("Error verifying booking:", checkError);
        throw new Error(`Booking verification failed: ${checkError.message}`);
      }

      if (!bookingCheck) {
        throw new Error(`Booking with ID ${bookingId} not found`);
      }

      console.log("Booking to update:", bookingCheck);

      // Check role-based permissions to give more specific error messages
      if (profile?.role === "tourist" && bookingCheck.tourist_id !== user.id) {
        throw new Error("You do not have permission to update this booking");
      }

      if (profile?.role === "guide" && bookingCheck.guide_id !== user.id) {
        throw new Error("You do not have permission to update this booking");
      }

      // Additional validation for status transitions
      if (
        profile?.role === "tourist" &&
        status === "completed" &&
        bookingCheck.status !== "paid"
      ) {
        throw new Error("Only paid bookings can be marked as completed");
      }

      // Special handling for tourists accepting offered bookings
      if (
        profile?.role === "tourist" &&
        bookingCheck.status === "offered" &&
        status === "accepted"
      ) {
        console.log(
          "Tourist accepting an offered booking - this should be allowed"
        );
        // Verify this is indeed an offered booking for this tourist
        if (bookingCheck.tourist_id !== user.id) {
          throw new Error("You can only accept bookings offered to you");
        }

        // Add this debug information
        console.log("Debug: Attempting tourist accept offer operation", {
          bookingId,
          touristId: user.id,
          guideId: bookingCheck.guide_id,
          fromStatus: bookingCheck.status,
          toStatus: status,
        });
      }

      // Then in the error handling section, where it has these lines:
      if (error.code === "P0001" && error.message.includes("not allowed")) {
        // Add this improved error message specifically for offer acceptance
        if (
          profile?.role === "tourist" &&
          bookingCheck.status === "offered" &&
          status === "accepted"
        ) {
          throw new Error(
            "Unable to accept offer: Please try refreshing the page and try again. If the problem persists, the database permissions may need to be updated."
          );
        }
        throw new Error(
          "Permission denied: You do not have the required permissions to update this booking"
        );
      }

      // Now perform the actual update
      const { error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", bookingId);

      if (error) {
        console.error("Supabase update error:", error);
        console.error("Error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          bookingId,
          status,
          userId: user.id,
          userRole: profile?.role,
          bookingTouristId: bookingCheck.tourist_id,
          bookingGuideId: bookingCheck.guide_id,
          currentStatus: bookingCheck.status,
        });

        // Provide more specific error messages based on error codes
        if (error.code === "P0001" && error.message.includes("not allowed")) {
          // Check if this is specifically about tourist accepting offers
          if (
            profile?.role === "tourist" &&
            bookingCheck.status === "offered" &&
            status === "accepted"
          ) {
            throw new Error(
              "Unable to accept offer: Database permission error. This may be due to Row Level Security policies. Please contact support."
            );
          }
          throw new Error(
            "Permission denied: You do not have the required permissions to update this booking"
          );
        }

        throw error;
      }

      // Create notifications for status changes
      try {
        // Find the booking to get the guide_id, tourist_id and tour info
        const { data: bookingData } = await supabase
          .from("bookings")
          .select("guide_id, tourist_id, total_price, tours(title)")
          .eq("id", bookingId)
          .single();

        if (bookingData) {
          if (status === "paid") {
            // Notify guide when tourist pays
            await createNotification({
              type: "booking_paid",
              actor_id: bookingData.tourist_id,
              recipient_id: bookingData.guide_id,
              target_type: "booking",
              target_id: bookingId,
              message: `Payment of $${bookingData.total_price} received for your tour`,
              action_url: "/dashboard/my-bookings",
            });
          } else if (status === "accepted") {
            // Notify tourist when guide accepts their booking
            await createNotification({
              type: "booking_created", // Reuse existing type since it's about booking status
              actor_id: bookingData.guide_id,
              recipient_id: bookingData.tourist_id,
              target_type: "booking",
              target_id: bookingId,
              message: `Your booking for '${
                (bookingData as any).tours?.title || "tour"
              }' has been accepted`,
              action_url: "/dashboard/my-bookings",
            });
          } else if (status === "declined") {
            // Notify tourist when guide declines their booking
            await createNotification({
              type: "booking_created", // Reuse existing type since it's about booking status
              actor_id: bookingData.guide_id,
              recipient_id: bookingData.tourist_id,
              target_type: "booking",
              target_id: bookingId,
              message: `Your booking for '${
                (bookingData as any).tours?.title || "tour"
              }' has been declined`,
              action_url: "/dashboard/my-bookings",
            });
          } else if (status === "completed") {
            // Notify guide when tourist marks tour as completed
            await createNotification({
              type: "booking_completed",
              actor_id: bookingData.tourist_id,
              recipient_id: bookingData.guide_id,
              target_type: "booking",
              target_id: bookingId,
              message: `Your tour '${
                (bookingData as any).tours?.title || "tour"
              }' has been marked as completed`,
              action_url: "/dashboard/my-bookings",
            });
          }
        }
      } catch (notificationError) {
        console.warn(
          "Failed to create status change notification:",
          notificationError
        );
      }

      // Update local state - need to check both incoming and outgoing for both roles
      // since tourists can have incoming offers and outgoing requests
      const updateBookingInList = (bookings: Booking[]) =>
        bookings.map((booking) =>
          booking.id === bookingId
            ? { ...booking, status, updated_at: new Date().toISOString() }
            : booking
        );

      setIncomingBookings((prev) => updateBookingInList(prev));
      setOutgoingBookings((prev) => updateBookingInList(prev));

      return true;
    } catch (err: any) {
      console.error("Error updating booking status:", err);

      // Provide a more user-friendly error message
      let errorMessage =
        "An unexpected error occurred while updating the booking";

      if (err.message) {
        errorMessage = err.message;

        // Special case for the specific error we're fixing
        if (err.message.includes("Tourist is not allowed")) {
          errorMessage =
            "Permission denied: Tourists can only mark paid bookings as completed";
        }
      }

      toast({
        title: "Error updating booking",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });

      return false;
    }
  };

  // Check if user has completed a specific tour
  const hasCompletedTour = useCallback(
    async (tourId: string): Promise<boolean> => {
      if (!user || !tourId) return false;

      try {
        const { data, error } = await supabase
          .from("bookings")
          .select("id")
          .eq("tourist_id", user.id)
          .eq("tour_id", tourId)
          .eq("status", "completed")
          .maybeSingle();

        if (error) {
          // Log the error but don't throw to prevent UI crashes
          console.warn("Unable to check tour completion:", error.message);
          return false;
        }

        return !!data;
      } catch (err) {
        // Silently handle any unexpected errors and return false
        console.warn("Error checking tour completion:", err);
        return false;
      }
    },
    [user]
  );

  // Check if user has completed a tour with a specific guide
  const hasCompletedGuideBooking = useCallback(
    async (guideId: string): Promise<boolean> => {
      if (!user || !guideId) return false;

      try {
        const { data, error } = await supabase
          .from("bookings")
          .select("id")
          .eq("tourist_id", user.id)
          .eq("guide_id", guideId)
          .eq("status", "completed")
          .maybeSingle();

        if (error) {
          // Log the error but don't throw to prevent UI crashes
          console.warn("Unable to check guide tour completion:", error.message);
          return false;
        }

        return !!data;
      } catch (err) {
        // Silently handle any unexpected errors and return false
        console.warn("Error checking guide tour completion:", err);
        return false;
      }
    },
    [user]
  );

  // Auto-complete bookings that are past their deadline
  const checkAndAutoCompleteBookings = useCallback(async () => {
    if (!user || !profile) return;

    try {
      // Build query based on user role to avoid empty UUID filters
      let query = supabase.from("bookings").select("*").eq("status", "paid");

      // Apply role-specific filters to avoid empty string UUIDs
      if (profile.role === "guide") {
        query = query.eq("guide_id", user.id);
      } else if (profile.role === "tourist") {
        query = query.eq("tourist_id", user.id);
      }

      const { data: paidBookings, error } = await query;

      if (error) {
        console.warn(
          "Error fetching paid bookings for auto-completion:",
          error
        );
        return;
      }

      if (!paidBookings || paidBookings.length === 0) return;

      // Check each booking for auto-completion
      for (const booking of paidBookings) {
        if (
          shouldAutoComplete(
            booking.booking_date,
            booking.status,
            booking.preferred_time
          )
        ) {
          // Update booking to completed
          const { error: updateError } = await supabase
            .from("bookings")
            .update({
              status: "completed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", booking.id);

          if (updateError) {
            console.warn(
              `Failed to auto-complete booking ${booking.id}:`,
              updateError
            );
            continue;
          }

          // Send notifications to both parties
          try {
            // Notify tourist
            await createNotification({
              type: "booking_completed",
              actor_id: booking.guide_id,
              recipient_id: booking.tourist_id,
              target_type: "booking",
              target_id: booking.id,
              message: `Your tour has been automatically completed. Payment has been released to the guide.`,
              action_url: "/dashboard/my-bookings",
            });

            // Notify guide
            await createNotification({
              type: "booking_completed",
              actor_id: booking.tourist_id,
              recipient_id: booking.guide_id,
              target_type: "booking",
              target_id: booking.id,
              message: `Your tour has been automatically completed. Payment has been released.`,
              action_url: "/dashboard/my-bookings",
            });
          } catch (notificationError) {
            console.warn(
              "Failed to send auto-completion notifications:",
              notificationError
            );
          }

          // Update local state if this booking affects current user
          if (profile.role === "guide") {
            setIncomingBookings((prev) =>
              prev.map((b) =>
                b.id === booking.id
                  ? {
                      ...b,
                      status: "completed",
                      updated_at: new Date().toISOString(),
                    }
                  : b
              )
            );
          } else {
            setOutgoingBookings((prev) =>
              prev.map((b) =>
                b.id === booking.id
                  ? {
                      ...b,
                      status: "completed",
                      updated_at: new Date().toISOString(),
                    }
                  : b
              )
            );
          }
        }
      }
    } catch (err) {
      console.warn("Error in auto-completion check:", err);
    }
  }, [user, profile, createNotification]);

  // Check for auto-completion when bookings refresh and periodically
  useEffect(() => {
    if (profile) {
      checkAndAutoCompleteBookings();

      // Set up periodic check (every 5 minutes)
      const interval = setInterval(checkAndAutoCompleteBookings, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [profile, checkAndAutoCompleteBookings]);

  // Enhanced updateBookingStatus with payment validation
  const updateBookingStatusWithValidation = async (
    bookingId: string,
    newStatus: BookingStatus
  ): Promise<boolean> => {
    if (!user || !profile) return false;

    // Validate the booking ID is valid
    if (!bookingId || typeof bookingId !== "string" || !bookingId.trim()) {
      toast({
        title: "Invalid booking ID",
        description: "A valid booking ID is required",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    // If status is changing to paid, validate payment timing
    if (newStatus === "paid") {
      const booking = [...incomingBookings, ...outgoingBookings].find(
        (b) => b.id === bookingId
      );
      if (booking) {
        const validation = validatePaymentTiming(
          booking.booking_date,
          booking.preferred_time
        );
        if (!validation.canPay) {
          toast({
            title: "Payment Deadline Passed",
            description: validation.error,
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          return false;
        }
      }
    }

    // If status is changing to completed by a tourist, ensure it's in paid status
    if (newStatus === "completed" && profile.role === "tourist") {
      const booking = [...incomingBookings, ...outgoingBookings].find(
        (b) => b.id === bookingId
      );
      if (!booking) {
        toast({
          title: "Booking not found",
          description: "Could not find the specified booking",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return false;
      }

      if (booking.status !== "paid") {
        toast({
          title: "Invalid status change",
          description: "Only paid bookings can be marked as completed",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return false;
      }
    }

    return updateBookingStatus(bookingId, newStatus);
  };

  const value = {
    incomingBookings,
    outgoingBookings,
    isLoading,
    error,
    createBooking,
    updateBookingStatus: updateBookingStatusWithValidation,
    refreshBookings,
    hasCompletedTour,
    hasCompletedGuideBooking,
  };

  return (
    <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
  );
};

export const useBookings = () => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error("useBookings must be used within a BookingProvider");
  }
  return context;
};
