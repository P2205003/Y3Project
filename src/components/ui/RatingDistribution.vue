<template>
  <div class="rating-distribution" v-if="totalReviews > 0">
    <h4>Rating Breakdown</h4>
    <div class="distribution-bars">
      <div v-for="rating in [5, 4, 3, 2, 1]" :key="`dist-${rating}`" class="distribution-row">
        <span class="rating-label">{{ rating }} star{{ rating !== 1 ? 's' : '' }}</span>
        <div class="bar-container">
          <div class="bar" :style="{ width: calculatePercentage(rating) + '%' }"></div>
        </div>
        <span class="rating-count">{{ distribution[rating] || 0 }}</span>
      </div>
    </div>
  </div>
  <div v-else class="rating-distribution--empty">
    <p>No ratings available to display distribution.</p>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  distribution: {
    type: Object, // Expects { '1': count, '2': count, ... '5': count }
    required: true,
    default: () => ({ '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 })
  }
});

const totalReviews = computed(() => {
  return Object.values(props.distribution).reduce((sum, count) => sum + (count || 0), 0);
});

const calculatePercentage = (rating) => {
  if (totalReviews.value === 0) return 0;
  const count = props.distribution[rating] || 0;
  return Math.round((count / totalReviews.value) * 100);
};
</script>

<style scoped>
  .rating-distribution {
    margin-bottom: 1.5rem;
  }

    .rating-distribution h4 {
      margin-bottom: 0.75rem;
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-dark);
    }

  .distribution-bars {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .distribution-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.85rem;
  }

  .rating-label {
    width: 50px; /* Fixed width for labels */
    text-align: right;
    color: var(--text-muted);
    flex-shrink: 0;
  }

  .bar-container {
    flex-grow: 1;
    height: 8px;
    background-color: var(--bg-off-light);
    border-radius: 4px;
    overflow: hidden;
  }

  .bar {
    height: 100%;
    background-color: var(--accent); /* Or use primary color */
    border-radius: 4px;
    transition: width 0.5s ease-out;
  }

  .rating-count {
    width: 30px; /* Fixed width for counts */
    text-align: right;
    color: var(--text-muted);
    font-weight: 500;
  }

  .rating-distribution--empty p {
    font-size: 0.9rem;
    color: var(--text-muted);
    font-style: italic;
  }
</style>
