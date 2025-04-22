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
    res.status(500).json({ message: error.message });
  }
});

// Add item to cart
router.post('/items', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { productId, quantity, attributes } = req.body;

    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({ message: 'Product ID and quantity are required' });
    }

    // Find or create user's cart
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if product is already in cart
    const existingItemIndex = cart.items.findIndex(item =>
      item.productId.toString() === productId &&
      JSON.stringify(item.attributes || {}) === JSON.stringify(attributes || {})
    );

    if (existingItemIndex > -1) {
      // Add the new quantity to existing quantity
      cart.items[existingItemIndex].quantity += parseInt(quantity);
    } else {
      // Add new item
      cart.items.push({
        productId,
        quantity: parseInt(quantity),
        name: product.name,
        price: product.price,
        image: product.images && product.images.length > 0 ? product.images[0] : '',
        attributes
      });
    }

    // Save cart
    cart.updatedAt = Date.now();
    await cart.save();

    res.status(201).json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update cart item quantity
router.put('/items/:productId', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { productId } = req.params;
    const { quantity, attributes } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Find the item
    const itemIndex = cart.items.findIndex(item =>
      item.productId.toString() === productId &&
      JSON.stringify(item.attributes || {}) === JSON.stringify(attributes || {})
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    // Update quantity
    cart.items[itemIndex].quantity = parseInt(quantity);
    cart.updatedAt = Date.now();
    await cart.save();

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove item from cart
router.delete('/items/:productId', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { productId } = req.params;
    const { attributes } = req.body;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Find and remove the item
    const initialLength = cart.items.length;
    cart.items = cart.items.filter(item =>
      !(item.productId.toString() === productId &&
        JSON.stringify(item.attributes || {}) === JSON.stringify(attributes || {}))
    );

    if (cart.items.length === initialLength) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    cart.updatedAt = Date.now();
    await cart.save();

    res.json(cart);
  } catch (error) {
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
    res.status(500).json({ message: error.message });
  }
});

// Merge guest cart with user cart after login
router.post('/merge', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    console.log(`Cart merge requested for user: ${userId}`);
    const { items } = req.body;

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
      // Validate item
      if (!guestItem.productId) {
        console.log('Skipping item without productId');
        continue;
      }

      // Verify product exists
      const product = await Product.findById(guestItem.productId);
      if (!product) {
        console.log(`Product not found: ${guestItem.productId}`);
        continue;
      }

      // Check if product is already in user's cart
      const existingItemIndex = cart.items.findIndex(item =>
        item.productId.toString() === guestItem.productId.toString() &&
        JSON.stringify(item.attributes || {}) === JSON.stringify(guestItem.attributes || {})
      );

      if (existingItemIndex > -1) {
        // Update quantity if item exists
        console.log(`Updating quantity for existing item: ${product.name}`);
        cart.items[existingItemIndex].quantity += parseInt(guestItem.quantity || 1);
      } else {
        // Add new item
        console.log(`Adding new item to cart: ${product.name}`);
        cart.items.push({
          productId: guestItem.productId,
          quantity: parseInt(guestItem.quantity || 1),
          name: product.name,
          price: product.price,
          image: product.images && product.images.length > 0 ? product.images[0] : '',
          attributes: guestItem.attributes || {}
        });
      }
    }

    // Save cart
    cart.updatedAt = Date.now();
    await cart.save();
    console.log(`Cart updated successfully. Total items: ${cart.items.length}`);

    res.json(cart);
  } catch (error) {
    console.error('Error merging carts:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
