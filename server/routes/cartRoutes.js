// server/routes/cartRoutes.js - FIXED VERSION
import express from 'express';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { isAuthenticated } from '../middleware/auth.js';
import { applyTranslations, getPreferredLanguage } from '../utils/languageHelper.js';

const router = express.Router();

// --- Helper function to get translated cart ---
async function getTranslatedCart(userId, lang) {
  try {
    // Fetch the basic cart containing only IDs, quantity, attributes
    const basicCart = await Cart.findOne({ userId }).lean();

    if (!basicCart || !basicCart.items || basicCart.items.length === 0) {
      return {
        _id: basicCart?._id,
        userId: userId,
        items: [],
        createdAt: basicCart?.createdAt || new Date(),
        updatedAt: basicCart?.updatedAt || new Date(),
        totalAmount: 0
      };
    }

    // Get all unique product IDs from the cart
    const productIds = basicCart.items.map(item => item.productId);

    // Fetch all needed products in one go, including translations and base attributes
    const products = await Product.find({
      _id: { $in: productIds }
    }).select('name description price images slug category averageRating reviewCount translations attributes')
      .lean();

    // Create a map for quick product lookup
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    // Build the fully populated and translated cart items
    let calculatedTotalAmount = 0;
    const populatedItems = basicCart.items.map(cartItem => {
      const productDetails = productMap.get(cartItem.productId.toString());
      if (!productDetails) {
        console.warn(`Product ${cartItem.productId} not found for cart item.`);
        return null; // Skip items if product was deleted
      }

      // Apply translation logic to the fetched product details
      const translatedProduct = applyTranslations(productDetails, lang);

      // Ensure the attributes stored in the cart (cartItem.attributes) are considered
      const finalAttributes = translatedProduct.attributes;

      // Calculate subtotal for this item using the product's current price
      const itemSubtotal = (productDetails.price || 0) * cartItem.quantity;
      calculatedTotalAmount += itemSubtotal;

      // Return the combined item structure for the response
      return {
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        name: translatedProduct.name,
        price: productDetails.price,
        image: translatedProduct.image,
        attributes: finalAttributes,
        subtotal: itemSubtotal
      };
    }).filter(item => item !== null);

    // Construct the final response object
    return {
      _id: basicCart._id,
      userId: basicCart.userId,
      items: populatedItems,
      createdAt: basicCart.createdAt,
      updatedAt: basicCart.updatedAt,
      totalAmount: calculatedTotalAmount
    };
  } catch (error) {
    console.error('Error in getTranslatedCart helper:', error);
    throw error; // Re-throw to be handled by route handler
  }
}

// --- Test Route ---
router.get('/test', (req, res) => {
  res.json({ message: 'Cart API is working!' });
});

// --- Get User's Cart (Dynamically Translated) ---
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const lang = getPreferredLanguage(req);
    
    const finalCart = await getTranslatedCart(userId, lang);
    res.json(finalCart);
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch cart' });
  }
});

// --- Add Item to Cart (Stores Minimal Data) ---
router.post('/items', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { productId, quantity, attributes } = req.body;

    // Basic Validation
    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({ message: 'Missing or invalid product ID or quantity' });
    }
    // Validate attributes format if necessary
    if (attributes && typeof attributes !== 'object') {
      return res.status(400).json({ message: 'Invalid attributes format. Must be an object.' });
    }

    // Find or create user's cart
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Verify Product Exists
    const productExists = await Product.findById(productId).select('_id');
    if (!productExists) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if product with the exact same attributes is already in cart
    const existingItemIndex = cart.items.findIndex(item =>
      item.productId.toString() === productId &&
      JSON.stringify(item.attributes || {}) === JSON.stringify(attributes || {})
    );

    // Define a reasonable upper limit for item quantity
    const MAX_QUANTITY = 99;

    if (existingItemIndex > -1) {
      // Add to existing item quantity with upper limit check
      const newQuantity = cart.items[existingItemIndex].quantity + parseInt(quantity);
      cart.items[existingItemIndex].quantity = Math.min(newQuantity, MAX_QUANTITY);
    } else {
      // Add MINIMAL item data to cart
      cart.items.push({
        productId,
        quantity: Math.min(parseInt(quantity), MAX_QUANTITY),
        attributes: attributes || {}
      });
    }

    await cart.save();

    // Get translated cart after save (using helper function)
    const lang = getPreferredLanguage(req);
    const translatedCart = await getTranslatedCart(userId, lang);
    
    res.status(201).json(translatedCart);
  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({ message: error.message || 'Server error adding item to cart' });
  }
});

// --- Update Cart Item Quantity ---
router.put('/items/:productId', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { productId } = req.params;
    const { quantity, attributes } = req.body;

    // Define a reasonable upper limit for item quantity
    const MAX_QUANTITY = 99;

    if (!quantity || quantity < 1 || quantity > MAX_QUANTITY) {
      return res.status(400).json({ message: `Quantity must be between 1 and ${MAX_QUANTITY}` });
    }
    if (attributes && typeof attributes !== 'object') {
      return res.status(400).json({ message: 'Invalid attributes format.' });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(item =>
      item.productId.toString() === productId &&
      JSON.stringify(item.attributes || {}) === JSON.stringify(attributes || {})
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    cart.items[itemIndex].quantity = parseInt(quantity);
    await cart.save();

    // Get translated cart after save (using helper function)
    const lang = getPreferredLanguage(req);
    const translatedCart = await getTranslatedCart(userId, lang);
    
    res.json(translatedCart);
  } catch (error) {
    console.error('Error updating item quantity:', error);
    res.status(500).json({ message: error.message || 'Server error updating quantity' });
  }
});

// --- Remove Item from Cart ---
router.delete('/items/:productId', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { productId } = req.params;
    const { attributes } = req.body; // Get attributes from body

    if (attributes && typeof attributes !== 'object') {
      return res.status(400).json({ message: 'Invalid attributes format.' });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter(item =>
      !(item.productId.toString() === productId &&
        JSON.stringify(item.attributes || {}) === JSON.stringify(attributes || {}))
    );

    if (cart.items.length === initialLength) {
      return res.status(404).json({ message: 'Item with specified attributes not found in cart' });
    }

    await cart.save();

    // Get translated cart after save (using helper function)
    const lang = getPreferredLanguage(req);
    const translatedCart = await getTranslatedCart(userId, lang);
    
    res.json(translatedCart);
  } catch (error) {
    console.error('Error removing item from cart:', error);
    res.status(500).json({ message: error.message || 'Server error removing item' });
  }
});

// --- Clear Cart ---
router.delete('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    await Cart.updateOne({ userId }, { $set: { items: [] } }); // More efficient way to clear
    res.json({ message: 'Cart cleared successfully', items: [], totalAmount: 0 });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ message: error.message || 'Server error clearing cart' });
  }
});

// --- Merge Guest Cart ---
router.post('/merge', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { items } = req.body; // Expect array of local storage items (minimal data needed)

    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'Items must be an array' });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Use a Set to track products that need verification to avoid redundant DB calls
    const productsToVerify = new Set(items.map(item => item.productId).filter(Boolean));
    if (productsToVerify.size > 0) {
      const existingProducts = await Product.find({ _id: { $in: Array.from(productsToVerify) } }).select('_id');
      const existingProductIds = new Set(existingProducts.map(p => p._id.toString()));
      productsToVerify.forEach(id => {
        if (!existingProductIds.has(id.toString())) {
          console.warn(`Product ID ${id} from guest cart not found in DB during merge.`);
          productsToVerify.delete(id); // Remove non-existent products
        }
      });
    }

    // Define a reasonable upper limit for item quantity
    const MAX_QUANTITY = 99;

    for (const guestItem of items) {
      // Skip if product ID is missing or product doesn't exist
      if (!guestItem.productId || !productsToVerify.has(guestItem.productId.toString())) {
        console.log(`Skipping merge for item with product ID: ${guestItem.productId}`);
        continue;
      }

      const attributes = guestItem.attributes || {};
      const quantity = parseInt(guestItem.quantity || 1);

      const existingItemIndex = cart.items.findIndex(item =>
        item.productId.toString() === guestItem.productId.toString() &&
        JSON.stringify(item.attributes || {}) === JSON.stringify(attributes)
      );

      if (existingItemIndex > -1) {
        // Add to existing with upper limit check
        const newQuantity = cart.items[existingItemIndex].quantity + quantity;
        cart.items[existingItemIndex].quantity = Math.min(newQuantity, MAX_QUANTITY);
      } else {
        cart.items.push({
          productId: guestItem.productId,
          quantity: Math.min(quantity, MAX_QUANTITY),
          attributes: attributes
        });
      }
    }

    await cart.save();
    console.log('Local cart merged into server cart.');

    // Get translated cart after save (using helper function)
    const lang = getPreferredLanguage(req);
    const translatedCart = await getTranslatedCart(userId, lang);
    
    res.json(translatedCart);
  } catch (error) {
    console.error('Error merging carts:', error);
    res.status(500).json({ message: error.message || 'Server error during cart merge' });
  }
});

export default router;
