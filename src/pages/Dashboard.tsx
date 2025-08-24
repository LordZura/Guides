import React, { useEffect, useState } from 'react';
import { useNavigate, Routes, Route, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import GuideProfile from './Dashboard/GuideProfile';
import TourRequests from './Dashboard/TourRequests';
import Messages from './Dashboard/Messages';
import { countUnreadMessages } from '../utils/messaging';

type UserRole = 'guide' | 'tourist' | null;

export default function Dashboard() {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        const userId = authData.user?.id;
        if (!userId) throw new Error('User not logged in');
        
        setUserId(userId);

        // Fetch role from users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', userId)
          .single();
        if (userError) throw userError;

        setRole(userData.role);
        
        // Check for unread messages
        const count = await countUnreadMessages(userId);
        setUnreadCount(count);
        
        // Set up polling for new message notifications
        const interval = setInterval(async () => {
          const newCount = await countUnreadMessages(userId);
          setUnreadCount(newCount);
        }, 30000); // Every 30 seconds
        
        return () => clearInterval(interval);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  if (loading) return <p>Loading dashboard...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {role && (
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar navigation */}
          <div className="md:w-64">
            <div className="bg-gray-50 border rounded p-4">
              <div className="pb-2 mb-2 border-b">
                <div className="font-medium">
                  {role === 'guide' ? 'Guide Dashboard' : 'Tourist Dashboard'}
                </div>
              </div>
              
              <nav className="space-y-1">
                {role === 'guide' && (
                  <>
                    <Link to="/dashboard" className="block py-2 px-3 rounded hover:bg-gray-200">
                      My Profile
                    </Link>
                    <Link to="/dashboard/tours" className="block py-2 px-3 rounded hover:bg-gray-200">
                      My Tours
                    </Link>
                  </>
                )}
                
                <Link to="/dashboard/requests" className="block py-2 px-3 rounded hover:bg-gray-200">
                  {role === 'guide' ? 'Tour Requests' : 'My Requests'}
                </Link>
                
                <Link to="/dashboard/messages" className="block py-2 px-3 rounded hover:bg-gray-200 flex justify-between">
                  <span>Messages</span>
                  {unreadCount > 0 && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              </nav>
            </div>
          </div>
          
          {/* Main content */}
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<GuideProfile />} />
              <Route path="/requests/*" element={<TourRequests />} />
              <Route path="/messages/*" element={<Messages />} />
              <Route path="/messages/:id" element={<Messages />} />
            </Routes>
          </div>
        </div>
      )}

      {role === null && (
        <p className="mt-2 text-red-500">
          Could not determine your role — are you logged in?
        </p>
      )}
    </div>
  );
}