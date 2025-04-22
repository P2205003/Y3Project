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
    // Use setTimeout to ensure notifications happen after the current execution context
    // This can help prevent race conditions or issues with immediate re-renders
    setTimeout(() => {
      console.log("CartService: Notifying listeners..."); // Add log
      this.eventListeners.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('Error in cart update listener:', error);
        }
      });
    }, 0);
  }

  // Get cart from localStorage
  getLocalCart() {
    const cartJson = localStorage.getItem(this.STORAGE_KEY);
    try {
      return cartJson ? JSON.parse(cartJson) : { items: [] };
    } catch (e) {
      console.error("Error parsing local cart data:", e);
      localStorage.removeItem(this.STORAGE_KEY); // Clear corrupted data
      return { items: [] };
    }
  }

  // Save cart to localStorage
  saveLocalCart(cart) {
    // Ensure cart structure is valid before saving
    const cartToSave = {
      items: Array.isArray(cart?.items) ? cart.items : []
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cartToSave));
    console.log("CartService: Local cart saved, notifying listeners."); // Add log
    // Notify listeners when cart is updated
    this.notifyCartUpdated();
  }

  // Clear localStorage cart
  clearLocalCart() {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log("CartService: Local cart cleared, notifying listeners."); // Add log
    this.notifyCartUpdated(); // Make sure this is called
  }

  // Get cart (from API if authenticated, localStorage if guest)
  async getCart(isLoggedIn) {
    console.log(`CartService: getCart called (isLoggedIn: ${isLoggedIn})`); // Add log
    if (isLoggedIn) {
      try {
        const response = await fetch('/api/cart', {
          credentials: 'include'
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to fetch cart:', response.status, errorText);
          throw new Error(`Failed to fetch cart (Status: ${response.status})`);
        }
        const cartData = await response.json();
        console.log("CartService: Fetched server cart:", cartData); // Log fetched data
        return cartData;
      } catch (error) {
        console.error('Error fetching server cart:', error);
        // Optionally return an empty cart instead of local cart on API error
        // return { items: [] };
        // Current behavior: Fallback to local cart
        console.warn('CartService: Falling back to local cart due to API error.');
        return this.getLocalCart();
      }
    } else {
      const localCart = this.getLocalCart();
      console.log("CartService: Returning local cart:", localCart); // Log local cart
      return localCart;
    }
  }

  // Add item to cart
  async addItem(item, isLoggedIn) {
    console.log(`CartService: addItem called (isLoggedIn: ${isLoggedIn})`, item); // Add log
    if (isLoggedIn) {
      try {
        // --- MODIFICATION START ---
        // Send productId, quantity, attributes AND name, price, image
        const response = await fetch('/api/cart/items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            productId: item.productId,
            quantity: item.quantity,
            attributes: item.attributes,
            name: item.name,       // <-- ADDED: Send the name seen by the user
            // price: item.price,     // <-- REMOVED: Backend will use authoritative price
            // image: item.image      // <-- REMOVED: Backend will use authoritative image
          })
        });
        // --- MODIFICATION END ---

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `HTTP error! Status: ${response.status}` })); // Try to parse error
          console.error('API Error adding item:', response.status, errorData.message);
          throw new Error(errorData.message || `Failed to add item (Status: ${response.status})`);
        }

        const updatedCart = await response.json();
        console.log("CartService: Item added via API, updated cart:", updatedCart); // Log updated cart
        this.notifyCartUpdated(); // Notify after successful API call
        return updatedCart;
      } catch (error) {
        console.error('Error adding item to cart via API:', error);
        // Fallback might be confusing if API fails, consider just throwing error
        // throw error; // Option 1: Re-throw the error
        // Current behavior: Fallback to local storage
        console.warn('CartService: Falling back to local cart update due to API error.');
        const cart = this.getLocalCart();
        return this.addToLocalCart(cart, item); // Return the result of addToLocalCart
      }
    } else {
      // Guest user - use localStorage
      console.log("CartService: Adding item to local cart.");
      const cart = this.getLocalCart();
      return this.addToLocalCart(cart, item); // Return the result of addToLocalCart
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
      cart.items[existingItemIndex].quantity = (cart.items[existingItemIndex].quantity || 0) + (newItem.quantity || 1);
      console.log(`CartService Local: Updated quantity for ${newItem.name}`);
    } else {
      // Add new item with all necessary fields
      // Ensure quantity is at least 1
      const quantityToAdd = Math.max(1, newItem.quantity || 1);
      cart.items.push({
        productId: newItem.productId,
        quantity: quantityToAdd,
        attributes: newItem.attributes || {},
        name: newItem.name,     // Store name locally
        price: newItem.price,   // Store price locally
        image: newItem.image    // Store image locally
      });
      console.log(`CartService Local: Added new item ${newItem.name}`);
    }

    this.saveLocalCart(cart); // saveLocalCart now notifies
    return cart; // Return the modified cart object
  }

  // Update item quantity
  async updateItemQuantity(productId, quantity, attributes, isLoggedIn) {
    console.log(`CartService: updateItemQuantity called (isLoggedIn: ${isLoggedIn})`, { productId, quantity, attributes }); // Add log
    // Ensure quantity is valid before proceeding
    const validQuantity = Math.max(1, parseInt(quantity) || 1);

    if (isLoggedIn) {
      try {
        const response = await fetch(`/api/cart/items/${productId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            quantity: validQuantity, // Use validated quantity
            attributes
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `HTTP error! Status: ${response.status}` }));
          console.error('API Error updating quantity:', response.status, errorData.message);
          throw new Error(errorData.message || `Failed to update quantity (Status: ${response.status})`);
        }
        const updatedCart = await response.json();
        console.log("CartService: Quantity updated via API, updated cart:", updatedCart);
        this.notifyCartUpdated(); // Notify after successful API call
        return updatedCart;
      } catch (error) {
        console.error('Error updating item quantity via API:', error);
        // Fallback to local storage
        console.warn('CartService: Falling back to local cart update due to API error.');
        const cart = this.getLocalCart();
        return this.updateLocalItemQuantity(cart, productId, validQuantity, attributes); // Use validated quantity
      }
    } else {
      // Guest user - use localStorage
      console.log("CartService: Updating quantity in local cart.");
      const cart = this.getLocalCart();
      return this.updateLocalItemQuantity(cart, productId, validQuantity, attributes); // Use validated quantity
    }
  }

  // Helper to update item quantity in local cart
  updateLocalItemQuantity(cart, productId, quantity, attributes) {
    const itemIndex = cart.items.findIndex(item =>
      item.productId === productId &&
      JSON.stringify(item.attributes || {}) === JSON.stringify(attributes || {})
    );

    if (itemIndex > -1) {
      const validQuantity = Math.max(1, parseInt(quantity) || 1); // Ensure quantity is at least 1
      cart.items[itemIndex].quantity = validQuantity;
      console.log(`CartService Local: Set quantity to ${validQuantity} for ${cart.items[itemIndex].name}`);
      this.saveLocalCart(cart); // saveLocalCart now notifies
    } else {
      console.warn(`CartService Local: Item not found for quantity update`, { productId, attributes });
    }

    return cart; // Return the modified cart object
  }

  // Remove item from cart
  async removeItem(productId, attributes, isLoggedIn) {
    console.log(`CartService: removeItem called (isLoggedIn: ${isLoggedIn})`, { productId, attributes }); // Add log
    if (isLoggedIn) {
      try {
        const response = await fetch(`/api/cart/items/${productId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json' // Required to send body
          },
          credentials: 'include',
          body: JSON.stringify({ attributes }) // Send attributes in body for DELETE
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `HTTP error! Status: ${response.status}` }));
          console.error('API Error removing item:', response.status, errorData.message);
          throw new Error(errorData.message || `Failed to remove item (Status: ${response.status})`);
        }
        const updatedCart = await response.json();
        console.log("CartService: Item removed via API, updated cart:", updatedCart);
        this.notifyCartUpdated(); // Notify after successful API call
        return updatedCart;
      } catch (error) {
        console.error('Error removing item from cart via API:', error);
        // Fallback to local storage
        console.warn('CartService: Falling back to local cart removal due to API error.');
        const cart = this.getLocalCart();
        return this.removeLocalItem(cart, productId, attributes);
      }
    } else {
      // Guest user - use localStorage
      console.log("CartService: Removing item from local cart.");
      const cart = this.getLocalCart();
      return this.removeLocalItem(cart, productId, attributes);
    }
  }

  // Helper to remove item from local cart
  removeLocalItem(cart, productId, attributes) {
    const initialLength = cart.items.length;
    cart.items = cart.items.filter(item =>
      !(item.productId === productId &&
        JSON.stringify(item.attributes || {}) === JSON.stringify(attributes || {}))
    );

    if (cart.items.length < initialLength) {
      console.log(`CartService Local: Removed item`, { productId, attributes });
      this.saveLocalCart(cart); // saveLocalCart now notifies
    } else {
      console.warn(`CartService Local: Item not found for removal`, { productId, attributes });
    }

    return cart; // Return the modified cart object
  }

  // Clear cart
  async clearCart(isLoggedIn) {
    console.log(`CartService: clearCart called (isLoggedIn: ${isLoggedIn})`); // Add log
    if (isLoggedIn) {
      try {
        const response = await fetch('/api/cart', {
          method: 'DELETE',
          credentials: 'include'
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `HTTP error! Status: ${response.status}` }));
          console.error('API Error clearing cart:', response.status, errorData.message);
          throw new Error(errorData.message || `Failed to clear server cart (Status: ${response.status})`);
        }
        console.log("CartService: Server cart cleared successfully.");
        // Also clear local cart for consistency, though it shouldn't be used if logged in
        this.clearLocalCart(); // This will notify
        return { items: [] }; // Return empty cart structure
      } catch (error) {
        console.error('Error clearing server cart:', error);
        // Don't clear local cart if server failed, maybe? Or clear anyway?
        // Let's clear local anyway to avoid potential merge issues later.
        this.clearLocalCart();
        return { items: [] }; // Return empty cart structure on error too
      }
    } else {
      // Guest user - just clear localStorage
      console.log("CartService: Clearing local cart.");
      this.clearLocalCart(); // This will notify
      return { items: [] }; // Return empty cart structure
    }
  }

  // Merge local cart with server cart after login
  async mergeCartsAfterLogin() {
    console.log('CartService: mergeCartsAfterLogin called'); // Add log
    try {
      const localCart = this.getLocalCart();
      if (!localCart.items || localCart.items.length === 0) {
        console.log('CartService: No local items to merge.');
        // Fetch the server cart to ensure the app state is up-to-date
        return await this.getCart(true);
      }

      console.log(`CartService: Attempting to merge ${localCart.items.length} local items.`);
      // --- MODIFICATION: Send full local items array ---
      const response = await fetch('/api/cart/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ items: localCart.items }) // Send full local items including name/price/image
      });
      // --- END MODIFICATION ---

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('CartService: Merge cart API error:', response.status, errorData.message || response.statusText);
        throw new Error(`Failed to merge carts: ${response.status} ${errorData.message || response.statusText}`);
      }

      // Clear local cart ONLY after successful merge API call.
      console.log('CartService: Merge API successful, clearing local cart.');
      // Clear local cart *before* notifying to avoid potential flicker with old local data
      localStorage.removeItem(this.STORAGE_KEY);

      const mergedCart = await response.json();
      console.log('CartService: Merge successful, returning merged cart data from API:', mergedCart);

      // Notify listeners AFTER local cart is cleared and we have the merged data
      this.notifyCartUpdated(); // Notify that cart state has fundamentally changed

      return mergedCart; // Return the final merged cart state from the server

    } catch (error) {
      console.error('CartService: Error in mergeCartsAfterLogin:', error);
      // Don't clear local cart if merge failed!
      // Re-throw the error so the calling function (App.vue) can handle it
      throw error;
    }
  }

  // Get cart item count (Simplified - relies on external caller having cart data)
  // This can be removed if App.vue calculates it directly from cartData.value
  /*
  async getCartItemCount(isLoggedIn) {
    const cart = await this.getCart(isLoggedIn);
    return cart.items.reduce((total, item) => total + (item.quantity || 0), 0);
  }
  */

  // Calculate cart total (Simplified - relies on external caller having cart data)
  // This can be removed if App.vue calculates it directly from cartData.value
  /*
  calculateTotal(cart) {
    if (!cart || !Array.isArray(cart.items)) return 0;
    return cart.items.reduce((total, item) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 0;
      return total + (price * quantity);
    }, 0);
  }
  */
}

// Create singleton instance
const cartService = new CartService();
export default cartService;
