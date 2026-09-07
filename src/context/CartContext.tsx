import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { apiFetch } from '@/lib/api';

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
    try {
      const res = await apiFetch<{ message?: string; items: CartItem[]; totalAmount: number }>('/api/cart/add', {
        method: 'POST',
        body: JSON.stringify({ plantId, quantity })
      });

      if (res.ok && res.data) {
        toast.success('Added to cart!');
        setItems(res.data.items || []);
        setTotalAmount(res.data.totalAmount || 0);
      } else {
        console.error('[Add To Cart Error]', res.error);
        toast.error(res.error || 'Failed to add item to cart');
      }
    } catch (err) {
      console.error('[Add To Cart Exception]', err);
      toast.error('Network error adding to cart');
    }
  };

  const updateQuantity = async (plantId: string, quantity: number) => {
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
      }
    } catch (err) {
      toast.error('Failed to update item quantity');
    }
  };

  const removeFromCart = async (plantId: string) => {
    try {
      const res = await apiFetch<{ items: CartItem[]; totalAmount: number }>(`/api/cart/remove/${plantId}`, {
        method: 'DELETE'
      });
      if (res.ok && res.data) {
        toast.info('Item removed from cart');
        setItems(res.data.items || []);
        setTotalAmount(res.data.totalAmount || 0);
      } else {
        console.error('[Remove From Cart Error]', res.error);
        toast.error(res.error || 'Failed to remove item');
      }
    } catch (err) {
      toast.error('Failed to remove item');
    }
  };

  const clearCart = async () => {
    try {
      const res = await apiFetch('/api/cart/clear', {
        method: 'DELETE'
      });
      if (res.ok) {
        setItems([]);
        setTotalAmount(0);
      }
    } catch (err) {
      console.error('Failed to clear cart', err);
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
