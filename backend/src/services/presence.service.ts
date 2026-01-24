import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import db from '../lib/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Track active connections: userId -> Set of socket IDs
const activeConnections = new Map<string, Set<string>>();

// Track heartbeat timeouts: socketId -> timeout
const heartbeatTimeouts = new Map<string, NodeJS.Timeout>();

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

/**
 * Verify JWT token for Socket.IO authentication
 */
const authenticateSocket = (socket: Socket, next: (err?: Error) => void) => {
  const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return next(new Error('Authentication token required'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username: string };
    (socket as AuthenticatedSocket).userId = decoded.userId;
    (socket as AuthenticatedSocket).username = decoded.username;
    next();
  } catch (error) {
    next(new Error('Invalid authentication token'));
  }
};

/**
 * Update user presence status in database
 */
const updatePresenceStatus = async (userId: string, status: 'online' | 'offline' | 'in-game', currentGame?: string | null) => {
  try {
    await db.query(
      `UPDATE users 
       SET "presenceStatus" = $1, "lastOnline" = NOW(), "currentGame" = $2
       WHERE id = $3`,
      [status, currentGame || null, userId]
    );
  } catch (error) {
    console.error('Error updating presence status:', error);
  }
};

/**
 * Broadcast presence update to relevant users (friends)
 */
const broadcastPresenceUpdate = async (io: SocketIOServer, userId: string) => {
  try {
    // Get user's current presence
    const userResult = await db.query(
      `SELECT id, username, "presenceStatus" as presence_status, "currentGame" as current_game, "lastOnline" as last_online
       FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) return;

    const user = userResult.rows[0];

    // Get all friends of this user
    const friendsResult = await db.query(
      `SELECT "userId" as user_id FROM friendships WHERE "friendId" = $1
       UNION
       SELECT "friendId" as user_id FROM friendships WHERE "userId" = $1`,
      [userId]
    );

    // Broadcast to each friend's active sockets
    friendsResult.rows.forEach((friend) => {
      const friendSockets = activeConnections.get(friend.user_id);
      if (friendSockets) {
        friendSockets.forEach((socketId) => {
          io.to(socketId).emit('presence:update', {
            userId: user.id,
            username: user.username,
            presenceStatus: user.presence_status,
            currentGame: user.current_game,
            lastOnline: user.last_online,
          });
        });
      }
    });
  } catch (error) {
    console.error('Error broadcasting presence update:', error);
  }
};

/**
 * Handle user going online
 */
const handleUserOnline = async (socket: AuthenticatedSocket, io: SocketIOServer) => {
  const userId = socket.userId!;

  // Add socket to active connections
  if (!activeConnections.has(userId)) {
    activeConnections.set(userId, new Set());
  }
  activeConnections.get(userId)!.add(socket.id);

  // Update presence to online
  await updatePresenceStatus(userId, 'online');

  // Broadcast to friends
  await broadcastPresenceUpdate(io, userId);

  console.log(`✅ User ${socket.username} (${userId}) connected - Socket: ${socket.id}`);
};

/**
 * Handle user going offline
 */
const handleUserOffline = async (socket: AuthenticatedSocket, io: SocketIOServer) => {
  const userId = socket.userId!;

  // Remove socket from active connections
  const userSockets = activeConnections.get(userId);
  if (userSockets) {
    userSockets.delete(socket.id);
    
    // If no more active sockets, user is fully offline
    if (userSockets.size === 0) {
      activeConnections.delete(userId);
      await updatePresenceStatus(userId, 'offline');
      await broadcastPresenceUpdate(io, userId);
      console.log(`❌ User ${socket.username} (${userId}) fully disconnected`);
    } else {
      console.log(`🔌 User ${socket.username} still has ${userSockets.size} active connection(s)`);
    }
  }

  // Clear heartbeat timeout
  const timeout = heartbeatTimeouts.get(socket.id);
  if (timeout) {
    clearTimeout(timeout);
    heartbeatTimeouts.delete(socket.id);
  }
};

/**
 * Setup heartbeat mechanism
 */
const setupHeartbeat = (socket: AuthenticatedSocket, io: SocketIOServer) => {
  const resetHeartbeat = () => {
    // Clear existing timeout
    const existingTimeout = heartbeatTimeouts.get(socket.id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout (60 seconds of inactivity = offline)
    const timeout = setTimeout(async () => {
      console.log(`💔 Heartbeat timeout for ${socket.username} - marking offline`);
      await handleUserOffline(socket, io);
      socket.disconnect();
    }, 60000);

    heartbeatTimeouts.set(socket.id, timeout);
  };

  // Initial heartbeat
  resetHeartbeat();

  // Listen for heartbeat pings from client
  socket.on('heartbeat', () => {
    resetHeartbeat();
  });
};

/**
 * Initialize presence service with Socket.IO
 */
export const initializePresenceService = (io: SocketIOServer) => {
  // Authentication middleware
  io.use(authenticateSocket);

  io.on('connection', async (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;

    // Handle user coming online
    await handleUserOnline(authSocket, io);

    // Setup heartbeat mechanism
    setupHeartbeat(authSocket, io);

    // Handle manual status updates
    socket.on('presence:status', async (data: { status: 'online' | 'in-game'; currentGame?: string }) => {
      if (!authSocket.userId) return;

      await updatePresenceStatus(authSocket.userId, data.status, data.currentGame);
      await broadcastPresenceUpdate(io, authSocket.userId);
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      await handleUserOffline(authSocket, io);
    });
  });

  console.log('🔌 Presence service initialized');
};

/**
 * Get active users count (for debugging)
 */
export const getActiveUsersCount = (): number => {
  return activeConnections.size;
};
