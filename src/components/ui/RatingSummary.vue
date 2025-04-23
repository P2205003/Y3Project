<template>
  <div class="rating-summary">
    <StarRatingDisplay :rating="averageRating" />
    <span v-if="reviewCount > 0" class="review-count">
      {{ t('ratingSummary.reviewCount', reviewCount) }}
    </span>
    <span v-else class="no-reviews">
      {{ t('ratingSummary.noReviews') }}
    </span>
  </div>
</template>

<script setup>
  import { useI18n } from 'vue-i18n'; // Import useI18n
  import StarRatingDisplay from './StarRatingDisplay.vue';

  // Get translation function
  const { t } = useI18n();

  const props = defineProps({
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
  /* Styles remain the same */
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
