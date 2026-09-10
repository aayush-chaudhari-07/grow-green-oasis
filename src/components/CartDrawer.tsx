import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, CheckCircle2, CreditCard, QrCode, Banknote, ShieldCheck, MapPin, Truck } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

interface SavedAddress {
  id: string;
  name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  is_default: number;
}

const CartDrawer: React.FC = () => {
  const { isCartOpen, setIsCartOpen, items, totalAmount, updateQuantity, removeFromCart, checkout, isCheckingOut } = useCart();
  const { user, isAuthenticated } = useAuth();

  const [step, setStep] = useState<'cart' | 'address' | 'payment' | 'success'>('cart');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Card' | 'UPI' | 'COD'>('Card');
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setCustomerName(user.name || '');
      setCustomerEmail(user.email || '');
      setCustomerPhone(user.phone || '');
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated && step === 'address') {
      apiFetch<{ addresses: SavedAddress[] }>('/api/user/addresses').then((res) => {
        if (res.ok && res.data?.addresses) {
          setSavedAddresses(res.data.addresses);
          const def = res.data.addresses.find((a) => a.is_default) || res.data.addresses[0];
          if (def && !addressLine1) {
            setCustomerName(def.name);
            setCustomerPhone(def.phone);
            setAddressLine1(def.address_line1);
            setAddressLine2(def.address_line2 || '');
            setCity(def.city);
            setState(def.state);
            setPincode(def.pincode);
          }
        }
      });
    }
  }, [isAuthenticated, step]);

  if (!isCartOpen) return null;

  const handleClose = () => {
    setIsCartOpen(false);
    setStep('cart');
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('payment');
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullAddress = [addressLine1, addressLine2].filter(Boolean).join(', ');
    const paymentStatus = paymentMethod === 'COD' ? 'Pending' : 'Paid';

    const result = await checkout({
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress: fullAddress,
      city,
      state,
      pincode,
      paymentMethod,
      paymentStatus
    });

    if (result.success && result.orderId) {
      setCreatedOrderId(result.orderId);
      setStep('success');
    }
  };

  const handleViewOrders = () => {
    handleClose();
    window.location.href = '/my-orders';
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
                  {step === 'address' && 'Shipping Address'}
                  {step === 'payment' && 'Payment Method'}
                  {step === 'success' && 'Order Confirmed!'}
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Step Progress indicator */}
            {step !== 'success' && items.length > 0 && (
              <div className="px-6 py-2 bg-secondary/40 border-b border-border flex items-center justify-between text-xs font-semibold">
                <span className={step === 'cart' ? 'text-primary font-bold' : 'text-muted-foreground'}>1. Cart</span>
                <span className="text-muted-foreground">→</span>
                <span className={step === 'address' ? 'text-primary font-bold' : 'text-muted-foreground'}>2. Address</span>
                <span className="text-muted-foreground">→</span>
                <span className={step === 'payment' ? 'text-primary font-bold' : 'text-muted-foreground'}>3. Payment</span>
              </div>
            )}

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
                            loading="lazy"
                            decoding="async"
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

              {step === 'address' && (
                <form id="address-form" onSubmit={handleAddressSubmit} className="space-y-4">
                  {savedAddresses.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-foreground/80 mb-2">Saved Addresses</label>
                      <div className="space-y-2">
                        {savedAddresses.map((addr) => (
                          <div
                            key={addr.id}
                            onClick={() => {
                              setCustomerName(addr.name);
                              setCustomerPhone(addr.phone);
                              setAddressLine1(addr.address_line1);
                              setAddressLine2(addr.address_line2 || '');
                              setCity(addr.city);
                              setState(addr.state);
                              setPincode(addr.pincode);
                            }}
                            className="p-3 bg-secondary/60 hover:bg-secondary rounded-xl text-xs cursor-pointer border border-border flex items-center justify-between"
                          >
                            <div>
                              <p className="font-bold text-foreground">{addr.name} ({addr.phone})</p>
                              <p className="text-muted-foreground">{addr.address_line1}, {addr.city}, {addr.state} - {addr.pincode}</p>
                            </div>
                            <MapPin size={16} className="text-primary" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-foreground/80 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Jane Doe"
                        className="w-full px-3.5 py-2.5 bg-secondary text-foreground text-sm rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground/80 mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+1 555 019 2834"
                        className="w-full px-3.5 py-2.5 bg-secondary text-foreground text-sm rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground/80 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-3.5 py-2.5 bg-secondary text-foreground text-sm rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground/80 mb-1">Street Address Line 1 *</label>
                    <input
                      type="text"
                      required
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      placeholder="123 Botanical Way"
                      className="w-full px-3.5 py-2.5 bg-secondary text-foreground text-sm rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground/80 mb-1">Address Line 2 (Optional)</label>
                    <input
                      type="text"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                      placeholder="Apartment 4B"
                      className="w-full px-3.5 py-2.5 bg-secondary text-foreground text-sm rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-foreground/80 mb-1">City *</label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Greenville"
                        className="w-full px-3 py-2.5 bg-secondary text-foreground text-sm rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground/80 mb-1">State *</label>
                      <input
                        type="text"
                        required
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="CA"
                        className="w-full px-3 py-2.5 bg-secondary text-foreground text-sm rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground/80 mb-1">Pincode *</label>
                      <input
                        type="text"
                        required
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="90210"
                        className="w-full px-3 py-2.5 bg-secondary text-foreground text-sm rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                </form>
              )}

              {step === 'payment' && (
                <form id="payment-form" onSubmit={handlePaymentSubmit} className="space-y-4">
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex items-center gap-3">
                    <ShieldCheck size={20} className="text-amber-600 dark:text-amber-400 shrink-0" />
                    <p className="text-xs text-amber-800 dark:text-amber-200">
                      <strong>Sandbox / Test Gateway</strong>: Select any payment method below to simulate an instant purchase.
                    </p>
                  </div>

                  <label className="block text-xs font-semibold text-foreground/80">Select Payment Method</label>
                  <div className="space-y-3">
                    <div
                      onClick={() => setPaymentMethod('Card')}
                      className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                        paymentMethod === 'Card'
                          ? 'border-primary bg-primary/10 shadow-sm'
                          : 'border-border bg-secondary/50 hover:bg-secondary'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="text-primary" size={20} />
                        <div>
                          <p className="font-bold text-sm text-foreground">Credit / Debit Card</p>
                          <p className="text-xs text-muted-foreground">Visa, MasterCard, Amex (Mocked)</p>
                        </div>
                      </div>
                      <input type="radio" checked={paymentMethod === 'Card'} onChange={() => setPaymentMethod('Card')} />
                    </div>

                    <div
                      onClick={() => setPaymentMethod('UPI')}
                      className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                        paymentMethod === 'UPI'
                          ? 'border-primary bg-primary/10 shadow-sm'
                          : 'border-border bg-secondary/50 hover:bg-secondary'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <QrCode className="text-primary" size={20} />
                        <div>
                          <p className="font-bold text-sm text-foreground">Instant UPI / QR Code</p>
                          <p className="text-xs text-muted-foreground">Google Pay, PhonePe, Paytm</p>
                        </div>
                      </div>
                      <input type="radio" checked={paymentMethod === 'UPI'} onChange={() => setPaymentMethod('UPI')} />
                    </div>

                    <div
                      onClick={() => setPaymentMethod('COD')}
                      className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                        paymentMethod === 'COD'
                          ? 'border-primary bg-primary/10 shadow-sm'
                          : 'border-border bg-secondary/50 hover:bg-secondary'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Banknote className="text-primary" size={20} />
                        <div>
                          <p className="font-bold text-sm text-foreground">Cash on Delivery (COD)</p>
                          <p className="text-xs text-muted-foreground">Pay cash upon plant delivery</p>
                        </div>
                      </div>
                      <input type="radio" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} />
                    </div>
                  </div>

                  <div className="bg-secondary/40 p-4 rounded-2xl space-y-2 text-xs mt-4">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Items Subtotal</span>
                      <span>${totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Eco Delivery</span>
                      <span className="text-leaf font-semibold">FREE</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-foreground pt-2 border-t border-border">
                      <span>Total Amount</span>
                      <span className="text-primary">${totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </form>
              )}

              {step === 'success' && (
                <div className="text-center py-8 space-y-4">
                  <CheckCircle2 size={60} className="mx-auto text-leaf animate-bounce" />
                  <h4 className="font-display text-2xl font-bold text-foreground">Order Placed Successfully!</h4>
                  {createdOrderId && (
                    <p className="text-xs font-mono text-primary bg-primary/10 px-3 py-1 rounded-full inline-block">
                      Order ID: {createdOrderId}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Your order is now confirmed with status <span className="font-bold text-leaf">Order Placed</span>.
                  </p>

                  <div className="bg-secondary/50 p-4 rounded-2xl text-left space-y-3 text-xs border border-border">
                    <div className="flex items-center gap-2 font-bold text-foreground">
                      <Truck size={16} className="text-leaf" />
                      Delivery Tracker
                    </div>
                    <div className="space-y-2 relative pl-4 border-l-2 border-primary">
                      <div className="text-primary font-bold">✓ Order Placed & Confirmed</div>
                      <div className="text-muted-foreground">○ Preparing Healthy Plants</div>
                      <div className="text-muted-foreground">○ Out for Express Delivery</div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      onClick={handleViewOrders}
                      className="w-full bg-primary text-primary-foreground py-3 rounded-full font-semibold text-sm shadow-plant"
                    >
                      View My Orders
                    </button>
                    <button
                      onClick={handleClose}
                      className="w-full bg-secondary text-foreground py-2.5 rounded-full font-semibold text-xs border border-border hover:bg-muted"
                    >
                      Continue Shopping
                    </button>
                  </div>
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

                {step === 'cart' && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setStep('address')}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3.5 rounded-full font-semibold text-sm shadow-plant hover:shadow-lg transition-all"
                  >
                    Proceed to Address
                    <ArrowRight size={18} />
                  </motion.button>
                )}

                {step === 'address' && (
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
                      form="address-form"
                      type="submit"
                      className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3.5 rounded-full font-semibold text-sm shadow-plant hover:shadow-lg transition-all"
                    >
                      Continue to Payment
                      <ArrowRight size={18} />
                    </motion.button>
                  </div>
                )}

                {step === 'payment' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep('address')}
                      className="px-4 py-3 rounded-full font-semibold text-sm border border-border text-foreground hover:bg-muted"
                    >
                      Back
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      form="payment-form"
                      type="submit"
                      disabled={isCheckingOut}
                      className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3.5 rounded-full font-semibold text-sm shadow-plant hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {isCheckingOut ? 'Processing Order...' : `Pay $${totalAmount.toFixed(2)} & Place Order`}
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
