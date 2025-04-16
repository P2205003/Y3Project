// src/components/ui/ReviewCard.vue
<template>
  <article class="review-card">
    <header class="review-card__header">
      <div class="review-card__author-rating">
        <StarRatingDisplay :rating="review.rating" class="review-card__stars" />
        <span class="review-card__author">{{ t('reviewCard.authorPrefix') }} {{ review.username || t('reviewCard.anonymous') }}</span>
        <span v-if="review.isVerifiedPurchase" class="review-card__verified" :title="t('reviewCard.verifiedPurchase')">
          <font-awesome-icon :icon="['fas', 'check']" /> {{ t('reviewCard.verifiedPurchase') }}
        </span>
      </div>
      <time class="review-card__date" :datetime="review.createdAt">
        {{ formatDateRelative(review.createdAt) }}
      </time>
    </header>
    <div class="review-card__body">
      <h5 v-if="review.title" class="review-card__title">{{ review.title }}</h5>
      <p class="review-card__text">{{ review.body }}</p>
    </div>

    <footer class="review-card__footer">
      <!-- Left Side: Helpful Info - Hide if it's the owner's review -->
      <div v-if="!isOwner" class="review-card__helpful-info">
        <span class="review-card__helpful-count">
          {{ t('reviewCard.helpfulCount', currentHelpfulVotes) }}
        </span>
        <button class="review-card__helpful-button"
                :class="{ 'voted': hasVoted }"
                @click="emitToggleHelpful"
                :disabled="voteLoading || showDeleteConfirmation"
                :aria-pressed="hasVoted"
                :title="t(hasVoted ? 'reviewCard.helpfulButton.undoHelpfulTitle' : 'reviewCard.helpfulButton.markAsHelpfulTitle')">
          <font-awesome-icon :icon="hasVoted ? ['fas', 'thumbs-up'] : ['far', 'thumbs-up']" />
          <span>{{ t(hasVoted ? 'reviewCard.helpfulButton.cancel' : 'reviewCard.helpfulButton.helpful') }}</span>
        </button>
      </div>
      <!-- Placeholder to maintain space when helpful info is hidden -->
      <div v-else class="review-card__helpful-info--placeholder"></div>

      <!-- Right Side: Delete Action (Conditional) -->
      <div class="review-card__user-actions">
        <!-- Delete Button (if owner and not confirming) -->
        <button v-if="isOwner && !showDeleteConfirmation"
                @click="requestDelete"
                class="button enhanced-button danger small delete-button">
          <font-awesome-icon :icon="['fas', 'trash']" />
          <span>{{ t('reviewCard.deleteButton') }}</span>
        </button>

        <!-- Delete Confirmation Controls (if owner and confirming) -->
        <div v-else-if="isOwner && showDeleteConfirmation" class="delete-confirmation">
          <button @click="confirmDelete" class="button enhanced-button danger small confirm-btn" :disabled="isDeleting" :aria-label="t('reviewCard.deleteConfirm.confirmButton')">
            <font-awesome-icon :icon="['fas', 'spinner']" spin v-if="isDeleting" />
            <font-awesome-icon :icon="['fas', 'check']" v-else />
          </button>
          <button @click="cancelDelete" class="button enhanced-button secondary small cancel-btn" :disabled="isDeleting" :aria-label="t('reviewCard.deleteConfirm.cancelButton')">
            <font-awesome-icon :icon="['fas', 'times']" />
          </button>
        </div>
      </div>
    </footer>

    <!-- Seller Response (optional) -->
    <div v-if="review.sellerResponse && review.sellerResponse.body" class="review-card__seller-response">
      <h6 class="seller-response__title">{{ t('reviewCard.sellerResponse.title') }}</h6>
      <p class="seller-response__body">{{ review.sellerResponse.body }}</p>
      <time class="seller-response__date" :datetime="review.sellerResponse.date">
        {{ formatDateRelative(review.sellerResponse.date) }}
      </time>
    </div>
  </article>
</template>

<script setup>
  import { ref, computed, watch } from 'vue';
  import { useI18n } from 'vue-i18n';
  import StarRatingDisplay from './StarRatingDisplay.vue';
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
  // Ensure necessary icons are added in main.js or here if not global
  import { library } from '@fortawesome/fontawesome-svg-core';
  import { faCheck, faThumbsUp as fasThumbsUp, faTrash, faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';
  import { faThumbsUp as farThumbsUp } from '@fortawesome/free-regular-svg-icons';

  library.add(fasThumbsUp, farThumbsUp, faCheck, faTrash, faTimes, faSpinner); // Ensure icons are added

  const { t, locale } = useI18n();

  const props = defineProps({
    review: {
      type: Object,
      required: true
    },
    hasVoted: {
      type: Boolean,
      default: false
    },
    currentUserId: {
      type: String,
      default: null
    }
  });

  const emit = defineEmits(['toggle-helpful', 'delete-review']);

  const voteLoading = ref(false);
  const currentHelpfulVotes = ref(props.review.helpfulVotes || 0);
  const showDeleteConfirmation = ref(false);
  const isDeleting = ref(false);

  const isOwner = computed(() => props.currentUserId && props.review.userId && props.currentUserId === props.review.userId);

  watch(() => props.review.helpfulVotes, (newVoteCount) => {
    currentHelpfulVotes.value = newVoteCount || 0;
  });

  // --- Date Formatting Helpers ---
  const formatDate = (dateString, options = { dateStyle: 'medium', timeStyle: 'short' }) => {
    if (!dateString) return 'N/A';
    try {
      // Use the locale code derived from the i18n instance for formatting
      const currentLocaleCode = t('dates.localeCode'); // Assumes 'dates.localeCode' exists in your locale files (e.g., 'en-US', 'zh-CN')
      return new Intl.DateTimeFormat(currentLocaleCode, options).format(new Date(dateString));
    }
    catch (e) {
      console.error("Error formatting date:", e);
      // Fallback to a basic format if locale formatting fails
      try {
        return new Date(dateString).toLocaleDateString();
      } catch {
        return 'Invalid Date';
      }
    }
  };

  const formatDateRelative = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now - date) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);
    const weeks = Math.round(days / 7);
    const months = Math.round(days / 30); // Approximation
    const years = Math.round(days / 365); // Approximation

    // Use translated keys, providing English defaults
    if (seconds < 60) return t('dates.relative.justNow', 'just now');
    if (minutes < 60) return t(minutes > 1 ? 'dates.relative.minutesAgo' : 'dates.relative.minuteAgo', { count: minutes }, `${minutes} min ago`);
    if (hours < 24) return t(hours > 1 ? 'dates.relative.hoursAgo' : 'dates.relative.hourAgo', { count: hours }, `${hours} hr ago`);
    // Special case for 'yesterday' in Chinese (or other languages if needed)
    if (days === 1 && locale.value.startsWith('zh')) return t('dates.relative.dayAgo', 'yesterday');
    if (days < 7) return t(days > 1 ? 'dates.relative.daysAgo' : 'dates.relative.dayAgo', { count: days }, `${days} day${days > 1 ? 's' : ''} ago`);
    if (weeks < 4) return t(weeks > 1 ? 'dates.relative.weeksAgo' : 'dates.relative.weekAgo', { count: weeks }, `${weeks} week${weeks > 1 ? 's' : ''} ago`);
    if (months < 12) return t(months > 1 ? 'dates.relative.monthsAgo' : 'dates.relative.monthAgo', { count: months }, `${months} month${months > 1 ? 's' : ''} ago`);
    if (years > 0) return t(years > 1 ? 'dates.relative.yearsAgo' : 'dates.relative.yearAgo', { count: years }, `${years} year${years > 1 ? 's' : ''} ago`);

    // Fallback if none of the above match (should be rare)
    const formattedDate = formatDate(dateString, { dateStyle: 'short' });
    return t('dates.relative.default', { date: formattedDate }, `on ${formattedDate}`);
  };

  // --- Event Handlers ---
  const emitToggleHelpful = async () => {
    if (showDeleteConfirmation.value) return; // Prevent voting during delete confirmation
    voteLoading.value = true;
    try {
      // Optimistic update
      if (props.hasVoted) {
        currentHelpfulVotes.value = Math.max(0, currentHelpfulVotes.value - 1);
      } else {
        currentHelpfulVotes.value++;
      }
      // Emit event for parent (ReviewList) to handle API call
      emit('toggle-helpful', { reviewId: props.review._id, currentState: props.hasVoted });
    } finally {
      // Simulate network delay slightly longer for visual feedback
      setTimeout(() => { voteLoading.value = false; }, 700);
    }
  };

  const requestDelete = () => {
    showDeleteConfirmation.value = true;
  };

  const cancelDelete = () => {
    showDeleteConfirmation.value = false;
    isDeleting.value = false; // Reset loading state on cancel
  };

  const confirmDelete = async () => {
    if (!isOwner.value) return; // Safety check
    isDeleting.value = true; // Show loading state on confirm button
    try {
      // Emit the event to the parent component (ReviewList)
      emit('delete-review', props.review._id);
      // Let the parent handle the API call, success/error feedback, and list update.
      // Don't reset state here, parent might need it until API call finishes.
    } catch (error) {
      // This catch block might not be necessary if the parent handles errors robustly
      console.error("Error emitting delete event from ReviewCard:", error);
      isDeleting.value = false; // Reset loading state if emit itself fails (unlikely)
      showDeleteConfirmation.value = false;
    }
    // Parent (ReviewList) will eventually cause this component to be removed or updated.
  };

  // Reset delete confirmation state if the underlying review changes
  watch(() => props.review._id, () => {
    showDeleteConfirmation.value = false;
    isDeleting.value = false;
  });

</script>

<style scoped>
  /* --- Base Button Enhancements (copied from main.css for standalone use if needed) --- */
  .button.enhanced-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5em;
    border-radius: var(--border-radius-small);
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    transition: all var(--transition-fast);
    padding: 0.6rem 1.2rem;
    font-size: 0.9rem;
    border: 1px solid transparent;
    line-height: 1.4;
    white-space: nowrap;
  }

    .button.enhanced-button:not(:disabled):hover, .button.enhanced-button:not(:disabled):focus-visible {
      transform: translateY(-2px);
      box-shadow: var(--shadow-soft);
      outline: none;
    }

    .button.enhanced-button:not(:disabled):active {
      transform: translateY(0px) scale(0.98);
      box-shadow: none;
    }

    .button.enhanced-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .button.enhanced-button.primary {
      background-color: var(--primary);
      color: var(--white);
      border-color: var(--primary);
    }

      .button.enhanced-button.primary:not(:disabled):hover, .button.enhanced-button.primary:not(:disabled):focus-visible {
        background-color: #3dbbab;
        border-color: #3dbbab;
        box-shadow: 0 6px 15px rgba(78, 205, 196, 0.2);
      }

    .button.enhanced-button.secondary {
      background-color: var(--white);
      color: var(--text-muted);
      border-color: var(--border-color);
    }

      .button.enhanced-button.secondary:not(:disabled):hover, .button.enhanced-button.secondary:not(:disabled):focus-visible {
        background-color: var(--bg-off-light);
        border-color: var(--text-muted);
        color: var(--text-dark);
      }

      .button.enhanced-button.secondary:not(:disabled):active {
        background-color: #e9ecef;
      }

    .button.enhanced-button.danger {
      background-color: transparent;
      color: var(--secondary);
      border-color: var(--secondary);
    }

      .button.enhanced-button.danger:not(:disabled):hover, .button.enhanced-button.danger:not(:disabled):focus-visible {
        background-color: var(--secondary);
        color: var(--white);
        border-color: var(--secondary);
        box-shadow: 0 6px 15px rgba(255, 107, 107, 0.2);
      }

      .button.enhanced-button.danger:not(:disabled):active {
        background-color: #d63031;
        color: var(--white);
        border-color: #d63031;
      }

    .button.enhanced-button.small {
      padding: 0.4rem 0.8rem;
      font-size: 0.8rem;
    }


  .review-card {
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-small);
    margin-bottom: 1.5rem;
    background-color: var(--white);
  }

  .review-card__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 0.8rem 1rem;
    border-bottom: 1px solid var(--border-color);
    background-color: var(--bg-off-light);
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .review-card__author-rating {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .review-card__stars {
    font-size: 0.9em;
  }

  .review-card__author {
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--text-dark);
  }

  .review-card__verified {
    font-size: 0.75rem;
    color: #0f5132;
    background-color: #d1e7dd;
    padding: 0.15rem 0.5rem;
    border-radius: 10px;
    border: 1px solid #badbcc;
    display: inline-flex;
    align-items: center;
    gap: 0.3em;
  }

    .review-card__verified svg {
      font-size: 0.9em;
    }

  .review-card__date {
    font-size: 0.8rem;
    color: var(--text-muted);
    flex-shrink: 0;
    margin-left: auto;
    align-self: center;
  }

  .review-card__body {
    padding: 1rem;
  }

  .review-card__title {
    font-size: 1.05rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
  }

  .review-card__text {
    font-size: 0.95rem;
    line-height: 1.6;
    color: var(--text-muted);
    margin: 0;
    white-space: pre-wrap;
  }

  .review-card__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    border-top: 1px solid var(--border-color);
    background-color: var(--white);
    font-size: 0.85rem;
    min-height: 50px;
  }

  .review-card__helpful-info {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    flex-shrink: 0;
  }

  .review-card__helpful-info--placeholder {
    min-width: 100px;
    visibility: hidden;
  }

  .review-card__helpful-count {
    color: var(--text-muted);
    line-height: 1.4;
  }

  .review-card__helpful-button {
    background: none;
    border: 1px solid var(--border-color);
    padding: 0.4rem 0.9rem;
    border-radius: 20px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.4em;
    color: var(--text-muted);
    font-weight: 600;
    font-size: 0.8rem;
    transition: all var(--transition-fast);
  }

    .review-card__helpful-button:hover:not(:disabled):not(.voted) {
      background-color: var(--bg-off-light);
      color: var(--primary);
      border-color: var(--primary);
      transform: translateY(-1px);
      box-shadow: var(--shadow-soft);
    }

    .review-card__helpful-button:focus-visible {
      outline: 2px solid var(--primary);
      outline-offset: 2px;
      border-color: var(--primary);
      color: var(--primary);
    }

    .review-card__helpful-button.voted {
      background-color: rgba(78, 205, 196, 0.1);
      color: var(--primary);
      border-color: rgba(78, 205, 196, 0.5);
      box-shadow: none;
      transform: none;
    }

      .review-card__helpful-button.voted:hover:not(:disabled) {
        background-color: rgba(255, 107, 107, 0.1);
        color: var(--secondary);
        border-color: rgba(255, 107, 107, 0.5);
        transform: translateY(-1px);
        box-shadow: var(--shadow-soft);
      }

    .review-card__helpful-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .review-card__helpful-button .svg-inline--fa {
      vertical-align: middle;
    }

  .review-card__user-actions {
    position: relative;
    margin-left: auto;
    flex-shrink: 0;
    min-height: 28px;
    display: flex;
    align-items: center;
  }

  .delete-button {
    padding: 0.4rem 0.8rem !important;
    font-size: 0.8rem !important;
    min-width: 80px;
  }

    .delete-button svg {
      margin-right: 0.4em;
    }

  .delete-confirmation {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

    .delete-confirmation .button.small {
      padding: 0.3rem 0.6rem !important;
      font-size: 0.8rem !important;
      min-width: 40px;
      min-height: 28px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .delete-confirmation .button svg {
      margin: 0;
    }

  .review-card__seller-response {
    background-color: #f9f9f9;
    border-top: 1px dashed var(--border-color);
    padding: 0.8rem 1rem;
    margin: 0 1rem 1rem 1rem;
    border-radius: var(--border-radius-small);
  }

  .seller-response__title {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-dark);
    margin: 0 0 0.3rem 0;
  }

  .seller-response__body {
    font-size: 0.9rem;
    color: var(--text-muted);
    line-height: 1.5;
    margin: 0 0 0.3rem 0;
    white-space: pre-wrap;
  }

  .seller-response__date {
    display: block;
    text-align: right;
    font-size: 0.75rem;
    color: var(--text-muted);
  }
</style>
