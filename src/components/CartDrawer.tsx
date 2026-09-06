import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

const CartDrawer: React.FC = () => {
  const { isCartOpen, setIsCartOpen, items, totalAmount, updateQuantity, removeFromCart, checkout, isCheckingOut } = useCart();
  const { user } = useAuth();

  const [step, setStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [shippingAddress, setShippingAddress] = useState('');

  if (!isCartOpen) return null;

  const handleClose = () => {
    setIsCartOpen(false);
    setStep('cart');
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await checkout(customerName, customerEmail, shippingAddress);
    if (success) {
      setStep('success');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-foreground/40 backdrop-blur-xs"
        />

        {/* Drawer container */}
        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-screen max-w-md bg-popover shadow-2xl border-l border-border flex flex-col justify-between"
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="text-primary" size={22} />
                <h3 className="font-display text-xl font-bold text-foreground">
                  {step === 'cart' && 'Your Plant Cart'}
                  {step === 'checkout' && 'Checkout & Shipping'}
                  {step === 'success' && 'Order Confirmed'}
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {step === 'cart' && (
                <>
                  {items.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <ShoppingBag size={48} className="mx-auto mb-3 opacity-30 text-leaf" />
                      <p className="font-display text-lg font-semibold text-foreground">Your cart is empty</p>
                      <p className="text-xs mt-1">Explore our collection and add your favorite greenery!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {items.map((item) => (
                        <div
                          key={item.plantId}
                          className="flex items-center gap-4 bg-secondary/50 rounded-2xl p-3 border border-border/50"
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-xl"
                          />
                          <div className="flex-1">
                            <h4 className="font-display text-sm font-bold text-foreground">{item.name}</h4>
                            <p className="text-xs text-leaf uppercase font-medium">{item.category}</p>
                            <span className="text-sm font-bold text-primary">${item.price}</span>
                          </div>

                          <div className="flex items-center gap-2 bg-popover rounded-full px-2 py-1 border border-border">
                            <button
                              onClick={() => updateQuantity(item.plantId, item.quantity - 1)}
                              className="text-muted-foreground hover:text-foreground p-0.5"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="text-xs font-bold text-foreground w-4 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.plantId, item.quantity + 1)}
                              className="text-muted-foreground hover:text-foreground p-0.5"
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.plantId)}
                            className="text-muted-foreground hover:text-destructive p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {step === 'checkout' && (
                <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground/80 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full px-4 py-2.5 bg-secondary text-foreground text-sm rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground/80 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-2.5 bg-secondary text-foreground text-sm rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground/80 mb-1">Shipping Address</label>
                    <textarea
                      required
                      rows={3}
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="123 Botanical Way, Apartment 4B, City, Country"
                      className="w-full px-4 py-2.5 bg-secondary text-foreground text-sm rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  <div className="bg-secondary/40 p-4 rounded-2xl space-y-2 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>${totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Shipping</span>
                      <span className="text-leaf font-semibold">Free</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-foreground pt-2 border-t border-border">
                      <span>Total Amount</span>
                      <span className="text-primary">${totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </form>
              )}

              {step === 'success' && (
                <div className="text-center py-12 space-y-4">
                  <CheckCircle2 size={64} className="mx-auto text-leaf animate-bounce" />
                  <h4 className="font-display text-2xl font-bold text-foreground">Thank You!</h4>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    Your order has been recorded in the database. Our team will carefully prepare your plants for shipping!
                  </p>
                  <button
                    onClick={handleClose}
                    className="mt-6 bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-semibold text-sm shadow-plant"
                  >
                    Continue Shopping
                  </button>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            {items.length > 0 && step !== 'success' && (
              <div className="p-6 border-t border-border bg-secondary/20">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-muted-foreground">Total</span>
                  <span className="text-2xl font-bold text-primary">${totalAmount.toFixed(2)}</span>
                </div>

                {step === 'cart' ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setStep('checkout')}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3.5 rounded-full font-semibold text-sm shadow-plant hover:shadow-lg transition-all"
                  >
                    Proceed to Checkout
                    <ArrowRight size={18} />
                  </motion.button>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep('cart')}
                      className="px-4 py-3 rounded-full font-semibold text-sm border border-border text-foreground hover:bg-muted"
                    >
                      Back
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      form="checkout-form"
                      type="submit"
                      disabled={isCheckingOut}
                      className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3.5 rounded-full font-semibold text-sm shadow-plant hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {isCheckingOut ? 'Processing...' : 'Place Order Now'}
                    </motion.button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default CartDrawer;
