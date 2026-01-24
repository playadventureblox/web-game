import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import app from './index.js';
import { initializePresenceService } from './services/presence.service.js';

// Redis clients for Socket.IO adapter
const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

// Initialize Socket.IO with Redis adapter for serverless
const io = new SocketIOServer({
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
    methods: ['GET', 'POST']
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});

// Use Redis adapter for serverless scaling
io.adapter(createAdapter(pubClient, subClient));

// Initialize presence service
initializePresenceService(io);

// Connect Redis clients
Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  console.log('🔌 Redis connected for Socket.IO adapter');
}).catch(console.error);

export { io };
export default app;
