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
        {loading && plantsList.length === 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-popover/50 rounded-2xl overflow-hidden animate-pulse p-4 flex flex-col gap-4">
                <div className="w-full h-56 bg-muted/60 rounded-xl" />
                <div className="h-4 w-1/3 bg-muted/60 rounded" />
                <div className="h-6 w-2/3 bg-muted/60 rounded" />
                <div className="h-5 w-1/4 bg-muted/60 rounded mt-auto" />
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            layout
            className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          >
            {filtered.map((plant) => (
              <PlantCard key={plant.id} plant={plant} />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default ShopSection;
