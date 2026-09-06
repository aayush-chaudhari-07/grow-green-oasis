import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-plants.jpg";
import { ArrowDown, Leaf, Sprout } from "lucide-react";

const HeroSection = () => {
  const [stats, setStats] = useState({
    plantVarieties: "500+",
    happyCustomers: "10K+",
    organicPercentage: "100%"
  });

  useEffect(() => {
    fetch("/api/stats/summary")
      .then((res) => res.json())
      .then((data) => {
        if (data.plantVarieties) {
          setStats({
            plantVarieties: data.plantVarieties,
            happyCustomers: data.happyCustomers,
            organicPercentage: data.organicPercentage
          });
        }
      })
      .catch((err) => console.error("Failed to load hero stats from API", err));
  }, []);

  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Beautiful plants collection"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-leaf-dark/90 via-primary/80 to-leaf-dark/70" />
      </div>

      {/* Floating decorative elements */}
      <motion.div
        animate={{ y: [-10, 10, -10] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-32 right-20 opacity-20"
      >
        <Leaf size={80} className="text-leaf-light" />
      </motion.div>
      <motion.div
        animate={{ y: [10, -10, 10] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-40 left-16 opacity-15"
      >
        <Sprout size={60} className="text-leaf-light" />
      </motion.div>

      <div className="container relative z-10 mx-auto px-6 pt-20">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-flex items-center gap-2 bg-gold/20 backdrop-blur-sm text-cream px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              🌿 Up to 33% OFF — Spring Sale
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-display text-5xl md:text-7xl font-bold text-cream leading-tight mb-6"
          >
            Bring Nature
            <br />
            <span className="text-leaf-light">Into Your Life</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-xl text-cream/80 mb-8 leading-relaxed max-w-lg"
          >
            Transform your space with our hand-picked, sustainably grown plants. 
            Breathe cleaner air, boost your mood, and create your own green sanctuary.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-wrap gap-4"
          >
            <a
              href="#shop"
              className="bg-leaf text-cream px-8 py-3.5 rounded-full font-semibold text-lg hover:shadow-plant transition-all hover:scale-105 active:scale-95"
            >
              Shop Now
            </a>
            <a
              href="#about"
              className="border-2 border-cream/40 text-cream px-8 py-3.5 rounded-full font-semibold text-lg hover:bg-cream/10 transition-all"
            >
              Learn More
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="flex gap-8 mt-14"
          >
            {[
              { num: stats.plantVarieties, label: "Plant Varieties" },
              { num: stats.happyCustomers, label: "Happy Customers" },
              { num: stats.organicPercentage, label: "Organic" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-cream">{stat.num}</p>
                <p className="text-sm text-cream/60">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-cream/50"
      >
        <ArrowDown size={24} />
      </motion.div>
    </section>
  );
};

export default HeroSection;
