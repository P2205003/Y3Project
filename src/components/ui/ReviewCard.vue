<template>
  <article class="review-card" :class="{ 'confirming-delete': confirmingDelete }">
    <header class="review-card__header">
      <!-- Left Side: Author/Rating -->
      <div class="review-card__author-rating">
        <StarRatingDisplay :rating="review.rating" class="review-card__stars" />
        <span class="review-card__author">{{ t('reviewCard.authorPrefix') }} {{ review.username || t('reviewCard.anonymous') }}</span>
        <span v-if="review.isVerifiedPurchase" class="review-card__verified" :title="t('reviewCard.verifiedPurchase')">
          <font-awesome-icon icon="check" /> {{ t('reviewCard.verifiedPurchase') }}
        </span>
      </div>

      <!-- Right Side: Date & Delete/Confirm Actions -->
      <div class="review-card__meta-actions">
        <time class="review-card__date" :datetime="review.createdAt">
          {{ formatDateRelative(review.createdAt) }}
        </time>

        <!-- Initial Delete Button -->
        <button v-if="isAuthor && !confirmingDelete"
                @click="requestConfirmDelete"
                class="review-card__delete-button"
                :title="t('reviewCard.deleteButton.title')">
          <font-awesome-icon icon="trash-alt" />
          <span class="visually-hidden">{{ t('reviewCard.deleteButton.label') }}</span>
        </button>

        <!-- Confirmation Actions -->
        <div v-if="isAuthor && confirmingDelete" class="review-card__confirm-actions">
          <button @click="executeDelete"
                  class="button button--danger button--small confirm-delete-button"
                  :disabled="isParentDeleting"
                  :aria-label="t('reviewCard.deleteButton.confirmLabel')">
            <font-awesome-icon v-if="isParentDeleting" icon="spinner" spin />
            <font-awesome-icon v-else icon="check" />
            <span>{{ t('reviewCard.deleteButton.confirmText') }}</span>
          </button>
          <button @click="cancelDelete"
                  class="button button--secondary button--small cancel-delete-button"
                  :disabled="isParentDeleting"
                  :aria-label="t('reviewCard.deleteButton.cancelLabel')">
            <font-awesome-icon icon="times" />
            <span>{{ t('reviewCard.deleteButton.cancelText') }}</span>
          </button>
        </div>
      </div>
    </header>

    <div class="review-card__body">
      <h5 v-if="review.title" class="review-card__title">{{ review.title }}</h5>
      <p class="review-card__text">{{ review.body }}</p>
    </div>

    <footer class="review-card__footer">
      <span class="review-card__helpful-count">
        {{ t('reviewCard.helpfulCount', currentHelpfulVotes) }}
      </span>
      <button class="review-card__helpful-button"
              :class="{ 'voted': hasVoted }"
              @click="emitToggleHelpful"
              :disabled="voteLoading || isParentDeleting || confirmingDelete"
              :aria-pressed="hasVoted"
              :title="t(hasVoted ? 'reviewCard.helpfulButton.undoHelpfulTitle' : 'reviewCard.helpfulButton.markAsHelpfulTitle')">
        <font-awesome-icon :icon="hasVoted ? ['fas', 'thumbs-up'] : ['far', 'thumbs-up']" />
        <span>{{ t(hasVoted ? 'reviewCard.helpfulButton.cancel' : 'reviewCard.helpfulButton.helpful') }}</span>
      </button>
    </footer>

    <!-- Seller Response (optional) -->
    <div v-if="review.sellerResponse && review.sellerResponse.body" class="review-card__seller-response">
      <!-- ... seller response content ... -->
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

  const { t } = useI18n();

  const props = defineProps({
    review: { type: Object, required: true },
    hasVoted: { type: Boolean, default: false },
    currentUserId: { type: String, default: null },
    isParentDeleting: { type: Boolean, default: false } // Track if parent (ReviewList) is busy deleting *any* review
  });

  const emit = defineEmits(['toggle-helpful', 'delete-review']);

  const voteLoading = ref(false);
  const confirmingDelete = ref(false); // NEW: State to track if confirmation is showing
  const currentHelpfulVotes = ref(props.review.helpfulVotes || 0);

  const isAuthor = computed(() => {
    return props.currentUserId && props.review.userId && props.currentUserId === props.review.userId;
  });

  watch(() => props.review.helpfulVotes, (newVoteCount) => {
    currentHelpfulVotes.value = newVoteCount || 0;
  });

  // Reset confirmation state if parent finishes deleting (e.g., if deletion failed and card remains)
  watch(() => props.isParentDeleting, (newValue, oldValue) => {
    if (oldValue === true && newValue === false && confirmingDelete.value) {
      // If parent was deleting and now isn't, and we were stuck confirming, reset.
      confirmingDelete.value = false;
    }
  });


  const formatDateRelative = (dateString) => {
    // ... (keep existing date formatting logic) ...
    if (!dateString) return 'N/A';
    const date = new Date(dateString); const now = new Date(); const seconds = Math.round((now - date) / 1000); const minutes = Math.round(seconds / 60); const hours = Math.round(minutes / 60); const days = Math.round(hours / 24);
    if (seconds < 60) return t('reviewCard.dateRelative.justNow'); if (minutes < 60) return t(minutes > 1 ? 'reviewCard.dateRelative.minutesAgo' : 'reviewCard.dateRelative.minuteAgo', { count: minutes }); if (hours < 24) return t(hours > 1 ? 'reviewCard.dateRelative.hoursAgo' : 'reviewCard.dateRelative.hourAgo', { count: hours }); if (days < 7) return t(days > 1 ? 'reviewCard.dateRelative.daysAgo' : 'reviewCard.dateRelative.dayAgo', { count: days });
    const options = { year: 'numeric', month: 'short', day: 'numeric' }; const formattedDate = date.toLocaleDateString('en-US', options); return t('reviewCard.dateRelative.default', { date: formattedDate });
  };

  const emitToggleHelpful = async () => {
    // ... (keep existing helpful vote logic, ensure it doesn't run if confirming delete) ...
    if (confirmingDelete.value || props.isParentDeleting) return; // Prevent action
    voteLoading.value = true;
    try {
      if (props.hasVoted) { currentHelpfulVotes.value = Math.max(0, currentHelpfulVotes.value - 1); } else { currentHelpfulVotes.value++; }
      emit('toggle-helpful', { reviewId: props.review._id, currentState: props.hasVoted });
    } finally {
      setTimeout(() => { voteLoading.value = false; }, 700);
    }
  };

  // --- Delete Logic ---
  const requestConfirmDelete = () => {
    if (props.isParentDeleting) return; // Don't enter confirmation if parent is busy
    confirmingDelete.value = true;
  };

  const cancelDelete = () => {
    confirmingDelete.value = false;
  };

  const executeDelete = () => {
    if (props.isParentDeleting) return; // Double check parent isn't busy
    // No need for local isDeleting state, parent handles the loading state
    emit('delete-review', props.review._id);
    // Keep confirmingDelete = true visually until parent process finishes
    // The watch() on isParentDeleting will handle resetting if needed
  };

</script>

<style scoped>
  /* --- Base Card Styles --- */
  .review-card {
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-small);
    margin-bottom: 1.5rem;
    background-color: var(--white);
    box-shadow: var(--shadow-sm);
    transition: box-shadow var(--transition-fast), border-color 0.2s ease-in-out; /* Add border transition */
    overflow: hidden;
  }

    .review-card:hover {
      box-shadow: var(--shadow-md);
    }
    /* Style when confirmation is active */
    .review-card.confirming-delete {
      border-color: var(--warning); /* Highlight border */
      box-shadow: 0 0 0 3px rgba(var(--warning-rgb), 0.2); /* Subtle glow */
    }


  /* --- Header --- */
  .review-card__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 0.8rem 1rem;
    border-bottom: 1px solid var(--border-color);
    background-color: var(--bg-off-light);
    flex-wrap: wrap;
    gap: 0.5rem 1rem;
  }

  /* Left Side: Author/Rating */
  .review-card__author-rating {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .review-card__stars {
    font-size: 0.9em;
    color: var(--star-color, #facc15);
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
    font-weight: 500;
  }

  /* Right Side: Meta & Actions */
  .review-card__meta-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-shrink: 0;
    margin-left: auto; /* Pushes this section to the right */
  }

  .review-card__date {
    font-size: 0.8rem;
    color: var(--text-muted);
    white-space: nowrap;
  }

  /* --- Initial Delete Button --- */
  .review-card__delete-button {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0.2rem 0.4rem;
    font-size: 0.85rem;
    border-radius: var(--border-radius-small);
    line-height: 1;
    transition: all var(--transition-fast);
  }

    .review-card__delete-button:hover:not(:disabled) {
      color: var(--secondary);
      background-color: rgba(255, 107, 107, 0.1);
    }

    .review-card__delete-button:focus-visible {
      outline: 2px solid var(--secondary);
      outline-offset: 1px;
      color: var(--secondary);
    }

    .review-card__delete-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      color: var(--text-muted);
      background-color: transparent;
    }

    .review-card__delete-button .svg-inline--fa {
      vertical-align: middle;
    }


  /* --- Confirmation Action Buttons --- */
  .review-card__confirm-actions {
    display: inline-flex; /* Keep buttons inline */
    gap: 0.5rem; /* Space between confirm/cancel */
    align-items: center;
  }

    /* Shared Button Styles (Leveraging existing global/local button classes) */
    .review-card__confirm-actions .button--small {
      padding: 0.3rem 0.7rem; /* Adjust padding for small size */
      font-size: 0.8rem;
      line-height: 1.2; /* Adjust line height for icons */
      display: inline-flex;
      align-items: center;
      gap: 0.4em; /* Space between icon and text */
    }

    .review-card__confirm-actions .button svg {
      font-size: 0.9em; /* Slightly smaller icon */
    }

  /* Specific Button Styles (Optional overrides if needed) */
  .confirm-delete-button {
    /* Uses .button--danger */
  }

  .cancel-delete-button {
    /* Uses .button--secondary */
  }

  .review-card__confirm-actions .button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }


  /* --- Body --- */
  .review-card__body {
    padding: 1rem 1.2rem;
  }

  .review-card__title {
    font-size: 1.05rem;
    font-weight: 600;
    margin: 0 0 0.6rem 0;
    color: var(--text-darker);
  }

  .review-card__text {
    font-size: 0.95rem;
    line-height: 1.6;
    color: var(--text-medium);
    margin: 0;
    white-space: pre-wrap;
  }

  /* --- Footer --- */
  .review-card__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    border-top: 1px solid var(--border-color);
    background-color: var(--white);
    font-size: 0.85rem;
  }

  .review-card__helpful-count {
    color: var(--text-muted);
    flex-shrink: 0;
    margin-right: 1rem;
    line-height: 1.4;
  }

  /* Helpful Button Styles (Copied from original, ensure vars are defined) */
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
      background-color: rgba(var(--primary-rgb), 0.1);
      color: var(--primary);
      border-color: rgba(var(--primary-rgb), 0.5);
      box-shadow: none;
      transform: none;
    }

      .review-card__helpful-button.voted:hover:not(:disabled) {
        background-color: rgba(var(--secondary-rgb), 0.1);
        color: var(--secondary);
        border-color: rgba(var(--secondary-rgb), 0.5);
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

  /* --- Seller Response --- */
  .review-card__seller-response {
    background-color: var(--bg-light);
    border-top: 1px dashed var(--border-color);
    padding: 0.8rem 1.2rem 1rem 1.2rem;
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
    color: var(--text-medium);
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
