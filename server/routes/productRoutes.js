// server/routes/productRoutes.js
import express from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Review from '../models/Review.js'; // Ensure Review is imported for delete route
import { isAuthenticated, isAdmin } from '../middleware/auth.js';
import { getPreferredLanguage } from '../utils/languageHelper.js'; // Import the helper

const router = express.Router();

// --- Helper Functions ---

// Slugify function
const slugify = (text) => {
  if (!text) return '';
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars except -
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
};

// Validation middleware
const validateProduct = (req, res, next) => {
  const { name, price } = req.body;
  if (!name || price === undefined || price === null) { // Check price presence explicitly
    return res.status(400).json({ message: 'Name and price are required' });
  }
  if (isNaN(Number(price)) || Number(price) < 0) { // Allow 0 price, check if valid number
    return res.status(400).json({ message: 'Price must be a non-negative number' });
  }
  next();
};


// --- Utility to apply translations ---
// Takes the raw product data (object, ideally from .lean()) and the target language code
function applyTranslations(productData, lang) {
  // Ensure productData exists
  if (!productData) return null;

  // Check if translation is needed/possible
  const needsTranslation = lang && lang !== 'en' && productData.translations && productData.translations[lang]; // Check plain object property access
  const baseAttributes = productData.attributes || {}; // Default to empty object if undefined

  // *** Prepare attributesOutput correctly regardless of translation ***
  const attributesOutput = {};
  // Iterate using Object.entries since .lean() gives plain objects
  Object.entries(baseAttributes).forEach(([key, values]) => {
    attributesOutput[key] = values; // Start with base attributes
  });

  // If no translation needed or available, return with base data structured correctly
  if (!needsTranslation) {
    return {
      ...productData, // Spread original data
      attributes: attributesOutput // Ensure attributes is a plain object
      // Keep translations field removed or handle as needed if base object is returned
    };
  }

  // --- Apply Translations ---
  const translation = productData.translations[lang];
  const output = { ...productData }; // Create a copy

  // Translate direct fields
  if (translation.name) output.name = translation.name;
  if (translation.description) output.description = translation.description;
  if (translation.category) output.category = translation.category;

  // --- Translate Attributes ---
  const translatedAttributesOutput = {};
  const translatedAttrKeys = translation.attributes?.keys || {};   // Assume plain object
  const translatedAttrValues = translation.attributes?.values || {}; // Assume plain object

  // Iterate over BASE attributes (now guaranteed to be an object)
  Object.entries(baseAttributes).forEach(([baseKey, baseValues]) => {
    // 1. Get the translated KEY (fallback to base key)
    const translatedKey = translatedAttrKeys[baseKey] || baseKey;

    // 2. Get the translated VALUES array (fallback to base values array)
    const translatedValues = translatedAttrValues[baseKey] || baseValues; // Fallback to original values

    // 3. Add to the output object using the translated key and values
    // Ensure translatedValues is an array for consistency if needed, though backend sends array
    translatedAttributesOutput[translatedKey] = Array.isArray(translatedValues) ? translatedValues : [translatedValues];
  });
  output.attributes = translatedAttributesOutput; // Replace original attributes with translated ones

  // --- Clean up ---
  // Optionally remove the raw translations map if it exists on the lean object
  // delete output.translations; // Be careful if productData was mutated directly

  return output;
}


// --- Admin GET route (fetches ALL data including raw translations) ---
router.get('/admin', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const query = {}; // Fetch all products

    const totalProducts = await Product.countDocuments(query);

    // Fetch full Mongoose documents, which include Maps for attributes/translations
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .select( // Explicitly select fields needed for admin table AND edit modal
        'name price enabled productNumber category averageRating reviewCount ' +
        'createdAt images description attributes slug translations' // Include slug & translations
      );

    // No need to apply translations here, send raw data with Maps
    res.json({
      products,
      totalProducts,
    });
  } catch (error) {
    console.error("Error fetching admin products:", error);
    res.status(500).json({ message: error.message || "Failed to fetch admin products" });
  }
});

// Get unique categories (fetches base English categories)
router.get('/categories', async (req, res) => {
  try {
    // Fetch distinct non-empty category values from ALL products (including disabled)
    const categories = await Product.distinct('category', { category: { $ne: null, $ne: "" } });
    // Sort alphabetically
    categories.sort((a, b) => a.localeCompare(b));
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
});

// --- Public GET routes (Apply translations) ---

// GET / (List enabled products with pagination & translations)
router.get('/', async (req, res) => {
  try {
    const lang = getPreferredLanguage(req); // Get preferred language
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const query = { enabled: true };

    const totalProducts = await Product.countDocuments(query);
    // Fetch necessary base fields AND the translations map
    const productsFromDB = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      // Fetch all fields needed for translation AND final selection
      .select('name description price images slug category averageRating reviewCount translations attributes')
      .lean(); // Use lean for performance

    // Apply translations to each product
    const translatedProducts = productsFromDB.map(p => applyTranslations(p, lang));

    // Select final fields for the response (public card view)
    const responseProducts = translatedProducts.map(p => ({
      id: p._id, // Use 'id' for frontend consistency
      name: p.name,
      description: p.description, // Include potentially translated description
      price: p.price,
      image: p.images && p.images.length > 0 ? p.images[0] : null,
      slug: p.slug,
      category: p.category, // Potentially translated category
      averageRating: p.averageRating,
      reviewCount: p.reviewCount,
      // Card view usually doesn't need attributes
    }));

    res.json({
      products: responseProducts,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      totalProducts,
    });
  } catch (error) {
    console.error("Error fetching paginated products:", error);
    res.status(500).json({ message: error.message });
  }
});


// GET /search (Apply translations)
router.get('/search', async (req, res) => {
  try {
    const lang = getPreferredLanguage(req);
    const { q, category, minPrice, maxPrice, sort, page = 1, limit = 12 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = { enabled: true };

    // --- Build Query ---
    if (q) {
      const searchRegex = { $regex: q, $options: 'i' };
      query.$or = [
        { name: searchRegex }, { description: searchRegex },
        { category: searchRegex }, { productNumber: searchRegex },
      ];
    }
    if (category) query.category = { $regex: `^${category}$`, $options: 'i' };
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined && !isNaN(Number(minPrice))) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined && !isNaN(Number(maxPrice)) && Number(maxPrice) >= 0) {
        if (query.price.$gte === undefined || Number(maxPrice) >= query.price.$gte) query.price.$lte = Number(maxPrice);
      }
      if (Object.keys(query.price).length === 0) delete query.price;
    }

    // Sorting (on base fields)
    let sortOption = { createdAt: -1 }; // Default sort
    switch (sort) {
      case 'price-asc': sortOption = { price: 1 }; break;
      case 'price-desc': sortOption = { price: -1 }; break;
      case 'name-asc': sortOption = { name: 1 }; break;
      case 'name-desc': sortOption = { name: -1 }; break;
      case 'newest': sortOption = { createdAt: -1 }; break;
      case 'rating': sortOption = { averageRating: -1, reviewCount: -1 }; break;
      case 'featured': default: sortOption = { createdAt: -1 };
    }
    // --- End Build Query ---

    const totalProducts = await Product.countDocuments(query);
    const productsFromDB = await Product.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .select('name description price images slug category averageRating reviewCount translations attributes')
      .lean();

    // Apply translations
    const translatedProducts = productsFromDB.map(p => applyTranslations(p, lang));

    // Select final fields for the response (public card view)
    const responseProducts = translatedProducts.map(p => ({
      id: p._id,
      name: p.name,
      description: p.description,
      price: p.price,
      image: p.images && p.images.length > 0 ? p.images[0] : null,
      slug: p.slug,
      category: p.category,
      averageRating: p.averageRating,
      reviewCount: p.reviewCount,
    }));

    res.json({
      products: responseProducts,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalProducts / parseInt(limit)),
      totalProducts,
    });
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({ message: error.message || "Error during product search" });
  }
});


// GET /:id (Single Product - Apply translations)
router.get('/:id', async (req, res) => {
  try {
    const lang = getPreferredLanguage(req); // Get preferred language

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      if (req.params.id === 'admin' || req.params.id === 'categories') { /* ... */ }
      return res.status(400).json({ message: 'Invalid product ID format' });
    }

    // Fetch the product including translations and base attributes
    const productFromDB = await Product.findById(req.params.id)
      .select('-__v') // Include all fields except __v
      .lean(); // Use lean()

    if (!productFromDB) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Apply translations (this modifies the copy)
    const translatedProduct = applyTranslations(productFromDB, lang);

    // *** ADD BASE ATTRIBUTES SEPARATELY for frontend logic if needed ***
    // The applyTranslations function now returns the translated attributes in the `attributes` key.
    // If the frontend *also* needs the original English attributes, send them separately.
    translatedProduct.baseAttributes = productFromDB.attributes || {}; // Add original attributes

    res.json(translatedProduct); // Return the augmented product document

  } catch (error) {
    console.error(`Error fetching product by ID ${req.params.id}:`, error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }
    res.status(500).json({ message: 'Server error fetching product' });
  }
});

// --- Admin POST/PUT/PATCH/DELETE routes ---

// POST / (Add NEW product - Accept translations)
router.post('/', isAuthenticated, isAdmin, validateProduct, async (req, res) => {
  try {
    let slug = slugify(req.body.name);
    // Ensure slug uniqueness
    if (slug) {
      let counter = 1;
      const baseSlug = slug;
      while (await Product.findOne({ slug })) {
        slug = `${baseSlug}-${counter++}`;
      }
    } else {
      slug = `product-${Date.now()}`;
    }

    const productNumber = await Product.generateProductNumber();

    // Prepare product data from request body
    const productData = {
      name: req.body.name,
      price: req.body.price,
      description: req.body.description || '',
      category: req.body.category || '',
      images: req.body.images || [],
      enabled: req.body.enabled !== undefined ? req.body.enabled : true,
      productNumber,
      slug,
      attributes: new Map(), // Initialize as Map
      translations: new Map(), // Initialize as Map
      averageRating: 0,
      reviewCount: 0,
      ratingDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
    };

    // Process base attributes (expecting { key: string, value: string[] } object)
    if (req.body.attributes && typeof req.body.attributes === 'object') {
      for (const [key, value] of Object.entries(req.body.attributes)) {
        // Ensure value is an array of strings
        if (key && Array.isArray(value) && value.every(v => typeof v === 'string') && value.length > 0) {
          productData.attributes.set(key, value);
        }
      }
    }

    // Process translations
    if (req.body.translations && typeof req.body.translations === 'object') {
      for (const [langCode, transData] of Object.entries(req.body.translations)) {
        // Basic validation: check if langCode is supported (optional but recommended)
        // if (!SUPPORTED_LANGUAGES.includes(langCode)) continue;

        const translationEntry = {}; // Build entry dynamically
        if (transData.name) translationEntry.name = transData.name;
        if (transData.description) translationEntry.description = transData.description;
        if (transData.category) translationEntry.category = transData.category;

        // Process translated attributes
        if (transData.attributes) {
          const attributesSubDoc = { keys: new Map(), values: new Map() };
          // Translated Keys
          if (transData.attributes.keys && typeof transData.attributes.keys === 'object') {
            for (const [baseKey, translatedKey] of Object.entries(transData.attributes.keys)) {
              if (baseKey && translatedKey && productData.attributes.has(baseKey)) { // Check base key exists
                attributesSubDoc.keys.set(baseKey, translatedKey);
              }
            }
          }
          // Translated Values
          if (transData.attributes.values && typeof transData.attributes.values === 'object') {
            for (const [baseKey, translatedValues] of Object.entries(transData.attributes.values)) {
              // Ensure it's a non-empty array of strings and base key exists
              if (baseKey && productData.attributes.has(baseKey) && Array.isArray(translatedValues) && translatedValues.every(v => typeof v === 'string') && translatedValues.length > 0) {
                attributesSubDoc.values.set(baseKey, translatedValues);
              }
            }
          }
          // Add attributes sub-document only if it has data
          if (attributesSubDoc.keys.size > 0 || attributesSubDoc.values.size > 0) {
            if (attributesSubDoc.keys.size === 0) delete attributesSubDoc.keys; // Clean up empty maps
            if (attributesSubDoc.values.size === 0) delete attributesSubDoc.values;
            translationEntry.attributes = attributesSubDoc;
          }
        }

        // Only add translation if there's something translated
        if (Object.keys(translationEntry).length > 0) {
          productData.translations.set(langCode, translationEntry);
        }
      }
    }
    // Mongoose handles empty Maps correctly, no need to delete if size is 0


    const product = new Product(productData);
    const newProduct = await product.save();

    res.status(201).json(newProduct);

  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ message: `Duplicate value error: ${field} must be unique.` });
    } else if (error.name === 'ValidationError') {
      console.error("Mongoose Validation Error (Create):", JSON.stringify(error.errors, null, 2));
      return res.status(400).json({ message: 'Validation Error. Please check your input.', errors: error.errors });
    }
    console.error("Error creating product:", error);
    res.status(500).json({ message: error.message || 'Error creating product' });
  }
});

// PUT /:id (Update a product - Accept translations)
router.put('/:id', isAuthenticated, isAdmin, validateProduct, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }

    // Exclude calculated/protected fields
    const {
      _id, createdAt, updatedAt,
      averageRating, reviewCount, ratingDistribution, productNumber,
      ...updateData
    } = req.body;

    const updatePayload = {};

    // Direct fields
    if (updateData.name !== undefined) updatePayload.name = updateData.name.trim();
    if (updateData.price !== undefined) updatePayload.price = parseFloat(updateData.price);
    if (updateData.description !== undefined) updatePayload.description = updateData.description.trim();
    if (updateData.category !== undefined) updatePayload.category = updateData.category.trim();
    if (updateData.slug !== undefined) updatePayload.slug = updateData.slug.trim() || slugify(updatePayload.name || req.body.name); // Use existing name if not in payload
    if (updateData.images !== undefined && Array.isArray(updateData.images)) {
      updatePayload.images = updateData.images.filter(url => url && url.trim().startsWith('http'));
      if (updatePayload.images.length === 0) return res.status(400).json({ message: 'At least one valid image URL is required.' });
    }
    if (updateData.enabled !== undefined) updatePayload.enabled = updateData.enabled;

    // Process base attributes
    if (updateData.attributes !== undefined) { // Check if attributes key exists (even if null)
      if (updateData.attributes === null || (typeof updateData.attributes === 'object' && Object.keys(updateData.attributes).length === 0)) {
        updatePayload.$unset = { ...(updatePayload.$unset || {}), attributes: "" }; // Unset if null or empty object
      } else if (typeof updateData.attributes === 'object') {
        updatePayload.attributes = new Map();
        for (const [key, value] of Object.entries(updateData.attributes)) {
          if (key && Array.isArray(value) && value.every(v => typeof v === 'string') && value.length > 0) {
            updatePayload.attributes.set(key, value);
          }
        }
        // If after processing, the map is empty, unset it instead
        if (updatePayload.attributes.size === 0) {
          updatePayload.$unset = { ...(updatePayload.$unset || {}), attributes: "" };
          delete updatePayload.attributes;
        }
      }
    }


    // Process translations
    if (updateData.translations !== undefined) { // Check if translations key exists
      if (updateData.translations === null || (typeof updateData.translations === 'object' && Object.keys(updateData.translations).length === 0)) {
        updatePayload.$unset = { ...(updatePayload.$unset || {}), translations: "" }; // Unset if null or empty object
      } else if (typeof updateData.translations === 'object') {
        updatePayload.translations = new Map();
        for (const [langCode, transData] of Object.entries(updateData.translations)) {
          const translationEntry = {};
          if (transData.name !== undefined) translationEntry.name = transData.name; // Allow empty strings to clear
          if (transData.description !== undefined) translationEntry.description = transData.description;
          if (transData.category !== undefined) translationEntry.category = transData.category;

          const attributesSubDoc = { keys: new Map(), values: new Map() };
          if (transData.attributes?.keys && typeof transData.attributes.keys === 'object') {
            for (const [baseKey, translatedKey] of Object.entries(transData.attributes.keys)) {
              // Allow setting empty string to remove translation
              if (baseKey) attributesSubDoc.keys.set(baseKey, translatedKey ?? '');
            }
          }
          if (transData.attributes?.values && typeof transData.attributes.values === 'object') {
            for (const [baseKey, translatedValues] of Object.entries(transData.attributes.values)) {
              if (baseKey && Array.isArray(translatedValues) && translatedValues.every(v => typeof v === 'string')) { // Allow empty array to clear
                attributesSubDoc.values.set(baseKey, translatedValues);
              }
            }
          }

          // Add attributes sub-document only if it has data or if intentionally clearing
          if (attributesSubDoc.keys.size > 0 || attributesSubDoc.values.size > 0 || (transData.attributes && Object.keys(transData.attributes).length === 0)) {
            if (attributesSubDoc.keys.size === 0) delete attributesSubDoc.keys;
            if (attributesSubDoc.values.size === 0) delete attributesSubDoc.values;
            // Only add 'attributes' key if there's something inside or it was explicitly empty in payload
            if (Object.keys(attributesSubDoc).length > 0 || (transData.attributes && Object.keys(transData.attributes).length === 0)) {
              translationEntry.attributes = attributesSubDoc;
            }
          }

          // Add translation entry if it contains any data
          if (Object.keys(translationEntry).length > 0) {
            updatePayload.translations.set(langCode, translationEntry);
          } else {
            // If the entire translation entry is empty, mark it for unsetting
            updatePayload.$unset = { ...(updatePayload.$unset || {}), [`translations.${langCode}`]: "" };
          }
        }
        // If after processing, the map is empty, unset it instead
        if (updatePayload.translations.size === 0) {
          updatePayload.$unset = { ...(updatePayload.$unset || {}), translations: "" };
          delete updatePayload.translations;
        }
      }
    }

    // Ensure slug uniqueness if it changed
    if (updatePayload.slug && updatePayload.slug !== product.slug) {
      const existingProduct = await Product.findOne({ slug: updatePayload.slug, _id: { $ne: req.params.id } });
      if (existingProduct) {
        return res.status(400).json({ message: `Slug "${updatePayload.slug}" is already in use.` });
      }
    } else if (!updatePayload.slug && updatePayload.name && updatePayload.name !== product.name) {
      // Auto-generate slug if name changed and slug was emptied or not provided
      updatePayload.slug = slugify(updatePayload.name);
      const existingProduct = await Product.findOne({ slug: updatePayload.slug, _id: { $ne: req.params.id } });
      if (existingProduct) { // Handle potential collision from auto-generation
        // Add counter or return error
        return res.status(400).json({ message: `Generated slug "${updatePayload.slug}" is already in use.` });
      }
    }


    // Construct the final update operation, separating $set and $unset
    const finalUpdate = {};
    const setFields = { ...updatePayload };
    delete setFields.$unset; // Remove $unset from $set
    if (Object.keys(setFields).length > 0) {
      finalUpdate.$set = setFields;
    }
    if (updatePayload.$unset && Object.keys(updatePayload.$unset).length > 0) {
      finalUpdate.$unset = updatePayload.$unset;
    }

    // Perform the update only if there's something to update
    if (Object.keys(finalUpdate).length === 0) {
      // If nothing changed, maybe return the original product or 304 Not Modified
      const existingProduct = await Product.findById(req.params.id);
      return res.json(existingProduct);
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      finalUpdate,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product); // Return the updated product (raw data from DB)
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ message: `Duplicate value error: ${field} must be unique.` });
    } else if (error.name === 'ValidationError') {
      console.error("Mongoose Validation Error (Update):", JSON.stringify(error.errors, null, 2));
      return res.status(400).json({ message: 'Validation Error. Please check your input.', errors: error.errors });
    } else if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid data format for update' });
    }
    console.error(`Error updating product ${req.params.id}:`, error);
    res.status(500).json({ message: error.message || 'Error updating product' });
  }
});


// PATCH /:id/status (remains the same)
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

// DELETE /:id (remains the same)
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
      const deleteResult = await Review.deleteMany({ productId: new mongoose.Types.ObjectId(productId) });
      console.log(`Deleted ${deleteResult.deletedCount} reviews associated with product ${productId}`);
    } catch (reviewError) {
      console.error(`Error deleting reviews for product ${productId}:`, reviewError);
    }
    // --- END Review Deletion ---

    res.status(200).json({ message: 'Product deleted successfully', deletedProductId: productId });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }
    console.error(`Error deleting product ${req.params.id}:`, error);
    res.status(500).json({ message: error.message || 'Error deleting product' });
  }
});


export default router;
