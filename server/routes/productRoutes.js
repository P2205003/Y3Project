import express from 'express';
import Product from '../models/Product.js';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all enabled products (public)
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({ enabled: true });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search products (public)
router.get('/search', async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice } = req.query;

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

    const products = await Product.find(query);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all products including disabled ones (admin only)
router.get('/admin', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
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
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-')   // Replace multiple - with single -
    .replace(/^-+/, '')       // Trim - from start of text
    .replace(/-+$/, '');      // Trim - from end of text
};

// Update the POST route handler (admin only)
router.post('/', isAuthenticated, isAdmin, validateProduct, async (req, res) => {
  try {
    let slug = slugify(req.body.name);
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
      enabled: true
    });

    const newProduct = await product.save();
    res.status(201).json(newProduct);

  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      res.status(400).json({ message: `${field} must be unique` });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// Get a product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
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
