<template>
  <div class="rating-distribution" v-if="totalReviews > 0">
    <h4>{{ t('ratingDistribution.title') }}</h4>
    <div class="distribution-bars">
      <div v-for="rating in [5, 4, 3, 2, 1]" :key="`dist-${rating}`" class="distribution-row">
        <!-- Use t() with pluralization syntax -->
        <span class="rating-label">{{ t('ratingDistribution.starLabel', rating) }}</span>
        <div class="bar-container">
          <div class="bar" :style="{ width: calculatePercentage(rating) + '%' }"></div>
        </div>
        <span class="rating-count">{{ distribution[rating] || 0 }}</span>
      </div>
    </div>
  </div>
  <div v-else class="rating-distribution--empty">
    <p>{{ t('ratingDistribution.emptyMessage') }}</p>
  </div>
</template>

<script setup>
  import { computed } from 'vue';
  import { useI18n } from 'vue-i18n'; // Import useI18n

  // Get translation function
  const { t } = useI18n();

  const props = defineProps({
    distribution: {
      type: Object,
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
  /* Styles remain the same */
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
    width: 50px;
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
    background-color: var(--accent);
    border-radius: 4px;
    transition: width 0.5s ease-out;
  }

  .rating-count {
    width: 30px;
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
