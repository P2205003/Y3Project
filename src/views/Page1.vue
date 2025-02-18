<template>
  <div class="page1">
    <h1>Welcome to Page 1</h1>
    <div class="items-container">
      <div v-if="loading" class="loading">Loading products...</div>

      <!-- Add router-link wrapper -->
      <router-link v-for="product in products"
                   :key="product._id"
                   :to="{ name: 'ProductPage', params: { id: product._id } }"
                   class="item-link">
        <div class="item">
          <img :src="product.images?.[0] || require('@/components/placeholder.jpg')"
               :alt="product.name">
          <h3>{{ product.name }}</h3>
          <p class="price">${{ product.price.toFixed(2) }}</p>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'Page1',
    data() {
      return {
        products: [],
        loading: true,
        error: null
      };
    },
      async created() {
        try {
          const response = await fetch('/api/products');
          if (!response.ok) throw new Error('Failed to fetch products');
          this.products = await response.json();
        } catch (error) {
          this.error = error.message;
          console.error('Error fetching products:', error);
        } finally {
          this.loading = false;
        }
      }
    };
</script>

<style scoped>
  .items-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 2rem;
    padding: 1rem;
  }

  .item-link {
    text-decoration: none;
    color: inherit;
  }

  .item {
    border: 1px solid #ddd;
    border-radius: 8px;
    overflow: hidden;
    transition: transform 0.2s;
    cursor: pointer;
  }

  .item:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  img {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }

  h3 {
    margin: 0.5rem;
    font-size: 1.1rem;
  }

  .price {
    margin: 0.5rem;
    font-weight: bold;
    color: #2c3e50;
  }

  .loading {
    text-align: center;
    padding: 2rem;
    font-size: 1.2rem;
  }
</style>
