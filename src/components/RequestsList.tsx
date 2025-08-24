import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import RequestCard, { RequestStatus } from './RequestCard';

interface Request {
  id: string;
  title: string;
  description: string;
  status: RequestStatus;
  created_at: string;
  start_date?: string | null;
  end_date?: string | null;
  guide_id: string;
  tourist_id: string;
  // Supabase returns related columns as arrays of objects
  guides?: Array<{
    users: Array<{
      display_name: string;
    }>;
  }>;
  tourists?: Array<{
    users: Array<{
      display_name: string;
    }>;
  }>;
}

interface RequestsListProps {
  userRole: 'guide' | 'tourist';
  filter?: RequestStatus | 'all';
}

export default function RequestsList({ userRole, filter = 'all' }: RequestsListProps) {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole, filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      const userId = (userData as any)?.user?.id;
      if (!userId) throw new Error('User not authenticated');
      
      // Build the query based on the user role
      let query = supabase
        .from('tour_requests')
        .select(`
          id,
          title, 
          description,
          status,
          created_at,
          start_date,
          end_date,
          guide_id,
          tourist_id,
          guides:guide_id (
            users (
              display_name
            )
          ),
          tourists:tourist_id (
            users (
              display_name
            )
          )
        `);
      
      // Add filter by user role
      if (userRole === 'guide') {
        query = query.eq('guide_id', userId);
      } else {
        query = query.eq('tourist_id', userId);
      }
      
      // Add status filter if not 'all'
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }
      
      // Order by created date, newest first
      query = query.order('created_at', { ascending: false });
      
      const { data, error: requestsError } = await query;
      
      if (requestsError) throw requestsError;
      
      // Pragmatic cast to Request[]; map/validate if you need stronger guarantees
      setRequests((data as Request[]) || []);
    } catch (err: any) {
      console.error('Error fetching requests:', err);
      setError(err?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId: string, newStatus: RequestStatus) => {
    try {
      const { error } = await supabase
        .from('tour_requests')
        .update({ status: newStatus })
        .eq('id', requestId);
        
      if (error) throw error;
      
      // Refresh the list
      fetchRequests();
    } catch (err: any) {
      console.error('Error updating request status:', err);
      alert('Failed to update request status');
    }
  };

  if (loading) {
    return <div className="py-4 text-center">Loading requests...</div>;
  }

  if (error) {
    return (
      <div className="py-4 text-center text-red-600">
        Error: {error}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        No requests found. {userRole === 'tourist' ? 'Try making a new request!' : ''}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => {
        // Safely pull the other user's display name:
        const otherUserName =
          userRole === 'guide'
            ? request.tourists?.[0]?.users?.[0]?.display_name ?? 'Tourist'
            : request.guides?.[0]?.users?.[0]?.display_name ?? 'Guide';

        return (
          <RequestCard
            key={request.id}
            id={request.id}
            title={request.title}
            description={request.description}
            status={request.status}
            createdAt={request.created_at}
            startDate={request.start_date ?? undefined}
            endDate={request.end_date ?? undefined}
            userName={otherUserName}
            userRole={userRole}
            onAccept={() => handleStatusUpdate(request.id, 'accepted')}
            onDecline={() => handleStatusUpdate(request.id, 'declined')}
          />
        );
      })}
    </div>
  );
}
