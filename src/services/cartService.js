/**
 * Cart Service
 * Handles cart operations with localStorage for guest users
 * and API calls for authenticated users
 */
class CartService {
  // Key for localStorage
  STORAGE_KEY = 'shopping-cart';

  // Event listeners for cart updates
  eventListeners = [];

  // Register a callback for cart updates
  onCartUpdate(callback) {
    this.eventListeners.push(callback);
    return () => {
      // Return unsubscribe function
      this.eventListeners = this.eventListeners.filter(cb => cb !== callback);
    };
  }

  // Notify all listeners of cart update
  notifyCartUpdated() {
    this.eventListeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in cart update listener:', error);
      }
    });
  }

  // Get cart from localStorage
  getLocalCart() {
    const cartJson = localStorage.getItem(this.STORAGE_KEY);
    return cartJson ? JSON.parse(cartJson) : { items: [] };
  }

  // Save cart to localStorage
  saveLocalCart(cart) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cart));
    // Notify listeners when cart is updated
    this.notifyCartUpdated();
  }

  // Clear localStorage cart
  clearLocalCart() {
    localStorage.removeItem(this.STORAGE_KEY);
    // Notify listeners when cart is cleared
    this.notifyCartUpdated();
  }

  // Get cart (from API if authenticated, localStorage if guest)
  async getCart(isLoggedIn) {
    if (isLoggedIn) {
      try {
        const response = await fetch('/api/cart', {
          credentials: 'include'
        });

        if (!response.ok) throw new Error('Failed to fetch cart');
        return await response.json();
      } catch (error) {
        console.error('Error fetching cart:', error);
        return this.getLocalCart(); // Fallback to local cart
      }
    } else {
      return this.getLocalCart();
    }
  }

  // Add item to cart
  async addItem(item, isLoggedIn) {
    if (isLoggedIn) {
      try {
        const response = await fetch('/api/cart/items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            productId: item.productId,
            quantity: item.quantity,
            attributes: item.attributes
          })
        });

        if (!response.ok) throw new Error('Failed to add item to cart');
        const updatedCart = await response.json();
        // Notify listeners when cart is updated via API
        this.notifyCartUpdated();
        return updatedCart;
      } catch (error) {
        console.error('Error adding item to cart:', error);

        // Fallback to local storage if API fails
        const cart = this.getLocalCart();
        this.addToLocalCart(cart, item);
        return cart;
      }
    } else {
      // Guest user - use localStorage
      const cart = this.getLocalCart();
      this.addToLocalCart(cart, item);
      return cart;
    }
  }

  // Helper to add item to local cart
  addToLocalCart(cart, newItem) {
    // Find if item with same product ID and attributes exists
    const existingItemIndex = cart.items.findIndex(item =>
      item.productId === newItem.productId &&
      JSON.stringify(item.attributes || {}) === JSON.stringify(newItem.attributes || {})
    );

    if (existingItemIndex > -1) {
      // Add the new quantity to existing quantity
      cart.items[existingItemIndex].quantity += newItem.quantity;
    } else {
      // Add new item
      cart.items.push({ ...newItem });
    }

    this.saveLocalCart(cart);
    return cart;
  }

  // Update item quantity
  async updateItemQuantity(productId, quantity, attributes, isLoggedIn) {
    if (isLoggedIn) {
      try {
        const response = await fetch(`/api/cart/items/${productId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            quantity,
            attributes
          })
        });

        if (!response.ok) throw new Error('Failed to update item quantity');
        const updatedCart = await response.json();
        // Notify listeners when cart is updated via API
        this.notifyCartUpdated();
        return updatedCart;
      } catch (error) {
        console.error('Error updating item quantity:', error);

        // Fallback to local storage
        const cart = this.getLocalCart();
        this.updateLocalItemQuantity(cart, productId, quantity, attributes);
        return cart;
      }
    } else {
      // Guest user - use localStorage
      const cart = this.getLocalCart();
      this.updateLocalItemQuantity(cart, productId, quantity, attributes);
      return cart;
    }
  }

  // Helper to update item quantity in local cart
  updateLocalItemQuantity(cart, productId, quantity, attributes) {
    const itemIndex = cart.items.findIndex(item =>
      item.productId === productId &&
      JSON.stringify(item.attributes || {}) === JSON.stringify(attributes || {})
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = quantity;
      this.saveLocalCart(cart);
    }

    return cart;
  }

  // Remove item from cart
  async removeItem(productId, attributes, isLoggedIn) {
    if (isLoggedIn) {
      try {
        const response = await fetch(`/api/cart/items/${productId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ attributes })
        });

        if (!response.ok) throw new Error('Failed to remove item from cart');
        const updatedCart = await response.json();
        // Notify listeners when cart is updated via API
        this.notifyCartUpdated();
        return updatedCart;
      } catch (error) {
        console.error('Error removing item from cart:', error);

        // Fallback to local storage
        const cart = this.getLocalCart();
        this.removeLocalItem(cart, productId, attributes);
        return cart;
      }
    } else {
      // Guest user - use localStorage
      const cart = this.getLocalCart();
      this.removeLocalItem(cart, productId, attributes);
      return cart;
    }
  }

  // Helper to remove item from local cart
  removeLocalItem(cart, productId, attributes) {
    cart.items = cart.items.filter(item =>
      !(item.productId === productId &&
        JSON.stringify(item.attributes || {}) === JSON.stringify(attributes || {}))
    );

    this.saveLocalCart(cart);
    return cart;
  }

  // Clear cart
  async clearCart(isLoggedIn) {
    if (isLoggedIn) {
      try {
        const response = await fetch('/api/cart', {
          method: 'DELETE',
          credentials: 'include'
        });

        if (!response.ok) throw new Error('Failed to clear cart');

        // Also clear local cart
        this.clearLocalCart();
        // Notify listeners when cart is cleared via API
        this.notifyCartUpdated();
        return { items: [] };
      } catch (error) {
        console.error('Error clearing cart:', error);
        return { items: [] };
      }
    } else {
      // Guest user - just clear localStorage
      this.clearLocalCart();
      return { items: [] };
    }
  }

  // Merge local cart with server cart after login
  async mergeCartsAfterLogin() {
    try {
      // Get local cart
      const localCart = this.getLocalCart();

      // If no items, no need to merge
      if (!localCart.items || localCart.items.length === 0) {
        console.log('No local items to merge');
        return { items: [] };
      }

      console.log(`Attempting to merge ${localCart.items.length} local items with server cart`);

      // IMPORTANT: Ensure we're using POST method, not GET
      const response = await fetch('/api/cart/merge', {
        method: 'POST',  // Make sure this is POST
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          items: localCart.items
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Merge cart error:', response.status, errorData.message || response.statusText);
        throw new Error(`Failed to merge carts: ${response.status} ${errorData.message || response.statusText}`);
      }

      // Clear local cart after successful merge
      console.log('Cart merge successful, clearing local cart');
      this.clearLocalCart();
      const mergedCart = await response.json();
      // Notify listeners when cart is updated via merging
      this.notifyCartUpdated();
      return mergedCart;
    } catch (error) {
      console.error('Error merging carts:', error);
      return null;
    }
  }

  // Get cart item count
  async getCartItemCount(isLoggedIn) {
    const cart = await this.getCart(isLoggedIn);
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  }

  // Calculate cart total
  calculateTotal(cart) {
    return cart.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  }
}

// Create singleton instance
const cartService = new CartService();
export default cartService;
