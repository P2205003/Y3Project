// src/services/cartService.js
// No direct use of useI18n here, relies on passed locale or localStorage fallback

class CartService {
  STORAGE_KEY = 'shopping-cart';
  eventListeners = [];

  onCartUpdate(callback) {
    this.eventListeners.push(callback);
    return () => {
      this.eventListeners = this.eventListeners.filter(cb => cb !== callback);
    };
  }

  notifyCartUpdated() {
    this.eventListeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in cart update listener:', error);
      }
    });
  }

  getLocalCart() {
    try {
      const cartJson = localStorage.getItem(this.STORAGE_KEY);
      const cart = cartJson ? JSON.parse(cartJson) : { items: [] };
      // Ensure items is always an array
      if (!Array.isArray(cart.items)) {
        cart.items = [];
      }
      return cart;
    } catch (e) {
      console.error("Error reading local cart:", e);
      return { items: [] }; // Return empty on error
    }
  }

  saveLocalCart(cart) {
    try {
      // Ensure items is an array before saving
      const cartToSave = { ...cart, items: Array.isArray(cart.items) ? cart.items : [] };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cartToSave));
      this.notifyCartUpdated();
    } catch (e) {
      console.error("Error saving local cart:", e);
    }
  }

  clearLocalCart() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.notifyCartUpdated();
  }

  // Get cart (Sends Accept-Language Header)
  async getCart(isLoggedIn) {
    // Use localStorage as primary source for locale preference
    const currentLocale = localStorage.getItem('user-locale') || navigator.language.split('-')[0] || 'en';
    console.log("CartService getCart using locale:", currentLocale);

    if (isLoggedIn) {
      try {
        const response = await fetch('/api/cart', {
          credentials: 'include',
          headers: {
            'Accept-Language': currentLocale // Send current locale preference
          }
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status} - Failed to fetch server cart`);
        }
        return await response.json();
      } catch (error) {
        console.error('Error fetching server cart:', error);
        // Don't fallback to local cart here, as it might be out of sync
        // Return an empty cart structure on error
        return { items: [], totalAmount: 0 };
      }
    } else {
      // Guest cart is always the local snapshot
      return this.getLocalCart();
    }
  }

  // Add item to cart (Sends minimal data to backend)
  async addItem(item, isLoggedIn) { // item contains full details from UI emit
    if (isLoggedIn) {
      try {
        const response = await fetch('/api/cart/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          // Send the full item details received from App.vue
          body: JSON.stringify(item) // <--- FIX: Send the whole 'item' object
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status} - Failed to add item`);
        }
        const updatedCart = await response.json(); // Backend returns translated cart
        // No need to call notifyCartUpdated here, backend response implies update
        return updatedCart; // Return the fresh, translated cart state
      } catch (error) {
        console.error('Error adding item to server cart:', error);
        // Fallback: Add full details to local storage (snapshot)
        const cart = this.getLocalCart();
        this.addToLocalCart(cart, item); // Uses full item details locally
        return cart; // Return the updated local cart
      }
    } else {
      // Guest user: Add full details to local storage (snapshot)
      const cart = this.getLocalCart();
      this.addToLocalCart(cart, item);
      return cart;
    }
  }

  // Helper to add item to local cart (stores snapshot)
  addToLocalCart(cart, newItem) {
    if (!newItem || !newItem.productId) {
      console.warn("Attempted to add invalid item to local cart:", newItem);
      return cart;
    }
    const existingItemIndex = cart.items.findIndex(item =>
      item.productId === newItem.productId &&
      JSON.stringify(item.attributes || {}) === JSON.stringify(newItem.attributes || {})
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += newItem.quantity;
    } else {
      // Store the full item details available at time of adding
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
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ quantity, attributes })
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status} - Failed to update quantity`);
        }
        const updatedCart = await response.json(); // Backend returns translated cart
        // No need to notify, backend response implies update
        return updatedCart;
      } catch (error) {
        console.error('Error updating item quantity on server:', error);
        // Fallback: Update local cart quantity
        const cart = this.getLocalCart();
        this.updateLocalItemQuantity(cart, productId, quantity, attributes);
        return cart;
      }
    } else {
      const cart = this.getLocalCart();
      this.updateLocalItemQuantity(cart, productId, quantity, attributes);
      return cart;
    }
  }

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
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ attributes }) // Send attributes in body
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status} - Failed to remove item`);
        }
        const updatedCart = await response.json(); // Backend returns translated cart
        // No need to notify, backend response implies update
        return updatedCart;
      } catch (error) {
        console.error('Error removing item from server cart:', error);
        // Fallback: Remove from local cart
        const cart = this.getLocalCart();
        this.removeLocalItem(cart, productId, attributes);
        return cart;
      }
    } else {
      const cart = this.getLocalCart();
      this.removeLocalItem(cart, productId, attributes);
      return cart;
    }
  }

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
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status} - Failed to clear server cart`);
        }
        this.clearLocalCart(); // Also clear local just in case
        this.notifyCartUpdated(); // Notify UI
        return { items: [], totalAmount: 0 }; // Return empty structure
      } catch (error) {
        console.error('Error clearing cart:', error);
        return { items: [], totalAmount: 0 }; // Return empty on error
      }
    } else {
      this.clearLocalCart();
      return { items: [], totalAmount: 0 };
    }
  }

  // Merge local cart with server cart after login
  async mergeCartsAfterLogin() {
    try {
      const localCart = this.getLocalCart();
      if (!localCart.items || localCart.items.length === 0) {
        console.log('No local items to merge');
        // Fetch initial server cart state (will be translated)
        return await this.getCart(true);
      }

      console.log(`Attempting to merge ${localCart.items.length} local items`);
      // Send minimal data needed for merge identification
      const itemsToMerge = localCart.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        attributes: item.attributes || {}
      }));

      const response = await fetch('/api/cart/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ items: itemsToMerge })
      });

      if (!response.ok) { /* ... error handling ... */ }

      console.log('Cart merge successful, clearing local cart');
      this.clearLocalCart();
      const mergedCart = await response.json(); // Backend returns translated cart
      this.notifyCartUpdated(); // Notify UI of the final state
      return mergedCart;
    } catch (error) { /* ... error handling including fallback fetch ... */ }
  }

  // Get cart item count
  async getCartItemCount(isLoggedIn) {
    // Fetch the latest cart data to get accurate count
    const cart = await this.getCart(isLoggedIn);
    return cart.items.reduce((total, item) => total + (item.quantity || 0), 0);
  }

  // Calculate cart total (uses prices fetched dynamically)
  calculateTotal(cart) {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((total, item) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 0;
      return total + (price * quantity);
    }, 0);
  }
}

const cartService = new CartService();
export default cartService;
