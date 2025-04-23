<template>
  <div id="preloader" :class="{ hidden: !isLoading }"></div>
</template>

<script setup>
defineProps({
  isLoading: {
    type: Boolean,
    required: true
  }
});
</script>

<style scoped>
  /* Preloader styles are in main.css */
  /* Add scoped styles ONLY if needed */
</style>
