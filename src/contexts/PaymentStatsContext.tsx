import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthProvider';

export interface PaymentStats {
  pendingPayments: number;
  completedPayments: number;
  totalEarnings: number;
  pendingEarnings: number;
  paidBookingsCount: number;
  completedBookingsCount: number;
}

interface PaymentStatsContextType {
  paymentStats: PaymentStats;
  isLoading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
}

const PaymentStatsContext = createContext<PaymentStatsContextType | undefined>(undefined);

export const PaymentStatsProvider = ({ children }: { children: ReactNode }) => {
  const { user, profile } = useAuth();
  const [paymentStats, setPaymentStats] = useState<PaymentStats>({
    pendingPayments: 0,
    completedPayments: 0,
    totalEarnings: 0,
    pendingEarnings: 0,
    paidBookingsCount: 0,
    completedBookingsCount: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentStats = async () => {
    if (!user || !profile || profile.role !== 'guide') {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch all bookings for this guide
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('status, total_price')
        .eq('guide_id', user.id)
        .in('status', ['paid', 'completed']);

      if (bookingsError) throw bookingsError;

      if (!bookings) {
        setPaymentStats({
          pendingPayments: 0,
          completedPayments: 0,
          totalEarnings: 0,
          pendingEarnings: 0,
          paidBookingsCount: 0,
          completedBookingsCount: 0,
        });
        return;
      }

      // Calculate stats
      const paidBookings = bookings.filter(b => b.status === 'paid');
      const completedBookings = bookings.filter(b => b.status === 'completed');

      const pendingEarnings = paidBookings.reduce((sum, booking) => sum + Number(booking.total_price), 0);
      const completedEarnings = completedBookings.reduce((sum, booking) => sum + Number(booking.total_price), 0);

      setPaymentStats({
        pendingPayments: paidBookings.length,
        completedPayments: completedBookings.length,
        totalEarnings: pendingEarnings + completedEarnings,
        pendingEarnings,
        paidBookingsCount: paidBookings.length,
        completedBookingsCount: completedBookings.length,
      });

    } catch (err: unknown) {
      console.error('Error fetching payment stats:', err);
      setError((err as Error).message || 'Failed to load payment statistics');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch stats on mount and when user/profile changes
  useEffect(() => {
    if (user && profile && profile.role === 'guide') {
      fetchPaymentStats();
    }
  }, [user, profile]);

  const value = {
    paymentStats,
    isLoading,
    error,
    refreshStats: fetchPaymentStats,
  };

  return (
    <PaymentStatsContext.Provider value={value}>
      {children}
    </PaymentStatsContext.Provider>
  );
};

export const usePaymentStats = () => {
  const context = useContext(PaymentStatsContext);
  if (context === undefined) {
    throw new Error('usePaymentStats must be used within a PaymentStatsProvider');
  }
  return context;
};