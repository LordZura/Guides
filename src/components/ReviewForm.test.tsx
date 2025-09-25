import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ReviewForm from './ReviewForm';

// Mock dependencies
vi.mock('../contexts/ReviewsContext', () => ({
  useReviews: () => ({
    addReview: vi.fn(),
    isLoading: false,
    hasUserReviewed: vi.fn().mockResolvedValue(false)
  })
}));

vi.mock('../contexts/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'user-123' },
    profile: { role: 'tourist' }
  })
}));

vi.mock('../contexts/BookingContext', () => ({
  useBookings: () => ({
    hasCompletedTour: vi.fn().mockResolvedValue(false),
    hasCompletedGuideBooking: vi.fn().mockResolvedValue(false)
  })
}));

vi.mock('@chakra-ui/react', () => ({
  Box: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  FormControl: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  FormLabel: ({ children, ...props }: any) => <label {...props}>{children}</label>,
  FormErrorMessage: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Textarea: ({ ...props }: any) => <textarea {...props} />,
  HStack: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Text: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  useToast: () => vi.fn(),
  Alert: ({ children, ...props }: any) => <div role="alert" {...props}>{children}</div>,
  AlertIcon: () => <span>!</span>,
  AlertTitle: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  AlertDescription: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

vi.mock('./StarRating', () => ({
  default: ({ onChange, ...props }: any) => 
    <div data-testid="star-rating" onClick={() => onChange(5)} {...props}>Star Rating</div>
}));

describe('ReviewForm', () => {
  it('should allow review when booking status is completed', async () => {
    render(
      <ReviewForm
        targetId="guide-123"
        targetType="guide"
        tourId="tour-456"
        bookingStatus="completed"
      />
    );

    // Wait for async checks to complete
    await waitFor(() => {
      expect(screen.queryByText('Checking if you can review...')).not.toBeInTheDocument();
    });

    // Should show the review form, not the "booking required" message
    expect(screen.queryByText('Booking required')).not.toBeInTheDocument();
    expect(screen.getByText('Your Rating')).toBeInTheDocument();
    expect(screen.getByText('Your Review')).toBeInTheDocument();
    expect(screen.getByText('Submit Review')).toBeInTheDocument();
  });

  it('should show booking required when booking status is not completed', async () => {
    render(
      <ReviewForm
        targetId="guide-123"
        targetType="guide"
        tourId="tour-456"
        bookingStatus="paid"
      />
    );

    // Wait for async checks to complete with a longer timeout
    await waitFor(() => {
      expect(screen.queryByText('Checking if you can review...')).not.toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Should show booking required since hasCompletedGuideBooking returns false
    expect(screen.getByText('Booking required')).toBeInTheDocument();
  });

  it('should show checking message when no booking status is provided', () => {
    render(
      <ReviewForm
        targetId="guide-123"
        targetType="guide"
        tourId="tour-456"
      />
    );

    // Should show checking message initially
    expect(screen.getByText('Checking if you can review...')).toBeInTheDocument();
  });
});