import express, { type Response } from 'express';
import { supabase } from '../db/database.js';
import { authenticateToken, type AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// GET /api/wishlist
router.get('/wishlist', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { data: rows, error } = await supabase.from('wishlist').select('id, created_at, plant_id').eq('user_id', req.user.id).order('created_at', { ascending: false });

    if (error) throw error;

    if (!rows || rows.length === 0) {
      return res.json({ items: [] });
    }

    const plantIds = rows.map((w) => w.plant_id);
    const { data: plants } = await supabase.from('plants').select('id, name, image, category, price, original_price, description, grow_time, specialty, discount').in('id', plantIds);

    const plantMap = new Map<string, any>((plants || []).map((p: any) => [p.id, p]));

    const items = rows.map((r) => {
      const plant = plantMap.get(r.plant_id) || {};
      return {
        id: plant.id || r.plant_id,
        name: plant.name,
        image: plant.image,
        category: plant.category,
        price: Number(plant.price || 0),
        originalPrice: plant.original_price ? Number(plant.original_price) : undefined,
        description: plant.description,
        growTime: plant.grow_time,
        specialty: plant.specialty,
        discount: plant.discount ? Number(plant.discount) : undefined,
        savedAt: r.created_at
      };
    });

    res.json({ items });
  } catch (err: any) {
    console.error('[API Route Error] GET /wishlist:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch wishlist' });
  }
});

// POST /api/wishlist/toggle
router.post('/wishlist/toggle', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { plantId } = req.body || {};
    if (!plantId) {
      return res.status(400).json({ error: 'Plant ID is required' });
    }

    const { data: existing } = await supabase.from('wishlist').select('id').eq('user_id', req.user.id).eq('plant_id', plantId).maybeSingle();

    if (existing) {
      await supabase.from('wishlist').delete().eq('user_id', req.user.id).eq('plant_id', plantId);
      return res.json({ message: 'Removed from wishlist', inWishlist: false });
    } else {
      const id = 'w_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      await supabase.from('wishlist').insert({ id, user_id: req.user.id, plant_id: plantId });
      return res.json({ message: 'Added to wishlist', inWishlist: true });
    }
  } catch (err: any) {
    console.error('[API Route Error] POST /wishlist/toggle:', err);
    res.status(500).json({ error: err.message || 'Failed to update wishlist' });
  }
});

// DELETE /api/wishlist/remove/:plantId
router.delete('/wishlist/remove/:plantId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { plantId } = req.params;
    await supabase.from('wishlist').delete().eq('user_id', req.user.id).eq('plant_id', plantId);
    res.json({ message: 'Item removed from wishlist', inWishlist: false });
  } catch (err: any) {
    console.error('[API Route Error] DELETE /wishlist/remove/:plantId:', err);
    res.status(500).json({ error: err.message || 'Failed to remove from wishlist' });
  }
});

export default router;
