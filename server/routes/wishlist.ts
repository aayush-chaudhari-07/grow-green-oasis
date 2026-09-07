import express, { type Response } from 'express';
import { db } from '../db/database.ts';
import { authenticateToken, type AuthRequest } from '../middleware/auth.ts';

const router = express.Router();

// GET /api/wishlist - Get all wishlist items for logged in user
router.get('/wishlist', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const rows = db.prepare(`
      SELECT w.id as wishlist_id, w.created_at as saved_at,
             p.id, p.name, p.image, p.category, p.price, p.original_price, p.description, p.grow_time, p.specialty, p.discount
      FROM wishlist w
      JOIN plants p ON w.plant_id = p.id
      WHERE w.user_id = ?
      ORDER BY w.created_at DESC
    `).all(req.user.id) as any[];

    const items = rows.map((r) => ({
      id: r.id,
      name: r.name,
      image: r.image,
      category: r.category,
      price: r.price,
      originalPrice: r.original_price || undefined,
      description: r.description,
      growTime: r.grow_time,
      specialty: r.specialty,
      discount: r.discount || undefined,
      savedAt: r.saved_at
    }));

    res.json({ items });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch wishlist' });
  }
});

// POST /api/wishlist/toggle - Add/Remove item from wishlist
router.post('/wishlist/toggle', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { plantId } = req.body;
    if (!plantId) {
      return res.status(400).json({ error: 'Plant ID is required' });
    }

    const existing = db.prepare('SELECT id FROM wishlist WHERE user_id = ? AND plant_id = ?').get(req.user.id, plantId);

    if (existing) {
      db.prepare('DELETE FROM wishlist WHERE user_id = ? AND plant_id = ?').run(req.user.id, plantId);
      return res.json({ message: 'Removed from wishlist', inWishlist: false });
    } else {
      const id = 'w_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      db.prepare('INSERT INTO wishlist (id, user_id, plant_id) VALUES (?, ?, ?)').run(id, req.user.id, plantId);
      return res.json({ message: 'Added to wishlist', inWishlist: true });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update wishlist' });
  }
});

// DELETE /api/wishlist/remove/:plantId
router.delete('/wishlist/remove/:plantId', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { plantId } = req.params;
    db.prepare('DELETE FROM wishlist WHERE user_id = ? AND plant_id = ?').run(req.user.id, plantId);
    res.json({ message: 'Item removed from wishlist', inWishlist: false });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to remove from wishlist' });
  }
});

export default router;
