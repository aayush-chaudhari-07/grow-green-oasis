import { motion } from "framer-motion";
import { Gift, ArrowRight } from "lucide-react";

const DiscountBanner = () => {
  return (
    <section className="py-16">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-gradient-hero rounded-3xl p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden"
        >
          {/* Decorative circles */}
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-leaf-light/10" />
          <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-gold/10" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Gift className="text-gold" size={24} />
              <span className="text-gold font-semibold text-sm uppercase tracking-wider">Limited Time Offer</span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-cream mb-3">
              Spring Sale — Up to 33% Off!
            </h2>
            <p className="text-cream/70 max-w-md">
              Refresh your space with lush greenery at unbeatable prices. Use code <span className="font-bold text-gold">GROW33</span> at checkout for extra savings.
            </p>
          </div>

          <motion.a
            href="#shop"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative z-10 flex items-center gap-2 bg-gold text-accent-foreground px-8 py-4 rounded-full font-bold text-lg shadow-gold hover:shadow-lg transition-all shrink-0"
          >
            Shop Deals
            <ArrowRight size={20} />
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
};

export default DiscountBanner;
