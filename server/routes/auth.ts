import express, { type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../db/database.js';
import { authenticateToken, type AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const getJwtSecret = () => process.env.JWT_SECRET || 'grow_green_oasis_super_secret_jwt_key_2026!';

// POST /api/auth/register
router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const cleanName = String(name).trim();
    const cleanEmail = String(email).toLowerCase().trim();

    if (!cleanName || !cleanEmail) {
      return res.status(400).json({ error: 'Name and email cannot be empty' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check duplicate
    const { data: existing } = await supabase.from('users').select('id').eq('email', cleanEmail).maybeSingle();
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const id = 'u_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const password_hash = await bcrypt.hash(String(password), 10);
    const role = 'user';

    const { error: insertErr } = await supabase.from('users').insert({
      id,
      name: cleanName,
      email: cleanEmail,
      password_hash,
      role
    });

    if (insertErr) {
      console.error('[Supabase Auth Register Error]', insertErr);
      return res.status(500).json({ error: insertErr.message || 'Failed to create user record' });
    }

    const token = jwt.sign(
      { id, email: cleanEmail, role, name: cleanName },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    res.status(201).json({
      user: { id, name: cleanName, email: cleanEmail, role },
      token
    });
  } catch (err: any) {
    console.error('[Vercel Auth Error] Registration failed:', err);
    res.status(500).json({ error: err.message || 'Registration failed due to a server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const { data: user, error: fetchErr } = await supabase.from('users').select('*').eq('email', cleanEmail).maybeSingle();

    if (fetchErr) {
      console.error('[Supabase Auth Error]', fetchErr);
      if (fetchErr.message?.includes('schema cache') || fetchErr.message?.includes('users')) {
        return res.status(500).json({
          error: 'Supabase database tables are not created yet. Please run server/db/schema.sql in your Supabase SQL Editor.'
        });
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(String(password), user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || undefined,
        role: user.role
      },
      token
    });
  } catch (err: any) {
    console.error('[Vercel Auth Error] Login failed:', err);
    res.status(500).json({ error: err.message || 'Login failed due to a server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', (_req: AuthRequest, res: Response) => {
  res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { data: user } = await supabase.from('users').select('id, name, email, phone, role, created_at').eq('id', req.user.id).maybeSingle();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (err: any) {
    console.error('[Vercel Auth Error] Me verification failed:', err);
    res.status(500).json({ error: err.message || 'Session verification failed' });
  }
});

export default router;
