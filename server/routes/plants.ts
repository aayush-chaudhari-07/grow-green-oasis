import express, { type Response } from 'express';
import { db } from '../db/database';
import { authenticateToken, type AuthRequest } from '../middleware/auth';

const router = express.Router();

// GET /api/categories
router.get('/categories', (_req, res: Response) => {
  try {
    const categories = db.prepare('SELECT * FROM categories').all();
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch categories' });
  }
});

// GET /api/plants
router.get('/plants', (req, res: Response) => {
  try {
    const { category, search, sort } = req.query;

    let query = 'SELECT * FROM plants WHERE 1=1';
    const params: any[] = [];

    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ? OR specialty LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (sort === 'price-asc') {
      query += ' ORDER BY price ASC';
    } else if (sort === 'price-desc') {
      query += ' ORDER BY price DESC';
    } else if (sort === 'name') {
      query += ' ORDER BY name ASC';
    } else {
      query += ' ORDER BY created_at DESC';
    }

    const plants = db.prepare(query).all(...params).map((p: any) => ({
      id: p.id,
      name: p.name,
      image: p.image,
      category: p.category,
      price: p.price,
      originalPrice: p.original_price || undefined,
      description: p.description,
      growTime: p.grow_time,
      specialty: p.specialty,
      discount: p.discount || undefined,
      stock: p.stock
    }));

    res.json(plants);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch plants' });
  }
});

// GET /api/plants/:id
router.get('/plants/:id', (req, res: Response) => {
  try {
    const plant = db.prepare('SELECT * FROM plants WHERE id = ?').get(req.params.id) as any;
    if (!plant) {
      return res.status(404).json({ error: 'Plant not found' });
    }

    res.json({
      id: plant.id,
      name: plant.name,
      image: plant.image,
      category: plant.category,
      price: plant.price,
      originalPrice: plant.original_price || undefined,
      description: plant.description,
      growTime: plant.grow_time,
      specialty: plant.specialty,
      discount: plant.discount || undefined,
      stock: plant.stock
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch plant' });
  }
});

// POST /api/plants (Admin only)
router.post('/plants', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { name, image, category, price, originalPrice, description, growTime, specialty, discount, stock } = req.body;

    if (!name || !image || !category || price === undefined) {
      return res.status(400).json({ error: 'Missing required plant fields' });
    }

    const id = 'p_' + Date.now();
    db.prepare(`
      INSERT INTO plants (id, name, image, category, price, original_price, description, grow_time, specialty, discount, stock)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, image, category, price, originalPrice || null, description, growTime, specialty, discount || null, stock || 50);

    res.status(201).json({ id, message: 'Plant created successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create plant' });
  }
});

export default router;
