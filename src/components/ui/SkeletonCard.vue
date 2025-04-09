<template>
  <div class="skeleton-card">
    <div class="skeleton-image"></div>
    <div class="skeleton-info">
      <div class="skeleton-line skeleton-title"></div>
      <div class="skeleton-line skeleton-text"></div>
      <div class="skeleton-line skeleton-text short"></div>
      <div class="skeleton-line skeleton-price"></div>
      <div class="skeleton-line skeleton-button"></div>
    </div>
  </div>
</template>

<style scoped>
  .skeleton-card {
    background-color: var(--white);
    border-radius: var(--border-radius);
    overflow: hidden;
    box-shadow: var(--shadow-soft);
    height: 100%; /* Match product card */
    display: flex;
    flex-direction: column;
  }

  .skeleton-image {
    height: 250px; /* Match product card image height */
    background-color: var(--bg-off-light);
    animation: pulse-bg 1.5s infinite ease-in-out;
  }

  .skeleton-info {
    padding: 1.5rem; /* Match product card padding */
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  }

  .skeleton-line {
    background-color: var(--bg-off-light);
    border-radius: 4px;
    margin-bottom: 0.8rem;
    animation: pulse-bg 1.5s infinite ease-in-out;
    height: 1em; /* Base height */
  }

  .skeleton-title {
    width: 60%;
    height: 1.2em; /* Slightly taller for title */
    margin-bottom: 0.7rem;
  }

  .skeleton-text {
    width: 90%;
  }

  .skeleton-text.short {
    width: 70%;
  }

  .skeleton-price {
    width: 30%;
    height: 1.1em;
    margin-top: 0.5rem;
    margin-bottom: 1.2rem;
  }

  .skeleton-button {
    width: 100%;
    height: 40px; /* Approx button height */
    border-radius: 50px; /* Match button style */
    margin-top: auto; /* Push to bottom */
  }

  @keyframes pulse-bg {
    0% {
      background-color: var(--bg-off-light);
    }

    50% {
      background-color: #e0e6e9; /* Slightly darker shade */
    }

    100% {
      background-color: var(--bg-off-light);
    }
  }
</style>
