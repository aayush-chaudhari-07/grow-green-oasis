import React from 'react';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PlantCard from '@/components/PlantCard';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';

const Wishlist: React.FC = () => {
  const { wishlistItems, removeFromWishlist, wishlistCount } = useWishlist();
  const { addToCart, setIsCartOpen } = useCart();

  const handleAddAllToCart = async () => {
    for (const item of wishlistItems) {
      await addToCart(item.id, 1);
    }
    setIsCartOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <Navbar />

      <main className="pt-28 pb-20 container mx-auto px-6 flex-1">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <div className="flex items-center justify-center gap-2 text-leaf font-semibold text-xs uppercase tracking-widest mb-2">
            <Heart size={16} className="fill-destructive text-destructive" />
            <span>Saved Sanctuary</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">
            My Plant Wishlist
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Your saved botanical favorites. Bring them into your home when you're ready!
          </p>

          {wishlistCount > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddAllToCart}
              className="mt-6 inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-semibold text-xs shadow-plant hover:shadow-lg transition-all"
            >
              <ShoppingBag size={16} />
              Add All ({wishlistCount}) Items to Cart
            </motion.button>
          )}
        </motion.div>

        {wishlistCount === 0 ? (
          <div className="bg-popover border border-border rounded-3xl p-16 text-center max-w-md mx-auto shadow-sm">
            <Heart size={56} className="mx-auto text-muted-foreground opacity-30 mb-3" />
            <h3 className="font-display text-2xl font-bold text-foreground">Your wishlist is empty</h3>
            <p className="text-xs text-muted-foreground mt-2 mb-6 leading-relaxed">
              Explore our collection of indoor, outdoor, and air-purifying plants and click the heart icon on any card to save it here!
            </p>
            <a
              href="/#shop"
              className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold text-xs shadow-plant inline-block"
            >
              Explore Green Collection
            </a>
          </div>
        ) : (
          <motion.div
            layout
            className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          >
            {wishlistItems.map((plant) => (
              <div key={plant.id} className="relative group">
                <PlantCard plant={plant} />
                <button
                  onClick={() => removeFromWishlist(plant.id)}
                  title="Remove from wishlist"
                  className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors border border-destructive/20"
                >
                  <Trash2 size={14} />
                  Remove from Wishlist
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Wishlist;
