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

/**
 * Initialize presence tracking with Supabase Realtime
 */
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

  // Track current user's presence
  presenceChannel
    .on('presence', { event: 'sync' }, () => {
      const state: RealtimePresenceState = presenceChannel!.presenceState();
      const presenceMap = new Map<string, PresenceData>();

      Object.keys(state).forEach((key) => {
        const presences = state[key];
        if (presences && presences.length > 0) {
          const presence = presences[0] as PresenceData;
          presenceMap.set(presence.userId, presence);
        }
      });

      onPresenceUpdate(presenceMap);
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }: { key: string; newPresences: any[] }) => {
      console.log('User joined:', key, newPresences);
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }: { key: string; leftPresences: any[] }) => {
      console.log('User left:', key, leftPresences);
    })
    .subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') {
        // Track this user's presence
        await presenceChannel!.track({
          userId,
          username,
          presenceStatus: 'online',
          lastOnline: new Date().toISOString(),
        });

        // Update database
        await updatePresenceInDatabase(userId, 'online');
        console.log('✅ Presence tracking initialized');
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
 * Subscribe to messages for a specific conversation
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

  // Create new channel for this conversation
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

        // Only process if it's from the other user
        if (newMessage.senderId === otherUserId) {
          // Fetch sender details
          const { data: sender } = await supabase
            .from('users')
            .select('username, displayName, avatarUrl')
            .eq('id', newMessage.senderId)
            .single();

          const messageWithSender: ChatMessage = {
            id: newMessage.id,
            sender_id: newMessage.senderId,
            receiver_id: newMessage.receiverId,
            content: newMessage.content,
            is_read: newMessage.isRead,
            created_at: newMessage.createdAt,
            sender_username: sender?.username,
            sender_display_name: sender?.displayName,
            sender_avatar_url: sender?.avatarUrl,
          };

          onMessage(messageWithSender);
        }
      }
    )
    .subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        console.log(`✅ Subscribed to messages with ${otherUserId}`);
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

  console.log('🧹 Realtime channels cleaned up');
};
