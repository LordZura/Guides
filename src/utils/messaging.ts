import { supabase } from '../supabaseClient';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  // normalized to be a single object (or undefined)
  sender?: {
    display_name: string;
    email: string;
  };
}

export interface Conversation {
  id: string;
  title: string;
  tour_request_id?: string;
  created_at: string;
  updated_at: string;
  latest_message?: Message;
  other_participant?: {
    id: string;
    display_name: string;
  } | null;
  unread_count: number;
}

/**
 * Get all conversations for the current user
 */
export async function getUserConversations(userId: string): Promise<Conversation[]> {
  try {
    // Get all conversations where user is a participant
    const { data: participantsData, error: participantsError } = await supabase
      .from('conversation_participants')
      .select('conversation_id, last_read_at')
      .eq('user_id', userId);

    if (participantsError) throw participantsError;
    if (!participantsData || participantsData.length === 0) return [];

    const conversationIds = participantsData.map((p: any) => p.conversation_id);
    const lastReadMap = participantsData.reduce((acc: Record<string, string>, p: any) => {
      acc[p.conversation_id] = p.last_read_at;
      return acc;
    }, {});

    // Get conversation details
    const { data: conversationsData, error: conversationsError } = await supabase
      .from('conversations')
      .select(`
        id,
        title,
        tour_request_id,
        created_at,
        updated_at
      `)
      .in('id', conversationIds)
      .order('updated_at', { ascending: false });

    if (conversationsError) throw conversationsError;
    if (!conversationsData) return [];

    // Get the latest message for each conversation (desc by created_at)
    const { data: latestMessagesData, error: messagesError } = await supabase
      .from('messages')
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        created_at
      `)
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false });

    if (messagesError) throw messagesError;

    // Create a map of conversation_id -> latest message
    const latestMessagesMap: Record<string, Message> = {};
    if (latestMessagesData) {
      for (const message of (latestMessagesData as any[])) {
        if (!latestMessagesMap[message.conversation_id]) {
          latestMessagesMap[message.conversation_id] = {
            id: message.id,
            conversation_id: message.conversation_id,
            sender_id: message.sender_id,
            content: message.content,
            created_at: message.created_at
          };
        }
      }
    }

    // Get all other participants in these conversations (joined to users)
    const { data: otherParticipantsData, error: otherParticipantsError } = await supabase
      .from('conversation_participants')
      .select(`
        conversation_id,
        user_id,
        users:user_id (
          id,
          display_name
        )
      `)
      .in('conversation_id', conversationIds)
      .neq('user_id', userId);

    if (otherParticipantsError) throw otherParticipantsError;

    // Map conversation_id -> other participant (take first user row)
    const otherParticipantsMap: Record<string, { id: string; display_name: string } | null> = {};
    if (otherParticipantsData) {
      for (const participant of (otherParticipantsData as any[])) {
        // participant.users may be an array; pick first if so
        const users = participant.users;
        if (Array.isArray(users) && users.length > 0) {
          otherParticipantsMap[participant.conversation_id] = {
            id: users[0].id,
            display_name: users[0].display_name
          };
        } else if (users && users.id) {
          // sometimes it might be an object already
          otherParticipantsMap[participant.conversation_id] = {
            id: users.id,
            display_name: users.display_name
          };
        } else {
          otherParticipantsMap[participant.conversation_id] = null;
        }
      }
    }

    // Count unread messages and assemble conversations
    const conversations: Conversation[] = [];

    for (const conversation of (conversationsData as any[])) {
      const lastReadAt = lastReadMap[conversation.id] || conversation.created_at;

      // Count messages after last_read_at not sent by this user
      const { count, error: countError } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conversation.id)
        .gt('created_at', lastReadAt)
        .neq('sender_id', userId);

      if (countError) throw countError;

      conversations.push({
        id: conversation.id,
        title: conversation.title,
        tour_request_id: conversation.tour_request_id,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at,
        latest_message: latestMessagesMap[conversation.id],
        other_participant: otherParticipantsMap[conversation.id] ?? null,
        unread_count: (count as number) || 0
      });
    }

    return conversations;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
}

/**
 * Get messages for a specific conversation
 */
export async function getConversationMessages(
  conversationId: string,
  limit = 50,
  startAfter?: string
): Promise<Message[]> {
  try {
    let query = supabase
      .from('messages')
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        created_at,
        sender:sender_id (
          display_name,
          email
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (startAfter) {
      query = query.lt('created_at', startAfter);
    }

    const { data, error } = await query;

    if (error) throw error;

    const raw = (data as any[]) || [];

    // Normalize sender: Supabase returns an array for the FK join; pick first element or undefined
    const normalized: Message[] = raw.map((message) => {
      const senderRaw = message.sender;
      const senderObj =
        Array.isArray(senderRaw) ? (senderRaw[0] ?? undefined) : (senderRaw ?? undefined);

      // Ensure returned object matches Message interface
      return {
        id: message.id,
        conversation_id: message.conversation_id,
        sender_id: message.sender_id,
        content: message.content,
        created_at: message.created_at,
        sender: senderObj ? { display_name: senderObj.display_name, email: senderObj.email } : undefined
      };
    });

    return normalized;
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
}

/**
 * Send a new message
 */
export async function sendMessage(
  conversationId: string,
  content: string
): Promise<Message> {
  try {
    // Get current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const userId = userData.user?.id;
    if (!userId) throw new Error('Not authenticated');

    // Insert the message
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        content
      })
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create message');

    // Update the conversation updated_at timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    // Normalize the returned message if needed (no sender info returned here usually)
    const created: any = data;
    return {
      id: created.id,
      conversation_id: created.conversation_id,
      sender_id: created.sender_id,
      content: created.content,
      created_at: created.created_at
    } as Message;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

/**
 * Mark conversation as read
 */
export async function markConversationAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    throw error;
  }
}

/**
 * Count unread messages across all conversations
 */
export async function countUnreadMessages(userId: string): Promise<number> {
  try {
    // Get all conversations where user is a participant
    const { data: participantsData, error: participantsError } = await supabase
      .from('conversation_participants')
      .select('conversation_id, last_read_at')
      .eq('user_id', userId);

    if (participantsError) throw participantsError;
    if (!participantsData || participantsData.length === 0) return 0;

    let totalUnread = 0;

    // For each conversation, count messages after last_read_at
    for (const participant of (participantsData as any[])) {
      const { count, error: countError } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', participant.conversation_id)
        .gt('created_at', participant.last_read_at)
        .neq('sender_id', userId);

      if (countError) throw countError;

      totalUnread += (count as number) || 0;
    }

    return totalUnread;
  } catch (error) {
    console.error('Error counting unread messages:', error);
    return 0; // Return 0 on error
  }
}
