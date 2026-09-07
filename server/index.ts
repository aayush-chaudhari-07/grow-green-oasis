import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { seedDatabase } from './db/seed';
import authRoutes from './routes/auth';
import plantRoutes from './routes/plants';
import cartRoutes from './routes/cart';
import orderRoutes from './routes/orders';
import statsRoutes from './routes/stats';
import wishlistRoutes from './routes/wishlist';
import userRoutes from './routes/user';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: true,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id']
}));
app.use(express.json());

// Initialize & seed database automatically
seedDatabase().catch((err) => {
  console.error('Failed to initialize database:', err);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', plantRoutes);
app.use('/api', cartRoutes);
app.use('/api', orderRoutes);
app.use('/api', statsRoutes);
app.use('/api', wishlistRoutes);
app.use('/api', userRoutes);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT} (http://localhost:${PORT})`);
  });
}

export default app;
