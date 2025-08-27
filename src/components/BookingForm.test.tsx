import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import BookingForm from './BookingForm';

// Mock the auth and booking contexts
vi.mock('../contexts/AuthProvider', () => ({
  useAuth: () => ({
    profile: { id: 'test-user-id', role: 'tourist' }
  })
}));

vi.mock('../contexts/BookingContext', () => ({
  useBookings: () => ({
    createBooking: vi.fn()
  })
}));

const defaultProps = {
  tourId: 'test-tour-id',
  tourTitle: 'Test Tour',
  guideId: 'test-guide-id',
  pricePerPerson: 50,
  maxCapacity: 10,
  availableDays: [true, false, true, false, true, false, false], // Mon, Wed, Fri
  onSuccess: vi.fn(),
  onCancel: vi.fn()
};

const renderWithChakra = (component: React.ReactElement) => {
  return render(
    <ChakraProvider>
      {component}
    </ChakraProvider>
  );
};

describe('BookingForm - Responsive Design', () => {
  it('should render all form elements', () => {
    renderWithChakra(<BookingForm {...defaultProps} />);
    
    expect(screen.getByText('Test Tour')).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/preferred time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/number of people/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/special requests/i)).toBeInTheDocument();
    expect(screen.getByText('Price Summary')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit request/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('should show available days information', () => {
    renderWithChakra(<BookingForm {...defaultProps} />);
    
    expect(screen.getByText('Available on: Monday, Wednesday, Friday')).toBeInTheDocument();
  });

  it('should calculate price correctly', () => {
    renderWithChakra(<BookingForm {...defaultProps} />);
    
    // Default party size is 1, price per person is 50
    expect(screen.getByText('$50 × 1 person')).toBeInTheDocument();
    expect(screen.getByText('$50.00')).toBeInTheDocument();
  });

  it('should render as offer mode when isOffer is true', () => {
    renderWithChakra(<BookingForm {...defaultProps} isOffer={true} />);
    
    expect(screen.getByText(/offering to provide this tour/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send offer/i })).toBeInTheDocument();
  });

  it('should show warning when no available days', () => {
    const propsWithNoAvailableDays = {
      ...defaultProps,
      availableDays: [false, false, false, false, false, false, false]
    };
    
    renderWithChakra(<BookingForm {...propsWithNoAvailableDays} />);
    
    expect(screen.getByText('No available days specified for this tour.')).toBeInTheDocument();
  });
});