import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { apiRateLimiter } from "./middleware/rateLimit.middleware.js";
import authRoutes from "./modules/auth/auth.routes.js";
import usersRoutes from "./modules/users/users.routes.js";
import accountsRoutes from "./modules/accounts/accounts.routes.js";
import groupsRoutes from "./modules/groups/groups.routes.js";
import uploadRoutes from "./modules/upload/upload.routes.js";
import friendsRoutes from "./modules/friends/friends.routes.js";
import searchRoutes from "./modules/search/search.routes.js";

// Load environment variables
dotenv.config();

// Create Express app
const app: Application = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [process.env.FRONTEND_URL || "http://localhost:3000"];

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Port configuration
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet()); // Security headers
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(morgan("dev")); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(apiRateLimiter); // Rate limiting

// Health check route
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "AdventureBlox API is running!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API Routes
app.get("/api/v1", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Welcome to AdventureBlox API v1",
    version: "1.0.0",
    documentation: "/api/v1/docs",
  });
});

// Auth routes
app.use("/api/v1/auth", authRoutes);

// Users routes
app.use("/api/v1/users", usersRoutes);

// Accounts routes
app.use("/api/v1/accounts", accountsRoutes);

// Groups routes
app.use("/api/v1/groups", groupsRoutes);

// Upload routes
app.use("/api/v1/upload", uploadRoutes);

// Friends routes
app.use("/api/v1/friends", friendsRoutes);

// Search routes
app.use("/api/v1/search", searchRoutes);

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // Handle user authentication
  socket.on("authenticate", (data) => {
    console.log("User authenticated:", data);
    socket.emit("authenticated", { success: true });
  });

  // Handle chat messages
  socket.on("chat:message", (data) => {
    console.log("Chat message:", data);
    io.emit("chat:message", data); // Broadcast to all clients
  });

  // Handle user presence
  socket.on("user:status", (status) => {
    console.log("User status update:", status);
    socket.broadcast.emit("user:status", { userId: socket.id, status });
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

// Start server only if not in serverless environment
if (process.env.VERCEL !== "1") {
  httpServer.listen(PORT, () => {
    console.log("🚀 ====================================");
    console.log(`🎮 AdventureBlox Backend Server`);
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`📡 API: http://localhost:${PORT}/api/v1`);
    console.log(`🔌 Socket.IO: ws://localhost:${PORT}`);
    console.log("🚀 ====================================");
  });

  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log("SIGTERM signal received: closing HTTP server");
    httpServer.close(() => {
      console.log("HTTP server closed");
      process.exit(0);
    });
  });
}

export { app, io };
