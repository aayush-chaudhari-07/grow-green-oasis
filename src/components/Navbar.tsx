import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import logo from "@/assets/logo.png";
import { Leaf, ShoppingCart, User as UserIcon, LogOut } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const { setIsCartOpen, itemCount } = useCart();
  const { user, isAuthenticated, setIsAuthModalOpen, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-popover/95 backdrop-blur-md shadow-plant"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between py-4 px-6">
        <a href="#" className="flex items-center gap-2">
          <img src={logo} alt="Grow Green" className="h-10 w-10" />
          <span className="font-display text-xl font-bold text-primary">
            Grow Green
          </span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {["Home", "Shop", "Categories", "About"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all hover:after:w-full"
            >
              {item}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className="hidden lg:inline text-xs font-semibold text-foreground/80 bg-secondary/80 px-3 py-1.5 rounded-full">
                Hi, {user?.name.split(' ')[0]}
              </span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={logout}
                title="Log Out"
                className="p-2 text-foreground/70 hover:text-destructive transition-colors bg-secondary/50 rounded-full"
              >
                <LogOut size={16} />
              </motion.button>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 text-foreground/80 hover:text-primary transition-colors bg-secondary/60 px-3.5 py-1.5 rounded-full text-xs font-semibold"
            >
              <UserIcon size={15} />
              <span>Sign In</span>
            </motion.button>
          )}

          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-1 bg-primary text-primary-foreground px-4 py-2 rounded-full cursor-pointer text-sm font-medium"
          >
            <ShoppingCart size={16} />
            <span className="hidden sm:inline">Cart</span>
            {itemCount > 0 && (
              <span className="ml-1 bg-gold text-accent-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </motion.div>
          <Leaf className="text-leaf md:hidden" size={24} />
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
