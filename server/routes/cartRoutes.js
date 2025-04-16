// server/routes/cartRoutes.js
import express from 'express';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js'; // Still needed for validation & fetching details
import { isAuthenticated } from '../middleware/auth.js';
// *** Import helpers from the utility file ***
import { applyTranslations, getPreferredLanguage } from '../utils/languageHelper.js';

const router = express.Router();

// --- Test Route ---
router.get('/test', (req, res) => {
  res.json({ message: 'Cart API is working!' });
});

// --- Get User's Cart (Dynamically Translated) ---
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const lang = getPreferredLanguage(req); // Get preferred language

    // Fetch the basic cart containing only IDs, quantity, attributes
    const basicCart = await Cart.findOne({ userId }).lean(); // Use lean

    if (!basicCart || !basicCart.items || basicCart.items.length === 0) {
      return res.json({
        _id: basicCart?._id,
        userId: userId,
        items: [],
        createdAt: basicCart?.createdAt || new Date(),
        updatedAt: basicCart?.updatedAt || new Date(),
        totalAmount: 0
      });
    }

    // Get all unique product IDs from the cart
    const productIds = basicCart.items.map(item => item.productId);

    // Fetch all needed products in one go, including translations and base attributes
    const products = await Product.find({
      _id: { $in: productIds }
    }).select('name description price images slug category averageRating reviewCount translations attributes')
      .lean(); // Fetch needed fields + translations + base attributes

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
      // Pass the original (base) attributes from the product model for translation context
      const translatedProduct = applyTranslations(productDetails, lang);

      // Ensure the attributes stored in the cart (cartItem.attributes) are considered
      // for the final display if needed, but primary translation comes from applyTranslations
      // For simplicity here, we rely on applyTranslations handling the attributes correctly
      const finalAttributes = translatedProduct.attributes; // Use the translated attributes

      // Calculate subtotal for this item using the product's current price
      const itemSubtotal = (productDetails.price || 0) * cartItem.quantity; // Use base price for calculation consistency
      calculatedTotalAmount += itemSubtotal;

      // Return the combined item structure for the response
      return {
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        name: translatedProduct.name, // Use translated name
        price: productDetails.price, // Use base price from product DB
        image: translatedProduct.image, // Use image from translated (usually same as base)
        attributes: finalAttributes, // Use the translated attributes map
        subtotal: itemSubtotal // Optional: Add subtotal
      };
    }).filter(item => item !== null); // Filter out items whose product wasn't found

    // Construct the final response object
    const finalCart = {
      _id: basicCart._id,
      userId: basicCart.userId,
      items: populatedItems,
      createdAt: basicCart.createdAt,
      updatedAt: basicCart.updatedAt,
      totalAmount: calculatedTotalAmount // Include calculated total
    };

    res.json(finalCart);

  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch cart' });
  }
});

// --- Add Item to Cart (Stores Minimal Data) ---
router.post('/items', isAuthenticated, async (req, res, next) => { // Added next for potential reuse
  try {
    const userId = req.session.userId;
    // *** Only get essential data from request ***
    const { productId, quantity, attributes } = req.body;

    // Basic Validation
    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({ message: 'Missing or invalid product ID or quantity' });
    }
    // Validate attributes format if necessary (e.g., ensure it's an object)
    if (attributes && typeof attributes !== 'object') {
      return res.status(400).json({ message: 'Invalid attributes format. Must be an object.' });
    }


    // Find or create user's cart
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // *** Verify Product Exists ***
    const productExists = await Product.findById(productId).select('_id');
    if (!productExists) {
      return res.status(404).json({ message: 'Product not found' });
    }
    // *** End Verification ***

    // Check if product with the exact same attributes is already in cart
    const existingItemIndex = cart.items.findIndex(item =>
      item.productId.toString() === productId &&
      JSON.stringify(item.attributes || {}) === JSON.stringify(attributes || {}) // Compare attributes too
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += parseInt(quantity);
    } else {
      // *** Add MINIMAL item data to cart ***
      cart.items.push({
        productId,
        quantity: parseInt(quantity),
        attributes: attributes || {} // Store base attributes received
      });
    }

    await cart.save();

    // *** Fetch and return the fully translated cart ***
    // Re-use the GET '/' logic by calling its handler
    // We need to ensure the handler has access to req, res, next
    return router.get('/', isAuthenticated, async (innerReq, innerRes) => {
      // The actual GET handler logic is called here
      // Need to make sure the response status is correct (201)
      try {
        const userId = innerReq.session.userId;
        const lang = getPreferredLanguage(innerReq);

        const basicCart = await Cart.findOne({ userId }).lean();

        if (!basicCart || !basicCart.items || basicCart.items.length === 0) {
          return innerRes.status(201).json({ /* ... empty cart structure ... */ });
        }

        const productIds = basicCart.items.map(item => item.productId);
        const products = await Product.find({ _id: { $in: productIds } })
          .select('name description price images slug category averageRating reviewCount translations attributes')
          .lean();
        const productMap = new Map(products.map(p => [p._id.toString(), p]));

        let calculatedTotalAmount = 0;
        const populatedItems = basicCart.items.map(cartItem => {
          const productDetails = productMap.get(cartItem.productId.toString());
          if (!productDetails) return null;
          const translatedProduct = applyTranslations(productDetails, lang);
          const itemSubtotal = (productDetails.price || 0) * cartItem.quantity;
          calculatedTotalAmount += itemSubtotal;
          return {
            productId: cartItem.productId,
            quantity: cartItem.quantity,
            name: translatedProduct.name,
            price: productDetails.price,
            image: translatedProduct.image,
            attributes: translatedProduct.attributes,
            subtotal: itemSubtotal
          };
        }).filter(item => item !== null);

        const finalCart = {
          _id: basicCart._id,
          userId: basicCart.userId,
          items: populatedItems,
          createdAt: basicCart.createdAt,
          updatedAt: basicCart.updatedAt,
          totalAmount: calculatedTotalAmount
        };

        innerRes.status(201).json(finalCart); // Set status to 201 for item added

      } catch (getCartError) {
        console.error("Error fetching translated cart after add:", getCartError);
        // Fallback: return the saved cart (minimal data) if fetching translated fails
        innerRes.status(201).json(cart.toObject()); // Convert Mongoose doc to plain object
      }
    })(req, res, next); // Pass the original request/response objects

  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({ message: error.message || 'Server error adding item to cart' });
  }
});

// --- Update Cart Item Quantity ---
router.put('/items/:productId', isAuthenticated, async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const { productId } = req.params;
    const { quantity, attributes } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
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

    // Fetch and return the fully translated cart
    return router.get('/', isAuthenticated, async (innerReq, innerRes) => {
      try {
        // (Same GET logic as above)
        const userId = innerReq.session.userId;
        const lang = getPreferredLanguage(innerReq);
        const basicCart = await Cart.findOne({ userId }).lean();
        // ... (rest of the GET logic to fetch products and translate) ...
        if (!basicCart || !basicCart.items || basicCart.items.length === 0) {
          return innerRes.json({ /* ... empty cart ... */ });
        }
        const productIds = basicCart.items.map(item => item.productId);
        const products = await Product.find({ _id: { $in: productIds } })
          .select('name description price images slug category averageRating reviewCount translations attributes')
          .lean();
        const productMap = new Map(products.map(p => [p._id.toString(), p]));
        let calculatedTotalAmount = 0;
        const populatedItems = basicCart.items.map(cartItem => {
          const productDetails = productMap.get(cartItem.productId.toString());
          if (!productDetails) return null;
          const translatedProduct = applyTranslations(productDetails, lang);
          const itemSubtotal = (productDetails.price || 0) * cartItem.quantity;
          calculatedTotalAmount += itemSubtotal;
          return {
            productId: cartItem.productId,
            quantity: cartItem.quantity,
            name: translatedProduct.name,
            price: productDetails.price,
            image: translatedProduct.image,
            attributes: translatedProduct.attributes,
            subtotal: itemSubtotal
          };
        }).filter(item => item !== null);
        const finalCart = {
          _id: basicCart._id,
          userId: basicCart.userId,
          items: populatedItems,
          createdAt: basicCart.createdAt,
          updatedAt: basicCart.updatedAt,
          totalAmount: calculatedTotalAmount
        };
        innerRes.json(finalCart); // Default 200 OK for update
      } catch (getCartError) {
        console.error("Error fetching translated cart after update:", getCartError);
        innerRes.status(500).json({ message: 'Failed to retrieve updated cart details.' });
      }
    })(req, res, next);

  } catch (error) {
    console.error('Error updating item quantity:', error);
    res.status(500).json({ message: error.message || 'Server error updating quantity' });
  }
});

// --- Remove Item from Cart ---
router.delete('/items/:productId', isAuthenticated, async (req, res, next) => {
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

    // Fetch and return the fully translated cart
    return router.get('/', isAuthenticated, async (innerReq, innerRes) => {
      try {
        // (Same GET logic as above)
        const userId = innerReq.session.userId;
        const lang = getPreferredLanguage(innerReq);
        const basicCart = await Cart.findOne({ userId }).lean();
        // ... (rest of the GET logic to fetch products and translate) ...
        if (!basicCart || !basicCart.items || basicCart.items.length === 0) {
          return innerRes.json({ /* ... empty cart ... */ });
        }
        const productIds = basicCart.items.map(item => item.productId);
        const products = await Product.find({ _id: { $in: productIds } })
          .select('name description price images slug category averageRating reviewCount translations attributes')
          .lean();
        const productMap = new Map(products.map(p => [p._id.toString(), p]));
        let calculatedTotalAmount = 0;
        const populatedItems = basicCart.items.map(cartItem => {
          const productDetails = productMap.get(cartItem.productId.toString());
          if (!productDetails) return null;
          const translatedProduct = applyTranslations(productDetails, lang);
          const itemSubtotal = (productDetails.price || 0) * cartItem.quantity;
          calculatedTotalAmount += itemSubtotal;
          return {
            productId: cartItem.productId,
            quantity: cartItem.quantity,
            name: translatedProduct.name,
            price: productDetails.price,
            image: translatedProduct.image,
            attributes: translatedProduct.attributes,
            subtotal: itemSubtotal
          };
        }).filter(item => item !== null);
        const finalCart = {
          _id: basicCart._id,
          userId: basicCart.userId,
          items: populatedItems,
          createdAt: basicCart.createdAt,
          updatedAt: basicCart.updatedAt,
          totalAmount: calculatedTotalAmount
        };
        innerRes.json(finalCart); // Default 200 OK for delete
      } catch (getCartError) {
        console.error("Error fetching translated cart after delete:", getCartError);
        innerRes.status(500).json({ message: 'Failed to retrieve updated cart details.' });
      }
    })(req, res, next);

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
    res.json({ message: 'Cart cleared successfully', items: [], totalAmount: 0 }); // Return empty structure
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ message: error.message || 'Server error clearing cart' });
  }
});

// --- Merge Guest Cart ---
router.post('/merge', isAuthenticated, async (req, res, next) => {
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
        cart.items[existingItemIndex].quantity += quantity;
      } else {
        cart.items.push({
          productId: guestItem.productId,
          quantity: quantity,
          attributes: attributes // Store base attributes
        });
      }
    }

    await cart.save();
    console.log('Local cart merged into server cart.');

    // Fetch and return the fully translated cart
    return router.get('/', isAuthenticated, async (innerReq, innerRes) => {
      try {
        // (Same GET logic as above)
        const userId = innerReq.session.userId;
        const lang = getPreferredLanguage(innerReq);
        const basicCart = await Cart.findOne({ userId }).lean();
        // ... (rest of the GET logic to fetch products and translate) ...
        if (!basicCart || !basicCart.items || basicCart.items.length === 0) {
          return innerRes.json({ /* ... empty cart ... */ });
        }
        const productIds = basicCart.items.map(item => item.productId);
        const products = await Product.find({ _id: { $in: productIds } })
          .select('name description price images slug category averageRating reviewCount translations attributes')
          .lean();
        const productMap = new Map(products.map(p => [p._id.toString(), p]));
        let calculatedTotalAmount = 0;
        const populatedItems = basicCart.items.map(cartItem => {
          const productDetails = productMap.get(cartItem.productId.toString());
          if (!productDetails) return null;
          const translatedProduct = applyTranslations(productDetails, lang);
          const itemSubtotal = (productDetails.price || 0) * cartItem.quantity;
          calculatedTotalAmount += itemSubtotal;
          return {
            productId: cartItem.productId,
            quantity: cartItem.quantity,
            name: translatedProduct.name,
            price: productDetails.price,
            image: translatedProduct.image,
            attributes: translatedProduct.attributes,
            subtotal: itemSubtotal
          };
        }).filter(item => item !== null);
        const finalCart = {
          _id: basicCart._id,
          userId: basicCart.userId,
          items: populatedItems,
          createdAt: basicCart.createdAt,
          updatedAt: basicCart.updatedAt,
          totalAmount: calculatedTotalAmount
        };
        innerRes.json(finalCart); // Default 200 OK for merge
      } catch (getCartError) {
        console.error("Error fetching translated cart after merge:", getCartError);
        innerRes.status(500).json({ message: 'Failed to retrieve updated cart details after merge.' });
      }
    })(req, res, next);

  } catch (error) {
    console.error('Error merging carts:', error);
    res.status(500).json({ message: error.message || 'Server error during cart merge' });
  }
});


export default router;
