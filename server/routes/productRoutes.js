// server/routes/productRoutes.js
import express from 'express';
import Product from '../models/Product.js';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// --- Specific Routes FIRST ---

// Get all enabled products (public) - NOW WITH PAGINATION
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const query = { enabled: true };

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
    console.error("Error fetching paginated products:", error);
    res.status(500).json({ message: error.message });
  }
});

// Search products (public) - MODIFIED FOR SORTING AND PRICE
router.get('/search', async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, sort, page = 1, limit = 12 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build search query
    const query = { enabled: true };

    // Text search
    if (q) {
      const searchRegex = { $regex: q, $options: 'i' };
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { productNumber: searchRegex }
      ];
    }

    // Category filter
    if (category) {
      query.category = { $regex: `^${category}$`, $options: 'i' };
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined && !isNaN(Number(minPrice))) {
        query.price.$gte = Number(minPrice);
      }
      if (maxPrice !== undefined && !isNaN(Number(maxPrice)) && Number(maxPrice) >= 0) {
        if (query.price.$gte === undefined || Number(maxPrice) >= query.price.$gte) {
          query.price.$lte = Number(maxPrice);
        } else {
          console.warn(`Invalid price range: maxPrice (${maxPrice}) < minPrice (${query.price.$gte}). Ignoring maxPrice.`);
        }
      }
       if (Object.keys(query.price).length === 0) {
         delete query.price;
       }
    }

    // Sorting logic
    let sortOption = { createdAt: -1 }; // Default sort (newest)
    switch (sort) {
      case 'price-asc': sortOption = { price: 1 }; break;
      case 'price-desc': sortOption = { price: -1 }; break;
      case 'name-asc': sortOption = { name: 1 }; break;
      case 'name-desc': sortOption = { name: -1 }; break;
      case 'newest': sortOption = { createdAt: -1 }; break;
      case 'featured': sortOption = { createdAt: -1 }; break; // Fallback if 'featured' field doesn't exist
      default: sortOption = { createdAt: -1 };
    }

    console.log("Backend search query:", JSON.stringify(query));
    console.log("Backend sort option:", sortOption);

    const totalProducts = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      products,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalProducts / parseInt(limit)),
      totalProducts,
    });
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({ message: error.message || "Error during product search" });
  }
});

// Get all products including disabled ones (admin only)
router.get('/admin', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const query = {};

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

// ** NEW ROUTE: Get unique categories (MOVED UP) **
router.get('/categories', async (req, res) => {
  try {
    // Fetch distinct non-empty category values from enabled products
    const categories = await Product.distinct('category', { enabled: true, category: { $ne: null, $ne: "" } });
    // Sort alphabetically
    categories.sort((a, b) => a.localeCompare(b));
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Failed to fetch categories" }); // Keep 500 for server errors
  }
});


// --- Dynamic Routes LAST ---

// Add validation middleware (remains the same)
const validateProduct = (req, res, next) => {
  const { name, price } = req.body;
  if (!name || !price) return res.status(400).json({ message: 'Name and price are required' });
  if (isNaN(price) || price <= 0) return res.status(400).json({ message: 'Invalid price value' });
  next();
};

// Slugify function (remains the same)
const slugify = (text) => {
  if (!text) return '';
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-').replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-').replace(/^-+/, '').replace(/-+$/, '');
};

// Add NEW product (admin only) - POST should generally be before dynamic GETs too
router.post('/', isAuthenticated, isAdmin, validateProduct, async (req, res) => {
  try {
    let slug = slugify(req.body.name);
    if (!slug) slug = `product-${Date.now()}`;
    let counter = 1;
    const baseSlug = slug;

    while (true) {
      const existingProduct = await Product.findOne({ slug });
      if (!existingProduct) break;
      slug = `${baseSlug}-${++counter}`;
    }

    const productNumber = await Product.generateProductNumber();
    const product = new Product({
      productNumber,
      name: req.body.name,
      price: req.body.price,
      description: req.body.description,
      category: req.body.category,
      images: req.body.images || [],
      slug,
      attributes: req.body.attributes || {},
      enabled: req.body.enabled !== undefined ? req.body.enabled : true
    });

    const newProduct = await product.save();
    res.status(201).json(newProduct);

  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      res.status(400).json({ message: `${field} must be unique` });
    } else {
      console.error("Error creating product:", error);
      res.status(400).json({ message: error.message || 'Error creating product' });
    }
  }
});

// Get a product by ID (dynamic parameter) - ** NOW AFTER SPECIFIC GETs **
router.get('/:id', async (req, res) => {
  try {
    // Check if the ID is potentially a valid ObjectId *before* querying
    // This helps prevent the "categories" string from causing an ObjectId error later
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
       return res.status(404).json({ message: 'Product not found (invalid ID format)' });
       // Or maybe 400, but 404 is often better if it doesn't look like an ID
       // return res.status(400).json({ message: 'Invalid product ID format' });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    // Optionally check if product is enabled for public view
    // if (!product.enabled && !await checkAdminStatus(req)) { // Hypothetical admin check
    //   return res.status(404).json({ message: 'Product not found' });
    // }

    res.json(product);
  } catch (error) {
    // Catch other potential errors (e.g., database connection issues)
    console.error(`Error fetching product by ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error fetching product' });
  }
});


// Update a product (admin only)
router.put('/:id', isAuthenticated, isAdmin, validateProduct, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
       return res.status(400).json({ message: 'Invalid product ID format' });
    }

    let updateData = { ...req.body };
    if (req.body.name) {
      // Consider slug update logic here if needed (can be complex)
      // For now, assuming slug is not updated automatically on name change via PUT
      // updateData.slug = slugify(req.body.name);
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
       console.error(`Error updating product ${req.params.id}:`, error);
      res.status(400).json({ message: error.message || 'Error updating product' });
    }
  }
});

// Update product status (enable/disable) (admin only)
router.patch('/:id/status', isAuthenticated, isAdmin, async (req, res) => {
  try {
     if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
       return res.status(400).json({ message: 'Invalid product ID format' });
    }
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
    console.error(`Error updating product status ${req.params.id}:`, error);
    res.status(400).json({ message: error.message });
  }
});

// Delete a product (admin only)
router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
     if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
       return res.status(400).json({ message: 'Invalid product ID format' });
    }
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ message: 'Product deleted successfully', deletedProduct: product });
  } catch (error) {
    console.error(`Error deleting product ${req.params.id}:`, error);
    res.status(500).json({ message: error.message });
  }
});

// Need to import mongoose to use mongoose.Types.ObjectId
import mongoose from 'mongoose';

export default router;
