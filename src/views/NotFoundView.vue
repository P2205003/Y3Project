// src/views/NotFoundView.vue
<template>
  <main class="not-found-page">
    <div class="message-container empty-container">
      <font-awesome-icon icon="compass" class="message-icon empty-icon" />
      <h2>{{ t('notFound.title') }}</h2>
      <p>{{ t('notFound.message') }}</p>
      <router-link to="/" class="button primary-button">{{ t('notFound.goHomeButton') }}</router-link>
      <router-link to="/products" class="button secondary-button">{{ t('notFound.exploreProductsButton') }}</router-link>
    </div>
  </main>
</template>

<script setup>
  import { useI18n } from 'vue-i18n'; // <-- Import useI18n
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
  import { library } from '@fortawesome/fontawesome-svg-core';
  import { faCompass } from '@fortawesome/free-solid-svg-icons';

  // --- Get translation function ---
  const { t } = useI18n();

  library.add(faCompass);
</script>

<style scoped>
  /* Styles remain the same */
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
    font-size: 4rem;
    color: var(--text-muted);
    margin-bottom: 2rem;
  }
</style>
