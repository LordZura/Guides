import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
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
  Box: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
  Button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <button {...props}>{children}</button>,
  FormControl: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
  FormLabel: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <label {...props}>{children}</label>,
  FormErrorMessage: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
  Textarea: ({ ...props }: Record<string, unknown>) => <textarea {...props} />,
  HStack: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
  Text: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <span {...props}>{children}</span>,
  useToast: () => vi.fn(),
  Alert: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div role="alert" {...props}>{children}</div>,
  AlertIcon: () => <span>!</span>,
  AlertTitle: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
  AlertDescription: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
}));

vi.mock('./StarRating', () => ({
  default: ({ onChange, ...props }: { onChange: (rating: number) => void } & Record<string, unknown>) => 
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