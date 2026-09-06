import express, { type Response } from 'express';
import { db } from '../db/database.ts';
import { optionalAuth, authenticateToken, type AuthRequest } from '../middleware/auth.ts';

const router = express.Router();

// Helper to get cart key
const getCartKey = (req: AuthRequest) => {
  if (req.user?.id) {
    return { field: 'user_id', value: req.user.id };
  }
  const rawSessionId = req.headers['x-session-id'];
  const sessionId = typeof rawSessionId === 'string' && rawSessionId.trim() ? rawSessionId.trim() : 'guest_default_session';
  return { field: 'session_id', value: sessionId };
};

// POST /api/orders/checkout
router.post('/orders/checkout', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    const { customerName, customerEmail, shippingAddress } = req.body;

    if (!customerName || !customerEmail || !shippingAddress) {
      return res.status(400).json({ error: 'Customer name, email, and shipping address are required' });
    }

    const key = getCartKey(req);

    // Get current cart items
    const cartItems = db.prepare(`
      SELECT c.quantity, p.id as plant_id, p.name, p.price, p.stock
      FROM cart_items c
      JOIN plants p ON c.plant_id = p.id
      WHERE c.${key.field} = ?
    `).all(key.value) as any[];

    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty' });
    }

    let totalAmount = 0;
    for (const item of cartItems) {
      if (item.stock < item.quantity) {
        return res.status(400).json({ error: `Not enough stock for ${item.name}` });
      }
      totalAmount += item.price * item.quantity;
    }

    const orderId = 'ord_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const userId = req.user?.id || null;

    db.exec('BEGIN TRANSACTION;');

    try {
      db.prepare(`
        INSERT INTO orders (id, user_id, customer_name, customer_email, shipping_address, total_amount, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(orderId, userId, customerName.trim(), customerEmail.trim(), shippingAddress.trim(), Number(totalAmount.toFixed(2)), 'completed');

      const insertOrderItem = db.prepare(`
        INSERT INTO order_items (id, order_id, plant_id, plant_name, quantity, price)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const updateStock = db.prepare('UPDATE plants SET stock = stock - ? WHERE id = ?');

      for (const item of cartItems) {
        const itemId = 'oi_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        insertOrderItem.run(itemId, orderId, item.plant_id, item.name, item.quantity, item.price);
        updateStock.run(item.quantity, item.plant_id);
      }

      // Clear user's cart
      db.prepare(`DELETE FROM cart_items WHERE ${key.field} = ?`).run(key.value);

      db.exec('COMMIT;');

      res.status(201).json({
        orderId,
        totalAmount: Number(totalAmount.toFixed(2)),
        status: 'completed',
        message: 'Order placed successfully! Thank you for your purchase.'
      });
    } catch (err: any) {
      db.exec('ROLLBACK;');
      throw err;
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Checkout failed' });
  }
});

// GET /api/orders/my-orders
router.get('/orders/my-orders', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const orders = db.prepare(`
      SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC
    `).all(req.user.id) as any[];

    const result = orders.map((o) => {
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id);
      return {
        id: o.id,
        customerName: o.customer_name,
        customerEmail: o.customer_email,
        shippingAddress: o.shipping_address,
        totalAmount: o.total_amount,
        status: o.status,
        createdAt: o.created_at,
        items
      };
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch order history' });
  }
});

export default router;
