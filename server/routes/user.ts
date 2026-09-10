import express, { type Response } from 'express';
import { supabase } from '../db/database.js';
import { authenticateToken, type AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// GET /api/user/profile - Get current user profile
router.get('/user/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { data: user, error } = await supabase.from('users').select('id, name, email, phone, role, created_at').eq('id', req.user.id).maybeSingle();
    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { data: addresses } = await supabase.from('addresses').select('*').eq('user_id', req.user.id).order('is_default', { ascending: false }).order('created_at', { ascending: false });

    res.json({ user, addresses: addresses || [] });
  } catch (err: any) {
    console.error('[API Route Error] GET /user/profile:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch user profile' });
  }
});

// PUT /api/user/profile - Update user profile (name, phone)
router.put('/user/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { name, phone } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const { error: updateErr } = await supabase.from('users').update({
      name: String(name).trim(),
      phone: phone ? String(phone).trim() : null
    }).eq('id', req.user.id);

    if (updateErr) throw updateErr;

    const { data: user } = await supabase.from('users').select('id, name, email, phone, role, created_at').eq('id', req.user.id).maybeSingle();
    res.json({ message: 'Profile updated successfully', user });
  } catch (err: any) {
    console.error('[API Route Error] PUT /user/profile:', err);
    res.status(500).json({ error: err.message || 'Failed to update profile' });
  }
});

// GET /api/user/addresses - List saved addresses
router.get('/user/addresses', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { data: addresses } = await supabase.from('addresses').select('*').eq('user_id', req.user.id).order('is_default', { ascending: false }).order('created_at', { ascending: false });
    res.json({ addresses: addresses || [] });
  } catch (err: any) {
    console.error('[API Route Error] GET /user/addresses:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch addresses' });
  }
});

// POST /api/user/addresses - Save a new address
router.post('/user/addresses', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { name, phone, addressLine1, addressLine2, city, state, pincode, isDefault } = req.body || {};

    if (!name || !phone || !addressLine1 || !city || !state || !pincode) {
      return res.status(400).json({ error: 'Name, phone, address line 1, city, state, and pincode are required' });
    }

    const addressId = 'addr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

    if (isDefault) {
      await supabase.from('addresses').update({ is_default: false }).eq('user_id', req.user.id);
    }

    const { error: insertErr } = await supabase.from('addresses').insert({
      id: addressId,
      user_id: req.user.id,
      name: String(name).trim(),
      phone: String(phone).trim(),
      address_line1: String(addressLine1).trim(),
      address_line2: addressLine2 ? String(addressLine2).trim() : null,
      city: String(city).trim(),
      state: String(state).trim(),
      pincode: String(pincode).trim(),
      is_default: Boolean(isDefault)
    });

    if (insertErr) throw insertErr;

    const { data: addresses } = await supabase.from('addresses').select('*').eq('user_id', req.user.id).order('is_default', { ascending: false }).order('created_at', { ascending: false });
    res.status(201).json({ message: 'Address saved successfully', addressId, addresses: addresses || [] });
  } catch (err: any) {
    console.error('[API Route Error] POST /user/addresses:', err);
    res.status(500).json({ error: err.message || 'Failed to save address' });
  }
});

// DELETE /api/user/addresses/:id - Delete an address
router.delete('/user/addresses/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;
    await supabase.from('addresses').delete().eq('id', id).eq('user_id', req.user.id);

    const { data: addresses } = await supabase.from('addresses').select('*').eq('user_id', req.user.id).order('is_default', { ascending: false }).order('created_at', { ascending: false });
    res.json({ message: 'Address removed', addresses: addresses || [] });
  } catch (err: any) {
    console.error('[API Route Error] DELETE /user/addresses/:id:', err);
    res.status(500).json({ error: err.message || 'Failed to delete address' });
  }
});

export default router;
