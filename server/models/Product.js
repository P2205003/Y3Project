// server/models/Product.js
import mongoose from 'mongoose';
import Review from './Review.js'; // Keep review logic

// --- Define the schema for translated attributes ---
const translatedAttributesSchema = new mongoose.Schema({
  // Maps original English KEY to translated KEY string
  // e.g., { "Color": "颜色", "Material": "材料" }
  keys: {
    type: Map,
    of: String,
    default: {}
  },
  // Maps original English KEY to Array of translated VALUES
  // e.g., { "Color": ["红色", "蓝色"], "Size": ["大", "中", "小"] }
  values: {
    type: Map,
    of: [String], // Array of strings for values
    default: {}
  }
}, { _id: false });

// --- Define the main product schema ---
const productSchema = new mongoose.Schema({
  // --- Base English Fields ---
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  category: String,
  enabled: { type: Boolean, default: true },
  images: [String],
  slug: { type: String, unique: true, sparse: true }, // Added sparse index for unique slug
  productNumber: { type: String, required: true, unique: true },
  attributes: { // Base English attributes
    type: Map,
    of: [String], // Array of strings for values
    default: {}
  },
  metaSEO: mongoose.Schema.Types.Mixed, // Keep if used

  // --- Review Fields (Keep existing) ---
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0, min: 0 },
  ratingDistribution: { type: Map, of: Number, default: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 } },

  // --- Embedded Translations ---
  translations: {
    type: Map,
    of: new mongoose.Schema({ // Sub-schema for each language
      name: String,
      description: String,
      category: String,
      attributes: translatedAttributesSchema // Embed the attribute translation schema
    }, { _id: false }),
    default: {} // Default to an empty map
  }
  // --- End Embedded Translations ---

}, { timestamps: true });

// --- Keep Existing Static Methods (generateProductNumber, recalculateRating) ---
// Ensure generateProductNumber logic handles potential concurrent requests if needed
productSchema.statics.generateProductNumber = async function () {
  const date = new Date();
  const year = date.getFullYear().toString().substr(-2);
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const day = ('0' + date.getDate()).slice(-2);
  const prefix = `PROD-${year}${month}${day}-`;

  const latestProduct = await this.findOne({
    productNumber: new RegExp(`^${prefix}`)
  }).sort({ productNumber: -1 });

  let sequence = 1;
  if (latestProduct && latestProduct.productNumber) {
    try {
      const latestSequence = parseInt(latestProduct.productNumber.split('-')[3]); // Adjusted index assuming format PROD-YYMMDD-NNNN
      if (!isNaN(latestSequence)) {
        sequence = latestSequence + 1;
      }
    } catch (e) {
      console.warn("Could not parse sequence from product number:", latestProduct.productNumber);
      // Attempt fallback or reset if parsing fails severely
      const countToday = await this.countDocuments({ productNumber: new RegExp(`^${prefix}`) });
      sequence = countToday + 1;
    }
  }
  return `${prefix}${('0000' + sequence).slice(-4)}`;
};


// Ensure recalculateRating handles potential errors and edge cases
productSchema.statics.recalculateRating = async function (productId) {
  try {
    // Ensure productId is a valid ObjectId before proceeding
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      console.error(`Invalid productId passed to recalculateRating: ${productId}`);
      return;
    }
    const objectId = new mongoose.Types.ObjectId(productId);

    const stats = await Review.aggregate([
      { $match: { productId: objectId } }, // Use the converted ObjectId
      {
        $group: {
          _id: '$productId',
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
          // Calculate distribution in the same aggregation
          ratingDistribution: {
            // Group ratings and count occurrences
            $push: { rating: "$rating" }
          }
        }
      },
      {
        $unwind: { // Unwind the ratings array
          path: "$ratingDistribution",
          preserveNullAndEmptyArrays: true // Keep product even if no reviews
        }
      },
      {
        $group: { // Group again to count ratings
          _id: "$_id", // Use the original _id (productId)
          averageRating: { $first: "$averageRating" }, // Keep the calculated average
          reviewCount: { $first: "$reviewCount" }, // Keep the total count
          // Count occurrences of each rating
          '1': { $sum: { $cond: [{ $eq: ["$ratingDistribution.rating", 1] }, 1, 0] } },
          '2': { $sum: { $cond: [{ $eq: ["$ratingDistribution.rating", 2] }, 1, 0] } },
          '3': { $sum: { $cond: [{ $eq: ["$ratingDistribution.rating", 3] }, 1, 0] } },
          '4': { $sum: { $cond: [{ $eq: ["$ratingDistribution.rating", 4] }, 1, 0] } },
          '5': { $sum: { $cond: [{ $eq: ["$ratingDistribution.rating", 5] }, 1, 0] } },
        }
      },
      {
        $project: {
          _id: 0, // Exclude default _id from projection
          averageRating: 1,
          reviewCount: 1,
          // Create the ratingDistribution map
          ratingDistribution: {
            '1': "$1", '2': "$2", '3': "$3", '4': "$4", '5': "$5"
          }
        }
      }
    ]);


    let updateData;
    if (stats.length > 0) {
      const result = stats[0];
      // Ensure all keys exist in the distribution, even if count is 0
      const finalDistribution = {
        '1': result.ratingDistribution['1'] || 0,
        '2': result.ratingDistribution['2'] || 0,
        '3': result.ratingDistribution['3'] || 0,
        '4': result.ratingDistribution['4'] || 0,
        '5': result.ratingDistribution['5'] || 0,
      };

      updateData = {
        averageRating: parseFloat(result.averageRating.toFixed(2)), // Ensure 2 decimal places
        reviewCount: result.reviewCount,
        ratingDistribution: finalDistribution
      };
    } else {
      // No reviews found, reset stats
      updateData = {
        averageRating: 0,
        reviewCount: 0,
        ratingDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
      };
    }

    await this.findByIdAndUpdate(productId, updateData); // Use original productId here
    console.log(`Rating recalculated for product ${productId}:`, updateData);

  } catch (error) {
    console.error(`Error recalculating rating for product ${productId}:`, error);
    // Optional: Implement more robust error handling, e.g., logging to a dedicated service
  }
};


const Product = mongoose.model('Product', productSchema);

export default Product;
