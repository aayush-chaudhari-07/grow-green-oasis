import express, { type Response } from 'express';
import { supabase } from '../db/database.js';
import { optionalAuth, type AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Helper to identify session or user and migrate guest items if user just logged in
const getCartKey = async (req: AuthRequest) => {
  const rawSessionId = req.headers['x-session-id'];
  const sessionId = typeof rawSessionId === 'string' && rawSessionId.trim() ? rawSessionId.trim() : 'guest_default_session';

  if (req.user?.id) {
    if (sessionId !== 'guest_default_session') {
      try {
        const { data: guestItems } = await supabase.from('cart_items').select('plant_id, quantity').eq('session_id', sessionId);
        if (guestItems && guestItems.length > 0) {
          for (const item of guestItems) {
            const { data: existing } = await supabase.from('cart_items').select('id, quantity').eq('user_id', req.user.id).eq('plant_id', item.plant_id).maybeSingle();
            if (existing) {
              await supabase.from('cart_items').update({ quantity: existing.quantity + item.quantity }).eq('id', existing.id);
            } else {
              const id = 'c_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
              await supabase.from('cart_items').insert({ id, user_id: req.user.id, plant_id: item.plant_id, quantity: item.quantity });
            }
          }
          await supabase.from('cart_items').delete().eq('session_id', sessionId);
        }
      } catch (_e) {}
    }
    return { field: 'user_id', value: req.user.id };
  }
  return { field: 'session_id', value: sessionId };
};

// Helper to fetch full cart response
const fetchCartResponse = async (key: { field: string; value: string }) => {
  const { data: cartItems } = await supabase.from('cart_items').select('id, quantity, plant_id').eq(key.field, key.value);
  if (!cartItems || cartItems.length === 0) {
    return { items: [], totalAmount: 0 };
  }

  const plantIds = cartItems.map((c) => c.plant_id);
  const { data: plants } = await supabase.from('plants').select('id, name, image, price, original_price, discount, category').in('id', plantIds);

  const plantMap = new Map<string, any>((plants || []).map((p: any) => [p.id, p]));

  const items = cartItems.map((c) => {
    const plant = plantMap.get(c.plant_id) || {};
    return {
      id: c.id,
      plantId: c.plant_id,
      name: plant.name || 'Plant',
      image: plant.image || '',
      price: Number(plant.price || 0),
      originalPrice: plant.original_price ? Number(plant.original_price) : undefined,
      discount: plant.discount ? Number(plant.discount) : undefined,
      category: plant.category || 'indoor',
      quantity: c.quantity
    };
  });

  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return { items, totalAmount: Number(totalAmount.toFixed(2)) };
};

// GET /api/cart
router.get('/cart', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const key = await getCartKey(req);
    const cartData = await fetchCartResponse(key);
    res.json(cartData);
  } catch (err: any) {
    console.error('[API Route Error] GET /cart:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch cart' });
  }
});

// POST /api/cart/add
router.post('/cart/add', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { plantId, quantity = 1 } = req.body || {};
    const parsedQty = Math.max(1, parseInt(quantity, 10) || 1);

    if (!plantId) {
      return res.status(400).json({ error: 'Plant ID is required' });
    }

    const { data: plant } = await supabase.from('plants').select('id').eq('id', plantId).maybeSingle();
    if (!plant) {
      return res.status(404).json({ error: 'Plant not found' });
    }

    const key = await getCartKey(req);

    const { data: existing } = await supabase.from('cart_items').select('id, quantity').eq(key.field, key.value).eq('plant_id', plantId).maybeSingle();

    if (existing) {
      const newQty = existing.quantity + parsedQty;
      await supabase.from('cart_items').update({ quantity: newQty }).eq('id', existing.id);
    } else {
      const id = 'c_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      const payload: any = { id, plant_id: plantId, quantity: parsedQty };
      payload[key.field] = key.value;
      await supabase.from('cart_items').insert(payload);
    }

    const updatedCart = await fetchCartResponse(key);
    res.json({ message: 'Item added to cart', ...updatedCart });
  } catch (err: any) {
    console.error('[API Route Error] POST /cart/add:', err);
    res.status(500).json({ error: err.message || 'Failed to add item to cart' });
  }
});

// PUT /api/cart/update
router.put('/cart/update', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { plantId, quantity } = req.body || {};
    if (!plantId || quantity === undefined) {
      return res.status(400).json({ error: 'Plant ID and quantity are required' });
    }

    const parsedQty = parseInt(quantity, 10);
    const key = await getCartKey(req);

    if (isNaN(parsedQty) || parsedQty <= 0) {
      await supabase.from('cart_items').delete().eq(key.field, key.value).eq('plant_id', plantId);
    } else {
      await supabase.from('cart_items').update({ quantity: parsedQty }).eq(key.field, key.value).eq('plant_id', plantId);
    }

    const updatedCart = await fetchCartResponse(key);
    res.json({ message: 'Cart updated', ...updatedCart });
  } catch (err: any) {
    console.error('[API Route Error] PUT /cart/update:', err);
    res.status(500).json({ error: err.message || 'Failed to update cart' });
  }
});

// DELETE /api/cart/clear
router.delete('/cart/clear', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const key = await getCartKey(req);
    await supabase.from('cart_items').delete().eq(key.field, key.value);
    res.json({ message: 'Cart cleared', items: [], totalAmount: 0 });
  } catch (err: any) {
    console.error('[API Route Error] DELETE /cart/clear:', err);
    res.status(500).json({ error: err.message || 'Failed to clear cart' });
  }
});

// DELETE /api/cart/remove/:plantId
router.delete('/cart/remove/:plantId', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { plantId } = req.params;
    const key = await getCartKey(req);

    await supabase.from('cart_items').delete().eq(key.field, key.value).eq('plant_id', plantId);

    const updatedCart = await fetchCartResponse(key);
    res.json({ message: 'Item removed from cart', ...updatedCart });
  } catch (err: any) {
    console.error('[API Route Error] DELETE /cart/remove/:plantId:', err);
    res.status(500).json({ error: err.message || 'Failed to remove item' });
  }
});

// DELETE /api/cart/:plantId
router.delete('/cart/:plantId', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { plantId } = req.params;
    const key = await getCartKey(req);

    if (plantId === 'clear') {
      await supabase.from('cart_items').delete().eq(key.field, key.value);
      return res.json({ message: 'Cart cleared', items: [], totalAmount: 0 });
    }

    await supabase.from('cart_items').delete().eq(key.field, key.value).eq('plant_id', plantId);

    const updatedCart = await fetchCartResponse(key);
    res.json({ message: 'Item removed from cart', ...updatedCart });
  } catch (err: any) {
    console.error('[API Route Error] DELETE /cart/:plantId:', err);
    res.status(500).json({ error: err.message || 'Failed to remove item' });
  }
});

export default router;
