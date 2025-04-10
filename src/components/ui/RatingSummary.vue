<template>
  <div class="rating-summary">
    <StarRatingDisplay :rating="averageRating" />
    <span v-if="reviewCount > 0" class="review-count">
      ({{ reviewCount }} review{{ reviewCount !== 1 ? 's' : '' }})
    </span>
    <span v-else class="no-reviews">
      (No reviews yet)
    </span>
  </div>
</template>

<script setup>
import StarRatingDisplay from './StarRatingDisplay.vue';

defineProps({
  averageRating: {
    type: Number,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  }
});
</script>

<style scoped>
  .rating-summary {
    display: flex;
    align-items: center;
    gap: 0.5em;
    font-size: 0.9rem;
  }

  .review-count, .no-reviews {
    color: var(--text-muted);
    font-size: 0.85em;
  }
</style>
