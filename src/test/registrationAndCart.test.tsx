import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CartProvider, useCart } from '@/context/CartContext';
import AuthModal from '@/components/AuthModal';
import CartDrawer from '@/components/CartDrawer';

// Helper component to toggle auth modal and cart drawer
const TestApp = () => {
  const { setIsAuthModalOpen, user, logout } = useAuth();
  const { setIsCartOpen, addToCart, items } = useCart();

  return (
    <div>
      <button onClick={() => setIsAuthModalOpen(true)}>Open Auth Modal</button>
      <button onClick={() => setIsCartOpen(true)}>Open Cart Drawer</button>
      <button onClick={() => addToCart('1', 1)}>Add Plant 1</button>
      <button onClick={logout}>Log Out</button>
      <div data-testid="user-info">{user ? user.name : 'Guest'}</div>
      <div data-testid="cart-count">{items.length}</div>
      <AuthModal />
      <CartDrawer />
    </div>
  );
};

describe('Registration and Cart Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should render AuthModal and allow switching to register mode', async () => {
    render(
      <AuthProvider>
        <CartProvider>
          <TestApp />
        </CartProvider>
      </AuthProvider>
    );

    // Open Auth Modal
    fireEvent.click(screen.getByText('Open Auth Modal'));
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();

    // Switch to Register mode
    fireEvent.click(screen.getByText('Sign Up'));
    expect(screen.getByText('Join Grow Green')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Jane Doe')).toBeInTheDocument();
  });
});
