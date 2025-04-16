// server/routes/productRoutes.js
import express from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Review from '../models/Review.js'; // Ensure Review is imported for delete route
import { isAuthenticated, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// --- Helper Functions ---

// Helper to extract preferred language (simple implementation)
const getPreferredLanguage = (req, supported = ['en', 'zh']) => {
  const langHeader = req.headers['accept-language'];
  if (!langHeader) return 'en'; // Default to English
  // Get the first language preference, ignore quality factors for simplicity
  const preferred = langHeader.split(',')[0].split('-')[0].toLowerCase();
  return supported.includes(preferred) ? preferred : 'en';
};


// Slugify function (remains the same)
const slugify = (text) => {
  if (!text) return '';
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars except -
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
};

// Validation middleware (remains the same)
const validateProduct = (req, res, next) => {
  const { name, price } = req.body;
  if (!name || price === undefined || price === null) {
    return res.status(400).json({ message: 'Name and price are required' });
  }
  if (isNaN(Number(price)) || Number(price) < 0) {
    return res.status(400).json({ message: 'Price must be a non-negative number' });
  }
  next();
};


// --- Utility to apply translations ---
// Takes the raw product data (object, from .lean()) and the target language code
function applyTranslations(productData, lang) {
  if (!productData) return null; // Handle null input

  // Start with a copy of the base product data
  // Important: Ensure attributes is copied as a plain object
  const output = {
    ...productData,
    attributes: productData.attributes ? { ...productData.attributes } : {} // Copy attributes
  };

  // Check if translation is needed/possible
  const needsTranslation = lang && lang !== 'en' && productData.translations && productData.translations[lang];

  // If no translation needed or available, return the base object
  if (!needsTranslation) {
    // Clean up: Remove raw translations map if present
    delete output.translations;
    return output;
  }

  // --- Apply Translations ---
  const translation = productData.translations[lang];

  // Translate direct fields if they exist in the translation
  if (translation.name) output.name = translation.name;
  if (translation.description) output.description = translation.description;
  if (translation.category) output.category = translation.category;

  // --- Translate Attributes ---
  // Only proceed if both base attributes and translated attributes data exist
  if (translation.attributes && productData.attributes && typeof productData.attributes === 'object') {
    const translatedAttributesOutput = {};
    const baseAttributes = productData.attributes; // Already a plain object from .lean()
    const translatedAttrKeys = translation.attributes.keys || {};   // Assume plain object
    const translatedAttrValues = translation.attributes.values || {}; // Assume plain object

    // Iterate over BASE attributes
    Object.entries(baseAttributes).forEach(([baseKey, baseValues]) => {
      // 1. Get the translated KEY (fallback to base key)
      const translatedKey = translatedAttrKeys[baseKey] || baseKey;

      // 2. Get the translated VALUES array (fallback to base values array)
      // Ensure baseValues is treated as an array if it's not (though schema defines it as such)
      const defaultValues = Array.isArray(baseValues) ? baseValues : [baseValues].filter(Boolean);
      let finalValues = translatedAttrValues[baseKey] || defaultValues;

      // Ensure final values are an array
      if (!Array.isArray(finalValues)) {
        finalValues = [finalValues].filter(Boolean);
      }

      // 3. Add to the output object using the translated key and values
      if (finalValues.length > 0) { // Only add if there are values
        translatedAttributesOutput[translatedKey] = finalValues;
      }
    });
    output.attributes = translatedAttributesOutput; // Replace original attributes with translated ones
  } else {
    // If no translated attributes, ensure output.attributes is still the plain object copy
    output.attributes = productData.attributes ? { ...productData.attributes } : {};
  }

  // --- Clean up ---
  delete output.translations; // Remove the raw translations map from the output

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
// --- GET /categories (Keep existing - returns BASE categories) ---
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category', { category: { $ne: null, $ne: "" } });
    categories.sort((a, b) => a.localeCompare(b));
    res.json(categories);
  } catch (error) {
    console.error("Error fetching base categories:", error);
    res.status(500).json({ message: "Failed to fetch base categories" });
  }
});

// Get Translated Categories ---
router.get('/categories/translated', async (req, res) => {
  try {
    const lang = getPreferredLanguage(req); // Get preferred language from request

    // Use aggregation to get distinct base categories and their translations
    const categoryPipeline = [
      // 1. Filter out products without a category
      { $match: { category: { $ne: null, $ne: "" } } },
      // 2. Group by the base category name
      {
        $group: {
          _id: '$category', // Group by the base English category
          // Get the *first* available translation for this category in the requested language
          translatedName: { $first: `$translations.${lang}.category` },
          // Optional: Get the first document's createdAt if you really needed 'oldest' logic complexly
          // firstAdded: { $min: '$createdAt' }
        }
      },
      // 3. Project the desired output format
      {
        $project: {
          _id: 0, // Exclude the default _id
          base: '$_id', // The original English category name
          // Use the translated name if available, otherwise fallback to the base name
          display: { $ifNull: ['$translatedName', '$_id'] }
        }
      },
      // 4. Sort alphabetically by the display name (using default collation)
      { $sort: { display: 1 } }
    ];

    const translatedCategories = await Product.aggregate(categoryPipeline);

    res.json(translatedCategories); // Send array of { base: "...", display: "..." }

  } catch (error) {
    console.error("Error fetching translated categories:", error);
    res.status(500).json({ message: "Failed to fetch translated categories" });
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
      .lean(); // Use lean for performance and plain objects

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
        // Search translated fields (optional, can impact performance)
        { [`translations.${lang}.name`]: searchRegex },
        { [`translations.${lang}.description`]: searchRegex },
        { [`translations.${lang}.category`]: searchRegex },
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
      case 'name-asc': sortOption = { name: 1 }; break; // Sorts by base name
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
      .lean(); // Use lean() for plain object

    if (!productFromDB) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Apply translations (this modifies the copy)
    const translatedProduct = applyTranslations(productFromDB, lang);

    res.json(translatedProduct); // Return the translated product document

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

    const productNumber = await Product.generateProductNumber(); // Ensure this method exists and works

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

    // Process base attributes (expecting { key: string, value: string[] } object from frontend form)
    if (req.body.attributes && typeof req.body.attributes === 'object') {
      for (const [key, value] of Object.entries(req.body.attributes)) {
        // Ensure value is an array of strings and key is not empty
        if (key && Array.isArray(value) && value.every(v => typeof v === 'string') && value.length > 0) {
          productData.attributes.set(key.trim(), value.map(v => v.trim()).filter(Boolean));
        }
      }
    }

    // Process translations (expecting { langCode: { name, description, category, attributes: { keys: {}, values: {} } } })
    if (req.body.translations && typeof req.body.translations === 'object') {
      for (const [langCode, transData] of Object.entries(req.body.translations)) {
        // Basic validation: check if langCode is supported (optional but recommended)
        // if (!['en', 'zh'].includes(langCode)) continue; // Example validation

        const translationEntry = {}; // Build entry dynamically
        if (transData.name) translationEntry.name = transData.name.trim();
        if (transData.description) translationEntry.description = transData.description.trim();
        if (transData.category) translationEntry.category = transData.category.trim();

        // Process translated attributes within the translation entry
        if (transData.attributes) {
          const attributesSubDoc = { keys: new Map(), values: new Map() };
          // Translated Keys (maps baseKey -> translatedKey)
          if (transData.attributes.keys && typeof transData.attributes.keys === 'object') {
            for (const [baseKey, translatedKey] of Object.entries(transData.attributes.keys)) {
              // Ensure baseKey exists in the base attributes and translatedKey is a non-empty string
              if (baseKey && translatedKey && typeof translatedKey === 'string' && productData.attributes.has(baseKey)) {
                attributesSubDoc.keys.set(baseKey.trim(), translatedKey.trim());
              }
            }
          }
          // Translated Values (maps baseKey -> array of translatedValue strings)
          if (transData.attributes.values && typeof transData.attributes.values === 'object') {
            for (const [baseKey, translatedValues] of Object.entries(transData.attributes.values)) {
              // Ensure it's a non-empty array of strings and base key exists
              if (baseKey && productData.attributes.has(baseKey) && Array.isArray(translatedValues) && translatedValues.every(v => typeof v === 'string') && translatedValues.length > 0) {
                attributesSubDoc.values.set(baseKey.trim(), translatedValues.map(v => v.trim()).filter(Boolean));
              }
            }
          }
          // Add attributes sub-document only if it has data
          if (attributesSubDoc.keys.size > 0 || attributesSubDoc.values.size > 0) {
            // Clean up empty maps before saving if needed (Mongoose should handle this)
            // if (attributesSubDoc.keys.size === 0) delete attributesSubDoc.keys; // Optional cleanup
            // if (attributesSubDoc.values.size === 0) delete attributesSubDoc.values;
            translationEntry.attributes = attributesSubDoc;
          }
        }

        // Only add translation if there's something translated
        if (Object.keys(translationEntry).length > 0) {
          productData.translations.set(langCode, translationEntry);
        }
      }
    }
    // Mongoose handles empty Maps correctly, no need to delete if size is 0 before saving

    const product = new Product(productData);
    const newProduct = await product.save();

    res.status(201).json(newProduct); // Return the newly created product (raw data)

  } catch (error) {
    // ... (existing error handling) ...
    if (error.code === 11000) { /* ... */ }
    else if (error.name === 'ValidationError') { /* ... */ }
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

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // --- Update Base Fields ---
    if (req.body.name !== undefined) product.name = req.body.name.trim();
    if (req.body.price !== undefined) product.price = parseFloat(req.body.price);
    if (req.body.description !== undefined) product.description = req.body.description.trim();
    if (req.body.category !== undefined) product.category = req.body.category.trim();
    if (req.body.slug !== undefined) {
      const newSlug = req.body.slug.trim() || slugify(product.name);
      if (newSlug !== product.slug) {
        const existing = await Product.findOne({ slug: newSlug, _id: { $ne: product._id } });
        if (existing) throw new Error(`Slug "${newSlug}" already exists.`);
        product.slug = newSlug;
      }
    } else if (req.body.name && req.body.name !== product.name) {
      // Auto-generate slug if name changed and slug not provided
      const newSlug = slugify(req.body.name);
      if (newSlug && newSlug !== product.slug) {
        const existing = await Product.findOne({ slug: newSlug, _id: { $ne: product._id } });
        if (existing) throw new Error(`Generated slug "${newSlug}" already exists.`);
        product.slug = newSlug;
      }
    }
    if (req.body.images !== undefined && Array.isArray(req.body.images)) {
      product.images = req.body.images.filter(url => url && url.trim().startsWith('http'));
      if (product.images.length === 0) return res.status(400).json({ message: 'At least one valid image URL is required.' });
    }
    if (req.body.enabled !== undefined) product.enabled = req.body.enabled;

    // --- Update Base Attributes ---
    if (req.body.attributes !== undefined) { // Check if key exists
      if (req.body.attributes === null || (typeof req.body.attributes === 'object' && Object.keys(req.body.attributes).length === 0)) {
        product.attributes = new Map(); // Clear the map
      } else if (typeof req.body.attributes === 'object') {
        const newAttributes = new Map();
        for (const [key, value] of Object.entries(req.body.attributes)) {
          if (key && Array.isArray(value) && value.every(v => typeof v === 'string') && value.length > 0) {
            newAttributes.set(key.trim(), value.map(v => v.trim()).filter(Boolean));
          }
        }
        product.attributes = newAttributes; // Replace the entire map
      }
    }

    // --- Update Translations ---
    if (req.body.translations !== undefined) { // Check if key exists
      if (req.body.translations === null || (typeof req.body.translations === 'object' && Object.keys(req.body.translations).length === 0)) {
        product.translations = new Map(); // Clear the map
      } else if (typeof req.body.translations === 'object') {
        const newTranslations = new Map();
        for (const [langCode, transData] of Object.entries(req.body.translations)) {
          // if (!['en', 'zh'].includes(langCode)) continue; // Optional validation

          const translationEntry = {};
          let hasData = false; // Track if this lang entry has any data

          // Update direct fields (set to empty string if explicitly provided, otherwise keep existing or set new)
          if (transData.hasOwnProperty('name')) { translationEntry.name = transData.name?.trim() ?? ''; hasData = true; }
          if (transData.hasOwnProperty('description')) { translationEntry.description = transData.description?.trim() ?? ''; hasData = true; }
          if (transData.hasOwnProperty('category')) { translationEntry.category = transData.category?.trim() ?? ''; hasData = true; }

          // Process translated attributes
          if (transData.attributes) {
            const attributesSubDoc = { keys: new Map(), values: new Map() };
            let hasAttributeData = false;

            // Translated Keys
            if (transData.attributes.keys && typeof transData.attributes.keys === 'object') {
              for (const [baseKey, translatedKey] of Object.entries(transData.attributes.keys)) {
                if (baseKey && product.attributes.has(baseKey.trim())) { // Check base key exists
                  attributesSubDoc.keys.set(baseKey.trim(), (translatedKey || '').trim()); // Allow empty string to remove
                  hasAttributeData = true;
                }
              }
            }
            // Translated Values
            if (transData.attributes.values && typeof transData.attributes.values === 'object') {
              for (const [baseKey, translatedValues] of Object.entries(transData.attributes.values)) {
                if (baseKey && product.attributes.has(baseKey.trim()) && Array.isArray(translatedValues) && translatedValues.every(v => typeof v === 'string')) {
                  const cleanedValues = translatedValues.map(v => v.trim()).filter(Boolean);
                  // Only set if there are actual values OR if explicitly empty array was passed
                  if (cleanedValues.length > 0 || translatedValues.length === 0) {
                    attributesSubDoc.values.set(baseKey.trim(), cleanedValues);
                    hasAttributeData = true;
                  }
                }
              }
            }
            // Add attributes sub-document only if it has data
            if (hasAttributeData) {
              translationEntry.attributes = attributesSubDoc;
              hasData = true; // Mark that the language entry has data
            }
          }

          // Only add the language entry to the map if it contains data
          if (hasData) {
            newTranslations.set(langCode, translationEntry);
          }
        }
        product.translations = newTranslations; // Replace the entire translations map
      }
    }

    const updatedProduct = await product.save();
    res.json(updatedProduct); // Return the updated product (raw data from DB)

  } catch (error) {
    // ... (existing error handling) ...
    if (error.code === 11000) { /* ... */ }
    else if (error.name === 'ValidationError') { /* ... */ }
    else if (error.name === 'CastError') { /* ... */ }
    console.error(`Error updating product ${req.params.id}:`, error);
    res.status(500).json({ message: error.message || 'Error updating product' });
  }
});


// PATCH /:id/status (remains the same)
router.patch('/:id/status', isAuthenticated, isAdmin, async (req, res) => {
  // ... unchanged ...
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

// DELETE /:id 
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
