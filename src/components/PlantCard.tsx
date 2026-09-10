import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Sparkles, ShoppingBag, X, Heart } from "lucide-react";
import type { Plant } from "@/data/plants";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

const PlantCard = ({ plant }: { plant: Plant }) => {
  const [hovered, setHovered] = useState(false);
  const { addToCart, setIsCartOpen } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const isSaved = isInWishlist(plant.id);

  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(plant.id, 1);
    setIsCartOpen(true);
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleWishlist(plant);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Base Card */}
      <motion.div
        whileHover={{ y: -8 }}
        className="bg-popover rounded-2xl overflow-hidden shadow-sm hover:shadow-plant transition-all cursor-pointer group"
      >
        <div className="relative overflow-hidden">
          <img
            src={plant.image}
            alt={plant.name}
            loading="lazy"
            decoding="async"
            className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {plant.discount && (
            <div className="absolute top-3 left-3 bg-gradient-gold text-accent-foreground text-xs font-bold px-3 py-1 rounded-full shadow-gold">
              {plant.discount}% OFF
            </div>
          )}
          <button
            onClick={handleToggleWishlist}
            title={isSaved ? "Remove from wishlist" : "Add to wishlist"}
            className="absolute top-3 right-3 z-10 bg-popover/80 backdrop-blur-md p-2 rounded-full hover:bg-popover transition-colors shadow-sm"
          >
            <Heart
              size={16}
              className={`transition-colors ${isSaved ? "fill-destructive text-destructive" : "text-foreground/70 hover:text-destructive"}`}
            />
          </button>
        </div>
        <div className="p-5">
          <p className="text-xs text-leaf font-semibold uppercase tracking-wider mb-1">
            {plant.category}
          </p>
          <h3 className="font-display text-lg font-bold text-foreground">{plant.name}</h3>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-xl font-bold text-primary">${plant.price}</span>
            {plant.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">${plant.originalPrice}</span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Hover Popup Card */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute z-50 top-0 left-1/2 -translate-x-1/2 w-[340px] bg-popover rounded-2xl shadow-2xl border border-border overflow-hidden"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <div className="relative">
              <img
                src={plant.image}
                alt={plant.name}
                loading="lazy"
                decoding="async"
                className="w-full h-48 object-cover"
              />
              {plant.discount && (
                <div className="absolute top-3 left-3 bg-gradient-gold text-accent-foreground text-xs font-bold px-3 py-1 rounded-full shadow-gold">
                  {plant.discount}% OFF
                </div>
              )}
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  onClick={handleToggleWishlist}
                  title={isSaved ? "Remove from wishlist" : "Add to wishlist"}
                  className="bg-popover/80 backdrop-blur-md p-1.5 rounded-full hover:bg-popover transition-colors shadow-sm text-foreground/70"
                >
                  <Heart
                    size={15}
                    className={`transition-colors ${isSaved ? "fill-destructive text-destructive" : "hover:text-destructive"}`}
                  />
                </button>
                <button
                  onClick={() => setHovered(false)}
                  className="bg-foreground/20 backdrop-blur-sm text-cream p-1.5 rounded-full hover:bg-foreground/40 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="p-5">
              <p className="text-xs text-leaf font-semibold uppercase tracking-wider mb-1">
                {plant.category}
              </p>
              <h3 className="font-display text-xl font-bold text-foreground">{plant.name}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{plant.description}</p>

              <div className="flex flex-col gap-2 mt-4">
                <div className="flex items-center gap-2 text-sm">
                  <Clock size={14} className="text-leaf" />
                  <span className="text-muted-foreground">Grow Time: </span>
                  <span className="font-medium text-foreground">{plant.growTime}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles size={14} className="text-gold" />
                  <span className="text-muted-foreground">Specialty: </span>
                  <span className="font-medium text-foreground">{plant.specialty}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-primary">${plant.price}</span>
                  {plant.originalPrice && (
                    <span className="text-sm text-muted-foreground line-through">${plant.originalPrice}</span>
                  )}
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBuyNow}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-semibold hover:shadow-plant transition-shadow"
                >
                  <ShoppingBag size={16} />
                  Buy Now
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PlantCard;
