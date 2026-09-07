import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CartProvider, useCart } from '@/context/CartContext';
import { WishlistProvider, useWishlist } from '@/context/WishlistContext';

const IntegrationTestApp = () => {
  const { user } = useAuth();
  const { items, addToCart, checkout } = useCart();
  const { wishlistCount, toggleWishlist, isInWishlist } = useWishlist();

  const dummyPlant = {
    id: 'plant_test_1',
    name: 'Test Monstera',
    image: '/test.jpg',
    category: 'indoor',
    price: 29.99,
    description: 'Test plant',
    growTime: '1 year',
    specialty: 'Air purifying'
  };

  return (
    <div>
      <button onClick={() => addToCart('plant_test_1', 2)}>Add Plant</button>
      <button onClick={() => toggleWishlist(dummyPlant)}>Toggle Wishlist</button>
      <button
        onClick={() =>
          checkout({
            customerName: 'Alice Green',
            customerEmail: 'alice@example.com',
            shippingAddress: '123 Garden St',
            city: 'Leafville',
            state: 'CA',
            pincode: '90001',
            paymentMethod: 'UPI'
          })
        }
      >
        Run Checkout
      </button>

      <div data-testid="wishlist-count">{wishlistCount}</div>
      <div data-testid="is-in-wishlist">{isInWishlist('plant_test_1') ? 'YES' : 'NO'}</div>
      <div data-testid="cart-items-count">{items.length}</div>
    </div>
  );
};

describe('Checkout and Wishlist Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should toggle wishlist state and count', async () => {
    render(
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
            <IntegrationTestApp />
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    );

    expect(screen.getByTestId('wishlist-count')).toHaveTextContent('0');
    expect(screen.getByTestId('is-in-wishlist')).toHaveTextContent('NO');

    fireEvent.click(screen.getByText('Toggle Wishlist'));

    await waitFor(() => {
      expect(screen.getByTestId('wishlist-count')).toHaveTextContent('1');
      expect(screen.getByTestId('is-in-wishlist')).toHaveTextContent('YES');
    });
  });
});
