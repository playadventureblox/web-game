import { io, Socket } from 'socket.io-client';
import { storage } from './api';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3001';

let socket: Socket | null = null;

/**
 * Initialize Socket.IO connection with authentication
 */
export const initializeSocket = (): Socket | null => {
  if (socket?.connected) {
    return socket;
  }

  const token = storage.getAccessToken();
  if (!token) {
    console.warn('No auth token found, cannot initialize socket');
    return null;
  }

  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('✅ Socket.IO connected:', socket?.id);
    startHeartbeat();
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket.IO disconnected:', reason);
    stopHeartbeat();
  });

  socket.on('connect_error', (error) => {
    console.error('Socket.IO connection error:', error.message);
  });

  return socket;
};

/**
 * Get current socket instance
 */
export const getSocket = (): Socket | null => {
  return socket;
};

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
  if (socket) {
    stopHeartbeat();
    socket.disconnect();
    socket = null;
  }
};

/**
 * Heartbeat mechanism to keep connection alive
 */
let heartbeatInterval: NodeJS.Timeout | null = null;

const startHeartbeat = () => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }

  // Send heartbeat every 30 seconds
  heartbeatInterval = setInterval(() => {
    if (socket?.connected) {
      socket.emit('heartbeat');
    }
  }, 30000);
};

const stopHeartbeat = () => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
};

/**
 * Update presence status
 */
export const updatePresenceStatus = (status: 'online' | 'in-game', currentGame?: string) => {
  if (socket?.connected) {
    socket.emit('presence:status', { status, currentGame });
  }
};

/**
 * Subscribe to presence updates
 */
export const onPresenceUpdate = (callback: (data: {
  userId: string;
  username: string;
  presenceStatus: string;
  currentGame?: string;
  lastOnline: string;
}) => void) => {
  if (socket) {
    socket.on('presence:update', callback);
  }
};

/**
 * Unsubscribe from presence updates
 */
export const offPresenceUpdate = (callback?: Function) => {
  if (socket) {
    if (callback) {
      socket.off('presence:update', callback as any);
    } else {
      socket.off('presence:update');
    }
  }
};
