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
    <div v-if="isLoading" class="review-list__loading">
      <font-awesome-icon icon="spinner" spin /> {{ t('reviewList.loading') }}
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="review-list__error">
      <p><font-awesome-icon icon="exclamation-triangle" /> {{ error }}</p> <!-- Keep backend error msg -->
      <button @click="fetchReviews(currentPage)" class="button enhanced-button secondary small">{{ t('reviewList.error.tryAgain') }}</button>
    </div>

    <!-- No Reviews State -->
    <div v-else-if="reviews.length === 0" class="review-list__empty">
      <p>{{ t('reviewList.empty') }}</p>
    </div>

    <!-- Review Cards List -->
    <div v-else class="review-list__items">
      <ReviewCard v-for="review in reviews"
                  :key="review._id"
                  :review="review"
                  :has-voted="!!userVotes[review._id]"
                  @toggle-helpful="handleToggleHelpful" />
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
    <!-- Display raw message from backend or specific translated frontend messages -->
    <p v-if="voteError" class="review-list__vote-error">{{ voteError }}</p>
  </div>
</template>

<script setup>
  import { ref, computed, watch, onMounted } from 'vue';
  import { useI18n } from 'vue-i18n'; // Import useI18n
  import reviewService from '@/services/reviewService';
  import ReviewCard from '../ui/ReviewCard.vue';
  // FontAwesomeIcon imported globally

  // --- Get translation function ---
  const { t } = useI18n();

  const props = defineProps({
    productId: { type: String, required: true },
    currentUserId: { type: String, default: null }
  });

  const reviews = ref([]);
  const isLoading = ref(false);
  const error = ref(null); // Holds fetch error messages (backend or translated fallback)
  const voteError = ref(null); // Holds vote error messages (backend or translated fallback)
  const currentPage = ref(1);
  const totalPages = ref(1);
  const totalReviews = ref(0);
  const limit = ref(5);
  const currentSort = ref('helpful');
  const userVotes = ref({});

  // --- Fetch Reviews ---
  const fetchReviews = async (page = 1) => {
    isLoading.value = true;
    error.value = null;
    voteError.value = null;
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
      // Use backend message if available, otherwise use translated fallback
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
  const changePage = (page) => { if (page >= 1 && page <= totalPages.value && !isLoading.value) { fetchReviews(page); } };
  const changeSort = () => { fetchReviews(1); };

  // --- Toggle Helpful ---
  const handleToggleHelpful = async ({ reviewId, currentState }) => {
    // Use translated error for login prompt
    if (!props.currentUserId) { voteError.value = t('reviewList.error.loginToVote'); return; }

    const isCurrentlyVoted = currentState;
    voteError.value = null;
    const reviewIndex = reviews.value.findIndex(r => r._id === reviewId);
    let originalVoteCount = -1;
    if (reviewIndex !== -1) originalVoteCount = reviews.value[reviewIndex].helpfulVotes || 0;

    // Optimistic UI
    userVotes.value[reviewId] = !isCurrentlyVoted;
    if (reviewIndex !== -1) { reviews.value[reviewIndex].helpfulVotes = isCurrentlyVoted ? Math.max(0, originalVoteCount - 1) : originalVoteCount + 1; }

    try {
      let updatedReviewData;
      if (isCurrentlyVoted) { updatedReviewData = await reviewService.unvoteHelpful(reviewId); }
      else { updatedReviewData = await reviewService.voteHelpful(reviewId); }
      console.log(`Vote toggle successful for review ${reviewId}`);
      // Update local data with server response
      if (reviewIndex !== -1 && updatedReviewData) { reviews.value[reviewIndex].helpfulVotes = updatedReviewData.helpfulVotes; }
      userVotes.value[reviewId] = !isCurrentlyVoted;
    } catch (err) {
      console.error("Error toggling helpful vote:", err);
      // Use backend message if available, otherwise use translated fallback
      voteError.value = err.message || t('reviewList.error.defaultVoteError');
      // Revert Optimistic UI
      userVotes.value[reviewId] = isCurrentlyVoted;
      if (reviewIndex !== -1 && originalVoteCount !== -1) { reviews.value[reviewIndex].helpfulVotes = originalVoteCount; }
      setTimeout(() => { voteError.value = null; }, 4000);
    }
  };


  // --- Watchers & Lifecycle --- (no changes)
  watch(() => props.productId, (newId, oldId) => { if (newId && newId !== oldId) fetchReviews(1); });
  onMounted(() => { fetchReviews(); });
  defineExpose({ refreshReviews: fetchReviews });

</script>

<style scoped>
  /* Styles remain the same */
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
      height: 40px;
      padding: 0.5rem 2.5rem 0.5rem 0.8rem;
      font-size: 0.9rem;
    }

  .review-list__loading, .review-list__error, .review-list__empty {
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

  .review-list__pagination {
    margin-top: 2rem;
  }

  .review-list__vote-error {
    color: var(--secondary);
    font-size: 0.85rem;
    text-align: center;
    margin-top: 1rem;
    font-weight: 500;
  }
</style>
