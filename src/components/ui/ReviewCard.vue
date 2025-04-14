<template>
  <article class="review-card">
    <header class="review-card__header">
      <div class="review-card__author-rating">
        <StarRatingDisplay :rating="review.rating" class="review-card__stars" />
        <span class="review-card__author">by {{ review.username || 'Anonymous' }}</span>
        <span v-if="review.isVerifiedPurchase" class="review-card__verified" title="Verified Purchase">
          <font-awesome-icon icon="check" /> Verified Purchase
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
      <span class="review-card__helpful-count">
        <!-- Display updated count dynamically -->
        {{ currentHelpfulVotes }} people found this helpful
      </span>
      <button class="review-card__helpful-button"
              :class="{ 'voted': hasVoted }"
              @click="emitToggleHelpful"
              :disabled="voteLoading"
              :aria-pressed="hasVoted"
              :title="hasVoted ? 'Undo helpful vote' : 'Mark as helpful'">
        <!-- Icon changes based on hasVoted -->
        <font-awesome-icon :icon="hasVoted ? ['fas', 'thumbs-up'] : ['far', 'thumbs-up']" />
        <!-- Text changes based on hasVoted -->
        <span>{{ hasVoted ? 'Cancel' : 'Helpful' }}</span>
      </button>
    </footer>
    <!-- Seller Response (optional) -->
    <div v-if="review.sellerResponse && review.sellerResponse.body" class="review-card__seller-response">
      <!-- ... seller response content ... -->
      <h6 class="seller-response__title">Response from Seller:</h6>
      <p class="seller-response__body">{{ review.sellerResponse.body }}</p>
      <time class="seller-response__date" :datetime="review.sellerResponse.date">
        {{ formatDateRelative(review.sellerResponse.date) }}
      </time>
    </div>
  </article>
</template>

<script setup>
import { ref, computed, watch } from 'vue'; // Added watch
import StarRatingDisplay from './StarRatingDisplay.vue';
// FontAwesomeIcon imported globally

const props = defineProps({
  review: {
    type: Object,
    required: true
  },
  hasVoted: { // If the CURRENT user has voted for THIS review
      type: Boolean,
      default: false
  }
});

const emit = defineEmits(['toggle-helpful']); // Changed event name

const voteLoading = ref(false);
// --- NEW: Local state for displaying votes, initialized from prop ---
const currentHelpfulVotes = ref(props.review.helpfulVotes || 0);

// --- Watch for external changes to the review prop (e.g., after list refresh) ---
watch(() => props.review.helpfulVotes, (newVoteCount) => {
    currentHelpfulVotes.value = newVoteCount || 0;
});
// --- Watch for external changes to hasVoted prop ---
// (No specific action needed here, the template reacts directly to hasVoted)
// watch(() => props.hasVoted, (newHasVoted) => { ... });


const formatDateRelative = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now - date) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hr ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
};

const emitToggleHelpful = async () => {
    voteLoading.value = true;
    try {
        // --- Optimistic UI Update ---
        if (props.hasVoted) {
            currentHelpfulVotes.value = Math.max(0, currentHelpfulVotes.value - 1);
        } else {
            currentHelpfulVotes.value++;
        }
        // --- End Optimistic Update ---

        // Emit event for parent (ReviewList) to handle API call
        emit('toggle-helpful', { reviewId: props.review._id, currentState: props.hasVoted });
        // Parent will call appropriate service method and update props/state

    } finally {
         // Parent should ideally signal completion, but we'll use a timeout
         // to prevent rapid double-clicks during API latency.
         setTimeout(() => { voteLoading.value = false; }, 700); // Adjust timeout as needed
    }
};

</script>

<style scoped>
  /* --- Keep existing ReviewCard styles --- */
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

  /* --- Updated Footer Styles --- */
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
    color: var(--text-muted); /* Default color */
    font-weight: 600;
    font-size: 0.8rem;
    transition: all var(--transition-fast);
  }

    /* Default Hover (when NOT voted) */
    .review-card__helpful-button:hover:not(:disabled):not(.voted) {
      background-color: var(--bg-off-light);
      color: var(--primary);
      border-color: var(--primary);
      transform: translateY(-1px);
      box-shadow: var(--shadow-soft);
    }

    /* Focus Visible State */
    .review-card__helpful-button:focus-visible {
      outline: 2px solid var(--primary);
      outline-offset: 2px;
      border-color: var(--primary);
      color: var(--primary);
    }

    /* Voted State */
    .review-card__helpful-button.voted {
      background-color: rgba(78, 205, 196, 0.1); /* Light primary background */
      color: var(--primary); /* Primary color text/icon */
      border-color: rgba(78, 205, 196, 0.5); /* Subtler primary border */
      box-shadow: none;
      transform: none;
    }

      /* Hover State (when ALREADY voted - indicates cancel) */
      .review-card__helpful-button.voted:hover:not(:disabled) {
        background-color: rgba(255, 107, 107, 0.1); /* Light secondary (red) background */
        color: var(--secondary); /* Secondary color text/icon */
        border-color: rgba(255, 107, 107, 0.5); /* Subtler secondary border */
        transform: translateY(-1px);
        box-shadow: var(--shadow-soft);
      }


    /* Disabled State */
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
