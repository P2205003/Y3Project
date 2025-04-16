<template>
  <div class="review-list">
    <!-- Header & Controls -->
    <div class="review-list__controls">
      <h3 class="review-list__heading">
        {{ t('reviewList.heading', { count: totalReviews }) }}
      </h3>
      <div class="review-list__sort-filter">
        <label for="review-sort">{{ t('reviewList.sortLabel') }}</label>
        <select id="review-sort" v-model="currentSort" @change="changeSort" :disabled="isLoading" class="enhanced-input">
          <option value="helpful">{{ t('reviewList.sortOptions.helpful') }}</option>
          <option value="newest">{{ t('reviewList.sortOptions.newest') }}</option>
          <option value="oldest">{{ t('reviewList.sortOptions.oldest') }}</option>
          <option value="rating-high">{{ t('reviewList.sortOptions.ratingHigh') }}</option>
          <option value="rating-low">{{ t('reviewList.sortOptions.ratingLow') }}</option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && reviews.length === 0" class="review-list__loading">
      <!-- Show only if no reviews displayed -->
      <font-awesome-icon icon="spinner" spin /> {{ t('reviewList.loading') }}
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="review-list__error">
      <p><font-awesome-icon icon="exclamation-triangle" /> {{ error || deleteError }}</p> <!-- Show delete error here too -->
      <button @click="fetchReviews(currentPage)" class="button enhanced-button secondary small">{{ t('reviewList.error.tryAgain') }}</button>
    </div>

    <!-- No Reviews State -->
    <div v-else-if="reviews.length === 0 && !isLoading" class="review-list__empty">
      <!-- Check isLoading again -->
      <p>{{ t('reviewList.empty') }}</p>
    </div>

    <!-- Review Cards List -->
    <div v-else class="review-list__items">
      <!-- Use a transition-group for potential list animations -->
      <transition-group name="review-list-fade">
        <ReviewCard v-for="(review) in reviews"
                    :key="review._id"
                    :review="review"
                    :has-voted="!!userVotes[review._id]"
                    :current-user-id="props.currentUserId"
                    @toggle-helpful="handleToggleHelpful"
                    @delete-review="handleDeleteReview" /> <!-- Listen for delete event -->
      </transition-group>
    </div>

    <!-- Pagination -->
    <nav v-if="totalPages > 1" class="review-list__pagination pagination-container standalone-pagination" :aria-label="t('reviewList.pagination.ariaLabel')">
      <ul class="pagination">
        <li class="page-item" :class="{ disabled: currentPage === 1 }"> <button class="page-link enhanced-page-link" @click="changePage(currentPage - 1)" :disabled="currentPage === 1 || isLoading" :aria-label="t('reviewList.pagination.previousAriaLabel')"> « <span class="visually-hidden">{{ t('reviewList.pagination.previousText') }}</span> </button> </li>
        <li v-for="page in paginationRange" :key="`review-page-${page}`" class="page-item" :class="{ active: currentPage === page, ellipsis: page === '...' }"> <span v-if="page === '...'" class="page-link enhanced-page-link page-link--ellipsis">...</span> <button v-else class="page-link enhanced-page-link" @click="changePage(page)" :disabled="isLoading" :aria-current="currentPage === page ? 'page' : null"> {{ page }} </button> </li>
        <li class="page-item" :class="{ disabled: currentPage === totalPages }"> <button class="page-link enhanced-page-link" @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages || isLoading" :aria-label="t('reviewList.pagination.nextAriaLabel')"> » <span class="visually-hidden">{{ t('reviewList.pagination.nextText') }}</span> </button> </li>
      </ul>
    </nav>

    <!-- Vote Error Message -->
    <p v-if="voteError" class="review-list__vote-error">{{ voteError }}</p>
    <!-- Delete Error Message -->
    <p v-if="deleteError" class="review-list__vote-error review-list__delete-error">{{ deleteError }}</p>
  </div>
</template>

<script setup>
  import { ref, computed, watch, onMounted } from 'vue';
  import { useI18n } from 'vue-i18n'; // Import useI18n
  import reviewService from '@/services/reviewService';
  import ReviewCard from '../ui/ReviewCard.vue';
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'; // Import if not global

  // --- Get translation function ---
  const { t } = useI18n();

  const props = defineProps({
    productId: { type: String, required: true },
    currentUserId: { type: String, default: null } // Already defined
  });

  const emit = defineEmits(['review-deleted']); // Optional: notify parent

  const reviews = ref([]);
  const isLoading = ref(false);
  const error = ref(null);
  const voteError = ref(null);
  const deleteError = ref(null); // State for delete errors
  const currentPage = ref(1);
  const totalPages = ref(1);
  const totalReviews = ref(0);
  const limit = ref(5);
  const currentSort = ref('helpful');
  const userVotes = ref({});

  // --- Fetch Reviews ---
  const fetchReviews = async (page = 1) => {
    // Don't show full loading state if reviews already exist (for pagination/sorting)
    if (reviews.value.length === 0) {
      isLoading.value = true;
    }
    error.value = null;
    voteError.value = null;
    deleteError.value = null; // Clear delete error on fetch
    const newUserVotes = {};
    console.log(`Fetching reviews for ${props.productId}, page ${page}, sort ${currentSort.value}`);
    try {
      const data = await reviewService.getReviewsForProduct(props.productId, { page, limit: limit.value, sort: currentSort.value });
      reviews.value = data.reviews;
      currentPage.value = data.pagination.page;
      totalPages.value = data.pagination.pages;
      totalReviews.value = data.pagination.total;

      // Rebuild userVotes from the fetched data
      if (props.currentUserId) {
        data.reviews.forEach(review => {
          if (review.currentUserVoted) { newUserVotes[review._id] = true; }
        });
      }
      userVotes.value = newUserVotes;
      console.log("Refreshed userVotes:", userVotes.value);

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
  const paginationRange = computed(() => {
    const current = currentPage.value; const last = totalPages.value; if (last <= 1) return []; const delta = 1; const left = current - delta; const right = current + delta + 1; const range = []; const rangeWithDots = []; for (let i = 1; i <= last; i++) { if (i === 1 || i === last || (i >= left && i < right)) { range.push(i); } } let l; for (const i of range) { if (l) { if (i - l === 2) rangeWithDots.push(l + 1); else if (i - l !== 1) rangeWithDots.push('...'); } rangeWithDots.push(i); l = i; } return rangeWithDots.filter((item, index, arr) => item !== '...' || arr[index - 1] !== '...');
  });
  const changePage = (page) => { if (page >= 1 && page <= totalPages.value && !isLoading.value) { fetchReviews(page); } };
  const changeSort = () => { fetchReviews(1); };

  // --- Toggle Helpful ---
  const handleToggleHelpful = async ({ reviewId, currentState }) => {
    if (!props.currentUserId) { voteError.value = t('reviewList.error.loginToVote'); return; }

    const isCurrentlyVoted = currentState;
    voteError.value = null;
    const reviewIndex = reviews.value.findIndex(r => r._id === reviewId);
    let originalVoteCount = -1;
    if (reviewIndex !== -1) originalVoteCount = reviews.value[reviewIndex].helpfulVotes || 0;

    userVotes.value[reviewId] = !isCurrentlyVoted;
    if (reviewIndex !== -1) { reviews.value[reviewIndex].helpfulVotes = isCurrentlyVoted ? Math.max(0, originalVoteCount - 1) : originalVoteCount + 1; }

    try {
      let updatedReviewData;
      if (isCurrentlyVoted) { updatedReviewData = await reviewService.unvoteHelpful(reviewId); }
      else { updatedReviewData = await reviewService.voteHelpful(reviewId); }
      if (reviewIndex !== -1 && updatedReviewData) { reviews.value[reviewIndex].helpfulVotes = updatedReviewData.helpfulVotes; }
      userVotes.value[reviewId] = !isCurrentlyVoted; // Confirm state
    } catch (err) {
      voteError.value = err.message || t('reviewList.error.defaultVoteError');
      userVotes.value[reviewId] = isCurrentlyVoted; // Revert
      if (reviewIndex !== -1 && originalVoteCount !== -1) { reviews.value[reviewIndex].helpfulVotes = originalVoteCount; }
      setTimeout(() => { voteError.value = null; }, 4000);
    }
  };


  // --- Handle Delete Review ---
  const handleDeleteReview = async (reviewId) => {
    console.log(`Attempting to delete review: ${reviewId}`);
    deleteError.value = null;

    const reviewIndex = reviews.value.findIndex(r => r._id === reviewId);

    try {
      await reviewService.deleteReview(reviewId);
      console.log(`Review ${reviewId} deleted successfully.`);

      // Remove locally
      if (reviewIndex !== -1) {
        reviews.value.splice(reviewIndex, 1);
        totalReviews.value--;
        // Adjust pagination
        const newTotalPages = Math.ceil(totalReviews.value / limit.value);
        if (currentPage.value > newTotalPages && newTotalPages > 0) {
          await fetchReviews(newTotalPages); // Go to the new last page
        } else if (reviews.value.length === 0 && currentPage.value > 1) {
          await fetchReviews(currentPage.value - 1); // Go to previous page if current is now empty
        } else {
          // Update total pages if it changed
          totalPages.value = newTotalPages > 0 ? newTotalPages : 1;
        }
      } else {
        await fetchReviews(currentPage.value); // Refetch if index wasn't found (edge case)
      }
      emit('review-deleted');

    } catch (err) {
      console.error("Error deleting review:", err);
      deleteError.value = err.message || t('reviewList.error.deleteError');
      setTimeout(() => { deleteError.value = null; }, 5000);
      // Note: We don't revert UI here, deletion errors are less common, user can retry
    }
  };

  // --- Watchers & Lifecycle ---
  watch(() => props.productId, (newId, oldId) => { if (newId && newId !== oldId) fetchReviews(1); });
  onMounted(() => { fetchReviews(); });
  defineExpose({ refreshReviews: fetchReviews });

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

    /* Use enhanced select style */
    .review-list__sort-filter select.enhanced-input {
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
      min-width: 180px; /* Give it some width */
    }

      .review-list__sort-filter select.enhanced-input:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px var(--glow-primary);
        background-color: var(--white);
      }

      .review-list__sort-filter select.enhanced-input:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        background-color: var(--bg-off-light);
      }


  .review-list__loading, .review-list__error, .review-list__empty {
    text-align: center;
    padding: 2rem;
    font-size: 1rem;
    color: var(--text-muted);
    background-color: var(--bg-light);
    border-radius: var(--border-radius-small);
    min-height: 150px; /* Give some height */
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

    .review-list__loading svg {
      margin-bottom: 0.5em; /* Space below icon */
      font-size: 1.5rem; /* Make spinner larger */
    }

  .review-list__error {
    color: var(--secondary);
    background-color: #fff9f9;
    border: 1px solid var(--secondary);
  }

    .review-list__error p {
      margin-bottom: 1rem;
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
    /* Optional: Add a subtle border or background */
  }

  .review-list__pagination {
    margin-top: 2rem;
  }

  .review-list__vote-error,
  .review-list__delete-error {
    color: var(--secondary);
    font-size: 0.85rem;
    text-align: center;
    margin-top: 1rem;
    font-weight: 500;
    padding: 0.5rem;
    background-color: #fff9f9;
    border: 1px solid #f5c6cb;
    border-radius: var(--border-radius-small);
  }

  /* List item fade transition */
  .review-list-fade-enter-active,
  .review-list-fade-leave-active {
    transition: opacity 0.5s ease;
  }

  .review-list-fade-enter-from,
  .review-list-fade-leave-to {
    opacity: 0;
  }
</style>
