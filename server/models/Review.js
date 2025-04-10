// server/models/Review.js
import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required for a review'],
    index: true // Index for faster lookups by product
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required for a review'],
    index: true // Index for faster lookups by user
  },
  username: { // Denormalized for easier display
    type: String,
    required: [true, 'Username is required']
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5'],
    index: true // Index for filtering/sorting by rating
  },
  title: { // Optional headline
    type: String,
    trim: true,
    maxlength: [100, 'Review title cannot exceed 100 characters']
  },
  body: {
    type: String,
    required: [true, 'Review body text is required'],
    trim: true,
    maxlength: [2000, 'Review body cannot exceed 2000 characters']
  },
  isVerifiedPurchase: { // Flag set based on purchase history
    type: Boolean,
    default: false
  },
  helpfulVotes: {
    type: Number,
    default: 0,
    min: 0
  },
  votedBy: [{ // Array of user IDs who found this helpful
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  sellerResponse: { // Optional response from admin/seller
    body: String,
    date: Date,
    userId: { // ID of the admin who responded
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String // Username of the admin
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Ensure a user can only review a specific product once
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
