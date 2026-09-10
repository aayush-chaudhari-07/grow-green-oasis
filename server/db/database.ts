import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

// Universal database interface supporting both node:sqlite and fallback memory/JSON store
export interface DatabaseInterface {
  exec: (sql: string) => void;
  prepare: (sql: string) => {
    get: (...params: any[]) => any;
    all: (...params: any[]) => any[];
    run: (...params: any[]) => { changes: number; lastInsertRowid?: any };
  };
}

// In-Memory & File-backed Store for Serverless Vercel fallback
class InMemoryStore {
  private tables: Record<string, any[]> = {
    users: [],
    categories: [],
    plants: [],
    cart_items: [],
    orders: [],
    order_items: [],
    wishlist: [],
    addresses: []
  };

  constructor() {
    this.loadFromDisk();
  }

  private getTmpFilePath() {
    return path.join(os.tmpdir(), 'grow_green_store.json');
  }

  private loadFromDisk() {
    try {
      const tmpPath = this.getTmpFilePath();
      if (fs.existsSync(tmpPath)) {
        const raw = fs.readFileSync(tmpPath, 'utf8');
        const data = JSON.parse(raw);
        this.tables = { ...this.tables, ...data };
      }
    } catch (_e) {
      // Ignore disk load errors
    }
  }

  private saveToDisk() {
    try {
      const tmpPath = this.getTmpFilePath();
      fs.writeFileSync(tmpPath, JSON.stringify(this.tables, null, 2), 'utf8');
    } catch (_e) {
      // Ignore disk write errors on serverless
    }
  }

  exec(sql: string) {
    if (sql.includes('BEGIN') || sql.includes('COMMIT') || sql.includes('ROLLBACK') || sql.includes('PRAGMA')) {
      return;
    }
  }

  prepare(sql: string) {
    const cleanSql = sql.trim().replace(/\s+/g, ' ');

    return {
      get: (...params: any[]) => {
        const res = this.executeQuery(cleanSql, params);
        return Array.isArray(res) ? res[0] : res;
      },
      all: (...params: any[]) => {
        const res = this.executeQuery(cleanSql, params);
        return Array.isArray(res) ? res : (res ? [res] : []);
      },
      run: (...params: any[]) => {
        this.executeUpdate(cleanSql, params);
        this.saveToDisk();
        return { changes: 1 };
      }
    };
  }

  private executeQuery(sql: string, params: any[]): any {
    const upper = sql.toUpperCase();

    // SELECT COUNT(*) FROM table
    if (upper.includes('SELECT COUNT(*) AS COUNT FROM')) {
      const tableMatch = sql.match(/FROM\s+([a_z0-9_]+)/i);
      const tableName = tableMatch ? tableMatch[1].toLowerCase() : '';
      const list = this.tables[tableName] || [];
      return [{ count: list.length }];
    }

    // USERS
    if (upper.includes('FROM USERS')) {
      if (upper.includes('WHERE EMAIL = ?')) {
        const email = String(params[0] || '').toLowerCase().trim();
        return this.tables.users.filter((u) => u.email === email);
      }
      if (upper.includes('WHERE ID = ?')) {
        return this.tables.users.filter((u) => u.id === params[0]);
      }
      return this.tables.users;
    }

    // PLANTS
    if (upper.includes('FROM PLANTS')) {
      let list = [...this.tables.plants];
      if (upper.includes('WHERE ID = ?')) {
        return list.filter((p) => p.id === params[0]);
      }
      if (upper.includes('WHERE CATEGORY = ?')) {
        list = list.filter((p) => p.category === params[0]);
      }
      if (upper.includes('ORDER BY PRICE ASC')) {
        list.sort((a, b) => a.price - b.price);
      } else if (upper.includes('ORDER BY PRICE DESC')) {
        list.sort((a, b) => b.price - a.price);
      } else if (upper.includes('ORDER BY NAME ASC')) {
        list.sort((a, b) => a.name.localeCompare(b.name));
      }
      return list;
    }

    // CATEGORIES
    if (upper.includes('FROM CATEGORIES')) {
      return this.tables.categories;
    }

    // CART ITEMS
    if (upper.includes('FROM CART_ITEMS')) {
      if (upper.includes('JOIN PLANTS')) {
        const field = upper.includes('USER_ID = ?') ? 'user_id' : 'session_id';
        const val = params[0];
        const rows = this.tables.cart_items.filter((c) => c[field] === val);
        return rows.map((c) => {
          const plant = this.tables.plants.find((p) => p.id === c.plant_id) || {};
          return {
            id: c.id,
            quantity: c.quantity,
            plant_id: c.plant_id,
            name: plant.name || 'Plant',
            image: plant.image || '',
            price: plant.price || 0,
            original_price: plant.original_price,
            discount: plant.discount,
            category: plant.category || 'indoor'
          };
        });
      }

      if (upper.includes('WHERE USER_ID = ? AND PLANT_ID = ?')) {
        return this.tables.cart_items.filter((c) => c.user_id === params[0] && c.plant_id === params[1]);
      }
      if (upper.includes('WHERE SESSION_ID = ? AND PLANT_ID = ?')) {
        return this.tables.cart_items.filter((c) => c.session_id === params[0] && c.plant_id === params[1]);
      }
      if (upper.includes('WHERE SESSION_ID = ?')) {
        return this.tables.cart_items.filter((c) => c.session_id === params[0]);
      }
      if (upper.includes('WHERE USER_ID = ?')) {
        return this.tables.cart_items.filter((c) => c.user_id === params[0]);
      }
    }

    // ORDERS
    if (upper.includes('FROM ORDERS')) {
      if (upper.includes('WHERE USER_ID = ?')) {
        return this.tables.orders
          .filter((o) => o.user_id === params[0])
          .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      }
      if (upper.includes('WHERE ID = ?')) {
        return this.tables.orders.filter((o) => o.id === params[0]);
      }
      return this.tables.orders;
    }

    // ORDER ITEMS
    if (upper.includes('FROM ORDER_ITEMS')) {
      if (upper.includes('WHERE ORDER_ID = ?')) {
        return this.tables.order_items.filter((i) => i.order_id === params[0]);
      }
    }

    // WISHLIST
    if (upper.includes('FROM WISHLIST')) {
      if (upper.includes('JOIN PLANTS')) {
        const rows = this.tables.wishlist.filter((w) => w.user_id === params[0]);
        return rows.map((w) => {
          const plant = this.tables.plants.find((p) => p.id === w.plant_id) || {};
          return {
            wishlist_id: w.id,
            saved_at: w.created_at,
            id: plant.id,
            name: plant.name,
            image: plant.image,
            category: plant.category,
            price: plant.price,
            original_price: plant.original_price,
            description: plant.description,
            grow_time: plant.grow_time,
            specialty: plant.specialty,
            discount: plant.discount
          };
        });
      }
      if (upper.includes('WHERE USER_ID = ? AND PLANT_ID = ?')) {
        return this.tables.wishlist.filter((w) => w.user_id === params[0] && w.plant_id === params[1]);
      }
    }

    // ADDRESSES
    if (upper.includes('FROM ADDRESSES')) {
      if (upper.includes('WHERE USER_ID = ?')) {
        return this.tables.addresses.filter((a) => a.user_id === params[0]);
      }
    }

    return [];
  }

  private executeUpdate(sql: string, params: any[]) {
    const upper = sql.toUpperCase();

    // INSERT INTO USERS
    if (upper.includes('INSERT INTO USERS')) {
      this.tables.users.push({
        id: params[0],
        name: params[1],
        email: params[2],
        password_hash: params[3],
        role: params[4] || 'user',
        created_at: new Date().toISOString()
      });
      return;
    }

    // INSERT INTO CART_ITEMS
    if (upper.includes('INSERT INTO CART_ITEMS')) {
      if (upper.includes('USER_ID')) {
        this.tables.cart_items.push({ id: params[0], user_id: params[1], plant_id: params[2], quantity: params[3] });
      } else {
        this.tables.cart_items.push({ id: params[0], session_id: params[1], plant_id: params[2], quantity: params[3] });
      }
      return;
    }

    // UPDATE CART_ITEMS
    if (upper.includes('UPDATE CART_ITEMS')) {
      if (upper.includes('SET QUANTITY = QUANTITY +')) {
        const item = this.tables.cart_items.find((c) => c.id === params[1]);
        if (item) item.quantity += params[0];
      } else if (upper.includes('WHERE ID = ?')) {
        const item = this.tables.cart_items.find((c) => c.id === params[1]);
        if (item) item.quantity = params[0];
      } else {
        const field = upper.includes('USER_ID = ?') ? 'user_id' : 'session_id';
        const item = this.tables.cart_items.find((c) => c[field] === params[1] && c.plant_id === params[2]);
        if (item) item.quantity = params[0];
      }
      return;
    }

    // DELETE FROM CART_ITEMS
    if (upper.includes('DELETE FROM CART_ITEMS')) {
      if (upper.includes('PLANT_ID = ?')) {
        const field = upper.includes('USER_ID = ?') ? 'user_id' : 'session_id';
        this.tables.cart_items = this.tables.cart_items.filter((c) => !(c[field] === params[0] && c.plant_id === params[1]));
      } else {
        const field = upper.includes('USER_ID = ?') ? 'user_id' : 'session_id';
        this.tables.cart_items = this.tables.cart_items.filter((c) => c[field] !== params[0]);
      }
      return;
    }

    // INSERT INTO ORDERS
    if (upper.includes('INSERT INTO ORDERS')) {
      this.tables.orders.push({
        id: params[0],
        user_id: params[1],
        customer_name: params[2],
        customer_email: params[3],
        customer_phone: params[4],
        shipping_address: params[5],
        city: params[6],
        state: params[7],
        pincode: params[8],
        payment_method: params[9],
        payment_status: params[10],
        total_amount: params[11],
        status: params[12] || 'Order Placed',
        created_at: new Date().toISOString()
      });
      return;
    }

    // INSERT INTO ORDER_ITEMS
    if (upper.includes('INSERT INTO ORDER_ITEMS')) {
      this.tables.order_items.push({
        id: params[0],
        order_id: params[1],
        plant_id: params[2],
        plant_name: params[3],
        image: params[4],
        quantity: params[5],
        price: params[6]
      });
      return;
    }

    // UPDATE PLANTS (stock)
    if (upper.includes('UPDATE PLANTS SET STOCK')) {
      const plant = this.tables.plants.find((p) => p.id === params[1]);
      if (plant) plant.stock = Math.max(0, (plant.stock || 50) - params[0]);
      return;
    }

    // INSERT INTO WISHLIST
    if (upper.includes('INSERT INTO WISHLIST')) {
      this.tables.wishlist.push({ id: params[0], user_id: params[1], plant_id: params[2], created_at: new Date().toISOString() });
      return;
    }

    // DELETE FROM WISHLIST
    if (upper.includes('DELETE FROM WISHLIST')) {
      this.tables.wishlist = this.tables.wishlist.filter((w) => !(w.user_id === params[0] && w.plant_id === params[1]));
      return;
    }

    // INSERT INTO ADDRESSES
    if (upper.includes('INSERT INTO ADDRESSES')) {
      this.tables.addresses.push({
        id: params[0],
        user_id: params[1],
        name: params[2],
        phone: params[3],
        address_line1: params[4],
        address_line2: params[5],
        city: params[6],
        state: params[7],
        pincode: params[8],
        is_default: params[9],
        created_at: new Date().toISOString()
      });
      return;
    }

    // UPDATE USERS
    if (upper.includes('UPDATE USERS')) {
      const user = this.tables.users.find((u) => u.id === params[2]);
      if (user) {
        user.name = params[0];
        user.phone = params[1];
      }
      return;
    }

    // INSERT INTO PLANTS
    if (upper.includes('INSERT INTO PLANTS')) {
      this.tables.plants.push({
        id: params[0],
        name: params[1],
        image: params[2],
        category: params[3],
        price: params[4],
        original_price: params[5],
        description: params[6],
        grow_time: params[7],
        specialty: params[8],
        discount: params[9],
        stock: params[10]
      });
      return;
    }
  }
}

// Create database instance safely without top-level module resolution failure on Node 18/20
const createDatabaseInstance = (): DatabaseInterface => {
  try {
    // Attempt to load native node:sqlite if available (Node 22+)
    // Using eval require or dynamic import so Node 18/20 bundlers don't crash
    const nodeSqlite = (globalThis as any).process?.versions?.node
      ? tryLoadNodeSqlite()
      : null;

    if (nodeSqlite) {
      return nodeSqlite;
    }
  } catch (_e) {
    // Fall back to memory store if node:sqlite fails
  }

  return new InMemoryStore() as unknown as DatabaseInterface;
};

const tryLoadNodeSqlite = (): DatabaseInterface | null => {
  try {
    // Try accessing DatabaseSync from node:sqlite
    const sqlite = eval('require("node:sqlite")');
    if (sqlite && sqlite.DatabaseSync) {
      const tmpPath = path.join(os.tmpdir(), 'grow_green.db');
      const realDb = new sqlite.DatabaseSync(tmpPath);
      try {
        realDb.exec('PRAGMA journal_mode = WAL;');
        realDb.exec('PRAGMA foreign_keys = ON;');
      } catch (_e) {}
      return realDb;
    }
  } catch (_e) {
    // Node 18/20 does not have node:sqlite
  }
  return null;
};

export const db: DatabaseInterface = createDatabaseInstance();

export const initDatabase = () => {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT, email TEXT, password_hash TEXT, role TEXT);
      CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT, icon TEXT);
      CREATE TABLE IF NOT EXISTS plants (id TEXT PRIMARY KEY, name TEXT, image TEXT, category TEXT, price REAL, original_price REAL, description TEXT, grow_time TEXT, specialty TEXT, discount REAL, stock INTEGER);
      CREATE TABLE IF NOT EXISTS cart_items (id TEXT PRIMARY KEY, user_id TEXT, session_id TEXT, plant_id TEXT, quantity INTEGER);
      CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, user_id TEXT, customer_name TEXT, customer_email TEXT, customer_phone TEXT, shipping_address TEXT, city TEXT, state TEXT, pincode TEXT, payment_method TEXT, payment_status TEXT, total_amount REAL, status TEXT, created_at TEXT);
      CREATE TABLE IF NOT EXISTS order_items (id TEXT PRIMARY KEY, order_id TEXT, plant_id TEXT, plant_name TEXT, image TEXT, quantity INTEGER, price REAL);
      CREATE TABLE IF NOT EXISTS wishlist (id TEXT PRIMARY KEY, user_id TEXT, plant_id TEXT, created_at TEXT);
      CREATE TABLE IF NOT EXISTS addresses (id TEXT PRIMARY KEY, user_id TEXT, name TEXT, phone TEXT, address_line1 TEXT, address_line2 TEXT, city TEXT, state TEXT, pincode TEXT, is_default INTEGER, created_at TEXT);
    `);
  } catch (_e) {}
  console.log('Database initialized successfully.');
};
