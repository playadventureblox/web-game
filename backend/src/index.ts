import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import accountsRoutes from './modules/accounts/accounts.routes.js';
import friendsRoutes from './modules/friends/friends.routes.js';
import groupsRoutes from './modules/groups/groups.routes.js';
import searchRoutes from './modules/search/search.routes.js';
import uploadRoutes from './modules/upload/upload.routes.js';
import messagesRoutes from './modules/messages/messages.routes.js';
import notificationsRoutes from './modules/notifications/notifications.routes.js';
import socialLinksRoutes from './modules/users/socialLinks.routes.js';
import catalogRoutes from './modules/catalog/catalog.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import feedRoutes from './modules/feed/feed.routes.js';
import { generalLimiter, signupLimiter, loginLimiter } from './middleware/rateLimiter.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Trust Vercel/proxy headers so real client IPs are used for rate limiting
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global rate limit — 200 req/min per IP
app.use(generalLimiter);

app.get('/', (_req, res) => {
  res.json({ 
    message: 'AdventureBlox API',
    status: 'running',
    version: '1.0.0'
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1/auth/signup', signupLimiter);
app.use('/api/v1/auth/login', loginLimiter);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/accounts', accountsRoutes);
app.use('/api/v1/friends', friendsRoutes);
app.use('/api/v1/groups', groupsRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/messages', messagesRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/users/social-links', socialLinksRoutes);
app.use('/api/v1/catalog', catalogRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/feed', feedRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

export default app;
