<template>
  <div class="page1">
    <h1>Welcome to Page 1</h1>
    <div class="items-container">
      <div v-if="loading" class="loading">Loading products...</div>

      <!-- Display products with different strategies based on viewport -->
      <router-link v-for="product in displayedProducts"
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

    <!-- Mobile: Load More button -->
    <div v-if="isMobile && !loading && products.length > 0" class="load-more-container">
      <button v-if="loadedCount < products.length"
              @click="loadMore"
              class="load-more-btn">
        Load More Products
      </button>
      <p v-else class="all-loaded">All products loaded</p>
    </div>

    <!-- Desktop: Pagination controls -->
    <div v-if="!isMobile && !loading && products.length > 0" class="pagination">
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
    <div v-if="!isMobile && !loading && products.length > 0" class="page-jump">
      <div class="page-info">
        Page {{ currentPage }} of {{ totalPages }} ({{ products.length }} products)
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
</template>

<script>
  export default {
    name: 'Page1',
    data() {
      return {
        products: [],
        loading: true,
        error: null,
        // Pagination data
        currentPage: 1,
        itemsPerPage: 15,
        pageInput: 1,
        // Responsive UI
        windowWidth: window.innerWidth,
        mobileBreakpoint: 768,
        // Load more data (for mobile)
        loadedCount: 8,
        loadMoreIncrement: 8
      };
    },
    computed: {
      // Check if we're on mobile
      isMobile() {
        return this.windowWidth <= this.mobileBreakpoint;
      },
      // Calculate total pages based on product count and items per page
      totalPages() {
        return Math.ceil(this.products.length / this.itemsPerPage);
      },
      // Get products to display based on view type (mobile or desktop)
      displayedProducts() {
        if (this.isMobile) {
          // For mobile: show products up to loadedCount
          return this.products.slice(0, this.loadedCount);
        } else {
          // For desktop: show paginated products
          const startIndex = (this.currentPage - 1) * this.itemsPerPage;
          const endIndex = startIndex + this.itemsPerPage;
          return this.products.slice(startIndex, endIndex);
        }
      },
      // Generate pagination buttons (show max 5 page buttons)
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
      // Validate page input
      isValidPageInput() {
        return this.pageInput && this.pageInput >= 1 && this.pageInput <= this.totalPages;
      }
    },
    methods: {
      // Go to next page if available
      nextPage() {
        if (this.currentPage < this.totalPages) {
          this.currentPage++;
          this.pageInput = this.currentPage;
          this.scrollToTop();
        }
      },
      // Go to previous page if available
      prevPage() {
        if (this.currentPage > 1) {
          this.currentPage--;
          this.pageInput = this.currentPage;
          this.scrollToTop();
        }
      },
      // Go to specific page
      goToPage(page) {
        if (page >= 1 && page <= this.totalPages) {
          this.currentPage = page;
          this.pageInput = page;
          this.scrollToTop();
        }
      },
      // Jump to page from input
      jumpToPage() {
        if (this.isValidPageInput) {
          this.goToPage(this.pageInput);
        } else {
          // Reset to current page if invalid
          this.pageInput = this.currentPage;
        }
      },
      // Load more products (for mobile view)
      loadMore() {
        const newCount = this.loadedCount + this.loadMoreIncrement;
        this.loadedCount = Math.min(newCount, this.products.length);
      },
      // Scroll to top when changing pages
      scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      // Fetch all products from API
      async fetchProducts() {
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
      },
      // Handle window resize
      handleResize() {
        this.windowWidth = window.innerWidth;
      }
    },
    async created() {
      await this.fetchProducts();

      // Set initial loaded count for mobile
      this.loadedCount = this.isMobile ? this.loadMoreIncrement : this.itemsPerPage;
    },
    mounted() {
      // Add resize event listener
      window.addEventListener('resize', this.handleResize);
    },
    beforeDestroy() {
      // Remove event listener
      window.removeEventListener('resize', this.handleResize);
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
    margin: 2rem 0;
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
    .page1 {
      background-color: #181818;
      color: #ffffff;
    }

    .item {
      border-color: #333;
      background-color: #222;
    }

    .price {
      color: #5D5CDE;
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
</style>
