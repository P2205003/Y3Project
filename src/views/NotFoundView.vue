// src/views/NotFoundView.vue
<template>
  <main class="not-found-page">
    <div class="message-container empty-container">
      <font-awesome-icon icon="compass" class="message-icon empty-icon" />
      <h2>Page Not Found (404)</h2>
      <p>Oops! The page you're looking for seems to have wandered off.</p>
      <router-link to="/" class="button primary-button">Go Home</router-link>
      <router-link to="/products" class="button secondary-button">Explore Products</router-link>
    </div>
  </main>
</template>

<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faCompass } from '@fortawesome/free-solid-svg-icons';

library.add(faCompass);
</script>

<style scoped>
  .not-found-page {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 70vh;
    padding: 4rem 1rem;
    text-align: center;
  }

  .message-container .button {
    margin: 1rem 0.5rem 0;
  }

  .message-icon {
    font-size: 4rem; /* Larger icon */
    color: var(--text-muted);
    margin-bottom: 2rem;
  }
</style>
