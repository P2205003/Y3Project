import mongoose from 'mongoose';
// Import Review model to use in the static method
import Review from './Review.js';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  category: String,
  enabled: { type: Boolean, default: true },
  images: [String],
  slug: { type: String, unique: true },
  productNumber: {
    type: String,
    required: true,
    unique: true
  },
  attributes: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  metaSEO: mongoose.Schema.Types.Mixed,

  // --- NEW REVIEW FIELDS ---
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  // Optional: Distribution breakdown
  ratingDistribution: {
    type: Map,
    of: Number,
    default: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
  }
  // --- END NEW REVIEW FIELDS ---

}, { timestamps: true });

// --- EXISTING generateProductNumber ---
productSchema.statics.generateProductNumber = async function () {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const prefix = `PRO-${year}${month}${day}-`;

  const latestProduct = await this.findOne({
    productNumber: { $regex: `^${prefix}` }
  }).sort({ productNumber: -1 });

  let sequence = 1;
  if (latestProduct) {
    const lastNumber = latestProduct.productNumber.split('-')[2];
    sequence = parseInt(lastNumber, 10) + 1;
  }

  return `${prefix}${sequence.toString().padStart(4, '0')}`;
};
// --- END EXISTING generateProductNumber ---

// --- NEW STATIC METHOD: Recalculate Ratings ---
productSchema.statics.recalculateRating = async function (productId) {
  try {
    const stats = await Review.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(productId) } }, // Match reviews for this product
      {
        $group: {
          _id: '$productId', // Group by product ID
          averageRating: { $avg: '$rating' }, // Calculate average rating
          reviewCount: { $sum: 1 }, // Count the reviews
           // Calculate distribution (optional but useful)
          ratingDistribution: {
            $push: { // Push ratings into an array for further processing
              k: { $toString: '$rating' }, // Key as string '1' through '5'
              v: 1 // Value is 1 for each review
            }
          }
        }
      },
       // Convert the pushed array into the Map format
      {
        $addFields: {
          ratingDistribution: {
             $arrayToObject: { // Converts [{k:'5',v:1}, {k:'4',v:1}, {k:'5',v:1}]
                $map: { // Iterate over possible ratings 1 to 5
                   input: [1, 2, 3, 4, 5],
                   as: "rate",
                   in: {
                      k: { $toString: "$$rate" }, // Key '1' to '5'
                      v: { // Count occurrences of this rating
                         $size: {
                            $filter: {
                               input: "$ratingDistribution",
                               cond: { $eq: ["$$this.k", { $toString: "$$rate" }] }
                            }
                         }
                      }
                   }
                }
             }
          }
        }
      }
    ]);


    let updateData;
    if (stats.length > 0) {
      // Reviews found, update with calculated stats
      const { averageRating, reviewCount, ratingDistribution } = stats[0];
      updateData = {
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
        reviewCount,
        ratingDistribution
      };
    } else {
      // No reviews found, reset stats
      updateData = {
        averageRating: 0,
        reviewCount: 0,
        ratingDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
      };
    }

    // Update the product document
    await this.findByIdAndUpdate(productId, updateData);
    console.log(`Updated ratings for product ${productId}:`, updateData);

  } catch (error) {
    console.error(`Error recalculating ratings for product ${productId}:`, error);
    // Decide how to handle the error, maybe log it or throw it
  }
};
// --- END NEW STATIC METHOD ---

const Product = mongoose.model('Product', productSchema); // Export model

export default Product; // Ensure it's default export
