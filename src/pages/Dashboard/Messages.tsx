import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import ConversationList from '../../components/ConversationList';
import ConversationView from '../../components/ConversationView';

export default function Messages() {
  const { id } = useParams<{ id?: string }>();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        
        setUserId(data.user?.id || null);
      } catch (err) {
        console.error('Error fetching user:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, []);

  if (loading) {
    return <div>Loading messages...</div>;
  }

  if (!userId) {
    return <div className="text-red-500">Error: You must be logged in to view messages</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Messages</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Conversation list sidebar */}
        <div className="md:col-span-1">
          <ConversationList userId={userId} activeId={id} />
        </div>
        
        {/* Conversation view */}
        <div className="md:col-span-2">
          {id ? (
            <ConversationView />
          ) : (
            <div className="bg-gray-50 border rounded-lg p-8 text-center">
              <p className="text-gray-500">Select a conversation from the list</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}