// server/routes/productRoutes.js
import express from 'express';
import mongoose from 'mongoose'; // Make sure mongoose is imported
import Product from '../models/Product.js';
import Review from '../models/Review.js'; // Ensure Review is imported for delete route
import { isAuthenticated, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// --- Helper Functions ---

// Slugify function
const slugify = (text) => {
  if (!text) return '';
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-').replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-').replace(/^-+/, '').replace(/-+$/, '');
};

// Validation middleware
const validateProduct = (req, res, next) => {
  const { name, price } = req.body;
  if (!name || !price) return res.status(400).json({ message: 'Name and price are required' });
  if (isNaN(price) || price <= 0) return res.status(400).json({ message: 'Invalid price value' });
  next();
};


// --- Specific Routes FIRST ---

// Get all products including disabled ones (admin only) - MOVED UP
router.get('/admin', isAuthenticated, isAdmin, async (req, res) => {
  try {
    // Fetch ALL admin products. Frontend handles pagination/filtering.
    const query = {}; // Fetch all products

    const totalProducts = await Product.countDocuments(query);

    // Select all necessary fields for the admin table/modal
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .select(
        'name price enabled productNumber category averageRating reviewCount ' +
        'createdAt images description attributes' // Added fields for edit modal
      );

    res.json({
      products, // Send the full list
      // The frontend expects a 'products' array directly in the response
      // No pagination needed from backend in this simplified approach
      totalProducts, // Include total count for reference
    });
  } catch (error) {
    console.error("Error fetching admin products:", error); // Specific log
    res.status(500).json({ message: error.message || "Failed to fetch admin products" });
  }
});

// Get unique categories (for admin filters) - MOVED UP & Modified
router.get('/categories', async (req, res) => {
  try {
    // Fetch distinct non-empty category values from ALL products
    const categories = await Product.distinct('category', { category: { $ne: null, $ne: "" } });
    // Sort alphabetically
    categories.sort((a, b) => a.localeCompare(b));
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
});

// --- Public GET routes ---

// GET / (List enabled products with pagination) - Includes rating info
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
      .select('name price images slug category averageRating reviewCount'); // Select fields for public cards

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

// GET /search - Includes rating info and sorting
router.get('/search', async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, sort, page = 1, limit = 12 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = { enabled: true };

    // Text search logic
    if (q) {
      const searchRegex = { $regex: q, $options: 'i' };
      query.$or = [
        { name: searchRegex }, { description: searchRegex },
        { category: searchRegex }, { productNumber: searchRegex }
      ];
    }
    // Category filter logic
    if (category) {
      query.category = { $regex: `^${category}$`, $options: 'i' };
    }
    // Price filter logic
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined && !isNaN(Number(minPrice))) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined && !isNaN(Number(maxPrice)) && Number(maxPrice) >= 0) {
        if (query.price.$gte === undefined || Number(maxPrice) >= query.price.$gte) query.price.$lte = Number(maxPrice);
      }
      if (Object.keys(query.price).length === 0) delete query.price;
    }

    // Sorting logic
    let sortOption = { createdAt: -1 }; // Default sort
    switch (sort) {
      case 'price-asc': sortOption = { price: 1 }; break;
      case 'price-desc': sortOption = { price: -1 }; break;
      case 'name-asc': sortOption = { name: 1 }; break;
      case 'name-desc': sortOption = { name: -1 }; break;
      case 'newest': sortOption = { createdAt: -1 }; break;
      case 'rating': sortOption = { averageRating: -1, reviewCount: -1 }; break;
      case 'featured': // fall through (if 'featured' should behave like default)
      default: sortOption = { createdAt: -1 };
    }

    console.log("Backend search query:", JSON.stringify(query));
    console.log("Backend sort option:", sortOption);

    const totalProducts = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .select('name price images slug category averageRating reviewCount'); // Select fields for public cards

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


// --- Dynamic Routes LAST ---

// GET /:id (Single Product) - Includes rating info - NOW AFTER /admin and /categories
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      // If ID is not valid, check if it matches 'admin' or 'categories' just in case
      // This is a fallback, the route order should prevent this
      if (req.params.id === 'admin' || req.params.id === 'categories') {
        console.warn(`Request for /${req.params.id} caught by /:id route despite ordering.`);
        return res.status(404).json({ message: `Resource /${req.params.id} not found.` });
      }
      return res.status(400).json({ message: 'Invalid product ID format' });
    }
    // Fetch product, including all rating fields by default
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    // Allow viewing disabled products if needed, or add admin check here
    // if (!product.enabled && !req.session?.isAdmin) {
    //     return res.status(404).json({ message: 'Product not found or disabled' });
    // }
    res.json(product); // Return the full product document

  } catch (error) {
    console.error(`Error fetching product by ID ${req.params.id}:`, error);
    // Distinguish between client error (like invalid ID) and server error
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }
    res.status(500).json({ message: 'Server error fetching product' });
  }
});


// POST / (Add NEW product - admin only)
router.post('/', isAuthenticated, isAdmin, validateProduct, async (req, res) => {
  try {
    let slug = slugify(req.body.name);
    if (!slug) slug = `product-${Date.now()}`;
    let counter = 1;
    const baseSlug = slug;

    // Ensure slug uniqueness
    while (true) {
      const existingProduct = await Product.findOne({ slug });
      if (!existingProduct) break;
      slug = `${baseSlug}-${++counter}`;
    }

    const productNumber = await Product.generateProductNumber();
    const product = new Product({
      productNumber, // Auto-generated
      name: req.body.name,
      price: req.body.price,
      description: req.body.description || '', // Ensure defaults
      category: req.body.category || '',
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
    if (error.code === 11000) { // Handle MongoDB duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      res.status(400).json({ message: `Duplicate value error: ${field} must be unique.` });
    } else if (error.name === 'ValidationError') { // Handle Mongoose validation errors
      res.status(400).json({ message: 'Validation Error', errors: error.errors });
    } else {
      console.error("Error creating product:", error);
      res.status(500).json({ message: error.message || 'Error creating product' });
    }
  }
});

// PUT /:id (Update a product - admin only)
router.put('/:id', isAuthenticated, isAdmin, validateProduct, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }

    // Exclude fields that shouldn't be directly updated via PUT
    const {
      _id, // Cannot update _id
      createdAt, updatedAt, // Timestamps managed by Mongoose
      averageRating, reviewCount, ratingDistribution, // Calculated fields
      // productNumber, // Optionally prevent updating productNumber
      ...updateData // The rest of the data from the request body
    } = req.body;

    // Optional: Handle slug update if name changes (requires uniqueness check)
    // if (updateData.name && !updateData.slug) {
    //    updateData.slug = slugify(updateData.name);
    //    // Add uniqueness check here if implementing slug update
    // }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData, // Use data excluding calculated/protected fields
      { new: true, runValidators: true } // Return updated doc, run schema validators
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    if (error.code === 11000) { // Handle MongoDB duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      res.status(400).json({ message: `Duplicate value error: ${field} must be unique.` });
    } else if (error.name === 'ValidationError') { // Handle Mongoose validation errors
      res.status(400).json({ message: 'Validation Error', errors: error.errors });
    } else if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid data format for update' });
    } else {
      console.error(`Error updating product ${req.params.id}:`, error);
      res.status(500).json({ message: error.message || 'Error updating product' });
    }
  }
});

// PATCH /:id/status (Update product status - admin only)
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
      { enabled }, // Update only the 'enabled' field
      { new: true } // Return the updated document
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }
    console.error(`Error updating product status ${req.params.id}:`, error);
    res.status(500).json({ message: error.message || 'Error updating product status' });
  }
});

// DELETE /:id (Delete a product - admin only) - Includes Review Deletion
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

    // --- Delete associated reviews ---
    try {
      // Ensure Review model is available and use mongoose.Types.ObjectId
      const deleteResult = await Review.deleteMany({ productId: new mongoose.Types.ObjectId(productId) });
      console.log(`Deleted ${deleteResult.deletedCount} reviews associated with product ${productId}`);
    } catch (reviewError) {
      console.error(`Error deleting reviews for product ${productId}:`, reviewError);
      // Decide if this should be a fatal error or just logged
      // return res.status(500).json({ message: 'Product deleted, but failed to delete associated reviews.' });
    }
    // --- END Review Deletion ---

    res.status(200).json({ message: 'Product deleted successfully', deletedProductId: productId }); // Send back ID
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }
    console.error(`Error deleting product ${req.params.id}:`, error);
    res.status(500).json({ message: error.message || 'Error deleting product' });
  }
});


export default router;
