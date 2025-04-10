<template>
  <div class="review-list">
    <!-- Header & Controls -->
    <div class="review-list__controls">
      <h3 class="review-list__heading">
        Customer Reviews ({{ totalReviews }})
      </h3>
      <div class="review-list__sort-filter">
        <label for="review-sort">Sort by:</label>
        <select id="review-sort" v-model="currentSort" @change="changeSort" :disabled="isLoading" class="enhanced-input">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="rating-high">Highest Rating</option>
          <option value="rating-low">Lowest Rating</option>
          <option value="helpful">Most Helpful</option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="review-list__loading">
      <font-awesome-icon icon="spinner" spin /> Loading reviews...
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="review-list__error">
      <p><font-awesome-icon icon="exclamation-triangle" /> {{ error }}</p>
      <button @click="fetchReviews(currentPage)" class="button enhanced-button secondary small">Try Again</button>
    </div>

    <!-- No Reviews State -->
    <div v-else-if="reviews.length === 0" class="review-list__empty">
      <p>Be the first to review this product!</p>
    </div>

    <!-- Review Cards List -->
    <div v-else class="review-list__items">
      <ReviewCard v-for="review in reviews"
                  :key="review._id"
                  :review="review"
                  :has-voted="userVotes[review._id]"
                  @vote-helpful="handleVoteHelpful" />
    </div>

    <!-- Pagination -->
    <nav v-if="totalPages > 1" class="review-list__pagination pagination-container standalone-pagination" aria-label="Reviews pagination">
      <ul class="pagination">
        <li class="page-item" :class="{ disabled: currentPage === 1 }">
          <button class="page-link enhanced-page-link" @click="changePage(currentPage - 1)" :disabled="currentPage === 1 || isLoading" aria-label="Previous reviews page">
            « <span class="visually-hidden">Previous</span>
          </button>
        </li>
        <li v-for="page in paginationRange"
            :key="`review-page-${page}`"
            class="page-item"
            :class="{ active: currentPage === page, ellipsis: page === '...' }">
          <span v-if="page === '...'" class="page-link enhanced-page-link page-link--ellipsis">...</span>
          <button v-else class="page-link enhanced-page-link" @click="changePage(page)" :disabled="isLoading" :aria-current="currentPage === page ? 'page' : null">
            {{ page }}
          </button>
        </li>
        <li class="page-item" :class="{ disabled: currentPage === totalPages }">
          <button class="page-link enhanced-page-link" @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages || isLoading" aria-label="Next reviews page">
            » <span class="visually-hidden">Next</span>
          </button>
        </li>
      </ul>
    </nav>

    <!-- Vote Error Message -->
    <p v-if="voteError" class="review-list__vote-error">{{ voteError }}</p>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import reviewService from '@/services/reviewService';
import ReviewCard from '../ui/ReviewCard.vue';
// FontAwesomeIcon imported globally

const props = defineProps({
  productId: {
    type: String,
    required: true
  },
  // Pass current user ID if logged in, to track votes
  currentUserId: {
      type: String,
      default: null
  }
});

const reviews = ref([]);
const isLoading = ref(false);
const error = ref(null);
const voteError = ref(null); // Specific error for voting
const currentPage = ref(1);
const totalPages = ref(1);
const totalReviews = ref(0);
const limit = ref(5); // Reviews per page
const currentSort = ref('newest');

// Track user's votes to disable button/show filled thumb
// In a real app, this might come from user profile data or be stored locally
const userVotes = ref({}); // { reviewId: true }

// Fetch reviews function
const fetchReviews = async (page = 1) => {
  isLoading.value = true;
  error.value = null;
  voteError.value = null; // Clear vote error on refresh
  console.log(`Fetching reviews for ${props.productId}, page ${page}, sort ${currentSort.value}`);
  try {
    const data = await reviewService.getReviewsForProduct(props.productId, {
      page,
      limit: limit.value,
      sort: currentSort.value
    });
    reviews.value = data.reviews;
    currentPage.value = data.pagination.page;
    totalPages.value = data.pagination.pages;
    totalReviews.value = data.pagination.total;

    // Update userVotes based on fetched reviews (if userId is available)
    if (props.currentUserId) {
        data.reviews.forEach(review => {
            // The backend excludes the votedBy list now, so this check needs adjustment.
            // We might need a separate endpoint to check if user voted, or rely on error response.
            // For now, let's assume the vote button just tries and handles the error.
            // userVotes.value[review._id] = review.votedBy?.includes(props.currentUserId);
        });
    }


  } catch (err) {
    console.error("Failed to fetch reviews:", err);
    error.value = err.message || "Could not load reviews.";
    reviews.value = [];
    currentPage.value = 1;
    totalPages.value = 1;
    totalReviews.value = 0;
  } finally {
    isLoading.value = false;
  }
};

// Pagination range calculation
const paginationRange = computed(() => {
  const current = currentPage.value;
  const last = totalPages.value;
  if (last <= 1) return [];
  const delta = 1;
  const left = current - delta;
  const right = current + delta + 1;
  const range = [];
  const rangeWithDots = [];
  for (let i = 1; i <= last; i++) {
    if (i === 1 || i === last || (i >= left && i < right)) {
      range.push(i);
    }
  }
  let l;
  for (const i of range) {
    if (l) {
      if (i - l === 2) rangeWithDots.push(l + 1);
      else if (i - l !== 1) rangeWithDots.push('...');
    }
    rangeWithDots.push(i);
    l = i;
  }
  return rangeWithDots.filter((item, index, arr) => item !== '...' || arr[index - 1] !== '...');
});


// Event Handlers
const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value && !isLoading.value) {
    fetchReviews(page);
  }
};

const changeSort = () => {
  fetchReviews(1); // Go back to page 1 when sort changes
};

const handleVoteHelpful = async (reviewId) => {
    if (!props.currentUserId) {
        voteError.value = "Please log in to vote.";
        // Optionally trigger login popup
        return;
    }

    if (userVotes.value[reviewId]) {
        voteError.value = "You've already voted for this review.";
        return; // Already voted
    }

    voteError.value = null; // Clear previous vote errors

    try {
        // Optimistic UI update (optional but good UX)
        const reviewIndex = reviews.value.findIndex(r => r._id === reviewId);
        if (reviewIndex !== -1) {
            reviews.value[reviewIndex].helpfulVotes = (reviews.value[reviewIndex].helpfulVotes || 0) + 1;
        }
        userVotes.value[reviewId] = true; // Mark as voted locally

        await reviewService.voteHelpful(reviewId);
        console.log(`Voted helpful for review ${reviewId}`);
        // Optionally refetch the specific review or trust the optimistic update
        // const updatedReview = await reviewService.getReviewById(reviewId); // If such an endpoint exists
        // if (reviewIndex !== -1) reviews.value[reviewIndex] = updatedReview;

    } catch (err) {
        console.error("Error voting helpful:", err);
        voteError.value = err.message || "Could not submit your vote.";

        // Revert optimistic update on error
        const reviewIndex = reviews.value.findIndex(r => r._id === reviewId);
        if (reviewIndex !== -1) {
            reviews.value[reviewIndex].helpfulVotes = Math.max(0, (reviews.value[reviewIndex].helpfulVotes || 1) - 1); // Decrement safely
        }
        userVotes.value[reviewId] = false; // Revert voted state

        // Clear error message after a delay
        setTimeout(() => { voteError.value = null; }, 4000);
    }
};


// Watch for productId changes (if the component stays mounted but product changes)
watch(() => props.productId, (newId, oldId) => {
  if (newId && newId !== oldId) {
    fetchReviews(1); // Fetch reviews for the new product
  }
});

// Initial fetch on mount
onMounted(() => {
  fetchReviews();
});

// Expose fetchReviews method so parent can trigger refresh
defineExpose({
  refreshReviews: fetchReviews
});

</script>

<style scoped>
  .review-list {
    margin-top: 2rem;
  }

  .review-list__controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-color);
    flex-wrap: wrap;
    gap: 1rem;
  }

  .review-list__heading {
    margin: 0;
    font-size: 1.3rem;
    font-weight: 600;
  }

  .review-list__sort-filter {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

    .review-list__sort-filter label {
      font-size: 0.9rem;
      color: var(--text-muted);
    }

    .review-list__sort-filter select.enhanced-input {
      min-width: 150px;
      height: 40px; /* Smaller height for sort dropdown */
      padding: 0.5rem 2.5rem 0.5rem 0.8rem; /* Adjust padding */
      font-size: 0.9rem;
    }


  .review-list__loading,
  .review-list__error,
  .review-list__empty {
    text-align: center;
    padding: 2rem;
    font-size: 1rem;
    color: var(--text-muted);
    background-color: var(--bg-light);
    border-radius: var(--border-radius-small);
  }

    .review-list__loading svg {
      margin-right: 0.5em;
    }

  .review-list__error {
    color: var(--secondary);
    background-color: #fff9f9;
    border: 1px solid var(--secondary);
  }

    .review-list__error svg {
      margin-right: 0.5em;
      color: var(--secondary);
    }

    .review-list__error .button {
      margin-top: 1rem;
      font-size: 0.85rem;
    }

  .review-list__items {
    /* Container for ReviewCards */
  }

  .review-list__pagination {
    margin-top: 2rem;
    /* Inherits styles from .pagination-container, .standalone-pagination */
  }

  .review-list__vote-error {
    color: var(--secondary);
    font-size: 0.85rem;
    text-align: center;
    margin-top: 1rem;
    font-weight: 500;
  }

  /* Reuse enhanced pagination styles */
  .enhanced-page-link {
    transition: all var(--transition-fast);
    border-radius: var(--border-radius-small);
    min-width: 38px;
    padding: 0.5rem 0.8rem;
    font-size: 0.85rem;
    will-change: transform, box-shadow, background-color, color, border-color;
  }

  .page-item:not(.disabled) .enhanced-page-link:hover,
  .page-item:not(.disabled) .enhanced-page-link:focus-visible {
    transform: translateY(-2px);
    box-shadow: var(--shadow-soft);
    border-color: var(--primary);
    color: var(--primary);
    background-color: var(--white);
    outline: none;
    z-index: 2;
  }

  .page-item.active .enhanced-page-link {
    transform: none;
    box-shadow: none;
    background-color: var(--primary);
    border-color: var(--primary);
    color: var(--white);
    z-index: 1;
  }

  .page-link--ellipsis {
    background: transparent;
    border: none;
    box-shadow: none;
  }

  .visually-hidden { /* From ProductsView */
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  select.enhanced-input { /* From ProductsView */
    padding: 0.8rem 1rem;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-small);
    font-size: 0.95rem;
    background-color: var(--bg-light);
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast), background-color var(--transition-fast);
    height: 44px;
    box-sizing: border-box;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%236c757d'%3E%3Cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.9rem center;
    background-size: 16px 12px;
    padding-right: 2.8rem;
    cursor: pointer;
    width: 100%;
  }

    select.enhanced-input:focus, select.enhanced-input:focus-visible {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px var(--glow-primary);
      background-color: var(--white);
    }

    select.enhanced-input:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      background-color: var(--bg-off-light);
    }
</style>
