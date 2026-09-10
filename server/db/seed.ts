import { supabase } from './database.js';
import bcrypt from 'bcryptjs';

export const seedDatabase = async () => {
  try {
    // 1. Seed Categories
    const { count: categoryCount } = await supabase.from('categories').select('*', { count: 'exact', head: true });
    if (!categoryCount || categoryCount === 0) {
      console.log('Seeding categories to Supabase...');
      const categories = [
        { id: "all", name: "All Plants", icon: "🌿" },
        { id: "indoor", name: "Indoor Plants", icon: "🏠" },
        { id: "outdoor", name: "Outdoor Plants", icon: "☀️" },
        { id: "succulents", name: "Succulents & Cacti", icon: "🌵" },
        { id: "herbs", name: "Herbs", icon: "🌱" },
        { id: "flowering", name: "Flowering Plants", icon: "🌸" },
      ];
      await supabase.from('categories').upsert(categories);
    }

    // 2. Seed Plants
    console.log('Seeding/updating plants to Supabase...');
    const plants = [
      {
        id: "1",
        name: "Monstera Deliciosa",
        image: "/plants/monstera.jpg",
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
        image: "/plants/snake-plant.jpg",
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
        image: "/plants/pothos.jpg",
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
        image: "/plants/lavender.jpg",
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
        image: "/plants/succulent.jpg",
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
        image: "/plants/peace-lily.jpg",
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
        image: "/plants/fiddle-leaf.jpg",
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
        image: "/plants/aloe-vera.jpg",
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
        image: "/plants/basil.jpg",
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
        image: "/plants/rubber-plant.jpg",
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
        image: "/plants/cactus.jpg",
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
        image: "/plants/rosemary.jpg",
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
    await supabase.from('plants').upsert(plants);

    // 3. Seed Default Users
    const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
    if (!userCount || userCount === 0) {
      console.log('Seeding default users to Supabase...');
      const userPassHash = await bcrypt.hash('user123', 10);
      const adminPassHash = await bcrypt.hash('admin123', 10);

      const users = [
        { id: 'u1', name: 'Garden Lover', email: 'user@growgreen.com', password_hash: userPassHash, role: 'user' },
        { id: 'u2', name: 'Admin Specialist', email: 'admin@growgreen.com', password_hash: adminPassHash, role: 'admin' }
      ];
      await supabase.from('users').upsert(users);
    }

    console.log('Supabase Database seeding complete.');
  } catch (err) {
    console.error('Supabase seeding notice:', err);
  }
};

if (process.argv[1]?.includes('seed')) {
  seedDatabase().catch(console.error);
}
