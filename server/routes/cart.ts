import express, { type Response } from 'express';
import { db } from '../db/database.ts';
import { optionalAuth, type AuthRequest } from '../middleware/auth.ts';

const router = express.Router();

// Helper to identify session or user and migrate guest items if user just logged in
const getCartKey = (req: AuthRequest) => {
  const rawSessionId = req.headers['x-session-id'];
  const sessionId = typeof rawSessionId === 'string' && rawSessionId.trim() ? rawSessionId.trim() : 'guest_default_session';

  if (req.user?.id) {
    // Migrate guest cart items to authenticated user if session ID is specific
    if (sessionId !== 'guest_default_session') {
      try {
        const guestItems = db.prepare('SELECT plant_id, quantity FROM cart_items WHERE session_id = ?').all(sessionId) as any[];
        if (guestItems && guestItems.length > 0) {
          for (const item of guestItems) {
            const existing = db.prepare('SELECT id, quantity FROM cart_items WHERE user_id = ? AND plant_id = ?').get(req.user.id, item.plant_id) as any;
            if (existing) {
              db.prepare('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?').run(item.quantity, existing.id);
            } else {
              const id = 'c_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
              db.prepare('INSERT INTO cart_items (id, user_id, plant_id, quantity) VALUES (?, ?, ?, ?)').run(id, req.user.id, item.plant_id, item.quantity);
            }
          }
          db.prepare('DELETE FROM cart_items WHERE session_id = ?').run(sessionId);
        }
      } catch (e) {
        // Ignore migration error if any
      }
    }
    return { field: 'user_id', value: req.user.id };
  }
  return { field: 'session_id', value: sessionId };
};

// Helper to fetch full cart response
const fetchCartResponse = (key: { field: string; value: string }) => {
  const rows = db.prepare(`
    SELECT c.id, c.quantity, p.id as plant_id, p.name, p.image, p.price, p.original_price, p.discount, p.category
    FROM cart_items c
    JOIN plants p ON c.plant_id = p.id
    WHERE c.${key.field} = ?
  `).all(key.value) as any[];

  const items = rows.map((r) => ({
    id: r.id,
    plantId: r.plant_id,
    name: r.name,
    image: r.image,
    price: r.price,
    originalPrice: r.original_price || undefined,
    discount: r.discount || undefined,
    category: r.category,
    quantity: r.quantity
  }));

  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return { items, totalAmount: Number(totalAmount.toFixed(2)) };
};

// GET /api/cart
router.get('/cart', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    const key = getCartKey(req);
    const cartData = fetchCartResponse(key);
    res.json(cartData);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch cart' });
  }
});

// POST /api/cart/add
router.post('/cart/add', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    const { plantId, quantity = 1 } = req.body;
    const parsedQty = Math.max(1, parseInt(quantity, 10) || 1);

    if (!plantId) {
      return res.status(400).json({ error: 'Plant ID is required' });
    }

    const plant = db.prepare('SELECT id FROM plants WHERE id = ?').get(plantId);
    if (!plant) {
      return res.status(404).json({ error: 'Plant not found' });
    }

    const key = getCartKey(req);

    // Check existing item in cart
    const existing = db.prepare(`
      SELECT id, quantity FROM cart_items WHERE ${key.field} = ? AND plant_id = ?
    `).get(key.value, plantId) as any;

    if (existing) {
      const newQty = existing.quantity + parsedQty;
      db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(newQty, existing.id);
    } else {
      const id = 'c_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      if (key.field === 'user_id') {
        db.prepare('INSERT INTO cart_items (id, user_id, plant_id, quantity) VALUES (?, ?, ?, ?)').run(
          id, key.value, plantId, parsedQty
        );
      } else {
        db.prepare('INSERT INTO cart_items (id, session_id, plant_id, quantity) VALUES (?, ?, ?, ?)').run(
          id, key.value, plantId, parsedQty
        );
      }
    }

    const updatedCart = fetchCartResponse(key);
    res.json({ message: 'Item added to cart', ...updatedCart });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to add item to cart' });
  }
});

// PUT /api/cart/update
router.put('/cart/update', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    const { plantId, quantity } = req.body;
    if (!plantId || quantity === undefined) {
      return res.status(400).json({ error: 'Plant ID and quantity are required' });
    }

    const parsedQty = parseInt(quantity, 10);
    const key = getCartKey(req);

    if (isNaN(parsedQty) || parsedQty <= 0) {
      db.prepare(`DELETE FROM cart_items WHERE ${key.field} = ? AND plant_id = ?`).run(key.value, plantId);
    } else {
      db.prepare(`UPDATE cart_items SET quantity = ? WHERE ${key.field} = ? AND plant_id = ?`).run(
        parsedQty, key.value, plantId
      );
    }

    const updatedCart = fetchCartResponse(key);
    res.json({ message: 'Cart updated', ...updatedCart });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update cart' });
  }
});

// DELETE /api/cart/clear
router.delete('/cart/clear', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    const key = getCartKey(req);
    db.prepare(`DELETE FROM cart_items WHERE ${key.field} = ?`).run(key.value);
    res.json({ message: 'Cart cleared', items: [], totalAmount: 0 });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to clear cart' });
  }
});

// DELETE /api/cart/remove/:plantId
router.delete('/cart/remove/:plantId', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    const { plantId } = req.params;
    const key = getCartKey(req);

    db.prepare(`DELETE FROM cart_items WHERE ${key.field} = ? AND plant_id = ?`).run(key.value, plantId);

    const updatedCart = fetchCartResponse(key);
    res.json({ message: 'Item removed from cart', ...updatedCart });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to remove item' });
  }
});

// DELETE /api/cart/:plantId
router.delete('/cart/:plantId', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    const { plantId } = req.params;
    const key = getCartKey(req);

    if (plantId === 'clear') {
      db.prepare(`DELETE FROM cart_items WHERE ${key.field} = ?`).run(key.value);
      return res.json({ message: 'Cart cleared', items: [], totalAmount: 0 });
    }

    db.prepare(`DELETE FROM cart_items WHERE ${key.field} = ? AND plant_id = ?`).run(key.value, plantId);

    const updatedCart = fetchCartResponse(key);
    res.json({ message: 'Item removed from cart', ...updatedCart });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to remove item' });
  }
});

export default router;
