<template>
  <div class="search-page">
    <div class="filter">
      <h3>Filter Products</h3>

      <!-- Search query display -->
      <div v-if="query" class="search-query">
        Searching for: <strong>{{ query }}</strong>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="loading">
        Loading filters...
      </div>

      <!-- Category filters -->
      <div v-if="categories.length > 0" class="filter-section">
        <h4>Categories</h4>
        <div v-for="category in categories" :key="category" class="filter-item">
          <label>
            <input type="checkbox"
                   :value="category"
                   v-model="selectedCategories"
                   @change="applyFilters" />
            {{ category }}
          </label>
        </div>
      </div>

      <!-- Price range filter -->
      <div class="filter-section">
        <h4>Price Range</h4>
        <div class="price-range">
          <div class="price-input">
            <label>Min $</label>
            <input type="number"
                   v-model.number="priceRange.min"
                   min="0"
                   @change="applyFilters" />
          </div>
          <div class="price-input">
            <label>Max $</label>
            <input type="number"
                   v-model.number="priceRange.max"
                   min="0"
                   @change="applyFilters" />
          </div>
        </div>
      </div>

      <!-- Clear filters button -->
      <button v-if="hasActiveFilters"
              @click="clearFilters"
              class="clear-filters-btn">
        Clear All Filters
      </button>
    </div>

    <div class="results">
      <h3>Search Results <span v-if="!loading">({{ products.length }})</span></h3>

      <!-- Loading state -->
      <div v-if="loading" class="loading-results">
        <div class="loading-spinner"></div>
        <p>Searching products...</p>
      </div>

      <!-- Error message -->
      <div v-else-if="error" class="error-message">
        <p>{{ error }}</p>
        <button @click="fetchProducts">Try Again</button>
      </div>

      <!-- No results -->
      <div v-else-if="products.length === 0" class="no-results">
        <p>No products found for your search criteria.</p>
        <p v-if="hasActiveFilters">Try removing some filters or changing your search term.</p>
      </div>

      <!-- Results grid -->
      <div v-else class="product-grid">
        <div v-for="product in products" :key="product._id" class="product-card">
          <router-link :to="{ name: 'ProductPage', params: { id: product._id } }">
            <div class="product-image">
              <img :src="product.images && product.images.length ? product.images[0] : '/placeholder.jpg'"
                   :alt="product.name" />
            </div>
            <div class="product-info">
              <h4>{{ product.name }}</h4>
              <p class="product-price">${{ product.price.toFixed(2) }}</p>
              <p v-if="product.category" class="product-category">{{ product.category }}</p>
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import axios from 'axios';

  export default {
    name: 'SearchPage',
    data() {
      return {
        query: '',
        products: [],
        loading: true,
        error: null,
        categories: [],
        selectedCategories: [],
        priceRange: {
          min: null,
          max: null
        },
        hasFiltersChanged: false
      };
    },
    computed: {
      hasActiveFilters() {
        return (
          this.selectedCategories.length > 0 ||
          this.priceRange.min !== null ||
          this.priceRange.max !== null
        );
      }
    },
    methods: {
      async fetchProducts() {
        this.loading = true;
        this.error = null;

        try {
          // Build query parameters
          const params = {};

          if (this.query) {
            params.q = this.query;
          }

          if (this.selectedCategories.length === 1) {
            params.category = this.selectedCategories[0];
          }

          if (this.priceRange.min !== null) {
            params.minPrice = this.priceRange.min;
          }

          if (this.priceRange.max !== null) {
            params.maxPrice = this.priceRange.max;
          }

          const response = await axios.get('/api/products/search', { params });
          this.products = response.data;

          // Extract unique categories from results if we don't have them yet
          if (this.categories.length === 0) {
            this.extractCategories();
          }
        } catch (error) {
          console.error('Error fetching search results:', error);
          this.error = 'Failed to fetch search results. Please try again.';
        } finally {
          this.loading = false;
        }
      },

      extractCategories() {
        // Extract unique categories from products
        const categorySet = new Set();

        this.products.forEach(product => {
          if (product.category) {
            categorySet.add(product.category);
          }
        });

        this.categories = Array.from(categorySet).sort();
      },

      applyFilters() {
        this.hasFiltersChanged = true;
        this.fetchProducts();
      },

      clearFilters() {
        this.selectedCategories = [];
        this.priceRange.min = null;
        this.priceRange.max = null;
        this.fetchProducts();
      },

      handleRouteChange() {
        const queryParam = this.$route.query.q || '';

        // Only reset and fetch if the query has changed
        if (this.query !== queryParam) {
          this.query = queryParam;
          this.clearFilters();
        }
      }
    },
    created() {
      this.query = this.$route.query.q || '';
      this.fetchProducts();
    },
    watch: {
      '$route'(to, from) {
        if (to.query.q !== from.query.q) {
          this.handleRouteChange();
        }
      }
    }
  };
</script>

<style scoped>
  .search-page {
    display: flex;
    padding: 10px;
    gap: 30px;
    width: 100vw;
    max-width: 100%;
  }

  .filter {
    width: 400px;
    min-width: 200px;
    padding: 20px;
    border-right: 1px solid #ddd;
    position: sticky;
    top: 20px;
    align-self: flex-start;
    max-height: calc(100vh - 40px);
    overflow-y: auto;
  }

  .results {
    flex: 1;
    padding: 20px;
  }

    .filter h3, .results h3 {
      margin-top: 0;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    }

  .filter-section {
    margin-bottom: 25px;
  }

  .filter-section h4 {
    margin-bottom: 10px;
  }

  .filter-item {
    margin-bottom: 8px;
  }

  .filter-item label {
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  .filter-item input[type="checkbox"] {
    margin-right: 8px;
  }

  .price-range {
    display: flex;
    gap: 10px;
  }

  .price-input {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

    .price-input label {
      margin-bottom: 5px;
      font-size: 14px;
    }

    .price-input input {
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 16px;
      width: 100%;
    }

  .clear-filters-btn {
    width: 100%;
    padding: 8px;
    background-color: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

    .clear-filters-btn:hover {
      background-color: #e5e5e5;
    }

  .search-query {
    margin-bottom: 20px;
    padding: 10px;
    background-color: #f5f5f5;
    border-radius: 4px;
  }

  .loading, .loading-results, .error-message, .no-results {
    padding: 20px;
    text-align: center;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    margin: 0 auto 15px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #5D5CDE;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }

  .error-message {
    color: #e74c3c;
  }

    .error-message button {
      padding: 8px 16px;
      background-color: #5D5CDE;
      color: white;
      border: none;
      border-radius: 4px;
      margin-top: 10px;
      cursor: pointer;
    }

  .product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 20px;
  }

  .product-card {
    border: 1px solid #eee;
    border-radius: 8px;
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
  }

    .product-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }

    .product-card a {
      text-decoration: none;
      color: inherit;
    }

  .product-image {
    height: 180px;
    overflow: hidden;
    position: relative;
  }

    .product-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s;
    }

  .product-card:hover .product-image img {
    transform: scale(1.05);
  }

  .product-info {
    padding: 15px;
  }

    .product-info h4 {
      margin: 0 0 10px;
      font-size: 16px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

  .product-price {
    font-weight: bold;
    color: #5D5CDE;
    margin: 5px 0;
  }

  .product-category {
    font-size: 14px;
    color: #666;
    margin: 5px 0 0;
  }

  /* Dark mode styles */
  @media (prefers-color-scheme: dark) {
    .search-page {
      background-color: #ffffff;
      color: #000000;
      border-style: solid;
    }

    .filter {
      border-right-color: #333;
    }

      .filter h3, .results h3 {
        border-bottom-color: #333;
      }

    .search-query, .clear-filters-btn {
      background-color: #d4d4d2;
      border-bottom: 2px solid #000000;
      color: #000000;
    }

      .clear-filters-btn:hover {
        background-color: #bd1c1c;
      }

    .price-input input {
      background-color: #ffffff;
      border-color: #444;
      color: #000000;
    }

    .product-card {
      border-color: #333;
      background-color: #222;
    }

    .product-info h4 {
      color: #fff;
    }

    .product-category {
      color: #aaa;
    }

    .loading-spinner {
      border-color: #333;
      border-top-color: #5D5CDE;
    }
  }

  /* Responsive styles */
  @media (max-width: 768px) {
    .search-page {
      flex-direction: column;
      padding: 10px;
    }

    .filter {
      width: 100%;
      border-right: none;
      border-bottom: 1px solid #ddd;
      padding: 15px;
      position: static;
      max-height: none;
    }

    .results {
      width: 100%;
      padding: 15px 0;
    }

    .product-grid {
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 15px;
    }

    .product-image {
      height: 150px;
    }
  }
</style>
