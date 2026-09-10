import express, { type Response } from 'express';
import { supabase } from '../db/database.js';
import { optionalAuth, authenticateToken, type AuthRequest } from '../middleware/auth.js';

const router = express.Router();

const getCartKey = (req: AuthRequest) => {
  if (req.user?.id) {
    return { field: 'user_id', value: req.user.id };
  }
  const rawSessionId = req.headers['x-session-id'];
  const sessionId = typeof rawSessionId === 'string' && rawSessionId.trim() ? rawSessionId.trim() : 'guest_default_session';
  return { field: 'session_id', value: sessionId };
};

// POST /api/orders/checkout
router.post('/orders/checkout', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      city,
      state,
      pincode,
      paymentMethod = 'Card',
      paymentStatus = 'Paid'
    } = req.body || {};

    if (!customerName || !customerEmail || !shippingAddress) {
      return res.status(400).json({ error: 'Customer name, email, and shipping address are required' });
    }

    const key = getCartKey(req);

    // Get current cart items
    const { data: cartItems } = await supabase.from('cart_items').select('quantity, plant_id').eq(key.field, key.value);

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty' });
    }

    const plantIds = cartItems.map((c) => c.plant_id);
    const { data: plants } = await supabase.from('plants').select('id, name, image, price, stock').in('id', plantIds);
    const plantMap = new Map((plants || []).map((p) => [p.id, p]));

    let totalAmount = 0;
    const itemsToInsert: any[] = [];

    const orderId = 'ord_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

    for (const item of cartItems) {
      const plant = plantMap.get(item.plant_id);
      if (!plant) continue;

      if ((plant.stock || 50) < item.quantity) {
        return res.status(400).json({ error: `Not enough stock for ${plant.name}` });
      }

      const itemPrice = Number(plant.price);
      totalAmount += itemPrice * item.quantity;

      itemsToInsert.push({
        id: 'oi_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        order_id: orderId,
        plant_id: plant.id,
        plant_name: plant.name,
        image: plant.image,
        quantity: item.quantity,
        price: itemPrice
      });
    }

    const userId = req.user?.id || null;
    const formattedAddress = [shippingAddress, city, state, pincode].filter(Boolean).join(', ');
    const initialStatus = 'Order Placed';

    // Insert Order
    const { error: orderErr } = await supabase.from('orders').insert({
      id: orderId,
      user_id: userId,
      customer_name: customerName.trim(),
      customer_email: customerEmail.trim(),
      customer_phone: customerPhone ? customerPhone.trim() : null,
      shipping_address: formattedAddress,
      city: city ? city.trim() : null,
      state: state ? state.trim() : null,
      pincode: pincode ? pincode.trim() : null,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      total_amount: Number(totalAmount.toFixed(2)),
      status: initialStatus
    });

    if (orderErr) throw orderErr;

    // Insert Order Items
    if (itemsToInsert.length > 0) {
      const { error: itemsErr } = await supabase.from('order_items').insert(itemsToInsert);
      if (itemsErr) throw itemsErr;
    }

    // Clear cart
    await supabase.from('cart_items').delete().eq(key.field, key.value);

    res.status(201).json({
      orderId,
      totalAmount: Number(totalAmount.toFixed(2)),
      status: initialStatus,
      paymentMethod,
      paymentStatus,
      shippingAddress: formattedAddress,
      message: 'Order placed successfully! Thank you for your purchase.'
    });
  } catch (err: any) {
    console.error('[API Route Error] POST /orders/checkout:', err);
    res.status(500).json({ error: err.message || 'Checkout failed' });
  }
});

// GET /api/orders/my-orders
router.get('/orders/my-orders', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { data: orders, error: ordersErr } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (ordersErr) throw ordersErr;

    const result = (orders || []).map((o: any) => {
      const items = (o.order_items || []).map((i: any) => ({
        id: i.id,
        plantId: i.plant_id,
        plantName: i.plant_name,
        image: i.image,
        quantity: i.quantity,
        price: Number(i.price)
      }));

      return {
        id: o.id,
        customerName: o.customer_name,
        customerEmail: o.customer_email,
        customerPhone: o.customer_phone,
        shippingAddress: o.shipping_address,
        city: o.city,
        state: o.state,
        pincode: o.pincode,
        paymentMethod: o.payment_method || 'Card',
        paymentStatus: o.payment_status || 'Paid',
        totalAmount: Number(o.total_amount),
        status: o.status || 'Order Placed',
        createdAt: o.created_at,
        items
      };
    });

    res.json(result);
  } catch (err: any) {
    console.error('[API Route Error] GET /orders/my-orders:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch order history' });
  }
});

// GET /api/orders/:id
router.get('/orders/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { data: order, error } = await supabase.from('orders').select('*').eq('id', id).maybeSingle();

    if (error || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.user_id && req.user?.id && order.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this order' });
    }

    const { data: rawItems } = await supabase.from('order_items').select('*').eq('order_id', order.id);
    const items = (rawItems || []).map((i) => ({
      id: i.id,
      plantId: i.plant_id,
      plantName: i.plant_name,
      image: i.image,
      quantity: i.quantity,
      price: Number(i.price)
    }));

    res.json({
      id: order.id,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      shippingAddress: order.shipping_address,
      city: order.city,
      state: order.state,
      pincode: order.pincode,
      paymentMethod: order.payment_method || 'Card',
      paymentStatus: order.payment_status || 'Paid',
      totalAmount: Number(order.total_amount),
      status: order.status || 'Order Placed',
      createdAt: order.created_at,
      items
    });
  } catch (err: any) {
    console.error('[API Route Error] GET /orders/:id:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch order' });
  }
});

export default router;
