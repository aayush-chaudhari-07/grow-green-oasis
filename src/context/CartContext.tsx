import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { apiFetch } from '@/lib/api';
import { plants as catalogPlants } from '@/data/plants';

export interface CartItem {
  id: string;
  plantId: string;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  category: string;
  quantity: number;
}

export interface CheckoutData {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: string;
  city?: string;
  state?: string;
  pincode?: string;
  paymentMethod?: string;
  paymentStatus?: string;
}

interface CartContextType {
  items: CartItem[];
  totalAmount: number;
  itemCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (plantId: string, quantity?: number) => Promise<void>;
  updateQuantity: (plantId: string, quantity: number) => Promise<void>;
  removeFromCart: (plantId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  checkout: (data: CheckoutData | string, customerEmail?: string, shippingAddress?: string) => Promise<{ success: boolean; orderId?: string }>;
  isCheckingOut: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const calcTotal = (cartItems: CartItem[]): number => {
  const sum = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  return Number(sum.toFixed(2));
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);

  const fetchCart = useCallback(async () => {
    try {
      const res = await apiFetch<{ items: CartItem[]; totalAmount: number }>('/api/cart');
      if (res.ok && res.data) {
        setItems(res.data.items || []);
        setTotalAmount(res.data.totalAmount || 0);
      } else {
        console.error('[Cart Fetch Error]', res.error);
      }
    } catch (err) {
      console.error('Failed to fetch cart', err);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart, user]);

  const addToCart = async (plantId: string, quantity: number = 1) => {
    const prevItems = [...items];
    const prevTotal = totalAmount;

    const existingIndex = items.findIndex((i) => i.plantId === plantId);
    let nextItems: CartItem[];

    if (existingIndex >= 0) {
      nextItems = items.map((item, idx) =>
        idx === existingIndex
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      const plantMeta = catalogPlants.find((p) => p.id === plantId);
      const newItem: CartItem = {
        id: 'opt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        plantId,
        name: plantMeta?.name || 'Plant',
        image: plantMeta?.image || '/plants/monstera.jpg',
        price: plantMeta?.price || 0,
        originalPrice: plantMeta?.originalPrice,
        discount: plantMeta?.discount,
        category: plantMeta?.category || 'indoor',
        quantity
      };
      nextItems = [...items, newItem];
    }

    // Immediate optimistic UI update
    setItems(nextItems);
    setTotalAmount(calcTotal(nextItems));
    toast.success('Added to cart!');

    // Background API sync
    try {
      const res = await apiFetch<{ message?: string; items: CartItem[]; totalAmount: number }>('/api/cart/add', {
        method: 'POST',
        body: JSON.stringify({ plantId, quantity })
      });

      if (res.ok && res.data) {
        setItems(res.data.items || []);
        setTotalAmount(res.data.totalAmount || 0);
      } else {
        console.error('[Add To Cart Error]', res.error);
        toast.error(res.error || 'Failed to add item to cart');
        setItems(prevItems);
        setTotalAmount(prevTotal);
      }
    } catch (err) {
      console.error('[Add To Cart Exception]', err);
      toast.error('Network error adding to cart');
      setItems(prevItems);
      setTotalAmount(prevTotal);
    }
  };

  const updateQuantity = async (plantId: string, quantity: number) => {
    const prevItems = [...items];
    const prevTotal = totalAmount;

    let nextItems: CartItem[];
    if (quantity <= 0) {
      nextItems = items.filter((i) => i.plantId !== plantId);
    } else {
      nextItems = items.map((i) => (i.plantId === plantId ? { ...i, quantity } : i));
    }

    // Immediate optimistic UI update
    setItems(nextItems);
    setTotalAmount(calcTotal(nextItems));

    // Background API sync
    try {
      const res = await apiFetch<{ items: CartItem[]; totalAmount: number }>('/api/cart/update', {
        method: 'PUT',
        body: JSON.stringify({ plantId, quantity })
      });
      if (res.ok && res.data) {
        setItems(res.data.items || []);
        setTotalAmount(res.data.totalAmount || 0);
      } else {
        console.error('[Update Quantity Error]', res.error);
        toast.error(res.error || 'Failed to update quantity');
        setItems(prevItems);
        setTotalAmount(prevTotal);
      }
    } catch (err) {
      toast.error('Failed to update item quantity');
      setItems(prevItems);
      setTotalAmount(prevTotal);
    }
  };

  const removeFromCart = async (plantId: string) => {
    const prevItems = [...items];
    const prevTotal = totalAmount;

    const nextItems = items.filter((i) => i.plantId !== plantId);

    // Immediate optimistic UI update
    setItems(nextItems);
    setTotalAmount(calcTotal(nextItems));
    toast.info('Item removed from cart');

    // Background API sync
    try {
      const res = await apiFetch<{ items: CartItem[]; totalAmount: number }>(`/api/cart/remove/${plantId}`, {
        method: 'DELETE'
      });
      if (res.ok && res.data) {
        setItems(res.data.items || []);
        setTotalAmount(res.data.totalAmount || 0);
      } else {
        console.error('[Remove From Cart Error]', res.error);
        toast.error(res.error || 'Failed to remove item');
        setItems(prevItems);
        setTotalAmount(prevTotal);
      }
    } catch (err) {
      toast.error('Failed to remove item');
      setItems(prevItems);
      setTotalAmount(prevTotal);
    }
  };

  const clearCart = async () => {
    const prevItems = [...items];
    const prevTotal = totalAmount;

    // Immediate optimistic UI update
    setItems([]);
    setTotalAmount(0);

    try {
      const res = await apiFetch('/api/cart/clear', {
        method: 'DELETE'
      });
      if (!res.ok) {
        setItems(prevItems);
        setTotalAmount(prevTotal);
      }
    } catch (err) {
      console.error('Failed to clear cart', err);
      setItems(prevItems);
      setTotalAmount(prevTotal);
    }
  };

  const checkout = async (
    data: CheckoutData | string,
    customerEmail?: string,
    shippingAddress?: string
  ): Promise<{ success: boolean; orderId?: string }> => {
    setIsCheckingOut(true);
    try {
      let payload: CheckoutData;
      if (typeof data === 'string') {
        payload = {
          customerName: data,
          customerEmail: customerEmail || '',
          shippingAddress: shippingAddress || ''
        };
      } else {
        payload = data;
      }

      const res = await apiFetch<{ orderId: string; message: string }>('/api/orders/checkout', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (!res.ok || !res.data) {
        console.error('[Checkout Error Details]', res.error);
        toast.error(res.error || 'Checkout failed');
        setIsCheckingOut(false);
        return { success: false };
      }

      toast.success(res.data.message || 'Order placed successfully!');
      setItems([]);
      setTotalAmount(0);
      setIsCheckingOut(false);
      return { success: true, orderId: res.data.orderId };
    } catch (err) {
      console.error('[Checkout Exception]', err);
      toast.error('Network error during checkout');
      setIsCheckingOut(false);
      return { success: false };
    }
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        totalAmount,
        itemCount,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        checkout,
        isCheckingOut
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
