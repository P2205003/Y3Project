import express from 'express';
import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Product from '../models/Product.js'; // Needed for recalculateRating
import Order from '../models/Order.js'; // Needed for purchase verification
import User from '../models/User.js'; // Needed for username
import { isAuthenticated, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// --- POST /api/products/:productId/reviews ---
// Create a new review for a specific product
router.post('/products/:productId/reviews', isAuthenticated, async (req, res) => {
  const { productId } = req.params;
  const userId = req.session.userId;
  const { rating, title, body } = req.body;

  // Basic Validation
  if (!rating || !body) {
    return res.status(400).json({ message: 'Rating and review body are required.' });
  }
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
  }

  try {
    // 1. Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // 2. Check if user exists (should be guaranteed by isAuthenticated, but good practice)
    const user = await User.findById(userId).select('username'); // Only select username
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // 3. Check for existing review by this user for this product
    const existingReview = await Review.findOne({ productId, userId });
    if (existingReview) {
      return res.status(409).json({ message: 'You have already reviewed this product.' });
    }

    // 4. Verify Purchase (Crucial Step)
    // Find an order by this user that contains this product and is 'delivered' or 'shipped'
    const purchaseRecord = await Order.findOne({
      userId: userId,
      'items.productId': productId,
       status: { $in: ['delivered', 'shipped'] } // Consider which statuses count
    });
    const isVerifiedPurchase = !!purchaseRecord; // Convert found record to boolean

    // 5. Create and Save the Review
    const newReview = new Review({
      productId,
      userId,
      username: user.username, // Use fetched username
      rating,
      title,
      body,
      isVerifiedPurchase
    });
    await newReview.save();

    // 6. Recalculate product ratings
    await Product.recalculateRating(productId);

    res.status(201).json(newReview);

  } catch (error) {
    console.error('Error creating review:', error);
    // Handle potential unique index violation (user already reviewed - race condition?)
    if (error.code === 11000) {
       return res.status(409).json({ message: 'You have already reviewed this product.' });
    }
    res.status(500).json({ message: 'Server error while creating review.' });
  }
});

// --- GET /api/products/:productId/reviews ---
// Get reviews for a specific product (public, paginated, sorted)
router.get('/products/:productId/reviews', async (req, res) => {
  const { productId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5; // Default to 5 reviews per page
  const sort = req.query.sort || 'newest'; // Options: 'newest', 'oldest', 'rating-high', 'rating-low', 'helpful'

  const skip = (page - 1) * limit;

  let sortOption = {};
  switch (sort) {
    case 'oldest': sortOption = { createdAt: 1 }; break;
    case 'rating-high': sortOption = { rating: -1, createdAt: -1 }; break;
    case 'rating-low': sortOption = { rating: 1, createdAt: -1 }; break;
    case 'helpful': sortOption = { helpfulVotes: -1, createdAt: -1 }; break;
    case 'newest': // fall through
    default: sortOption = { createdAt: -1 };
  }

  try {
    const reviews = await Review.find({ productId })
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      // Optionally select fields to return
      .select('-votedBy'); // Exclude votedBy array from public view for privacy

    const totalReviews = await Review.countDocuments({ productId });

    res.json({
      reviews,
      pagination: {
        total: totalReviews,
        page,
        limit,
        pages: Math.ceil(totalReviews / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Server error while fetching reviews.' });
  }
});

// --- PUT /api/reviews/:reviewId/helpful ---
// Mark a review as helpful (vote)
router.put('/reviews/:reviewId/helpful', isAuthenticated, async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.session.userId;

  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    return res.status(400).json({ message: 'Invalid review ID format.' });
  }

  try {
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found.' });
    }

    // Prevent user from voting helpful on their own review
    if (review.userId.toString() === userId) {
        return res.status(403).json({ message: 'You cannot vote for your own review.' });
    }

    // Check if user has already voted
    // Convert ObjectId array elements to strings for comparison
    const alreadyVoted = review.votedBy.some(voterId => voterId.toString() === userId);

    if (alreadyVoted) {
       // Optional: Allow unvoting
       /*
       await Review.findByIdAndUpdate(reviewId, {
         $inc: { helpfulVotes: -1 },
         $pull: { votedBy: userId }
       });
       return res.json({ message: 'Vote removed.' });
       */
       return res.status(409).json({ message: 'You have already voted this review as helpful.' });
    }

    // Atomically increment votes and add user ID to votedBy array
    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      {
        $inc: { helpfulVotes: 1 }, // Increment helpfulVotes
        $addToSet: { votedBy: userId } // Add userId to the set (prevents duplicates)
      },
      { new: true } // Return the updated document
    ).select('-votedBy'); // Exclude voter list from response

    if (!updatedReview) { // Should not happen if findById found it, but safety check
        return res.status(404).json({ message: 'Review not found during update.' });
    }

    res.json(updatedReview); // Return the updated review (excluding votedBy)

  } catch (error) {
    console.error('Error voting helpful:', error);
    res.status(500).json({ message: 'Server error while voting helpful.' });
  }
});

// --- DELETE /api/reviews/:reviewId ---
// Delete own review
router.delete('/reviews/:reviewId', isAuthenticated, async (req, res) => {
    const { reviewId } = req.params;
    const userId = req.session.userId;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return res.status(400).json({ message: 'Invalid review ID format.' });
    }

    try {
        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ message: 'Review not found.' });
        }

        // Check ownership
        if (review.userId.toString() !== userId) {
            return res.status(403).json({ message: 'You are not authorized to delete this review.' });
        }

        // Delete the review
        await Review.findByIdAndDelete(reviewId);

        // Recalculate product ratings
        await Product.recalculateRating(review.productId);

        res.json({ message: 'Review deleted successfully.' });

    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ message: 'Server error while deleting review.' });
    }
});

// --- POST /api/reviews/:reviewId/response (Admin) ---
// Add or update a seller response to a review
router.post('/reviews/:reviewId/response', isAuthenticated, isAdmin, async (req, res) => {
    const { reviewId } = req.params;
    const { body } = req.body;
    const adminUserId = req.session.userId;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return res.status(400).json({ message: 'Invalid review ID format.' });
    }
    if (!body) {
        return res.status(400).json({ message: 'Response body is required.' });
    }

    try {
        const adminUser = await User.findById(adminUserId).select('username');
        if (!adminUser) {
            return res.status(404).json({ message: 'Admin user not found.' }); // Should not happen
        }

        const updatedReview = await Review.findByIdAndUpdate(
            reviewId,
            {
                $set: {
                    'sellerResponse.body': body,
                    'sellerResponse.date': new Date(),
                    'sellerResponse.userId': adminUserId,
                    'sellerResponse.username': adminUser.username
                }
            },
            { new: true, runValidators: true }
        ).select('-votedBy');

        if (!updatedReview) {
            return res.status(404).json({ message: 'Review not found.' });
        }

        res.json(updatedReview);

    } catch (error) {
        console.error('Error adding seller response:', error);
        res.status(500).json({ message: 'Server error while adding seller response.' });
    }
});

// --- DELETE /api/reviews/:reviewId/admin (Admin) ---
// Delete any review (Admin only)
router.delete('/reviews/:reviewId/admin', isAuthenticated, isAdmin, async (req, res) => {
    const { reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return res.status(400).json({ message: 'Invalid review ID format.' });
    }

    try {
        const review = await Review.findByIdAndDelete(reviewId);
        if (!review) {
            return res.status(404).json({ message: 'Review not found.' });
        }

        // Recalculate product ratings after admin deletion
        await Product.recalculateRating(review.productId);

        res.json({ message: 'Review deleted successfully by admin.' });

    } catch (error) {
        console.error('Error deleting review (admin):', error);
        res.status(500).json({ message: 'Server error while deleting review.' });
    }
});


export default router;
