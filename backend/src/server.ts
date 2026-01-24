import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './index.js';
import { initializePresenceService } from './services/presence.service.js';

const PORT = process.env.PORT || 3001;

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO with CORS
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
    methods: ['GET', 'POST']
  },
  pingTimeout: 60000, // 60 seconds
  pingInterval: 25000, // 25 seconds
});

// Initialize presence service
initializePresenceService(io);

// Always start server for Socket.IO to work
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 Socket.IO server ready`);
});

export { httpServer, io };
export default app;
