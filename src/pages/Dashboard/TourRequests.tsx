import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import RequestsList from '../../components/RequestsList';
import { RequestStatus } from '../../components/RequestCard';

export default function TourRequests() {
  const { id } = useParams<{ id?: string }>();
  const [userRole, setUserRole] = useState<'guide' | 'tourist' | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<RequestStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        const userId = userData.user?.id;
        if (!userId) throw new Error('User not logged in');

        // Fetch role from users table
        const { data: roleData, error: roleError } = await supabase
          .from('users')
          .select('role')
          .eq('id', userId)
          .single();
        if (roleError) throw roleError;

        setUserRole(roleData.role as 'guide' | 'tourist');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  if (loading) return <p>Loading...</p>;

  if (!userRole) {
    return <p className="text-red-500">Error: Unable to determine your role</p>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          {userRole === 'guide' ? 'Tour Requests' : 'My Requests'}
        </h2>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as RequestStatus | 'all')}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="declined">Declined</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
      
      {id ? (
        <div>
          {/* Individual request view */}
          <p>Viewing request {id}</p>
        </div>
      ) : (
        <RequestsList userRole={userRole} filter={selectedStatus} />
      )}
    </div>
  );
}