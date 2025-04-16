<template>
  <article class="review-card">
    <header class="review-card__header">
      <div class="review-card__author-rating">
        <StarRatingDisplay :rating="review.rating" class="review-card__stars" />
        <span class="review-card__author">{{ t('reviewCard.authorPrefix') }} {{ review.username || t('reviewCard.anonymous') }}</span>
        <span v-if="review.isVerifiedPurchase" class="review-card__verified" :title="t('reviewCard.verifiedPurchase')">
          <font-awesome-icon icon="check" /> {{ t('reviewCard.verifiedPurchase') }}
        </span>
      </div>
      <time class="review-card__date" :datetime="review.createdAt">
        {{ formatDateRelative(review.createdAt) }} <!-- Keep relative date logic for now -->
      </time>
    </header>
    <div class="review-card__body">
      <h5 v-if="review.title" class="review-card__title">{{ review.title }}</h5>
      <p class="review-card__text">{{ review.body }}</p> <!-- Body text is dynamic -->
    </div>
    <footer class="review-card__footer">
      <span class="review-card__helpful-count">
        {{ t('reviewCard.helpfulCount', currentHelpfulVotes) }}
      </span>
      <button class="review-card__helpful-button"
              :class="{ 'voted': hasVoted }"
              @click="emitToggleHelpful"
              :disabled="voteLoading"
              :aria-pressed="hasVoted"
              :title="t(hasVoted ? 'reviewCard.helpfulButton.undoHelpfulTitle' : 'reviewCard.helpfulButton.markAsHelpfulTitle')">
        <font-awesome-icon :icon="hasVoted ? ['fas', 'thumbs-up'] : ['far', 'thumbs-up']" />
        <span>{{ t(hasVoted ? 'reviewCard.helpfulButton.cancel' : 'reviewCard.helpfulButton.helpful') }}</span>
      </button>
    </footer>
    <!-- Seller Response (optional) -->
    <div v-if="review.sellerResponse && review.sellerResponse.body" class="review-card__seller-response">
      <h6 class="seller-response__title">{{ t('reviewCard.sellerResponse.title') }}</h6>
      <p class="seller-response__body">{{ review.sellerResponse.body }}</p> <!-- Seller response body is dynamic -->
      <time class="seller-response__date" :datetime="review.sellerResponse.date">
        {{ formatDateRelative(review.sellerResponse.date) }} <!-- Keep relative date logic -->
      </time>
    </div>
  </article>
</template>

<script setup>
  import { ref, computed, watch } from 'vue';
  import { useI18n } from 'vue-i18n'; // Import useI18n
  import StarRatingDisplay from './StarRatingDisplay.vue';

  // Get translation function
  const { t } = useI18n();

  const props = defineProps({
    review: {
      type: Object,
      required: true
    },
    hasVoted: {
      type: Boolean,
      default: false
    }
  });

  const emit = defineEmits(['toggle-helpful']);

  const voteLoading = ref(false);
  const currentHelpfulVotes = ref(props.review.helpfulVotes || 0);

  watch(() => props.review.helpfulVotes, (newVoteCount) => {
    currentHelpfulVotes.value = newVoteCount || 0;
  });

  // --- Relative Date Formatting ---
  // NOTE: This function is NOT fully internationalized.
  // A dedicated library or Intl.RelativeTimeFormat is recommended for robust i18n.
  const formatDateRelative = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now - date) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    // Use simplistic translated parts
    if (seconds < 60) return t('reviewCard.dateRelative.justNow');
    if (minutes < 60) return t(minutes > 1 ? 'reviewCard.dateRelative.minutesAgo' : 'reviewCard.dateRelative.minuteAgo', { count: minutes });
    if (hours < 24) return t(hours > 1 ? 'reviewCard.dateRelative.hoursAgo' : 'reviewCard.dateRelative.hourAgo', { count: hours });
    if (days < 7) return t(days > 1 ? 'reviewCard.dateRelative.daysAgo' : 'reviewCard.dateRelative.dayAgo', { count: days });

    // Fallback to default formatted date
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options); // Keep locale consistent for fallback format for now
    return t('reviewCard.dateRelative.default', { date: formattedDate });
  };

  const emitToggleHelpful = async () => {
    voteLoading.value = true;
    try {
      if (props.hasVoted) { currentHelpfulVotes.value = Math.max(0, currentHelpfulVotes.value - 1); }
      else { currentHelpfulVotes.value++; }
      emit('toggle-helpful', { reviewId: props.review._id, currentState: props.hasVoted });
    } finally {
      setTimeout(() => { voteLoading.value = false; }, 700);
    }
  };

</script>

<style scoped>
  /* Styles remain the same */
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

  .review-card__date {
    font-size: 0.8rem;
    color: var(--text-muted);
    flex-shrink: 0;
    margin-left: auto;
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
  }

  .review-card__helpful-count {
    color: var(--text-muted);
    flex-shrink: 0;
    margin-right: 1rem;
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
  }

  .seller-response__date {
    display: block;
    text-align: right;
    font-size: 0.75rem;
    color: var(--text-muted);
  }
</style>
