// server/routes/productRoutes.js
import express from 'express';
import Product from '../models/Product.js';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';
import mongoose from 'mongoose'; // Make sure mongoose is imported

const router = express.Router();

// --- GET / (List enabled products with pagination) ---
// MODIFIED: Include rating info
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
      .limit(limit)
      // Select fields, including new rating fields
      .select('name price images slug category averageRating reviewCount'); // <-- ADDED rating fields

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

// --- GET /search ---
// MODIFIED: Include rating info
router.get('/search', async (req, res) => {
  try {
    // ... (keep existing query building logic for q, category, price) ...
    const { q, category, minPrice, maxPrice, sort, page = 1, limit = 12 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = { enabled: true };
    if (q) { /* ... text search logic ... */
        const searchRegex = { $regex: q, $options: 'i' };
        query.$or = [
            { name: searchRegex }, { description: searchRegex },
            { category: searchRegex }, { productNumber: searchRegex }
        ];
    }
    if (category) { /* ... category filter logic ... */
        query.category = { $regex: `^${category}$`, $options: 'i' };
    }
    if (minPrice !== undefined || maxPrice !== undefined) { /* ... price filter logic ... */
        query.price = {};
        if (minPrice !== undefined && !isNaN(Number(minPrice))) query.price.$gte = Number(minPrice);
        if (maxPrice !== undefined && !isNaN(Number(maxPrice)) && Number(maxPrice) >= 0) {
            if (query.price.$gte === undefined || Number(maxPrice) >= query.price.$gte) query.price.$lte = Number(maxPrice);
        }
        if (Object.keys(query.price).length === 0) delete query.price;
    }

    // Sorting logic (Add sorting by rating)
    let sortOption = { createdAt: -1 };
    switch (sort) {
      case 'price-asc': sortOption = { price: 1 }; break;
      case 'price-desc': sortOption = { price: -1 }; break;
      case 'name-asc': sortOption = { name: 1 }; break;
      case 'name-desc': sortOption = { name: -1 }; break;
      case 'newest': sortOption = { createdAt: -1 }; break;
      // --- NEW SORT OPTION ---
      case 'rating': sortOption = { averageRating: -1, reviewCount: -1 }; break; // Sort by rating (desc), then review count (desc)
      // --- END NEW SORT OPTION ---
      case 'featured': // fall through
      default: sortOption = { createdAt: -1 };
    }

    console.log("Backend search query:", JSON.stringify(query));
    console.log("Backend sort option:", sortOption);

    const totalProducts = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      // Select fields, including new rating fields
      .select('name price images slug category averageRating reviewCount'); // <-- ADDED rating fields

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

// --- GET /:id (Single Product) ---
// MODIFIED: Return all rating info
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Product not found (invalid ID format)' });
    }
    // Fetch product, including all rating fields by default now
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (!product.enabled) { // Maybe check req.isAdmin here if needed later
        // return res.status(404).json({ message: 'Product not found or disabled' });
    }
    res.json(product); // Return the full product document including ratings

  } catch (error) {
    console.error(`Error fetching product by ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error fetching product' });
  }
});


// ... (Keep other routes: /admin, /categories, POST /, PUT /:id, PATCH /:id/status, DELETE /:id) ...
// --- Specific Routes FIRST ---

// Get all enabled products (public) - NOW WITH PAGINATION
// (Modified above)

// Search products (public) - MODIFIED FOR SORTING AND PRICE
// (Modified above)

// Get all products including disabled ones (admin only)
router.get('/admin', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const query = {}; // Fetch all products

    const totalProducts = await Product.countDocuments(query);
    // Include rating fields for admin view too
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('name price enabled productNumber category averageRating reviewCount createdAt'); // Added rating fields

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

// ** Get unique categories **
router.get('/categories', async (req, res) => {
  try {
    // Fetch distinct non-empty category values from enabled products
    const categories = await Product.distinct('category', { enabled: true, category: { $ne: null, $ne: "" } });
    // Sort alphabetically
    categories.sort((a, b) => a.localeCompare(b));
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
});


// --- Dynamic Routes LAST ---

// Add validation middleware
const validateProduct = (req, res, next) => {
  const { name, price } = req.body;
  if (!name || !price) return res.status(400).json({ message: 'Name and price are required' });
  if (isNaN(price) || price <= 0) return res.status(400).json({ message: 'Invalid price value' });
  next();
};

// Slugify function
const slugify = (text) => {
  if (!text) return '';
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-').replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-').replace(/^-+/, '').replace(/-+$/, '');
};

// Add NEW product (admin only)
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
      enabled: req.body.enabled !== undefined ? req.body.enabled : true,
      // Initialize review fields
      averageRating: 0,
      reviewCount: 0,
      ratingDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
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
// (Modified above)


// Update a product (admin only)
router.put('/:id', isAuthenticated, isAdmin, validateProduct, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
       return res.status(400).json({ message: 'Invalid product ID format' });
    }

    // Exclude rating fields from direct update via PUT, they are calculated
    const { averageRating, reviewCount, ratingDistribution, ...updateData } = req.body;

    if (updateData.name && !updateData.slug) {
      // Consider slug update logic if needed - careful with uniqueness
      // updateData.slug = slugify(updateData.name); // Simple example, needs uniqueness check
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData, // Use data excluding calculated fields
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
    const productId = req.params.id;
    const product = await Product.findByIdAndDelete(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // --- ADDED: Delete associated reviews ---
    try {
        const deleteResult = await Review.deleteMany({ productId: productId });
        console.log(`Deleted ${deleteResult.deletedCount} reviews associated with product ${productId}`);
    } catch (reviewError) {
        console.error(`Error deleting reviews for product ${productId}:`, reviewError);
        // Continue even if review deletion fails, product is already deleted
    }
    // --- END ADDED ---

    res.status(200).json({ message: 'Product deleted successfully', deletedProduct: product });
  } catch (error) {
    console.error(`Error deleting product ${req.params.id}:`, error);
    res.status(500).json({ message: error.message });
  }
});


export default router;
