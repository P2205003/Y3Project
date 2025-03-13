<template>
  <div class="not-found">
    <div class="not-found-content">
      <h1>404</h1>
      <h2>Page Not Found</h2>
      <p>The page you are looking for doesn't exist or has been moved.</p>
      <router-link to="/" class="home-link">Go to Homepage</router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotFound'
}
</script>

<style scoped>
  .not-found {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background-color: #f8f9fa;
  }

  .not-found-content {
    text-align: center;
    padding: 2rem;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    max-width: 500px;
  }

  h1 {
    font-size: 5rem;
    margin: 0;
    color: #5D5CDE;
  }

  h2 {
    font-size: 1.8rem;
    margin-top: 0.5rem;
    margin-bottom: 1rem;
    color: #333;
  }

  p {
    color: #666;
    margin-bottom: 2rem;
  }

  .home-link {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background-color: #5D5CDE;
    color: white;
    text-decoration: none;
    border-radius: 4px;
    font-weight: 500;
    transition: background-color 0.2s;
  }

    .home-link:hover {
      background-color: #4a49b8;
    }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .not-found {
      background-color: #1a202c;
    }

    .not-found-content {
      background-color: #2d3748;
    }

    h2 {
      color: #e2e8f0;
    }

    p {
      color: #cbd5e0;
    }
  }
</style>
