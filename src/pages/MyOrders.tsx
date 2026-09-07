import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Calendar, MapPin, CreditCard, ChevronRight, ShoppingBag, Clock, Truck, CheckCircle, RefreshCw } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

interface OrderItem {
  id: string;
  plantId: string;
  plantName: string;
  image?: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: string;
  paymentMethod: string;
  paymentStatus: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

const MyOrders: React.FC = () => {
  const { isAuthenticated, setIsAuthModalOpen } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch<Order[]>('/api/orders/my-orders');
      if (res.ok && res.data) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [isAuthenticated]);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
      case 'completed':
        return <span className="bg-leaf/10 text-leaf border border-leaf/30 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5"><CheckCircle size={13} /> Delivered</span>;
      case 'in transit':
      case 'shipped':
        return <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5"><Truck size={13} /> In Transit</span>;
      default:
        return <span className="bg-gold/20 text-gold-dark dark:text-gold border border-gold/40 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5"><Clock size={13} /> Order Placed</span>;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <Navbar />

      <main className="pt-28 pb-20 container mx-auto px-6 flex-1 max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-4 border-b border-border pb-8"
        >
          <div>
            <div className="flex items-center justify-center md:justify-start gap-2.5 text-leaf font-semibold text-xs uppercase tracking-widest mb-1">
              <Package size={16} />
              <span>Customer Portal</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              My Orders & Deliveries
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track real-time delivery status and review your past plant purchases
            </p>
          </div>

          {isAuthenticated && (
            <button
              onClick={fetchOrders}
              className="flex items-center gap-2 bg-secondary text-foreground hover:bg-muted px-4 py-2 rounded-full text-xs font-semibold border border-border transition-colors"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh Status
            </button>
          )}
        </motion.div>

        {!isAuthenticated ? (
          <div className="bg-popover border border-border rounded-3xl p-12 text-center max-w-md mx-auto shadow-xl">
            <Package size={56} className="mx-auto text-primary opacity-40 mb-4" />
            <h3 className="font-display text-2xl font-bold text-foreground mb-2">Sign in to view your orders</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Log in with your Grow Green account to access your full order history and track shipments.
            </p>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-semibold text-sm shadow-plant hover:shadow-lg transition-all"
            >
              Sign In to Account
            </button>
          </div>
        ) : loading ? (
          <div className="py-20 text-center text-muted-foreground space-y-3">
            <RefreshCw size={32} className="mx-auto animate-spin text-primary" />
            <p className="text-sm font-medium">Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-popover border border-border rounded-3xl p-12 text-center max-w-md mx-auto shadow-sm">
            <ShoppingBag size={48} className="mx-auto text-muted-foreground opacity-30 mb-3" />
            <h3 className="font-display text-xl font-bold text-foreground">No orders found yet</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-6">
              You haven't placed any plant orders yet. Explore our shop collection to bring home your first greenery!
            </p>
            <a
              href="/#shop"
              className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-semibold text-xs shadow-plant inline-block"
            >
              Browse Plants Collection
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-popover border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4 mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-sm text-primary">{order.id}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar size={13} />
                        {new Date(order.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <CreditCard size={13} />
                        {order.paymentMethod} ({order.paymentStatus})
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-muted-foreground block">Total Amount</span>
                    <span className="text-xl font-bold text-primary">${order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Items preview */}
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 bg-secondary/40 p-2.5 rounded-xl border border-border/40">
                      {item.image ? (
                        <img src={item.image} alt={item.plantName} className="w-12 h-12 object-cover rounded-lg" />
                      ) : (
                        <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center text-leaf">🌿</div>
                      )}
                      <div className="overflow-hidden">
                        <p className="font-bold text-xs text-foreground truncate">{item.plantName}</p>
                        <p className="text-[11px] text-muted-foreground">
                          Qty: {item.quantity} × ${item.price}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Shipping address footer & Details toggle */}
                <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground truncate max-w-md">
                    <MapPin size={14} className="text-leaf shrink-0" />
                    <span className="truncate">{order.shippingAddress}</span>
                  </div>

                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="flex items-center gap-1 text-primary font-semibold hover:underline shrink-0"
                  >
                    <span>Full Details</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-lg bg-popover rounded-3xl p-6 shadow-2xl border border-border max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
              <div>
                <span className="text-xs font-mono font-bold text-primary">{selectedOrder.id}</span>
                <h3 className="font-display text-xl font-bold text-foreground">Order Details</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-secondary/40 p-4 rounded-2xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-bold text-foreground">{selectedOrder.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-bold text-foreground">{selectedOrder.customerEmail}</span>
                </div>
                {selectedOrder.customerPhone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-bold text-foreground">{selectedOrder.customerPhone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping Address:</span>
                  <span className="font-bold text-foreground text-right max-w-[200px]">{selectedOrder.shippingAddress}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-foreground text-sm">Ordered Items</p>
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl border border-border">
                    <div className="flex items-center gap-3">
                      {item.image && <img src={item.image} alt={item.plantName} className="w-10 h-10 object-cover rounded-lg" />}
                      <div>
                        <p className="font-bold text-foreground">{item.plantName}</p>
                        <p className="text-muted-foreground">Quantity: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-bold text-primary">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="bg-secondary/40 p-4 rounded-2xl space-y-2 pt-3 border-t border-border">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method:</span>
                  <span className="font-bold text-foreground">{selectedOrder.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Status:</span>
                  <span className="font-bold text-leaf">{selectedOrder.paymentStatus}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-foreground pt-2 border-t border-border">
                  <span>Total Amount Paid:</span>
                  <span className="text-primary">${selectedOrder.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="mt-6 w-full bg-primary text-primary-foreground py-2.5 rounded-full font-semibold text-xs shadow-plant"
            >
              Close Details
            </button>
          </motion.div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default MyOrders;
