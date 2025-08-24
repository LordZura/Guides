import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  getConversationMessages, 
  sendMessage, 
  markConversationAsRead, 
  Message 
} from '../utils/messaging';
import { supabase } from '../supabaseClient';

export default function ConversationView() {
  const { id } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUserId = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error fetching user:', error);
        return;
      }
      
      setUserId(data.user?.id || null);
    };
    
    fetchUserId();
  }, []);

  useEffect(() => {
    if (!id || !userId) return;
    
    // Load initial messages
    fetchMessages();
    
    // Mark as read when viewing
    markConversationAsRead(id, userId);
    
    // Set up subscription for new messages
    const subscription = supabase
      .channel(`conversation_${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${id}`
      }, (payload) => {
        const newMessage = payload.new as Message;
        setMessages(prev => [newMessage, ...prev]);
        
        // Mark as read if we're receiving messages
        if (newMessage.sender_id !== userId) {
          markConversationAsRead(id, userId);
        }
      })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, [id, userId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && !loadingMore) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loadingMore]);

  const fetchMessages = async (startAfter?: string) => {
    if (!id) return;
    
    try {
      if (startAfter) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      const fetchedMessages = await getConversationMessages(id, 25, startAfter);
      
      if (startAfter) {
        setMessages(prev => [...prev, ...fetchedMessages]);
      } else {
        setMessages(fetchedMessages);
      }
      
      // If we got less than 25 messages, there are no more to load
      setHasMore(fetchedMessages.length === 25);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      setError(err.message || 'Failed to load messages');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id || !newMessage.trim() || !userId) return;
    
    try {
      setSendingMessage(true);
      await sendMessage(id, newMessage.trim());
      setNewMessage('');
    } catch (err: any) {
      console.error('Error sending message:', err);
      alert('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleLoadMore = () => {
    if (loadingMore || !hasMore || messages.length === 0) return;
    
    const oldestMessage = messages[messages.length - 1];
    fetchMessages(oldestMessage.created_at);
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  // Group messages by date
  const groupMessagesByDate = () => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';
    let currentGroup: Message[] = [];
    
    // Remember the array is newest first, so we process in reverse for the display
    [...messages].reverse().forEach(message => {
      const messageDate = new Date(message.created_at).toDateString();
      
      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: [...currentGroup] });
          currentGroup = [];
        }
        currentDate = messageDate;
      }
      
      currentGroup.push(message);
    });
    
    // Add the last group
    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }
    
    return groups;
  };

  if (loading && messages.length === 0) {
    return <div className="py-4 text-center">Loading conversation...</div>;
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-200px)]">
      {/* Messages container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 flex flex-col-reverse"
      >
        <div>
          <div ref={messagesEndRef} />
          
          {groupMessagesByDate().map(group => (
            <div key={group.date}>
              <div className="text-center my-4">
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                  {formatMessageDate(group.messages[0].created_at)}
                </span>
              </div>
              
              {group.messages.map(message => (
                <div 
                  key={message.id}
                  className={`mb-4 flex ${message.sender_id === userId ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[75%] rounded-lg px-4 py-2 ${
                      message.sender_id === userId 
                        ? 'bg-blue-500 text-white rounded-br-none' 
                        : 'bg-gray-200 text-gray-800 rounded-bl-none'
                    }`}
                  >
                    <div className="text-sm">{message.content}</div>
                    <div 
                      className={`text-xs mt-1 ${
                        message.sender_id === userId ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      {formatMessageTime(message.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
          
          {hasMore && (
            <div className="text-center my-4">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="text-blue-500 text-sm hover:underline disabled:text-gray-400"
              >
                {loadingMore ? 'Loading...' : 'Load older messages'}
              </button>
            </div>
          )}
          
          {error && (
            <div className="text-center text-red-500 my-4">
              {error}
            </div>
          )}
        </div>
      </div>
      
      {/* Message input */}
      <div className="border-t p-4 bg-white">
        <form onSubmit={handleSendMessage} className="flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={sendingMessage}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sendingMessage}
            className="bg-blue-600 text-white px-4 py-2 rounded-r-lg disabled:bg-blue-300"
          >
            {sendingMessage ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}