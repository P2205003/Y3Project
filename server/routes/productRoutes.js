// server/routes/productRoutes.js
import express from 'express';
import Product from '../models/Product.js';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all enabled products (public) - NOW WITH PAGINATION
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 12; // Default limit (e.g., 12 products per page)
    const skip = (page - 1) * limit;

    // TODO: Add filtering/sorting logic here based on other query params (q, category, sort) later

    const query = { enabled: true }; // Only fetch enabled products

    // Get total count for pagination calculation
    const totalProducts = await Product.countDocuments(query);

    // Fetch paginated products
    const products = await Product.find(query)
      .sort({ createdAt: -1 }) // Example sort (newest first), make dynamic later
      .skip(skip)
      .limit(limit);

    res.json({
      products,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      totalProducts,
    });
  } catch (error) {
    console.error("Error fetching paginated products:", error); // Add logging
    res.status(500).json({ message: error.message });
  }
});

// Search products (public)
router.get('/search', async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, page = 1, limit = 12 } = req.query; // Added page/limit
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build search query
    const query = { enabled: true };

    // Text search (case-insensitive)
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) {
        query.price.$gte = Number(minPrice);
      }
      if (maxPrice !== undefined) {
        query.price.$lte = Number(maxPrice);
      }
    }

    const totalProducts = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort({ createdAt: -1 }) // Example sort
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      products,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalProducts / parseInt(limit)),
      totalProducts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all products including disabled ones (admin only)
router.get('/admin', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15; // Admin might want more per page
    const skip = (page - 1) * limit;

    const query = {}; // No 'enabled' filter for admin

    const totalProducts = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      products,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      totalProducts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Add validation middleware
const validateProduct = (req, res, next) => {
  const { name, price } = req.body;

  if (!name || !price) {
    return res.status(400).json({ message: 'Name and price are required' });
  }

  if (isNaN(price) || price <= 0) {
    return res.status(400).json({ message: 'Invalid price value' });
  }

  next();
};

// Add slugify function
const slugify = (text) => {
  if (!text) return ''; // Handle empty input
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-')   // Replace multiple - with single -
    .replace(/^-+/, '')       // Trim - from start of text
    .replace(/-+$/, '');      // Trim - from end of text
};

// Update the POST route handler (admin only)
router.post('/', isAuthenticated, isAdmin, validateProduct, async (req, res) => {
  try {
    let slug = slugify(req.body.name);
    if (!slug) { // Generate slug from timestamp if name is empty or results in empty slug
      slug = `product-${Date.now()}`;
    }
    let counter = 1;
    const baseSlug = slug;

    // Check for existing slugs and find available variation
    while (true) {
      const existingProduct = await Product.findOne({ slug });
      if (!existingProduct) break;
      slug = `${baseSlug}-${++counter}`;
    }

    // Generate product number
    const productNumber = await Product.generateProductNumber();

    // Create product with guaranteed unique slug
    const product = new Product({
      productNumber,
      name: req.body.name,
      price: req.body.price,
      description: req.body.description,
      category: req.body.category,
      images: req.body.images || [],
      slug,  // Now guaranteed unique
      attributes: req.body.attributes || {},
      enabled: req.body.enabled !== undefined ? req.body.enabled : true // Respect passed 'enabled' or default to true
    });

    const newProduct = await product.save();
    res.status(201).json(newProduct);

  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      res.status(400).json({ message: `${field} must be unique` });
    } else {
      console.error("Error creating product:", error); // Log the detailed error
      res.status(400).json({ message: error.message || 'Error creating product' });
    }
  }
});

// Get a product by ID (no pagination needed)
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.enabled) { // Also check if enabled for public view
      // Allow admin to see disabled products?
      // const userIsAdmin = await checkAdminStatus(req); // Hypothetical function
      // if (!product && !userIsAdmin) { ... }
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }
    res.status(500).json({ message: error.message });
  }
});

// Update a product (admin only)
router.put('/:id', isAuthenticated, isAdmin, validateProduct, async (req, res) => {
  try {
    // Check if updating name, then update slug too
    let updateData = { ...req.body };
    if (req.body.name) {
      updateData.slug = slugify(req.body.name);
      // Need to add logic here to check for slug uniqueness on update if the name changes
      // This can be complex, might need a pre-update hook or manual check
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      res.status(400).json({ message: `${field} must be unique` });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// Update product status (enable/disable) (admin only)
router.patch('/:id/status', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ message: 'Enabled status must be a boolean' });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { enabled },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a product (admin only)
router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ message: 'Product deleted successfully', deletedProduct: product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
