import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import app from '../dist/index.js';

// Create server for Socket.IO
const httpServer = createServer(app);

// Initialize Socket.IO for Vercel serverless
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['polling', 'websocket']
});

// Basic presence handling for serverless
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  
  socket.on('chat:send', async (data, callback) => {
    // Basic chat handling for serverless
    callback?.({ success: true, message: { ...data, id: Date.now().toString() } });
  });
  
  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// Export the handler for Vercel
export default function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Handle Socket.IO requests
  if (req.url?.startsWith('/socket.io/')) {
    httpServer.emit('request', req, res);
    return;
  }

  // Handle regular API requests
  return app(req, res);
}
