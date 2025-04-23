<template>
  <div class="review-list">
    <!-- Header & Controls -->
    <div class="review-list__controls">
      <h3 class="review-list__heading">
        {{ t('reviewList.heading', { count: totalReviews }) }}
      </h3>
      <div class="review-list__sort-filter">
        <label for="review-sort">{{ t('reviewList.sortLabel') }}</label>
        <select id="review-sort"
                v-model="currentSort"
                @change="changeSort"
                :disabled="isLoading || isDeleting"
                class="enhanced-input">
          <option value="helpful">{{ t('reviewList.sortOptions.helpful') }}</option>
          <option value="newest">{{ t('reviewList.sortOptions.newest') }}</option>
          <option value="oldest">{{ t('reviewList.sortOptions.oldest') }}</option>
          <option value="rating-high">{{ t('reviewList.sortOptions.ratingHigh') }}</option>
          <option value="rating-low">{{ t('reviewList.sortOptions.ratingLow') }}</option>
        </select>
      </div>
    </div>

    <!-- Loading State (Initial Fetch) -->
    <div v-if="isLoading && reviews.length === 0" class="review-list__loading">
      <font-awesome-icon icon="spinner" spin size="lg" />
      <p>{{ t('reviewList.loading') }}</p>
    </div>

    <!-- Fetch Error State -->
    <div v-else-if="error" class="review-list__error alert alert--danger">
      <p><font-awesome-icon icon="exclamation-triangle" /> {{ error }}</p>
      <button @click="fetchReviews(currentPage)" class="button enhanced-button secondary small">{{ t('reviewList.error.tryAgain') }}</button>
    </div>

    <!-- Delete Error State -->
    <div v-if="deleteError" class="review-list__delete-error alert alert--warning">
      <p><font-awesome-icon icon="exclamation-circle" /> {{ deleteError }}</p>
      <button @click="deleteError = null" class="alert__close-button" :aria-label="t('reviewList.error.dismiss')">×</button>
    </div>

    <!-- No Reviews State -->
    <div v-else-if="!isLoading && reviews.length === 0" class="review-list__empty">
      <p>{{ t('reviewList.empty') }}</p>
    </div>

    <!-- Review Cards List -->
    <!-- Add subtle opacity effect while deleting -->
    <div v-else class="review-list__items" :class="{ 'is-processing': isDeleting }">
      <ReviewCard v-for="review in reviews"
                  :key="review._id"
                  :review="review"
                  :has-voted="!!userVotes[review._id]"
                  :current-user-id="currentUserId"
                  :is-parent-deleting="isDeleting"
                  @toggle-helpful="handleToggleHelpful"
                  @delete-review="handleDeleteReview" />
    </div>

    <!-- Pagination -->
    <nav v-if="totalPages > 1"
         class="review-list__pagination pagination-container standalone-pagination"
         :aria-label="t('reviewList.pagination.ariaLabel')">
      <ul class="pagination">
        <li class="page-item" :class="{ disabled: currentPage === 1 }">
          <button class="page-link enhanced-page-link"
                  @click="changePage(currentPage - 1)"
                  :disabled="currentPage === 1 || isLoading || isDeleting"
                  :aria-label="t('reviewList.pagination.previousAriaLabel')">
            « <span class="visually-hidden">{{ t('reviewList.pagination.previousText') }}</span>
          </button>
        </li>
        <li v-for="page in paginationRange"
            :key="`review-page-${page}`"
            class="page-item"
            :class="{ active: currentPage === page, ellipsis: page === '...' }">
          <span v-if="page === '...'" class="page-link enhanced-page-link page-link--ellipsis">...</span>
          <button v-else class="page-link enhanced-page-link"
                  @click="changePage(page)"
                  :disabled="isLoading || isDeleting"
                  :aria-current="currentPage === page ? 'page' : null">
            {{ page }}
          </button>
        </li>
        <li class="page-item" :class="{ disabled: currentPage === totalPages }">
          <button class="page-link enhanced-page-link"
                  @click="changePage(currentPage + 1)"
                  :disabled="currentPage === totalPages || isLoading || isDeleting"
                  :aria-label="t('reviewList.pagination.nextAriaLabel')">
            » <span class="visually-hidden">{{ t('reviewList.pagination.nextText') }}</span>
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
  import { useI18n } from 'vue-i18n';
  import reviewService from '@/services/reviewService';
  import ReviewCard from '../ui/ReviewCard.vue';
  // Assuming FontAwesomeIcon is globally registered or imported as needed

  const { t } = useI18n();

  const props = defineProps({
    productId: { type: String, required: true },
    currentUserId: { type: String, default: null } // Passed from parent view
  });

  const reviews = ref([]);
  const isLoading = ref(false);       // For initial fetch/pagination/sort
  const error = ref(null);            // Error during fetch
  const voteError = ref(null);        // Error during voting
  const deleteError = ref(null);      // Error during deletion
  const isDeleting = ref(false);      // Loading state specifically for delete operation

  const currentPage = ref(1);
  const totalPages = ref(1);
  const totalReviews = ref(0);
  const limit = ref(5);
  const currentSort = ref('helpful');
  const userVotes = ref({});

  // --- Fetch Reviews ---
  const fetchReviews = async (page = 1, preserveErrors = false) => {
    isLoading.value = true;
    if (!preserveErrors) { // Don't clear errors if just refreshing after delete/vote
      error.value = null;
      voteError.value = null;
      deleteError.value = null;
    }
    const newUserVotes = {};
    console.log(`Fetching reviews for ${props.productId}, page ${page}, sort ${currentSort.value}`);
    try {
      const data = await reviewService.getReviewsForProduct(props.productId, { page, limit: limit.value, sort: currentSort.value });
      reviews.value = data.reviews;
      currentPage.value = data.pagination.page;
      totalPages.value = data.pagination.pages;
      totalReviews.value = data.pagination.total;

      if (props.currentUserId) {
        data.reviews.forEach(review => {
          if (review.currentUserVoted) { newUserVotes[review._id] = true; }
        });
      }
      userVotes.value = newUserVotes;
      console.log("Initialized userVotes:", userVotes.value);

    } catch (err) {
      console.error("Failed to fetch reviews:", err);
      error.value = err.message || t('reviewList.error.defaultLoadError');
      reviews.value = []; currentPage.value = 1; totalPages.value = 1; totalReviews.value = 0;
      userVotes.value = {};
    } finally {
      isLoading.value = false;
    }
  };

  // --- Pagination ---
  const paginationRange = computed(() => { /* ... (no change) ... */
    const current = currentPage.value; const last = totalPages.value; if (last <= 1) return []; const delta = 1; const left = current - delta; const right = current + delta + 1; const range = []; const rangeWithDots = []; for (let i = 1; i <= last; i++) { if (i === 1 || i === last || (i >= left && i < right)) { range.push(i); } } let l; for (const i of range) { if (l) { if (i - l === 2) rangeWithDots.push(l + 1); else if (i - l !== 1) rangeWithDots.push('...'); } rangeWithDots.push(i); l = i; } return rangeWithDots.filter((item, index, arr) => item !== '...' || arr[index - 1] !== '...');
  });
  const changePage = (page) => { if (page >= 1 && page <= totalPages.value && !isLoading.value && !isDeleting.value) { fetchReviews(page); } };
  const changeSort = () => { if (!isLoading.value && !isDeleting.value) fetchReviews(1); };

  // --- Toggle Helpful ---
  const handleToggleHelpful = async ({ reviewId, currentState }) => {
    if (!props.currentUserId) { voteError.value = t('reviewList.error.loginToVote'); return; }
    if (isDeleting.value) return; // Prevent action while deleting

    // ... (rest of the existing handleToggleHelpful logic) ...
    const isCurrentlyVoted = currentState;
    voteError.value = null; deleteError.value = null; // Clear other errors
    const reviewIndex = reviews.value.findIndex(r => r._id === reviewId);
    let originalVoteCount = -1;
    if (reviewIndex !== -1) originalVoteCount = reviews.value[reviewIndex].helpfulVotes || 0;

    userVotes.value[reviewId] = !isCurrentlyVoted;
    if (reviewIndex !== -1) { reviews.value[reviewIndex].helpfulVotes = isCurrentlyVoted ? Math.max(0, originalVoteCount - 1) : originalVoteCount + 1; }

    try {
      let updatedReviewData;
      if (isCurrentlyVoted) { updatedReviewData = await reviewService.unvoteHelpful(reviewId); }
      else { updatedReviewData = await reviewService.voteHelpful(reviewId); }
      console.log(`Vote toggle successful for review ${reviewId}`);
      if (reviewIndex !== -1 && updatedReviewData) { reviews.value[reviewIndex].helpfulVotes = updatedReviewData.helpfulVotes; }
      userVotes.value[reviewId] = !isCurrentlyVoted;
    } catch (err) {
      console.error("Error toggling helpful vote:", err);
      voteError.value = err.message || t('reviewList.error.defaultVoteError');
      userVotes.value[reviewId] = isCurrentlyVoted;
      if (reviewIndex !== -1 && originalVoteCount !== -1) { reviews.value[reviewIndex].helpfulVotes = originalVoteCount; }
      setTimeout(() => { voteError.value = null; }, 4000);
    }
  };

  // --- Delete Review ---
  const handleDeleteReview = async (reviewId) => {
    console.log(`Attempting to delete review ${reviewId}`);
    isDeleting.value = true;
    deleteError.value = null; // Clear previous delete errors
    voteError.value = null;   // Clear vote errors too

    try {
      await reviewService.deleteReview(reviewId);
      console.log(`Review ${reviewId} deleted successfully.`);

      // --- Update UI Optimistically/Realistically ---
      // Remove the review from the local array
      reviews.value = reviews.value.filter(review => review._id !== reviewId);
      // Decrement total count
      totalReviews.value = Math.max(0, totalReviews.value - 1);

      // Optional: Check if the current page is now empty and needs adjusting
      // This is slightly more complex, might involve going to previous page if not page 1
      if (reviews.value.length === 0 && currentPage.value > 1) {
        console.log("Current page empty after delete, fetching previous page.");
        await changePage(currentPage.value - 1); // Go to previous page
      } else if (reviews.value.length === 0 && currentPage.value === 1) {
        // If it was the only page and now empty, update totalPages
        totalPages.value = 0;
      } else {
        // If items remain on page, we might need to refresh to ensure pagination counts are right
        // OR just update the total - simpler for now.
        // Could optionally call fetchReviews(currentPage.value, true) here to refresh counts if needed
        // but decrementing totalReviews might be sufficient.
      }

    } catch (err) {
      console.error(`Failed to delete review ${reviewId}:`, err);
      // Use backend message if available, otherwise use translated fallback
      deleteError.value = err.message || t('reviewList.error.defaultDeleteError');
      // Optionally hide the error after a few seconds
      setTimeout(() => { deleteError.value = null; }, 5000);
    } finally {
      isDeleting.value = false;
    }
  };


  // --- Watchers & Lifecycle ---
  watch(() => props.productId, (newId, oldId) => { if (newId && newId !== oldId) fetchReviews(1); });
  onMounted(() => { fetchReviews(); });
  defineExpose({ refreshReviews: fetchReviews }); // Expose refresh method

</script>

<style scoped>
  /* --- General Styles --- */
  .review-list {
    margin-top: 2rem;
    position: relative; /* Needed for absolute positioning of error messages if desired */
  }

  /* --- Controls --- */
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
    color: var(--text-darker);
  }

  .review-list__sort-filter {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

    .review-list__sort-filter label {
      font-size: 0.9rem;
      color: var(--text-muted);
      font-weight: 500;
    }

    .review-list__sort-filter select.enhanced-input {
      min-width: 150px;
      height: 40px;
      padding: 0.5rem 2.5rem 0.5rem 0.8rem;
      font-size: 0.9rem;
    }

    .review-list__sort-filter select:disabled {
      cursor: not-allowed;
      opacity: 0.7;
    }


  /* --- Loading / Empty / Error States --- */
  .review-list__loading,
  .review-list__empty {
    text-align: center;
    padding: 3rem 1rem; /* More padding */
    font-size: 1rem;
    color: var(--text-muted);
    background-color: var(--bg-light);
    border-radius: var(--border-radius-medium);
    margin-top: 1.5rem;
  }

    .review-list__loading p {
      margin-top: 0.75rem;
      font-weight: 500;
    }

  /* Generic Alert Styles (assuming you might reuse these) */
  .alert {
    padding: 1rem 1.25rem;
    margin-bottom: 1.5rem;
    border: 1px solid transparent;
    border-radius: var(--border-radius-small);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    font-size: 0.95rem;
  }

    .alert p {
      margin: 0;
      flex-grow: 1; /* Allow text to take up space */
    }

      .alert p svg {
        margin-right: 0.6em;
        vertical-align: middle; /* Align icon better */
      }

  .alert__close-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    font-weight: bold;
    color: inherit; /* Inherit color from alert */
    opacity: 0.7;
    cursor: pointer;
    padding: 0 0.5rem;
    line-height: 1;
  }

    .alert__close-button:hover {
      opacity: 1;
    }

  /* Specific Alert Colors */
  .alert--danger {
    color: #842029;
    background-color: #f8d7da;
    border-color: #f5c2c7;
  }

    .alert--danger .button.secondary {
      border-color: #842029;
      color: #842029;
    }

      .alert--danger .button.secondary:hover {
        background-color: #842029;
        color: white;
      }

  .alert--warning {
    color: #664d03;
    background-color: #fff3cd;
    border-color: #ffecb5;
  }

  /* Error States Specific Styling */
  .review-list__error { /* Fetch Error */
    /* Uses .alert.alert--danger */
  }

    .review-list__error .button {
      margin-left: auto; /* Push button to the right if needed */
      flex-shrink: 0;
    }

  .review-list__delete-error { /* Delete Error */
    /* Uses .alert.alert--warning */
  }

  /* --- Review Items & Deleting State --- */
  .review-list__items {
    transition: opacity 0.3s ease-in-out; /* Smooth opacity transition */
  }

    .review-list__items.is-processing {
      opacity: 0.6; /* Dim the list while deleting */
      pointer-events: none; /* Prevent interactions */
    }

  /* --- Pagination --- */
  .review-list__pagination {
    margin-top: 2rem;
    /* Existing pagination styles should work, ensure disabled state applies */
  }

    .review-list__pagination button:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }

  /* --- Vote Error --- */
  .review-list__vote-error {
    color: var(--secondary);
    font-size: 0.85rem;
    text-align: center;
    margin-top: 1rem;
    font-weight: 500;
    padding: 0.5rem;
    background-color: rgba(255, 107, 107, 0.1);
    border: 1px solid rgba(255, 107, 107, 0.3);
    border-radius: var(--border-radius-small);
  }

  /* Visually Hidden Utility */
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
  }
</style>
