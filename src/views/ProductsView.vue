<template>
  <main>
    <!-- Page Header -->
    <section class="page-header">
      <h1>Our Collections</h1>
      <p>Explore consciously crafted furniture designed to bring harmony and style to your everyday living.</p>
    </section>

    <!-- Product Listing Section -->
    <section class="product-listing-section">

      <!-- Filter Controls -->
      <div class="filter-controls">
        <div class="filter-group">
          <label for="search-products">Search by Name</label>
          <input type="search" id="search-products" name="search" placeholder="e.g., Serene Sofa">
        </div>
        <div class="filter-group">
          <label for="filter-category">Category</label>
          <select id="filter-category" name="category">
            <option value="all" selected>All Categories</option>
            <option value="living-room">Living Room</option>
            <option value="dining">Dining</option>
            <option value="bedroom">Bedroom</option>
            <option value="lighting">Lighting</option>
            <option value="storage">Storage</option>
          </select>
        </div>
        <div class="filter-group">
          <label for="filter-sort">Sort By</label>
          <select id="filter-sort" name="sort">
            <option value="featured" selected>Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Name: A to Z</option>
            <option value="name-desc">Name: Z to A</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>

      <!-- Transition Wrapper -->
      <transition name="fade" mode="out-in">
        <div v-if="isLoading" key="loading" class="loading-indicator">Loading products...</div>
        <div v-else-if="errorLoading" key="error" class="error-message">{{ errorLoading }}</div>
        <div v-else-if="products.length > 0" key="grid" class="product-grid">
          <ProductCard v-for="product in products"
                       :key="product.id"
                       :product="product"
                       :linkTo="`/product-detail/${product.id}`"
                       @add-to-cart="emitAddToCart"
                       :apply-tilt="true" />
        </div>
        <div v-else key="empty" class="empty-message">No products found matching your criteria.</div>
      </transition>

    </section>

    <!-- Pagination - Positioned via JS/CSS -->
    <nav v-if="!isLoading && !errorLoading && totalPages > 1"
         ref="paginationRef"
         :class="['pagination-container', { 'is-fixed': isPaginationFixed, 'is-absolute': !isPaginationFixed }]"
         aria-label="Product pagination">
      <ul class="pagination">
        <!-- Previous Button -->
        <li class="page-item" :class="{ disabled: currentPage === 1 }">
          <button class="page-link" @click="goToPage(currentPage - 1)" :disabled="currentPage === 1" aria-label="Previous page">
            <span aria-hidden="true">«</span>
            <span class="visually-hidden">Previous</span>
          </button>
        </li>
        <!-- Page Number Buttons -->
        <li v-for="page in totalPages"
            :key="page"
            class="page-item"
            :class="{ active: currentPage === page }">
          <button class="page-link" @click="goToPage(page)" :aria-current="currentPage === page ? 'page' : null">
            {{ page }}
          </button>
        </li>
        <!-- Next Button -->
        <li class="page-item" :class="{ disabled: currentPage === totalPages }">
          <button class="page-link" @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages" aria-label="Next page">
            <span aria-hidden="true">»</span>
            <span class="visually-hidden">Next</span>
          </button>
        </li>
      </ul>
    </nav>
  </main>
</template>

<script setup>
  import { ref, onMounted, onUnmounted, nextTick } from 'vue';
  import ProductCard from '../components/ui/ProductCard.vue';
  import { useRoute, useRouter } from 'vue-router';
  import { throttle } from 'lodash-es'; // Ensure lodash-es is installed

  // --- Constants ---
  const GAP_BETWEEN_PAGINATION_AND_FOOTER = 90; // Gap in pixels
  // --- NEW: Buffer to trigger switch earlier ---
  const THRESHOLD_BUFFER = 90; // Pixels. Trigger switch when footer is this close to viewport bottom. Adjust if needed.
  const THROTTLE_TIME = 30; // Reduced throttle time slightly for faster reaction

  // --- Emits, Refs, State ---
  const emit = defineEmits(['addToCart']);
  const products = ref([]);
  const isLoading = ref(true);
  const errorLoading = ref(null);
  const route = useRoute();
  const router = useRouter();
  const currentPage = ref(1);
  const totalPages = ref(1);
  const limit = ref(12);
  const totalProducts = ref(0);
  const defaultDescription = "High-quality, sustainable furniture piece.";

  const paginationRef = ref(null);
  const isPaginationFixed = ref(true);
  let footerEl = null;
  let lastKnownScrollY = 0;

  // --- Helper function for truncation ---
  function truncateText(text, maxLength) { /* ... no change ... */
    if (!text) return '';
    const cleanedText = text.trim();
    if (cleanedText.length <= maxLength) return cleanedText;
    let truncated = cleanedText.slice(0, maxLength);
    let lastSpaceIndex = truncated.lastIndexOf(' ');
    if (lastSpaceIndex > 0) {
      truncated = truncated.slice(0, lastSpaceIndex);
    }
    return truncated + "...";
  }


  // --- Product Fetching Logic ---
  const fetchProducts = async (page = 1) => { /* ... no change ... */
    isLoading.value = true;
    errorLoading.value = null;
    console.log(`Fetching products for page ${page}, limit ${limit.value}...`);
    try {
      const url = `/api/products?page=${page}&limit=${limit.value}`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorBody}`);
      }
      const data = await response.json();
      const maxDescriptionLength = 75;

      products.value = data.products.map(product => {
        const originalDescription = product.description || defaultDescription;
        const truncatedDescription = truncateText(originalDescription, maxDescriptionLength);
        return { /* ... mapping ... */
          id: product._id,
          name: product.name,
          description: truncatedDescription,
          price: product.price,
          image: product.images && product.images.length > 0
            ? product.images[0]
            : `https://via.placeholder.com/400x250/cccccc/FFFFFF?text=${encodeURIComponent(product.name)}`,
        };
      });

      currentPage.value = data.currentPage;
      totalPages.value = data.totalPages;
      totalProducts.value = data.totalProducts;

      console.log("Products updated:", products.value);
      console.log("Pagination state:", { currentPage: currentPage.value, totalPages: totalPages.value, totalProducts: totalProducts.value });

      isLoading.value = false;
      await nextTick();
      handleScroll();

      const sectionElement = document.querySelector('.product-listing-section');
      if (sectionElement) {
        const sectionTop = sectionElement.getBoundingClientRect().top + window.scrollY;
        const headerOffset = document.getElementById('header')?.offsetHeight || 80;
        window.scrollTo({ top: sectionTop - headerOffset - 20, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

    } catch (error) {
      console.error("Error fetching products:", error);
      errorLoading.value = "Failed to load products. Please try again later.";
      products.value = [];
      currentPage.value = 1;
      totalPages.value = 1;
      totalProducts.value = 0;
      isLoading.value = false;
    }
  };

  const goToPage = (pageNumber) => { /* ... no change ... */
    if (pageNumber >= 1 && pageNumber <= totalPages.value && pageNumber !== currentPage.value && !isLoading.value) {
      fetchProducts(pageNumber);
    }
  };

  const emitAddToCart = (productData) => { /* ... no change ... */
    console.log('Add to cart clicked in ProductsView:', productData);
    emit('addToCart', productData);
  };


  // --- Sticky Pagination Logic ---

  const handleScroll = () => {
    if (!paginationRef.value || !footerEl) {
      return;
    }

    const paginationHeight = paginationRef.value.offsetHeight;
    const footerRect = footerEl.getBoundingClientRect(); // Position relative to viewport
    const viewportHeight = window.innerHeight;

    // --- MODIFIED Threshold ---
    // Check if the footer's top edge is within THRESHOLD_BUFFER pixels
    // from the bottom of the viewport (or already above it).
    const isFooterApproachingOrVisible = footerRect.top <= viewportHeight + THRESHOLD_BUFFER;

    // Calculate the absolute top position (relative to document)
    const absoluteTopPosition = footerEl.offsetTop - paginationHeight - GAP_BETWEEN_PAGINATION_AND_FOOTER;


    // --- Logic for switching ---
    if (isFooterApproachingOrVisible) {
      // Footer is close or visible. Switch/stay absolute.
      if (isPaginationFixed.value) {
        // console.log(`Switching to Absolute. FooterTop (viewport): ${footerRect.top.toFixed(0)} <= ${viewportHeight + THRESHOLD_BUFFER}`);
        paginationRef.value.style.top = `${absoluteTopPosition}px`;
        paginationRef.value.style.bottom = 'auto';
        isPaginationFixed.value = false; // Change state AFTER applying position
      } else {
        // Already absolute, ensure top position is updated (useful for resize)
        paginationRef.value.style.top = `${absoluteTopPosition}px`;
      }
    } else {
      // Footer is far below the viewport. Switch/stay fixed.
      if (!isPaginationFixed.value) {
        // console.log(`Switching to Fixed. FooterTop (viewport): ${footerRect.top.toFixed(0)} > ${viewportHeight + THRESHOLD_BUFFER}`);
        paginationRef.value.style.top = ''; // Remove inline styles
        paginationRef.value.style.bottom = '';
        isPaginationFixed.value = true; // Change state AFTER removing styles
      }
    }

    // Update last scroll position (optional)
    // lastKnownScrollY = window.scrollY;
  };


  // Throttle the scroll handler
  const throttledScrollHandler = throttle(handleScroll, THROTTLE_TIME);

  // --- Lifecycle Hooks ---
  onMounted(async () => { /* ... no change ... */
    const initialPage = parseInt(route.query.page) || 1;
    await fetchProducts(initialPage);

    footerEl = document.querySelector('footer');
    if (!footerEl) {
      console.error("Footer element not found for sticky calculation!");
    }

    window.addEventListener('scroll', throttledScrollHandler);
    window.addEventListener('resize', throttledScrollHandler);

    requestAnimationFrame(() => {
      handleScroll();
    });
  });

  onUnmounted(() => { /* ... no change ... */
    window.removeEventListener('scroll', throttledScrollHandler);
    window.removeEventListener('resize', throttledScrollHandler);
  });
</script>

<style scoped>
  /* Add padding to the bottom of the grid container itself */
  /* This ensures space below the product cards for the absolute pagination */
  .product-grid {
    min-height: 300px;
    /* Adjust based on pagination height + desired gap */
    padding-bottom: calc(50px + 16px + 1rem); /* Approx height + gap + some buffer */
  }

  /* --- Sticky Pagination Classes --- */
  .pagination-container.is-fixed {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    /* Appearance is inherited from main.css */
  }

  .pagination-container.is-absolute {
    position: absolute;
    /* JS sets the 'top' property */
    left: 0;
    right: 0;
    /* Appearance is inherited */
  }
  /* --- End Sticky Classes --- */


  /* Loading/Error/Empty states */
  .loading-indicator,
  .error-message,
  .empty-message {
    text-align: center;
    padding: 3rem 1rem;
    font-size: 1.1rem;
    color: var(--text-muted);
    font-style: italic;
    min-height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .error-message {
    color: var(--secondary);
    font-weight: 600;
  }

  /* Fade Transition */
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>
