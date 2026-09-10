import express, { type Response } from 'express';
import { supabase } from '../db/database.js';
import { seedDatabase } from '../db/seed.js';
import { authenticateToken, type AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// GET /api/categories
router.get('/categories', async (_req, res: Response) => {
  try {
    const { data: categories, error } = await supabase.from('categories').select('*');
    if (error) throw error;
    res.json(categories || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch categories' });
  }
});

// GET /api/plants
router.get('/plants', async (req, res: Response) => {
  try {
    const { category, search, sort } = req.query;

    const { count, error: countErr } = await supabase.from('plants').select('*', { count: 'exact', head: true });
    if (countErr && countErr.message?.includes('schema cache')) {
      return res.status(500).json({ error: 'Supabase tables not created yet. Please run server/db/schema.sql in your Supabase SQL Editor.' });
    }

    if (!count || count === 0) {
      await seedDatabase();
    }

    let query = supabase.from('plants').select('*');

    if (category && category !== 'all') {
      query = query.eq('category', String(category));
    }

    if (search) {
      const term = `%${search}%`;
      query = query.or(`name.ilike.${term},description.ilike.${term},specialty.ilike.${term}`);
    }

    if (sort === 'price-asc') {
      query = query.order('price', { ascending: true });
    } else if (sort === 'price-desc') {
      query = query.order('price', { ascending: false });
    } else if (sort === 'name') {
      query = query.order('name', { ascending: true });
    } else {
      query = query.order('id', { ascending: true });
    }

    const { data, error } = await query;
    if (error) throw error;

    const plants = (data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      image: p.image,
      category: p.category,
      price: Number(p.price),
      originalPrice: p.original_price ? Number(p.original_price) : undefined,
      description: p.description,
      growTime: p.grow_time,
      specialty: p.specialty,
      discount: p.discount ? Number(p.discount) : undefined,
      stock: p.stock
    }));

    res.json(plants);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch plants' });
  }
});

// GET /api/plants/:id
router.get('/plants/:id', async (req, res: Response) => {
  try {
    const { data: plant, error } = await supabase.from('plants').select('*').eq('id', req.params.id).maybeSingle();
    if (error || !plant) {
      return res.status(404).json({ error: 'Plant not found' });
    }

    res.json({
      id: plant.id,
      name: plant.name,
      image: plant.image,
      category: plant.category,
      price: Number(plant.price),
      originalPrice: plant.original_price ? Number(plant.original_price) : undefined,
      description: plant.description,
      growTime: plant.grow_time,
      specialty: plant.specialty,
      discount: plant.discount ? Number(plant.discount) : undefined,
      stock: plant.stock
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch plant' });
  }
});

// POST /api/plants (Admin only)
router.post('/plants', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { name, image, category, price, originalPrice, description, growTime, specialty, discount, stock } = req.body;

    if (!name || !image || !category || price === undefined) {
      return res.status(400).json({ error: 'Missing required plant fields' });
    }

    const id = 'p_' + Date.now();
    const { error } = await supabase.from('plants').insert({
      id,
      name,
      image,
      category,
      price,
      original_price: originalPrice || null,
      description,
      grow_time: growTime,
      specialty,
      discount: discount || null,
      stock: stock || 50
    });

    if (error) throw error;

    res.status(201).json({ id, message: 'Plant created successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create plant' });
  }
});

export default router;
