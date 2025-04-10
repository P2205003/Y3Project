<template>
  <div class="star-rating-display" :title="`${rating.toFixed(1)} out of 5 stars`">
    <span v-for="n in 5" :key="`star-${n}`" class="star-icon" :class="{ 'half': n - 0.5 === ratingClamped, 'filled': n <= ratingClamped, 'empty': n > ratingClamped + 0.5 }">
      <font-awesome-icon :icon="getStarIcon(n)" />
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue';
// FontAwesomeIcon imported globally

const props = defineProps({
  rating: {
    type: Number,
    required: true,
    default: 0
  }
});

// Clamp rating between 0 and 5
const ratingClamped = computed(() => Math.min(Math.max(props.rating, 0), 5));

// Determine which icon to show for each star position
const getStarIcon = (starPosition) => {
  const ratingVal = ratingClamped.value;
  if (starPosition <= Math.floor(ratingVal)) {
    // Full star
    return ['fas', 'star']; // Use solid star
  } else if (starPosition - 0.5 <= ratingVal) {
    // Half star
    return ['fas', 'star-half-alt']; // Use solid half star
  } else {
    // Empty star
    return ['far', 'star']; // Use regular (empty) star
  }
};
</script>

<style scoped>
  .star-rating-display {
    display: inline-flex;
    color: #feca57; /* var(--accent) or another gold/yellow */
    line-height: 1;
  }

  .star-icon {
    font-size: 1em; /* Adjust size as needed */
    margin-right: 0.1em;
  }

    /* You might not need these classes if the icon logic handles it */
    /* .star-icon.filled { } */
    /* .star-icon.half { } */
    .star-icon.empty {
      color: #e0e0e0; /* Light grey for empty stars */
    }
</style>
