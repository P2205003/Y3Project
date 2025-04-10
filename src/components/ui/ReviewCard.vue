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
        {{ review.helpfulVotes || 0 }} people found this helpful
      </span>
      <button class="review-card__helpful-button"
              @click="emitVoteHelpful"
              :disabled="voteLoading"
              :aria-pressed="hasVoted"
              :title="hasVoted ? 'You found this helpful' : 'Mark as helpful'">
        <font-awesome-icon :icon="hasVoted ? ['fas', 'thumbs-up'] : ['far', 'thumbs-up']" />
        <span>Helpful</span>
      </button>
    </footer>
    <!-- Seller Response (optional) -->
    <div v-if="review.sellerResponse && review.sellerResponse.body" class="review-card__seller-response">
      <h6 class="seller-response__title">Response from Seller:</h6>
      <p class="seller-response__body">{{ review.sellerResponse.body }}</p>
      <time class="seller-response__date" :datetime="review.sellerResponse.date">
        {{ formatDateRelative(review.sellerResponse.date) }}
      </time>
    </div>
  </article>
</template>

<script setup>
import { ref } from 'vue';
import StarRatingDisplay from './StarRatingDisplay.vue';
// FontAwesomeIcon imported globally

const props = defineProps({
  review: {
    type: Object,
    required: true
  },
  // Add prop to indicate if current user has voted (needs logic in parent)
  hasVoted: {
      type: Boolean,
      default: false
  }
});

const emit = defineEmits(['vote-helpful']);

const voteLoading = ref(false); // Local state for loading indicator

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

const emitVoteHelpful = async () => {
    if (props.hasVoted) return; // Prevent voting again if already voted
    voteLoading.value = true;
    try {
        // Emit event for parent (ReviewList) to handle API call
        emit('vote-helpful', props.review._id);
        // Parent component will handle updating the review's state/vote count
    } finally {
        // Consider removing loading state here, let parent manage it fully
         // Or keep it for immediate UI feedback, but parent MUST update hasVoted prop
         setTimeout(() => { voteLoading.value = false; }, 500); // Simulate delay
    }
};

</script>

<style scoped>
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
    flex-wrap: wrap; /* Allow wrapping on small screens */
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
    color: #0f5132; /* Success green */
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
    white-space: pre-wrap; /* Preserve line breaks */
  }

  .review-card__footer {
    display: flex; /* Use flexbox for layout */
    justify-content: space-between; /* Push count and button apart */
    align-items: center; /* Vertically center items */
    padding: 0.75rem 1rem; /* Consistent padding */
    border-top: 1px solid var(--border-color); /* Keep the separator */
    background-color: var(--white); /* Ensure light background */
    font-size: 0.85rem; /* Base font size for footer elements */
  }

  /* Helpful Count Text */
  .review-card__helpful-count {
    color: var(--text-muted); /* Use muted text color */
    flex-shrink: 0; /* Prevent shrinking if button text is long */
    margin-right: 1rem; /* Space between count and button */
    line-height: 1.4; /* Ensure text aligns well */
  }

  /* Helpful Button */
  .review-card__helpful-button {
    /* Reset & Base */
    background: none;
    border: 1px solid var(--border-color); /* Subtle default border */
    padding: 0.4rem 0.9rem; /* Adjust padding for comfortable click */
    border-radius: 20px; /* Pill shape */
    cursor: pointer;
    /* Content Alignment & Color */
    display: inline-flex; /* Align icon and text */
    align-items: center;
    gap: 0.4em; /* Space between icon and text */
    color: var(--text-muted); /* Default muted color */
    font-weight: 600;
    font-size: 0.8rem; /* Slightly smaller font */
    /* Transitions */
    transition: background-color var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast), transform var(--transition-fast), box-shadow var(--transition-fast);
  }

    /* Hover State (only when not disabled and not already pressed) */
    .review-card__helpful-button:hover:not(:disabled):not([aria-pressed="true"]) {
      background-color: var(--bg-off-light); /* Light background on hover */
      color: var(--primary); /* Primary color text/icon */
      border-color: var(--primary); /* Primary border */
      transform: translateY(-1px); /* Subtle lift */
      box-shadow: var(--shadow-soft); /* Add subtle shadow */
    }

    /* Focus Visible State */
    .review-card__helpful-button:focus-visible {
      outline: 2px solid var(--primary);
      outline-offset: 2px;
      border-color: var(--primary); /* Ensure border matches outline */
      color: var(--primary); /* Consistent color */
    }

    /* Voted/Pressed State */
    .review-card__helpful-button[aria-pressed="true"] {
      background-color: rgba(78, 205, 196, 0.1); /* Very light primary background */
      color: var(--primary); /* Primary color text/icon */
      border-color: rgba(78, 205, 196, 0.5); /* Subtler primary border */
      /* cursor: default; */ /* Optional: Indicate non-clickable */
      box-shadow: none; /* Remove shadow when pressed */
      transform: none; /* Remove lift when pressed */
    }

    /* Disabled State */
    .review-card__helpful-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none; /* Disable hover transform */
      box-shadow: none;
    }

    /* Icon Styling (inherits color, but can be adjusted) */
    .review-card__helpful-button .svg-inline--fa {
      /* font-size: 0.9em; */ /* Example: Make icon slightly smaller than text */
      vertical-align: middle; /* Ensure good alignment */
    }

  .review-card__seller-response {
    background-color: #f9f9f9; /* Slightly different background */
    border-top: 1px dashed var(--border-color);
    padding: 0.8rem 1rem;
    margin: 0 1rem 1rem 1rem; /* Indent slightly */
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
