import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

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
  checkout: (customerName: string, customerEmail: string, shippingAddress: string) => Promise<boolean>;
  isCheckingOut: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Session ID for guests
const getGuestSessionId = () => {
  let sessionId = localStorage.getItem('grow_green_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    localStorage.setItem('grow_green_session_id', sessionId);
  }
  return sessionId;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);

  const getHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-session-id': getGuestSessionId()
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }, [token]);

  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch('/api/cart', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setTotalAmount(data.totalAmount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch cart', err);
    }
  }, [getHeaders]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart, user]);

  const addToCart = async (plantId: string, quantity: number = 1) => {
    try {
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ plantId, quantity })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Added to cart!');
        await fetchCart();
      } else {
        toast.error(data.error || 'Failed to add item to cart');
      }
    } catch (err) {
      toast.error('Network error adding to cart');
    }
  };

  const updateQuantity = async (plantId: string, quantity: number) => {
    try {
      const res = await fetch('/api/cart/update', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ plantId, quantity })
      });
      if (res.ok) {
        await fetchCart();
      }
    } catch (err) {
      toast.error('Failed to update item quantity');
    }
  };

  const removeFromCart = async (plantId: string) => {
    try {
      const res = await fetch(`/api/cart/remove/${plantId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        toast.info('Item removed from cart');
        await fetchCart();
      }
    } catch (err) {
      toast.error('Failed to remove item');
    }
  };

  const clearCart = async () => {
    try {
      const res = await fetch('/api/cart/clear', {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setItems([]);
        setTotalAmount(0);
      }
    } catch (err) {
      console.error('Failed to clear cart');
    }
  };

  const checkout = async (customerName: string, customerEmail: string, shippingAddress: string): Promise<boolean> => {
    setIsCheckingOut(true);
    try {
      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ customerName, customerEmail, shippingAddress })
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Checkout failed');
        setIsCheckingOut(false);
        return false;
      }

      toast.success(data.message || 'Order placed successfully!');
      setItems([]);
      setTotalAmount(0);
      setIsCartOpen(false);
      setIsCheckingOut(false);
      return true;
    } catch (err) {
      toast.error('Network error during checkout');
      setIsCheckingOut(false);
      return false;
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
