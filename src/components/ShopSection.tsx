import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { categories as fallbackCategories, plants as fallbackPlants, Plant } from "@/data/plants";
import PlantCard from "./PlantCard";

const ShopSection = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [categoriesList, setCategoriesList] = useState(fallbackCategories);
  const [plantsList, setPlantsList] = useState<Plant[]>(fallbackPlants);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, plantRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/plants")
        ]);
        if (catRes.ok) {
          const cats = await catRes.json();
          if (cats && cats.length > 0) setCategoriesList(cats);
        }
        if (plantRes.ok) {
          const fetchedPlants = await plantRes.json();
          if (fetchedPlants && fetchedPlants.length > 0) setPlantsList(fetchedPlants);
        }
      } catch (err) {
        console.error("Failed to load plants from API, using fallback data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filtered = activeCategory === "all"
    ? plantsList
    : plantsList.filter((p) => p.category === activeCategory);

  return (
    <section id="shop" className="py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-leaf font-semibold text-sm uppercase tracking-widest">Our Collection</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-3">
            Find Your Perfect Plant
          </h2>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          id="categories"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {categoriesList.map((cat) => (
            <motion.button
              key={cat.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat.id
                  ? "bg-primary text-primary-foreground shadow-plant"
                  : "bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              <span>{cat.icon}</span>
              {cat.name}
            </motion.button>
          ))}
        </motion.div>

        {/* Plant Grid */}
        <motion.div
          layout
          className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
        >
          {filtered.map((plant) => (
            <PlantCard key={plant.id} plant={plant} />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ShopSection;
