// src/services/reviewService.js
class ReviewService {

  async getReviewsForProduct(productId, { page = 1, limit = 5, sort = 'newest' } = {}) {
      try {
        const response = await fetch(`/api/products/${productId}/reviews?page=${page}&limit=${limit}&sort=${sort}`);
        if (!response.ok) throw new Error((await response.json()).message || `HTTP ${response.status}`);
        return await response.json();
      } catch (error) { console.error(`Err fetching reviews:`, error); throw error; }
  }
  async submitReview(productId, reviewData) {
      try {
        const response = await fetch(`/api/products/${productId}/reviews`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(reviewData) });
        if (!response.ok) throw new Error((await response.json()).message || `HTTP ${response.status}`);
        return await response.json();
      } catch (error) { console.error(`Err submitting review:`, error); throw error; }
  }
  async voteHelpful(reviewId) {
      try {
        const response = await fetch(`/api/reviews/${reviewId}/helpful`, { method: 'PUT', credentials: 'include' });
        if (!response.ok) throw new Error((await response.json()).message || `HTTP ${response.status}`);
        return await response.json();
      } catch (error) { console.error(`Err voting helpful:`, error); throw error; }
  }
  async unvoteHelpful(reviewId) {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 400) {
            console.warn('User had not voted for this review.');
        }
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error removing helpful vote for review ${reviewId}:`, error);
      throw error;
    }
  }
  async deleteReview(reviewId) {
      try {
        const response = await fetch(`/api/reviews/${reviewId}`, { method: 'DELETE', credentials: 'include' });
        if (!response.ok) throw new Error((await response.json()).message || `HTTP ${response.status}`);
        return await response.json();
      } catch (error) { console.error(`Err deleting review:`, error); throw error; }
  }
}

const reviewService = new ReviewService();
export default reviewService;
