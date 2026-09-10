export type Plant = {
  id: string;
  name: string;
  image: string;
  category: string;
  price: number;
  originalPrice?: number;
  description: string;
  growTime: string;
  specialty: string;
  discount?: number;
};

export const categories = [
  { id: "all", name: "All Plants", icon: "🌿" },
  { id: "indoor", name: "Indoor Plants", icon: "🏠" },
  { id: "outdoor", name: "Outdoor Plants", icon: "☀️" },
  { id: "succulents", name: "Succulents & Cacti", icon: "🌵" },
  { id: "herbs", name: "Herbs", icon: "🌱" },
  { id: "flowering", name: "Flowering Plants", icon: "🌸" },
];

export const plants: Plant[] = [
  {
    id: "1",
    name: "Monstera Deliciosa",
    image: "/plants/monstera.jpg",
    category: "indoor",
    price: 29.99,
    originalPrice: 39.99,
    description: "The iconic Swiss Cheese Plant with dramatic split leaves. A statement piece for any room that brings tropical vibes instantly.",
    growTime: "2-3 years to mature",
    specialty: "Air purifying & low maintenance",
    discount: 25,
  },
  {
    id: "2",
    name: "Snake Plant",
    image: "/plants/snake-plant.jpg",
    category: "indoor",
    price: 19.99,
    description: "Nearly indestructible and perfect for beginners. Thrives in low light and purifies air while you sleep.",
    growTime: "6-8 months",
    specialty: "Night oxygen producer",
  },
  {
    id: "3",
    name: "Golden Pothos",
    image: "/plants/pothos.jpg",
    category: "indoor",
    price: 14.99,
    originalPrice: 19.99,
    description: "A trailing vine with heart-shaped leaves. Perfect for shelves and hanging baskets.",
    growTime: "3-4 months for trails",
    specialty: "Removes toxins from air",
    discount: 25,
  },
  {
    id: "4",
    name: "Lavender",
    image: "/plants/lavender.jpg",
    category: "flowering",
    price: 22.99,
    description: "Fragrant purple blooms that attract pollinators and bring calm to your garden. Great for aromatherapy.",
    growTime: "1-2 seasons to bloom",
    specialty: "Natural stress reliever",
  },
  {
    id: "5",
    name: "Echeveria Succulent",
    image: "/plants/succulent.jpg",
    category: "succulents",
    price: 9.99,
    originalPrice: 14.99,
    description: "A rosette-shaped succulent with stunning pink-tipped leaves. Drought-tolerant and easy to propagate.",
    growTime: "4-6 months",
    specialty: "Drought resistant beauty",
    discount: 33,
  },
  {
    id: "6",
    name: "Peace Lily",
    image: "/plants/peace-lily.jpg",
    category: "flowering",
    price: 24.99,
    description: "Elegant white blooms that symbolize peace and harmony. One of the best air-purifying plants.",
    growTime: "1 year to first bloom",
    specialty: "Top NASA air purifier",
  },
  {
    id: "7",
    name: "Fiddle Leaf Fig",
    image: "/plants/fiddle-leaf.jpg",
    category: "indoor",
    price: 44.99,
    originalPrice: 59.99,
    description: "The Instagram-famous tree with large, violin-shaped leaves. A stunning architectural plant.",
    growTime: "2-3 years to full height",
    specialty: "Designer's favorite statement plant",
    discount: 25,
  },
  {
    id: "8",
    name: "Aloe Vera",
    image: "/plants/aloe-vera.jpg",
    category: "succulents",
    price: 12.99,
    description: "A medicinal marvel that soothes burns and purifies air. Easy to grow and incredibly useful.",
    growTime: "3-4 months",
    specialty: "Medicinal healing properties",
  },
  {
    id: "9",
    name: "Sweet Basil",
    image: "/plants/basil.jpg",
    category: "herbs",
    price: 7.99,
    description: "Fresh, aromatic leaves perfect for cooking. Grows quickly and fills your kitchen with amazing scent.",
    growTime: "3-4 weeks to harvest",
    specialty: "Culinary superfood herb",
  },
  {
    id: "10",
    name: "Rubber Plant",
    image: "/plants/rubber-plant.jpg",
    category: "indoor",
    price: 34.99,
    description: "Glossy, dark green leaves that add a bold, tropical feel to any space. Very forgiving plant.",
    growTime: "1-2 years",
    specialty: "Toxin-absorbing powerhouse",
  },
  {
    id: "11",
    name: "Mixed Cactus Set",
    image: "/plants/cactus.jpg",
    category: "succulents",
    price: 18.99,
    originalPrice: 24.99,
    description: "A curated collection of unique cacti. Perfect for windowsills and desks. Virtually zero maintenance.",
    growTime: "Slow-growing, years to mature",
    specialty: "Beginner-proof & unique shapes",
    discount: 24,
  },
  {
    id: "12",
    name: "Rosemary",
    image: "/plants/rosemary.jpg",
    category: "herbs",
    price: 10.99,
    description: "Fragrant evergreen herb used in cooking and aromatherapy. Hardy and drought-tolerant once established.",
    growTime: "6-8 weeks to harvest",
    specialty: "Memory-boosting aroma",
  },
];
