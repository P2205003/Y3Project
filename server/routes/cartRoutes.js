// server/routes/cartRoutes.js
import express from 'express';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

router.get('/test', (req, res) => {
  res.json({ message: 'Cart API is working!' });
});

// Get user's cart
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      // Create empty cart if none exists
      cart = new Cart({
        userId,
        items: []
      });
      await cart.save();
    }

    res.json(cart);
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add item to cart
router.post('/items', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    // --- MODIFICATION: Destructure name, price, image from body ---
    const { productId, quantity, attributes, name } = req.body; // Removed price, image from here initially, will use DB values

    // Basic validation: check required fields from frontend
    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({ message: 'Product ID and quantity (>= 1) are required' });
    }
    // Add validation for the name sent from frontend
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ message: 'Product name is required' });
    }
    // --- END MODIFICATION ---

    // Find or create user's cart
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // --- MODIFICATION: Get product details for validation and authoritative price/image ---
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    // Optionally check if the product is enabled
    if (!product.enabled) {
      return res.status(400).json({ message: 'Product is currently unavailable' });
    }
    // --- END MODIFICATION ---

    // Check if product with the same attributes is already in cart
    const existingItemIndex = cart.items.findIndex(item =>
      item.productId.toString() === productId &&
      JSON.stringify(item.attributes || {}) === JSON.stringify(attributes || {}) // Compare attributes
    );

    if (existingItemIndex > -1) {
      // Add the new quantity to existing quantity
      cart.items[existingItemIndex].quantity += parseInt(quantity);
    } else {
      // Add new item
      // --- MODIFICATION: Use name from req.body, but PRICE and IMAGE from the fetched product ---
      cart.items.push({
        productId,
        quantity: parseInt(quantity),
        name: name.trim(), // Use the name sent from the frontend (already translated)
        price: product.price, // Use the authoritative price from the database
        image: product.images && product.images.length > 0 ? product.images[0] : '', // Use authoritative image
        attributes // Store selected attributes
      });
      // --- END MODIFICATION ---
    }

    // Save cart
    cart.updatedAt = Date.now();
    await cart.save();

    res.status(201).json(cart);
  } catch (error) {
    console.error("Error adding item to cart:", error); // Enhanced logging
    res.status(500).json({ message: error.message || 'Server error adding item to cart' });
  }
});

// Update cart item quantity
router.put('/items/:productId', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { productId } = req.params;
    const { quantity, attributes } = req.body; // Attributes are needed to find the correct item

    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Find the item using productId AND attributes
    const itemIndex = cart.items.findIndex(item =>
      item.productId.toString() === productId &&
      JSON.stringify(item.attributes || {}) === JSON.stringify(attributes || {})
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item with specified attributes not found in cart' });
    }

    // Update quantity
    cart.items[itemIndex].quantity = parseInt(quantity);
    cart.updatedAt = Date.now();
    await cart.save();

    res.json(cart);
  } catch (error) {
    console.error('Error updating cart item quantity:', error);
    res.status(500).json({ message: error.message });
  }
});

// Remove item from cart
router.delete('/items/:productId', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { productId } = req.params;
    // --- MODIFICATION: Expect attributes in the request body to identify the correct item ---
    const { attributes } = req.body;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Find and remove the item using productId AND attributes
    const initialLength = cart.items.length;
    cart.items = cart.items.filter(item =>
      !(item.productId.toString() === productId &&
        JSON.stringify(item.attributes || {}) === JSON.stringify(attributes || {}))
    );
    // --- END MODIFICATION ---

    if (cart.items.length === initialLength) {
      return res.status(404).json({ message: 'Item with specified attributes not found in cart' });
    }

    cart.updatedAt = Date.now();
    await cart.save();

    res.json(cart);
  } catch (error) {
    console.error('Error removing item from cart:', error);
    res.status(500).json({ message: error.message });
  }
});

// Clear cart
router.delete('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = [];
    cart.updatedAt = Date.now();
    await cart.save();

    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ message: error.message });
  }
});

// Merge guest cart with user cart after login
router.post('/merge', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    console.log(`Cart merge requested for user: ${userId}`);
    // --- MODIFICATION: Expect full items array including name, price, image from localStorage ---
    const { items } = req.body; // These items come from the guest's localStorage

    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'Items must be an array' });
    }

    console.log(`Attempting to merge ${items.length} items into user cart`);

    // Find or create user's cart
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      console.log('Creating new cart for user');
      cart = new Cart({ userId, items: [] });
    }

    // Process each guest cart item
    for (const guestItem of items) {
      // Validate item essentials
      if (!guestItem.productId || !guestItem.name || guestItem.price === undefined || guestItem.price === null) {
        console.log('Skipping invalid guest item:', guestItem);
        continue;
      }

      // --- MODIFICATION: Verify product exists, but prioritize guest item's details ---
      const product = await Product.findById(guestItem.productId);
      if (!product) {
        console.log(`Product not found during merge, skipping item: ${guestItem.productId}`);
        continue; // Skip if product doesn't exist anymore
      }
      // --- END MODIFICATION ---

      // Check if product with the same attributes is already in user's cart
      const existingItemIndex = cart.items.findIndex(item =>
        item.productId.toString() === guestItem.productId.toString() &&
        JSON.stringify(item.attributes || {}) === JSON.stringify(guestItem.attributes || {})
      );

      if (existingItemIndex > -1) {
        // Update quantity if item exists
        console.log(`Updating quantity for existing item in merge: ${cart.items[existingItemIndex].name}`);
        cart.items[existingItemIndex].quantity += parseInt(guestItem.quantity || 1);
      } else {
        // Add new item using guest details primarily
        // --- MODIFICATION: Use details from the GUEST item when adding NEW ---
        console.log(`Adding new item from guest cart: ${guestItem.name}`);
        cart.items.push({
          productId: guestItem.productId,
          quantity: parseInt(guestItem.quantity || 1),
          name: guestItem.name, // Use guest name (captured in specific language)
          price: guestItem.price, // Use guest price (captured at time of add) - backend order creation should re-verify price
          image: guestItem.image || (product.images && product.images.length > 0 ? product.images[0] : ''), // Use guest image, fallback to current product image
          attributes: guestItem.attributes || {}
        });
        // --- END MODIFICATION ---
      }
    }

    // Save cart
    cart.updatedAt = Date.now();
    await cart.save();
    console.log(`Cart merged successfully. Total items: ${cart.items.length}`);

    res.json(cart);
  } catch (error) {
    console.error('Error merging carts:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
