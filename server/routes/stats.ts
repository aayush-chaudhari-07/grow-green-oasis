import express, { type Response } from 'express';
import { supabase } from '../db/database.js';

const router = express.Router();

// GET /api/stats/summary
router.get('/stats/summary', async (_req, res: Response) => {
  try {
    const { count: plantCount } = await supabase.from('plants').select('*', { count: 'exact', head: true });
    const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
    const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });

    const totalPlants = plantCount || 0;
    const totalOrders = orderCount || 0;
    const totalUsers = userCount || 0;

    const plantVarieties = totalPlants > 0 ? `${totalPlants}+` : "500+";
    const happyCustomers = totalOrders > 0 ? `${(10 + totalOrders)}K+` : "10K+";

    res.json({
      plantVarieties,
      happyCustomers,
      organicPercentage: "100%",
      totalPlants,
      totalOrders,
      totalUsers
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch summary stats' });
  }
});

export default router;
