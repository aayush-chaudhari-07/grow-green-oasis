import express, { type Response } from 'express';
import { db } from '../db/database.ts';
import { authenticateToken, type AuthRequest } from '../middleware/auth.ts';

const router = express.Router();

// GET /api/user/profile - Get current user profile
router.get('/user/profile', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = db.prepare('SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?').get(req.user.id) as any;
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const addresses = db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC').all(req.user.id);

    res.json({ user, addresses });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch user profile' });
  }
});

// PUT /api/user/profile - Update user profile (name, phone)
router.put('/user/profile', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { name, phone } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    db.prepare('UPDATE users SET name = ?, phone = ? WHERE id = ?').run(
      name.trim(),
      phone ? phone.trim() : null,
      req.user.id
    );

    const user = db.prepare('SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?').get(req.user.id);
    res.json({ message: 'Profile updated successfully', user });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update profile' });
  }
});

// GET /api/user/addresses - List saved addresses
router.get('/user/addresses', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const addresses = db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC').all(req.user.id);
    res.json({ addresses });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch addresses' });
  }
});

// POST /api/user/addresses - Save a new address
router.post('/user/addresses', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { name, phone, addressLine1, addressLine2, city, state, pincode, isDefault } = req.body;

    if (!name || !phone || !addressLine1 || !city || !state || !pincode) {
      return res.status(400).json({ error: 'Name, phone, address line 1, city, state, and pincode are required' });
    }

    const addressId = 'addr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

    if (isDefault) {
      db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user.id);
    }

    db.prepare(`
      INSERT INTO addresses (id, user_id, name, phone, address_line1, address_line2, city, state, pincode, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      addressId,
      req.user.id,
      name.trim(),
      phone.trim(),
      addressLine1.trim(),
      addressLine2 ? addressLine2.trim() : null,
      city.trim(),
      state.trim(),
      pincode.trim(),
      isDefault ? 1 : 0
    );

    const addresses = db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC').all(req.user.id);
    res.status(201).json({ message: 'Address saved successfully', addressId, addresses });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to save address' });
  }
});

// DELETE /api/user/addresses/:id - Delete an address
router.delete('/user/addresses/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;
    db.prepare('DELETE FROM addresses WHERE id = ? AND user_id = ?').run(id, req.user.id);

    const addresses = db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC').all(req.user.id);
    res.json({ message: 'Address removed', addresses });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete address' });
  }
});

export default router;
