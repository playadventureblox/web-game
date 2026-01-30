import app from './index.js';

const PORT = process.env.PORT || 3001;

// Start server only in non-production (Vercel handles production)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`✅ REST API ready`);
    console.log(`🔌 Real-time via Supabase`);
  });
}

export default app;
