import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import { seedDatabase } from './db/seed.ts';
import authRoutes from './routes/auth.ts';
import plantRoutes from './routes/plants.ts';
import cartRoutes from './routes/cart.ts';
import orderRoutes from './routes/orders.ts';
import statsRoutes from './routes/stats.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
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

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT} (http://localhost:${PORT})`);
});
