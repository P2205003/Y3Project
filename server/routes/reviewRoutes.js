// server/routes/reviewRoutes.js
import express from 'express';
import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// --- POST /api/products/:productId/reviews --- (Keep as is)
// ...
router.post('/products/:productId/reviews', isAuthenticated, async (req, res) => { /* ... no change ... */
    const { productId } = req.params;
    const userId = req.session.userId;
    const { rating, title, body } = req.body;
    if (!rating || !body) return res.status(400).json({ message: 'Rating and review body are required.' });
    if (rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    try {
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: 'Product not found.' });
        const user = await User.findById(userId).select('username');
        if (!user) return res.status(404).json({ message: 'User not found.' });
        const existingReview = await Review.findOne({ productId, userId });
        if (existingReview) return res.status(409).json({ message: 'You have already reviewed this product.' });
        const purchaseRecord = await Order.findOne({ userId: userId, 'items.productId': productId, status: { $in: ['delivered', 'shipped'] } });
        const isVerifiedPurchase = !!purchaseRecord;
        const newReview = new Review({ productId, userId, username: user.username, rating, title, body, isVerifiedPurchase });
        await newReview.save();
        await Product.recalculateRating(productId);
        res.status(201).json(newReview);
    } catch (error) {
        console.error('Error creating review:', error);
        if (error.code === 11000) return res.status(409).json({ message: 'You have already reviewed this product.' });
        res.status(500).json({ message: 'Server error while creating review.' });
    }
});

// --- GET /api/products/:productId/reviews --- (*** MODIFY THIS ***)
router.get('/products/:productId/reviews', async (req, res) => {
  const { productId } = req.params;
  const currentUserId = req.session?.userId; // Get current user ID if logged in
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const sort = req.query.sort || 'newest';
  const skip = (page - 1) * limit;

  let sortOption = {};
  switch (sort) { /* ... sort logic as before ... */
    case 'oldest': sortOption = { createdAt: 1 }; break;
    case 'rating-high': sortOption = { rating: -1, createdAt: -1 }; break;
    case 'rating-low': sortOption = { rating: 1, createdAt: -1 }; break;
    case 'helpful': sortOption = { helpfulVotes: -1, createdAt: -1 }; break;
    case 'newest': default: sortOption = { createdAt: -1 };
  }

  try {
    // Base query
    const query = Review.find({ productId }).sort(sortOption).skip(skip).limit(limit);

    // Select fields: Always exclude votedBy from the final *public* response,
    // but *fetch* it if the user is logged in so we can check it.
    if (currentUserId) {
        // Fetch votedBy if user is logged in
        query.select('-__v'); // Exclude version key, keep votedBy for now
    } else {
        // Exclude votedBy if user is not logged in
        query.select('-votedBy -__v');
    }

    const reviews = await query.lean(); // Use lean() for plain JS objects

    // If user is logged in, add the currentUserVoted flag
    let processedReviews = reviews;
    if (currentUserId) {
        processedReviews = reviews.map(review => {
            // Check if the current user ID is in the (now potentially present) votedBy array
            const currentUserVoted = review.votedBy?.some(voterId => voterId.toString() === currentUserId.toString()) || false;
            // Create a new object excluding the votedBy array for the response
            const { votedBy, ...reviewToSend } = review;
            return { ...reviewToSend, currentUserVoted }; // Add the flag
        });
    }

    const totalReviews = await Review.countDocuments({ productId });

    res.json({
      reviews: processedReviews, // Send the processed reviews
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


// --- PUT /api/reviews/:reviewId/helpful --- (Keep as is)
// ...
router.put('/reviews/:reviewId/helpful', isAuthenticated, async (req, res) => { /* ... no change ... */
    const { reviewId } = req.params;
    const userId = req.session.userId;
    if (!mongoose.Types.ObjectId.isValid(reviewId)) return res.status(400).json({ message: 'Invalid review ID format.' });
    try {
        const review = await Review.findById(reviewId);
        if (!review) return res.status(404).json({ message: 'Review not found.' });
        if (review.userId.toString() === userId) return res.status(403).json({ message: 'You cannot vote for your own review.' });
        const alreadyVoted = review.votedBy.some(voterId => voterId.toString() === userId);
        if (alreadyVoted) return res.status(409).json({ message: 'You have already voted this review as helpful.' });
        const updatedReview = await Review.findByIdAndUpdate(
        reviewId,
        { $inc: { helpfulVotes: 1 }, $addToSet: { votedBy: userId } },
        { new: true }
        ).select('-votedBy');
        if (!updatedReview) return res.status(404).json({ message: 'Review not found during update.' });
        res.json(updatedReview);
    } catch (error) {
        console.error('Error voting helpful:', error);
        res.status(500).json({ message: 'Server error while voting helpful.' });
    }
});

// --- DELETE /api/reviews/:reviewId/helpful --- (Keep as is)
// ...
router.delete('/reviews/:reviewId/helpful', isAuthenticated, async (req, res) => { /* ... no change ... */
    const { reviewId } = req.params;
    const userId = req.session.userId;
    if (!mongoose.Types.ObjectId.isValid(reviewId)) return res.status(400).json({ message: 'Invalid review ID format.' });
    try {
        const review = await Review.findById(reviewId);
        if (!review) return res.status(404).json({ message: 'Review not found.' });
        const hasVoted = review.votedBy.some(voterId => voterId.toString() === userId);
        if (!hasVoted) return res.status(400).json({ message: 'You have not voted for this review.' });
        const updatedReview = await Review.findByIdAndUpdate(
            reviewId,
            [ { $set: { helpfulVotes: { $max: [0, { $subtract: ["$helpfulVotes", 1] }] }, votedBy: { $filter: { input: "$votedBy", as: "voter", cond: { $ne: ["$$voter", new mongoose.Types.ObjectId(userId)] } } } } } ],
            { new: true }
        ).select('-votedBy');
        if (!updatedReview) return res.status(404).json({ message: 'Review not found during update.' });
        res.json(updatedReview);
    } catch (error) {
        console.error('Error removing helpful vote:', error);
        res.status(500).json({ message: 'Server error while removing helpful vote.' });
    }
});

// --- DELETE /api/reviews/:reviewId --- (Keep as is)
// ...
router.delete('/reviews/:reviewId', isAuthenticated, async (req, res) => { /* ... no change ... */
    const { reviewId } = req.params;
    const userId = req.session.userId;
    if (!mongoose.Types.ObjectId.isValid(reviewId)) return res.status(400).json({ message: 'Invalid review ID format.' });
    try {
        const review = await Review.findById(reviewId);
        if (!review) return res.status(404).json({ message: 'Review not found.' });
        if (review.userId.toString() !== userId) return res.status(403).json({ message: 'You are not authorized to delete this review.' });
        await Review.findByIdAndDelete(reviewId);
        await Product.recalculateRating(review.productId);
        res.json({ message: 'Review deleted successfully.' });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ message: 'Server error while deleting review.' });
    }
});


// --- POST /api/reviews/:reviewId/response (Admin) --- (Keep as is)
// ...
router.post('/reviews/:reviewId/response', isAuthenticated, isAdmin, async (req, res) => { /* ... no change ... */
    const { reviewId } = req.params;
    const { body } = req.body;
    const adminUserId = req.session.userId;
    if (!mongoose.Types.ObjectId.isValid(reviewId)) return res.status(400).json({ message: 'Invalid review ID format.' });
    if (!body) return res.status(400).json({ message: 'Response body is required.' });
    try {
        const adminUser = await User.findById(adminUserId).select('username');
        if (!adminUser) return res.status(404).json({ message: 'Admin user not found.' });
        const updatedReview = await Review.findByIdAndUpdate(
            reviewId,
            { $set: { 'sellerResponse.body': body, 'sellerResponse.date': new Date(), 'sellerResponse.userId': adminUserId, 'sellerResponse.username': adminUser.username } },
            { new: true, runValidators: true }
        ).select('-votedBy');
        if (!updatedReview) return res.status(404).json({ message: 'Review not found.' });
        res.json(updatedReview);
    } catch (error) {
        console.error('Error adding seller response:', error);
        res.status(500).json({ message: 'Server error while adding seller response.' });
    }
});

// --- DELETE /api/reviews/:reviewId/admin (Admin) --- (Keep as is)
// ...
router.delete('/reviews/:reviewId/admin', isAuthenticated, isAdmin, async (req, res) => { /* ... no change ... */
    const { reviewId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(reviewId)) return res.status(400).json({ message: 'Invalid review ID format.' });
    try {
        const review = await Review.findByIdAndDelete(reviewId);
        if (!review) return res.status(404).json({ message: 'Review not found.' });
        await Product.recalculateRating(review.productId);
        res.json({ message: 'Review deleted successfully by admin.' });
    } catch (error) {
        console.error('Error deleting review (admin):', error);
        res.status(500).json({ message: 'Server error while deleting review.' });
    }
});


export default router;
