import { db, initDatabase } from './database.ts';
import bcrypt from 'bcryptjs';

export const seedDatabase = async () => {
  initDatabase();

  // Check if categories already exist
  const existingCategories = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };

  if (existingCategories.count === 0) {
    console.log('Seeding categories...');
    const insertCategory = db.prepare('INSERT INTO categories (id, name, icon) VALUES (?, ?, ?)');
    const categories = [
      { id: "all", name: "All Plants", icon: "🌿" },
      { id: "indoor", name: "Indoor Plants", icon: "🏠" },
      { id: "outdoor", name: "Outdoor Plants", icon: "☀️" },
      { id: "succulents", name: "Succulents & Cacti", icon: "🌵" },
      { id: "herbs", name: "Herbs", icon: "🌱" },
      { id: "flowering", name: "Flowering Plants", icon: "🌸" },
    ];
    for (const cat of categories) {
      insertCategory.run(cat.id, cat.name, cat.icon);
    }
  }

  // Check if plants already exist
  const existingPlants = db.prepare('SELECT COUNT(*) as count FROM plants').get() as { count: number };

  if (existingPlants.count === 0) {
    console.log('Seeding plants...');
    const insertPlant = db.prepare(`
      INSERT INTO plants (id, name, image, category, price, original_price, description, grow_time, specialty, discount, stock)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const plants = [
      {
        id: "1",
        name: "Monstera Deliciosa",
        image: "/src/assets/plants/monstera.jpg",
        category: "indoor",
        price: 29.99,
        original_price: 39.99,
        description: "The iconic Swiss Cheese Plant with dramatic split leaves. A statement piece for any room that brings tropical vibes instantly.",
        grow_time: "2-3 years to mature",
        specialty: "Air purifying & low maintenance",
        discount: 25,
        stock: 45
      },
      {
        id: "2",
        name: "Snake Plant",
        image: "/src/assets/plants/snake-plant.jpg",
        category: "indoor",
        price: 19.99,
        original_price: null,
        description: "Nearly indestructible and perfect for beginners. Thrives in low light and purifies air while you sleep.",
        grow_time: "6-8 months",
        specialty: "Night oxygen producer",
        discount: null,
        stock: 60
      },
      {
        id: "3",
        name: "Golden Pothos",
        image: "/src/assets/plants/pothos.jpg",
        category: "indoor",
        price: 14.99,
        original_price: 19.99,
        description: "A trailing vine with heart-shaped leaves. Perfect for shelves and hanging baskets.",
        grow_time: "3-4 months for trails",
        specialty: "Removes toxins from air",
        discount: 25,
        stock: 35
      },
      {
        id: "4",
        name: "Lavender",
        image: "/src/assets/plants/lavender.jpg",
        category: "flowering",
        price: 22.99,
        original_price: null,
        description: "Fragrant purple blooms that attract pollinators and bring calm to your garden. Great for aromatherapy.",
        grow_time: "1-2 seasons to bloom",
        specialty: "Natural stress reliever",
        discount: null,
        stock: 25
      },
      {
        id: "5",
        name: "Echeveria Succulent",
        image: "/src/assets/plants/succulent.jpg",
        category: "succulents",
        price: 9.99,
        original_price: 14.99,
        description: "A rosette-shaped succulent with stunning pink-tipped leaves. Drought-tolerant and easy to propagate.",
        grow_time: "4-6 months",
        specialty: "Drought resistant beauty",
        discount: 33,
        stock: 50
      },
      {
        id: "6",
        name: "Peace Lily",
        image: "/src/assets/plants/peace-lily.jpg",
        category: "flowering",
        price: 24.99,
        original_price: null,
        description: "Elegant white blooms that symbolize peace and harmony. One of the best air-purifying plants.",
        grow_time: "1 year to first bloom",
        specialty: "Top NASA air purifier",
        discount: null,
        stock: 30
      },
      {
        id: "7",
        name: "Fiddle Leaf Fig",
        image: "/src/assets/plants/fiddle-leaf.jpg",
        category: "indoor",
        price: 44.99,
        original_price: 59.99,
        description: "The Instagram-famous tree with large, violin-shaped leaves. A stunning architectural plant.",
        grow_time: "2-3 years to full height",
        specialty: "Designer's favorite statement plant",
        discount: 25,
        stock: 20
      },
      {
        id: "8",
        name: "Aloe Vera",
        image: "/src/assets/plants/aloe-vera.jpg",
        category: "succulents",
        price: 12.99,
        original_price: null,
        description: "A medicinal marvel that soothes burns and purifies air. Easy to grow and incredibly useful.",
        grow_time: "3-4 months",
        specialty: "Medicinal healing properties",
        discount: null,
        stock: 40
      },
      {
        id: "9",
        name: "Sweet Basil",
        image: "/src/assets/plants/basil.jpg",
        category: "herbs",
        price: 7.99,
        original_price: null,
        description: "Fresh, aromatic leaves perfect for cooking. Grows quickly and fills your kitchen with amazing scent.",
        grow_time: "3-4 weeks to harvest",
        specialty: "Culinary superfood herb",
        discount: null,
        stock: 75
      },
      {
        id: "10",
        name: "Rubber Plant",
        image: "/src/assets/plants/rubber-plant.jpg",
        category: "indoor",
        price: 34.99,
        original_price: null,
        description: "Glossy, dark green leaves that add a bold, tropical feel to any space. Very forgiving plant.",
        grow_time: "1-2 years",
        specialty: "Toxin-absorbing powerhouse",
        discount: null,
        stock: 28
      },
      {
        id: "11",
        name: "Mixed Cactus Set",
        image: "/src/assets/plants/cactus.jpg",
        category: "succulents",
        price: 18.99,
        original_price: 24.99,
        description: "A curated collection of unique cacti. Perfect for windowsills and desks. Virtually zero maintenance.",
        grow_time: "Slow-growing, years to mature",
        specialty: "Beginner-proof & unique shapes",
        discount: 24,
        stock: 30
      },
      {
        id: "12",
        name: "Rosemary",
        image: "/src/assets/plants/rosemary.jpg",
        category: "herbs",
        price: 10.99,
        original_price: null,
        description: "Fragrant evergreen herb used in cooking and aromatherapy. Hardy and drought-tolerant once established.",
        grow_time: "6-8 weeks to harvest",
        specialty: "Memory-boosting aroma",
        discount: null,
        stock: 50
      }
    ];

    for (const p of plants) {
      insertPlant.run(
        p.id, p.name, p.image, p.category, p.price,
        p.original_price, p.description, p.grow_time,
        p.specialty, p.discount, p.stock
      );
    }
  }

  // Check demo users
  const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (existingUsers.count === 0) {
    console.log('Seeding default users...');
    const insertUser = db.prepare('INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)');
    
    const userPassHash = await bcrypt.hash('user123', 10);
    const adminPassHash = await bcrypt.hash('admin123', 10);

    insertUser.run('u1', 'Garden Lover', 'user@growgreen.com', userPassHash, 'user');
    insertUser.run('u2', 'Admin Specialist', 'admin@growgreen.com', adminPassHash, 'admin');
  }

  console.log('Database seeding complete.');
};

if (process.argv[1]?.endsWith('seed.ts')) {
  seedDatabase().catch(console.error);
}
