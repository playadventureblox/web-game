import { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { storage } from './api';

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_username?: string;
  sender_display_name?: string;
  sender_avatar_url?: string;
}

export interface PresenceData {
  userId: string;
  username: string;
  presenceStatus: 'online' | 'offline' | 'in-game';
  currentGame?: string;
  lastOnline: string;
}

// Global channel references
let presenceChannel: RealtimeChannel | null = null;
let messageChannels: Map<string, RealtimeChannel> = new Map();
let typingChannels: Map<string, RealtimeChannel> = new Map();

/**
 * Initialize presence tracking with Supabase Realtime
 */
// Helper to build presenceMap from Supabase presence state
const buildPresenceMap = (state: RealtimePresenceState): Map<string, PresenceData> => {
  const map = new Map<string, PresenceData>();
  Object.keys(state).forEach((key) => {
    const presences = state[key];
    if (presences && presences.length > 0) {
      const p = presences[0] as any;
      if (p && p.userId) {
        map.set(p.userId, {
          userId: p.userId,
          username: p.username,
          presenceStatus: p.presenceStatus || 'online',
          currentGame: p.currentGame,
          lastOnline: p.lastOnline,
        });
      }
    }
  });
  return map;
};

export const initializePresence = async (
  userId: string,
  username: string,
  onPresenceUpdate: (presences: Map<string, PresenceData>) => void
): Promise<RealtimeChannel> => {
  // Remove existing channel if any
  if (presenceChannel) {
    await supabase.removeChannel(presenceChannel);
  }

  // Create presence channel
  presenceChannel = supabase.channel('presence', {
    config: {
      presence: {
        key: userId,
      },
    },
  });

  presenceChannel
    .on('presence', { event: 'sync' }, () => {
      const state: RealtimePresenceState = presenceChannel!.presenceState();
      onPresenceUpdate(buildPresenceMap(state));
    })
    .on('presence', { event: 'join' }, () => {
      // Re-sync on join so map is always up to date
      const state: RealtimePresenceState = presenceChannel!.presenceState();
      onPresenceUpdate(buildPresenceMap(state));
    })
    .on('presence', { event: 'leave' }, () => {
      // Re-sync on leave so departed users are removed
      const state: RealtimePresenceState = presenceChannel!.presenceState();
      onPresenceUpdate(buildPresenceMap(state));
    })
    .subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') {
        await presenceChannel!.track({
          userId,
          username,
          presenceStatus: 'online',
          lastOnline: new Date().toISOString(),
        });
        await updatePresenceInDatabase(userId, 'online');
      }
    });

  return presenceChannel;
};

/**
 * Update presence status
 */
export const updatePresenceStatus = async (
  status: 'online' | 'offline' | 'in-game',
  currentGame?: string
) => {
  if (!presenceChannel) return;

  const token = storage.getAccessToken();
  if (!token) return;

  // Decode JWT to get userId
  const payload = JSON.parse(atob(token.split('.')[1]));
  const userId = payload.userId;
  const username = payload.username;

  await presenceChannel.track({
    userId,
    username,
    presenceStatus: status,
    currentGame: currentGame || null,
    lastOnline: new Date().toISOString(),
  });

  // Update database
  await updatePresenceInDatabase(userId, status, currentGame);
};

/**
 * Update presence in database
 */
const updatePresenceInDatabase = async (
  userId: string,
  status: 'online' | 'offline' | 'in-game',
  currentGame?: string
) => {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        presenceStatus: status,
        lastOnline: new Date().toISOString(),
        currentGame: currentGame || null,
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating presence in database:', error);
    }
  } catch (error) {
    console.error('Error updating presence:', error);
  }
};

/**
 * Disconnect presence
 */
export const disconnectPresence = async () => {
  if (presenceChannel) {
    await presenceChannel.untrack();
    await supabase.removeChannel(presenceChannel);
    presenceChannel = null;
  }
};

/**
 * Subscribe to messages for a specific conversation.
 * Listens for messages where the current user is either sender OR receiver.
 */
export const subscribeToMessages = (
  userId: string,
  otherUserId: string,
  onMessage: (message: ChatMessage) => void
): RealtimeChannel => {
  const channelName = `messages:${[userId, otherUserId].sort().join('-')}`;

  // Remove existing channel if any
  const existingChannel = messageChannels.get(channelName);
  if (existingChannel) {
    supabase.removeChannel(existingChannel);
  }

  // Listen for messages where current user is the RECEIVER (incoming messages)
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiverId=eq.${userId}`,
      },
      async (payload: any) => {
        const newMessage = payload.new as any;
        // Only process if it's from the other user in this conversation
        if (newMessage.senderId !== otherUserId) return;

        const { data: sender } = await supabase
          .from('users')
          .select('username, displayName, avatarUrl')
          .eq('id', newMessage.senderId)
          .single();

        onMessage({
          id: newMessage.id,
          sender_id: newMessage.senderId,
          receiver_id: newMessage.receiverId,
          content: newMessage.content,
          is_read: newMessage.isRead,
          created_at: newMessage.createdAt,
          sender_username: sender?.username,
          sender_display_name: sender?.displayName,
          sender_avatar_url: sender?.avatarUrl,
        });
      }
    )
    .subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        console.log(`✅ Subscribed to messages channel with ${otherUserId}`);
      }
    });

  messageChannels.set(channelName, channel);
  return channel;
};

/**
 * Unsubscribe from messages
 */
export const unsubscribeFromMessages = async (userId: string, otherUserId: string) => {
  const channelName = `messages:${[userId, otherUserId].sort().join('-')}`;
  const channel = messageChannels.get(channelName);
  if (channel) {
    await supabase.removeChannel(channel);
    messageChannels.delete(channelName);
  }
};

/**
 * Subscribe to typing indicators for a conversation via Broadcast.
 * Returns cleanup function.
 */
export const subscribeToTyping = (
  userId: string,
  otherUserId: string,
  onTyping: (isTyping: boolean, fromUserId: string) => void
): RealtimeChannel => {
  const channelName = `typing:${[userId, otherUserId].sort().join('-')}`;

  const existingChannel = typingChannels.get(channelName);
  if (existingChannel) {
    supabase.removeChannel(existingChannel);
  }

  const channel = supabase
    .channel(channelName)
    .on('broadcast', { event: 'typing' }, (payload: any) => {
      // Only react to typing events from the other user
      if (payload.payload?.userId === otherUserId) {
        onTyping(payload.payload.isTyping, payload.payload.userId);
      }
    })
    .subscribe();

  typingChannels.set(channelName, channel);
  return channel;
};

/**
 * Broadcast typing status to the other user.
 */
export const broadcastTyping = async (
  userId: string,
  otherUserId: string,
  isTyping: boolean
): Promise<void> => {
  const channelName = `typing:${[userId, otherUserId].sort().join('-')}`;
  const channel = typingChannels.get(channelName);
  if (!channel) return;

  await channel.send({
    type: 'broadcast',
    event: 'typing',
    payload: { userId, isTyping },
  });
};

/**
 * Unsubscribe from typing channel
 */
export const unsubscribeFromTyping = async (userId: string, otherUserId: string) => {
  const channelName = `typing:${[userId, otherUserId].sort().join('-')}`;
  const channel = typingChannels.get(channelName);
  if (channel) {
    await supabase.removeChannel(channel);
    typingChannels.delete(channelName);
  }
};

/**
 * Send a chat message
 */
export const sendChatMessage = async (
  receiverId: string,
  content: string
): Promise<{ success: boolean; message?: ChatMessage; error?: string }> => {
  try {
    const token = storage.getAccessToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    // Decode JWT to get senderId
    const payload = JSON.parse(atob(token.split('.')[1]));
    const senderId = payload.userId;

    if (!content || !content.trim() || content.length > 2000) {
      return { success: false, error: 'Invalid message content' };
    }

    // Insert message into database
    const { data, error } = await supabase
      .from('messages')
      .insert({
        senderId,
        receiverId,
        content: content.trim(),
        isRead: false,
        createdAt: new Date().toISOString(),
      })
      .select(
        `
        id,
        senderId,
        receiverId,
        content,
        isRead,
        createdAt
      `
      )
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return { success: false, error: 'Failed to send message' };
    }

    // Fetch sender details
    const { data: sender } = await supabase
      .from('users')
      .select('username, displayName, avatarUrl')
      .eq('id', senderId)
      .single();

    const messageWithSender: ChatMessage = {
      id: data.id,
      sender_id: data.senderId,
      receiver_id: data.receiverId,
      content: data.content,
      is_read: data.isRead,
      created_at: data.createdAt,
      sender_username: sender?.username,
      sender_display_name: sender?.displayName,
      sender_avatar_url: sender?.avatarUrl,
    };

    return { success: true, message: messageWithSender };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, error: 'Failed to send message' };
  }
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (senderId: string): Promise<void> => {
  try {
    const token = storage.getAccessToken();
    if (!token) return;

    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.userId;

    await supabase
      .from('messages')
      .update({
        isRead: true,
        readAt: new Date().toISOString(),
      })
      .eq('receiverId', userId)
      .eq('senderId', senderId)
      .eq('isRead', false);
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
};

/**
 * Cleanup all channels
 */
export const cleanupRealtimeChannels = async () => {
  // Disconnect presence
  await disconnectPresence();

  // Remove all message channels
  for (const channel of messageChannels.values()) {
    await supabase.removeChannel(channel);
  }
  messageChannels.clear();

  // Remove all typing channels
  for (const channel of typingChannels.values()) {
    await supabase.removeChannel(channel);
  }
  typingChannels.clear();

  console.log('🧹 Realtime channels cleaned up');
};
