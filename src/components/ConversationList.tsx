import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserConversations, Conversation } from '../utils/messaging';

interface ConversationListProps {
  userId: string;
  activeId?: string;
}

export default function ConversationList({ userId, activeId }: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchConversations();
    
    // Set up polling every 30 seconds
    const interval = setInterval(fetchConversations, 30000);
    
    return () => clearInterval(interval);
  }, [userId]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const conversationList = await getUserConversations(userId);
      setConversations(conversationList);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching conversations:', err);
      setError(err.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // Today: show time only
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // This week: show day name
    const daysAgo = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (daysAgo < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Older: show date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (loading && conversations.length === 0) {
    return <div className="py-4 text-center">Loading conversations...</div>;
  }

  if (error && conversations.length === 0) {
    return (
      <div className="py-4 text-center text-red-600">
        Error: {error}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        No conversations yet.
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden divide-y">
      {conversations.map((conversation) => (
        <Link
          key={conversation.id}
          to={`/dashboard/messages/${conversation.id}`}
          className={`block p-3 hover:bg-gray-50 ${
            activeId === conversation.id ? 'bg-blue-50' : ''
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                <h3 className="font-medium truncate">
                  {conversation.other_participant?.display_name || conversation.title}
                </h3>
                {conversation.unread_count > 0 && (
                  <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {conversation.unread_count}
                  </span>
                )}
              </div>
              
              {conversation.latest_message && (
                <p className="text-sm text-gray-600 truncate mt-1">
                  {conversation.latest_message.sender_id === userId ? 'You: ' : ''}
                  {conversation.latest_message.content}
                </p>
              )}
            </div>
            
            {conversation.latest_message && (
              <div className="text-xs text-gray-500 whitespace-nowrap ml-2">
                {formatDate(conversation.latest_message.created_at)}
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}