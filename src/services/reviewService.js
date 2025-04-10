// src/services/reviewService.js
class ReviewService {

  async getReviewsForProduct(productId, { page = 1, limit = 5, sort = 'newest' } = {}) {
    try {
      const response = await fetch(`/api/products/${productId}/reviews?page=${page}&limit=${limit}&sort=${sort}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }
      return await response.json(); // Should return { reviews: [], pagination: {} }
    } catch (error) {
      console.error(`Error fetching reviews for product ${productId}:`, error);
      throw error;
    }
  }

  async submitReview(productId, reviewData) {
    // reviewData should contain { rating, title (optional), body }
    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Send session cookie
        body: JSON.stringify(reviewData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }
      return await response.json(); // Return the newly created review
    } catch (error) {
      console.error(`Error submitting review for product ${productId}:`, error);
      throw error;
    }
  }

  async voteHelpful(reviewId) {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: 'PUT',
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json();
        // Handle specific errors like 409 (already voted) differently if needed
        if (response.status === 409) {
            console.warn('User already voted for this review.');
            // Optionally return a specific value or the existing review data
            // For simplicity, we'll just throw the message
        }
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }
      return await response.json(); // Return updated review (helpfulVotes count)
    } catch (error) {
      console.error(`Error voting helpful for review ${reviewId}:`, error);
      throw error;
    }
  }

  async deleteReview(reviewId) {
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }
      return await response.json(); // Return { message: '...' }
    } catch (error) {
      console.error(`Error deleting review ${reviewId}:`, error);
      throw error;
    }
  }

  // Add methods for getMyReviews, addSellerResponse, adminDeleteReview later if needed
}

const reviewService = new ReviewService();
export default reviewService;
