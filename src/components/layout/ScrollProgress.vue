<template>
  <div id="scroll-progress" :style="{ width: scrollPercentage + '%' }"></div>
</template>

<script setup>
defineProps({
  scrollPercentage: {
    type: Number,
    default: 0
  }
});
</script>

<style scoped>
  /* Scroll progress styles are in main.css */
</style>
