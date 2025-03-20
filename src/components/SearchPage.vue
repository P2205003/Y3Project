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
      <h3>Search Results <span v-if="!loading">({{ filteredProducts.length }})</span></h3>

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
      <div v-else-if="filteredProducts.length === 0" class="no-results">
        <p>No products found for your search criteria.</p>
        <p v-if="hasActiveFilters">Try removing some filters or changing your search term.</p>
      </div>

      <!-- Results grid - Now shows products based on device type -->
      <div v-else class="product-grid">
        <div v-for="product in displayedProducts" :key="product._id" class="product-card">
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

      <!-- Mobile: Load More button -->
      <div v-if="isMobile && !loading && filteredProducts.length > 0" class="load-more-container">
        <button v-if="loadedCount < filteredProducts.length"
                @click="loadMore"
                class="load-more-btn">
          Load More Products
        </button>
        <p v-else class="all-loaded">All products loaded</p>
      </div>

      <!-- Desktop: Pagination controls -->
      <div v-if="!isMobile && !loading && filteredProducts.length > 0" class="pagination">
        <div class="pagination-btn-group">
          <button class="pagination-btn"
                  @click="goToPage(1)"
                  :disabled="currentPage === 1"
                  :class="{ disabled: currentPage === 1 }"
                  title="First page">
            &laquo; First
          </button>

          <button class="pagination-btn"
                  @click="prevPage"
                  :disabled="currentPage === 1"
                  :class="{ disabled: currentPage === 1 }"
                  title="Previous page">
            &laquo;
          </button>
        </div>

        <div class="page-numbers">
          <button v-for="page in paginationButtons"
                  :key="page"
                  @click="goToPage(page)"
                  class="page-btn"
                  :class="{ active: currentPage === page }">
            {{ page }}
          </button>
        </div>

        <div class="pagination-btn-group">
          <button class="pagination-btn"
                  @click="nextPage"
                  :disabled="currentPage === totalPages"
                  :class="{ disabled: currentPage === totalPages }"
                  title="Next page">
            &raquo;
          </button>

          <button class="pagination-btn"
                  @click="goToPage(totalPages)"
                  :disabled="currentPage === totalPages"
                  :class="{ disabled: currentPage === totalPages }"
                  title="Last page">
            Last &raquo;
          </button>
        </div>
      </div>

      <!-- Desktop: Page jump control -->
      <div v-if="!isMobile && !loading && filteredProducts.length > 0" class="page-jump">
        <div class="page-info">
          Page {{ currentPage }} of {{ totalPages }} ({{ filteredProducts.length }} products)
        </div>

        <div class="jump-form">
          <label for="page-input">Go to page:</label>
          <input id="page-input"
                 v-model.number="pageInput"
                 type="number"
                 min="1"
                 :max="totalPages"
                 @keyup.enter="jumpToPage" />
          <button class="jump-btn"
                  @click="jumpToPage"
                  :disabled="!isValidPageInput">
            Go
          </button>
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
        products: [], // All products from API
        loading: true,
        error: null,
        categories: [],
        selectedCategories: [],
        priceRange: {
          min: null,
          max: null
        },
        hasFiltersChanged: false,
        // Pagination data
        currentPage: 1,
        itemsPerPage: 12,
        pageInput: 1,
        // Responsive UI
        windowWidth: window.innerWidth,
        mobileBreakpoint: 768,
        // Load more data (for mobile)
        loadedCount: 12,
        loadMoreIncrement: 12
      };
    },
    computed: {
      // Check if we're on mobile
      isMobile() {
        return this.windowWidth <= this.mobileBreakpoint;
      },

      hasActiveFilters() {
        return (
          this.selectedCategories.length > 0 ||
          this.priceRange.min !== null ||
          this.priceRange.max !== null
        );
      },

      // Apply client-side filtering for multiple categories
      filteredProducts() {
        if (!this.hasActiveFilters) {
          return this.products;
        }

        return this.products.filter(product => {
          // Category filter
          if (this.selectedCategories.length > 0 && product.category) {
            if (!this.selectedCategories.includes(product.category)) {
              return false;
            }
          }

          // Price range filter - min
          if (this.priceRange.min !== null && product.price < this.priceRange.min) {
            return false;
          }

          // Price range filter - max
          if (this.priceRange.max !== null && product.price > this.priceRange.max) {
            return false;
          }

          return true;
        });
      },

      // Get products to display based on device type
      displayedProducts() {
        if (this.isMobile) {
          // For mobile: show products up to loadedCount
          return this.filteredProducts.slice(0, this.loadedCount);
        } else {
          // For desktop: show paginated products
          const startIndex = (this.currentPage - 1) * this.itemsPerPage;
          const endIndex = startIndex + this.itemsPerPage;
          return this.filteredProducts.slice(startIndex, endIndex);
        }
      },

      // Pagination computed properties
      totalPages() {
        return Math.ceil(this.filteredProducts.length / this.itemsPerPage);
      },

      paginationButtons() {
        const buttons = [];
        const maxButtons = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxButtons / 2));
        const endPage = Math.min(this.totalPages, startPage + maxButtons - 1);

        // Adjust start page if we're near the end
        startPage = Math.max(1, endPage - maxButtons + 1);

        for (let i = startPage; i <= endPage; i++) {
          buttons.push(i);
        }

        return buttons;
      },

      isValidPageInput() {
        return this.pageInput && this.pageInput >= 1 && this.pageInput <= this.totalPages;
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

          // For API calls, we'll still use single category param
          // but client-side filtering will handle multiple categories
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

          // Always extract categories from the full result set
          this.extractCategories();

          // Reset pagination and load more count when results change
          this.resetControls();
        } catch (error) {
          console.error('Error fetching search results:', error);
          this.error = 'Failed to fetch search results. Please try again.';
        } finally {
          this.loading = false;
        }
      },

      extractCategories() {
        // Extract unique categories from ALL products
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
        // Reset controls when filters change
        this.resetControls();
      },

      clearFilters() {
        this.selectedCategories = [];
        this.priceRange.min = null;
        this.priceRange.max = null;
        this.resetControls();
      },

      handleRouteChange() {
        const queryParam = this.$route.query.q || '';

        // Only reset and fetch if the query has changed
        if (this.query !== queryParam) {
          this.query = queryParam;
          this.clearFilters();
          this.fetchProducts(); // Need to fetch new data for new search query
        }
      },

      // Load more products (for mobile)
      loadMore() {
        const newCount = this.loadedCount + this.loadMoreIncrement;
        this.loadedCount = Math.min(newCount, this.filteredProducts.length);
      },

      // Pagination methods
      nextPage() {
        if (this.currentPage < this.totalPages) {
          this.currentPage++;
          this.pageInput = this.currentPage;
          this.scrollToTop();
        }
      },

      prevPage() {
        if (this.currentPage > 1) {
          this.currentPage--;
          this.pageInput = this.currentPage;
          this.scrollToTop();
        }
      },

      goToPage(page) {
        if (page >= 1 && page <= this.totalPages) {
          this.currentPage = page;
          this.pageInput = page;
          this.scrollToTop();
        }
      },

      jumpToPage() {
        if (this.isValidPageInput) {
          this.goToPage(this.pageInput);
        } else {
          // Reset to current page if invalid
          this.pageInput = this.currentPage;
        }
      },

      resetControls() {
        // Reset pagination
        this.currentPage = 1;
        this.pageInput = 1;

        // Reset load more count based on device
        this.loadedCount = this.isMobile ? this.loadMoreIncrement : this.itemsPerPage;
      },

      scrollToTop() {
        // Scroll to the top of the results section
        const resultsElement = this.$el.querySelector('.results');
        if (resultsElement) {
          resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      },

      // Handle window resize
      handleResize() {
        const wasMobile = this.isMobile;
        this.windowWidth = window.innerWidth;

        // If viewport crossed the mobile breakpoint, reset controls
        if (wasMobile !== this.isMobile) {
          this.resetControls();
        }
      }
    },
    created() {
      this.query = this.$route.query.q || '';
      this.fetchProducts();
    },
    mounted() {
      // Add resize event listener
      window.addEventListener('resize', this.handleResize);
    },
    beforeDestroy() {
      // Remove resize event listener
      window.removeEventListener('resize', this.handleResize);
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

  /* Load More button (mobile) */
  .load-more-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 2rem 0;
  }

  .load-more-btn {
    padding: 0.75rem 1.5rem;
    background-color: #5D5CDE;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
    width: 80%;
    max-width: 300px;
  }

    .load-more-btn:hover {
      background-color: #4a49b0;
    }

  .all-loaded {
    color: #666;
    margin: 1rem 0;
  }

  /* Pagination styles (desktop) */
  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 2rem 0 1rem;
    gap: 0.5rem;
  }

  .pagination-btn {
    padding: 0.5rem 1rem;
    background-color: #5D5CDE;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

    .pagination-btn:hover:not(.disabled) {
      background-color: #4a49b0;
    }

    .pagination-btn.disabled {
      background-color: #b8b8e0;
      cursor: not-allowed;
    }

  .page-numbers {
    display: flex;
    gap: 0.25rem;
  }

  .page-btn {
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }

    .page-btn.active {
      background-color: #5D5CDE;
      color: white;
      border-color: #5D5CDE;
    }

    .page-btn:hover:not(.active) {
      background-color: #f5f5f5;
    }

  .page-jump {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 600px;
    margin: 0 auto 2rem;
    padding: 0 1rem;
  }

  .page-info {
    color: #666;
  }

  .jump-form {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

    .jump-form label {
      font-size: 0.9rem;
      color: #666;
    }

    .jump-form input {
      width: 3.5rem;
      height: 2.5rem;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      text-align: center;
      font-size: 16px;
    }

  .jump-btn {
    padding: 0.5rem 1rem;
    background-color: #5D5CDE;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

    .jump-btn:hover:not(:disabled) {
      background-color: #4a49b0;
    }

    .jump-btn:disabled {
      background-color: #b8b8e0;
      cursor: not-allowed;
    }

  .pagination-btn-group {
    display: flex;
    gap: 0.25rem;
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

    .page-btn {
      background-color: #333;
      border-color: #444;
      color: #ddd;
    }

      .page-btn:hover:not(.active) {
        background-color: #444;
      }

    .jump-form input {
      background-color: #333;
      border-color: #444;
      color: #fff;
    }

    .all-loaded {
      color: #aaa;
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
