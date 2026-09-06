import express, { type Response } from 'express';
import { db } from '../db/database.ts';

const router = express.Router();

// GET /api/stats/summary
router.get('/stats/summary', (_req, res: Response) => {
  try {
    const plantCountRow = db.prepare('SELECT COUNT(*) as count FROM plants').get() as { count: number };
    const orderCountRow = db.prepare('SELECT COUNT(*) as count FROM orders').get() as { count: number };
    const userCountRow = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

    // Format display metrics for Hero and Dashboard
    const plantVarieties = plantCountRow.count > 0 ? `${plantCountRow.count}+` : "500+";
    const totalOrders = orderCountRow.count;
    const happyCustomers = totalOrders > 0 ? `${(10 + totalOrders)}K+` : "10K+";

    res.json({
      plantVarieties,
      happyCustomers,
      organicPercentage: "100%",
      totalPlants: plantCountRow.count,
      totalOrders: orderCountRow.count,
      totalUsers: userCountRow.count
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch summary stats' });
  }
});

export default router;
