<template>
  <main>
    <!-- Enhanced Page Header -->
    <section class="page-header enhanced-page-header">
      <h1>Our Collections</h1>
      <p>Explore consciously crafted furniture designed to bring harmony and style to your everyday living.</p>
    </section>

    <!-- Product Listing Section -->
    <section class="product-listing-section">

      <!-- Enhanced Filter Controls -->
      <div class="filter-controls enhanced-filter-controls">
        <div class="filter-group search-group">
          <label for="search-products">
            <font-awesome-icon icon="search" /> Search
          </label>
          <input type="search" id="search-products" name="search" placeholder="e.g., Serene Sofa" v-model="filters.searchQuery" @keyup.enter="applyFilters">
        </div>
        <div class="filter-group">
          <label for="filter-category">Category</label>
          <select id="filter-category" name="category" v-model="filters.category">
            <option value="all">All Categories</option>
            <option value="living-room">Living Room</option>
            <option value="dining">Dining</option>
            <option value="bedroom">Bedroom</option>
            <option value="lighting">Lighting</option>
            <option value="storage">Storage</option>
            <!-- Add more categories as needed -->
          </select>
        </div>
        <div class="filter-group">
          <label for="filter-sort">Sort By</label>
          <select id="filter-sort" name="sort" v-model="filters.sort">
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Name: A to Z</option>
            <option value="name-desc">Name: Z to A</option>
            <option value="newest">Newest</option>
          </select>
        </div>
        <div class="filter-actions">
          <button @click="applyFilters" class="filter-button primary" :disabled="isLoading">Apply Filters</button>
          <button @click="resetFilters" class="filter-button secondary" :disabled="isLoading">Reset</button>
        </div>
      </div>

      <!-- Transition Wrapper -->
      <transition name="fade" mode="out-in">
        <!-- Loading State with Skeletons -->
        <div v-if="isLoading" key="loading" class="product-grid skeleton-grid">
          <SkeletonCard v-for="n in limit" :key="`skel-${n}`" />
        </div>

        <!-- Error State -->
        <div v-else-if="errorLoading" key="error" class="message-container error-container">
          <font-awesome-icon icon="exclamation-triangle" class="message-icon error-icon" />
          <h2>Oops! Something went wrong.</h2>
          <p>{{ errorLoading }}</p>
          <button @click="fetchProducts(1)" class="filter-button primary">Try Again</button>
        </div>

        <!-- Product Grid -->
        <div v-else-if="products.length > 0" key="grid" class="product-grid">
          <!-- Add a subtle stagger animation -->
          <ProductCard v-for="(product, index) in products"
                       :key="product.id"
                       :product="product"
                       :linkTo="`/product-detail/${product.id}`"
                       @add-to-cart="emitAddToCart"
                       :apply-tilt="true"
                       class="product-card-item"
                       :style="{ '--stagger-delay': `${index * 0.05}s` }" />
        </div>

        <!-- Empty State -->
        <div v-else key="empty" class="message-container empty-container">
          <font-awesome-icon icon="box-open" class="message-icon empty-icon" />
          <h2>No Matches Found</h2>
          <p>We couldn't find any products matching your current filters. Try adjusting your search or category.</p>
          <button @click="resetFilters" class="filter-button secondary">Clear Filters</button>
        </div>
      </transition>

    </section>

    <!-- Pagination -->
    <!-- v-if ensures it only renders after loading and if needed -->
    <nav v-if="!isLoading && !errorLoading && totalPages > 1"
         ref="paginationRef"
         class="pagination-container"
         :class="{ 'is-absolute': !isPaginationFixed }"
         aria-label="Product pagination">
      <!-- The 'is-absolute' class is now only for potential style overrides if needed -->
      <!-- Base styles in CSS handle the default fixed positioning -->
      <ul class="pagination">
        <!-- Previous Button -->
        <li class="page-item" :class="{ disabled: currentPage === 1 }">
          <button class="page-link" @click="goToPage(currentPage - 1)" :disabled="currentPage === 1" aria-label="Previous page">
            <span aria-hidden="true">«</span>
            <span class="visually-hidden">Previous</span>
          </button>
        </li>
        <!-- Page Number Buttons -->
        <li v-for="page in paginationRange"
            :key="page"
            class="page-item"
            :class="{ active: currentPage === page, ellipsis: page === '...' }">
          <span v-if="page === '...'" class="page-link ellipsis">...</span>
          <button v-else class="page-link" @click="goToPage(page)" :aria-current="currentPage === page ? 'page' : null">
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
  import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue';
  import ProductCard from '../components/ui/ProductCard.vue';
  import SkeletonCard from '../components/ui/SkeletonCard.vue';
  import { useRoute, useRouter } from 'vue-router';
  import { throttle } from 'lodash-es';
  import { library } from '@fortawesome/fontawesome-svg-core';
  import { faSearch, faExclamationTriangle, faBoxOpen } from '@fortawesome/free-solid-svg-icons';
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

  library.add(faSearch, faExclamationTriangle, faBoxOpen);

  // --- Constants ---
  const GAP_BETWEEN_PAGINATION_AND_FOOTER = 90;
  const THRESHOLD_BUFFER = 90;
  const THROTTLE_TIME = 30; // Check scroll/resize fairly often

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
  // This ref now tracks if JS needs to apply *absolute* positioning logic
  const isPaginationFixed = ref(true); // Assume fixed initially
  let footerEl = null;

  const filters = ref({
    searchQuery: '',
    category: 'all',
    sort: 'featured'
  });

  // --- Helper function for truncation ---
  function truncateText(text, maxLength) {
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
  const fetchProducts = async (page = 1) => {
    isLoading.value = true;
    errorLoading.value = null;
    // Clear products immediately for loading state if not appending
    // products.value = [];
    console.log(`Fetching products for page ${page}, limit ${limit.value}, filters:`, filters.value);
    try {
      let url = `/api/products?page=${page}&limit=${limit.value}`;
      if (filters.value.searchQuery) {
        url += `&q=${encodeURIComponent(filters.value.searchQuery)}`;
      }
      if (filters.value.category !== 'all') {
        url += `&category=${filters.value.category}`;
      }
      if (filters.value.sort !== 'featured') {
        url += `&sort=${filters.value.sort}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        let errorMessage = `HTTP error! Status: ${response.status}`;
        try { const errorBody = await response.json(); errorMessage = errorBody.message || errorMessage; }
        catch (e) { /* Ignore */ }
        throw new Error(errorMessage);
      }
      const data = await response.json();
      const maxDescriptionLength = 75;

      products.value = data.products.map(product => {
        const originalDescription = product.description || defaultDescription;
        const truncatedDescription = truncateText(originalDescription, maxDescriptionLength);
        return {
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

      isLoading.value = false; // Set loading false BEFORE scroll/tick

      // Update URL query params without full reload
      // Do this *after* fetch is successful and *before* scrolling
      router.push({ query: { ...route.query, page: page, ...getCleanFiltersForURL() } });

      await nextTick(); // Wait for DOM updates (grid renders, v-if evaluates)

      // Run scroll handler *after* DOM is updated to check initial position
      handleScroll();

      // Scroll logic
      if (page !== 1 && products.value.length > 0) {
        const sectionElement = document.querySelector('.product-listing-section');
        if (sectionElement) {
          const sectionTop = sectionElement.getBoundingClientRect().top + window.scrollY;
          const headerOffset = document.getElementById('header')?.offsetHeight || 80;
          window.scrollTo({ top: sectionTop - headerOffset - 20, behavior: 'smooth' });
        }
      } else if (page === 1 && !route.query.page) { // Only scroll to top on initial load (not filter change)
        // Don't scroll to top automatically on filter change/reset
        // window.scrollTo({ top: 0, behavior: 'smooth' });
      }

    } catch (error) {
      console.error("Error fetching products:", error);
      errorLoading.value = error.message || "Failed to load products. Please try again later.";
      products.value = [];
      currentPage.value = 1;
      totalPages.value = 1;
      totalProducts.value = 0;
      isLoading.value = false;
      await nextTick(); // Ensure v-if updates for error message
      handleScroll(); // Check pagination position even on error
    }
  };

  // --- Filter Methods ---
  const applyFilters = () => {
    if (isLoading.value) return; // Prevent applying filters while loading
    // Fetch products starting from page 1 when filters are applied
    fetchProducts(1);
  };

  const resetFilters = () => {
    if (isLoading.value) return; // Prevent resetting while loading
    filters.value = {
      searchQuery: '',
      category: 'all',
      sort: 'featured'
    };
    // Fetch products starting from page 1 after resetting
    fetchProducts(1);
  };

  const getCleanFiltersForURL = () => {
    const cleanFilters = {};
    if (filters.value.searchQuery) cleanFilters.q = filters.value.searchQuery;
    if (filters.value.category !== 'all') cleanFilters.category = filters.value.category;
    if (filters.value.sort !== 'featured') cleanFilters.sort = filters.value.sort;
    return cleanFilters;
  }


  // --- Pagination Logic ---
  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages.value && pageNumber !== currentPage.value && !isLoading.value) {
      fetchProducts(pageNumber);
    }
  };

  const paginationRange = computed(() => {
    const current = currentPage.value;
    const last = totalPages.value;
    const delta = 2;
    const left = current - delta;
    const right = current + delta + 1;
    const range = [];
    const rangeWithDots = [];

    for (let i = 1; i <= last; i++) {
      if (i === 1 || i === last || (i >= left && i < right)) {
        range.push(i);
      }
    }

    let l;
    for (const i of range) {
      if (l) {
        if (i - l === 2) { rangeWithDots.push(l + 1); }
        else if (i - l !== 1) { rangeWithDots.push('...'); }
      }
      rangeWithDots.push(i);
      l = i;
    }
    return rangeWithDots;
  });

  const emitAddToCart = (productData) => {
    console.log('Add to cart clicked in ProductsView:', productData);
    emit('addToCart', productData);
  };


  // --- Sticky Pagination Logic ---
  const handleScroll = () => {
    // Ensure pagination element exists (it might not initially due to v-if)
    if (!paginationRef.value || !footerEl) {
      // console.log("Pagination or footer ref not available yet.");
      return;
    }

    const paginationHeight = paginationRef.value.offsetHeight;
    const footerRect = footerEl.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const isFooterApproachingOrVisible = footerRect.top <= viewportHeight + THRESHOLD_BUFFER;

    // Calculate the absolute top position needed if switching to absolute
    const absoluteTopPosition = footerEl.offsetTop - paginationHeight - GAP_BETWEEN_PAGINATION_AND_FOOTER;

    if (isFooterApproachingOrVisible) {
      // Footer is close or visible: Use ABSOLUTE positioning
      // Only apply styles if not already absolute to avoid unnecessary DOM manipulation
      if (isPaginationFixed.value) {
        // console.log("Switching to Absolute");
        paginationRef.value.style.position = 'absolute';
        paginationRef.value.style.top = `${absoluteTopPosition}px`;
        paginationRef.value.style.bottom = 'auto'; // Remove bottom constraint
        // Centering styles (already in base CSS, but good to ensure)
        paginationRef.value.style.left = '50%';
        paginationRef.value.style.transform = 'translateX(-50%)';
        isPaginationFixed.value = false; // Update state
      } else {
        // Already absolute, just ensure top position is correct (for resize cases)
        paginationRef.value.style.top = `${absoluteTopPosition}px`;
      }
    } else {
      // Footer is far below: Use FIXED positioning
      // Only apply styles if not already fixed
      if (!isPaginationFixed.value) {
        // console.log("Switching to Fixed");
        paginationRef.value.style.position = 'fixed';
        paginationRef.value.style.top = 'auto'; // Remove top constraint
        paginationRef.value.style.bottom = '1.5rem'; // Re-apply bottom constraint
        // Centering styles (already in base CSS, but good to ensure)
        paginationRef.value.style.left = '50%';
        paginationRef.value.style.transform = 'translateX(-50%)';
        isPaginationFixed.value = true; // Update state
      }
    }
  };

  const throttledScrollHandler = throttle(handleScroll, THROTTLE_TIME);

  // --- Lifecycle Hooks ---
  onMounted(async () => {
    footerEl = document.querySelector('footer'); // Find footer once on mount
    if (!footerEl) { console.error("Footer element not found!"); }

    // Initialize filters from URL query params
    filters.value.searchQuery = route.query.q || '';
    filters.value.category = route.query.category || 'all';
    filters.value.sort = route.query.sort || 'featured';
    const initialPage = parseInt(route.query.page) || 1;

    await fetchProducts(initialPage); // Fetch initial data

    // Add listeners AFTER initial fetch completes and DOM might have pagination
    window.addEventListener('scroll', throttledScrollHandler);
    window.addEventListener('resize', throttledScrollHandler);

    // Initial check in case content is short
    // Use nextTick to ensure paginationRef is available after v-if becomes true
    await nextTick();
    handleScroll();

  });

  onUnmounted(() => {
    window.removeEventListener('scroll', throttledScrollHandler);
    window.removeEventListener('resize', throttledScrollHandler);
  });
</script>

<style scoped>
  /* --- Enhanced Page Header --- */
  .enhanced-page-header {
    padding-top: calc(var(--header-height) + 5rem);
    padding-bottom: 4rem;
    background: linear-gradient(to bottom, var(--bg-off-light), var(--bg-light));
    border-bottom: 1px solid var(--border-color);
    position: relative;
    overflow: hidden;
    text-align: center; /* Ensure text is centered */
  }

    .enhanced-page-header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      opacity: 0.03;
      z-index: 0;
    }

    .enhanced-page-header h1 {
      font-size: clamp(2.8rem, 7vw, 4rem);
      position: relative;
      z-index: 1;
      margin-bottom: 0.8rem;
      color: var(--text-dark); /* Explicit color */
    }

    .enhanced-page-header p {
      font-size: 1.15rem;
      max-width: 65ch;
      position: relative;
      z-index: 1;
      color: var(--text-muted); /* Explicit color */
      margin-left: auto; /* Center paragraph */
      margin-right: auto; /* Center paragraph */
    }

  /* --- Enhanced Filter Controls --- */
  .enhanced-filter-controls {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1.5rem 1.2rem;
    margin-bottom: 3.5rem;
    padding: 1.8rem;
    background-color: var(--white);
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-medium);
    border: none;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

    .filter-group label {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-dark);
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

      .filter-group label .svg-inline--fa {
        color: var(--primary);
        font-size: 0.9em;
      }

    .filter-group input[type="search"],
    .filter-group select {
      padding: 0.8rem 1rem;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-small);
      font-size: 0.95rem;
      background-color: var(--bg-light);
      transition: border-color var(--transition-fast), box-shadow var(--transition-fast), background-color var(--transition-fast);
      height: 44px; /* Consistent height */
      box-sizing: border-box;
    }

    .filter-group input[type="search"] {
      padding-left: 1rem;
    }

      .filter-group input[type="search"]:focus,
      .filter-group select:focus,
      .filter-group input[type="search"]:focus-visible,
      .filter-group select:focus-visible {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px var(--glow-primary);
        background-color: var(--white);
      }

    .filter-group select {
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%236c757d'%3E%3Cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.9rem center;
      background-size: 16px 12px;
      padding-right: 2.8rem;
      cursor: pointer;
    }

  .filter-actions {
    grid-column: 1 / -1;
    display: flex;
    justify-content: flex-end;
    align-items: center; /* Vertically align buttons */
    gap: 0.8rem;
    margin-top: 0.5rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border-color);
  }

  .filter-button { /* Make sure global styles exist or add here */
    padding: 0.7rem 1.5rem;
    border-radius: var(--border-radius-small);
    font-weight: 600;
    font-size: 0.85rem;
    border: 1px solid transparent;
    transition: all var(--transition-fast);
    cursor: pointer;
    height: 44px; /* Match input height */
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

    .filter-button.primary {
      background-color: var(--primary);
      color: var(--white);
      border-color: var(--primary);
    }

      .filter-button.primary:hover:not(:disabled) {
        background-color: #3dbbab;
        border-color: #3dbbab;
        transform: translateY(-1px);
      }

    .filter-button.secondary {
      background-color: transparent;
      color: var(--text-muted);
      border-color: var(--border-color);
    }

      .filter-button.secondary:hover:not(:disabled) {
        background-color: var(--bg-off-light);
        color: var(--text-dark);
        border-color: #adb5bd;
      }

    .filter-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }


  @media (max-width: 768px) {
    .enhanced-filter-controls {
      grid-template-columns: 1fr;
    }

    .filter-actions {
      justify-content: center;
    }
  }


  /* --- Skeleton Grid --- */
  .skeleton-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2.5rem;
    min-height: 300px;
    padding-bottom: calc(50px + 16px + 6rem); /* Match product grid padding */
  }

  /* --- Message Containers (Error/Empty) --- */
  .message-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 4rem 1rem;
    min-height: 40vh;
    color: var(--text-muted);
  }

  .message-icon {
    font-size: 3.5rem;
    margin-bottom: 1.5rem;
    opacity: 0.6;
  }

  .message-container h2 {
    font-family: var(--font-heading);
    font-size: 1.8rem;
    color: var(--text-dark);
    margin-bottom: 0.8rem;
  }

  .message-container p {
    font-size: 1.05rem;
    max-width: 50ch;
    margin-bottom: 2rem;
    line-height: 1.6;
  }

  .error-container .message-icon {
    color: var(--secondary);
  }

  .empty-container .message-icon {
    color: var(--primary);
  }

  /* --- Product Card Stagger Animation --- */
  .product-card-item {
    opacity: 0;
    transform: translateY(20px);
    animation: fade-slide-up 0.5s ease-out forwards;
    animation-delay: var(--stagger-delay, 0s);
  }

  @keyframes fade-slide-up {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* --- Pagination Ellipsis --- */
  .page-item.ellipsis .page-link {
    background-color: transparent;
    border-color: transparent;
    color: var(--text-muted);
    pointer-events: none;
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }

  .page-link.ellipsis {
    cursor: default;
  }

    .page-link.ellipsis:hover {
      background-color: transparent;
      transform: none;
      box-shadow: none;
    }

  /* --- CORRECTED: Pagination Container Styling --- */
  .pagination-container {
    /* Default state is Fixed */
    position: fixed;
    bottom: 1.5rem; /* Default bottom position */
    left: 50%;
    transform: translateX(-50%);
    width: fit-content; /* Let width be determined by content */
    /* Appearance */
    background-color: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(8px);
    padding: 0.75rem 1.5rem;
    border: 1px solid var(--border-color);
    border-radius: 50px;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    z-index: 900;
    /* Flex for inner alignment (already handled by global styles) */
    display: flex;
    justify-content: center;
    align-items: center;
    /* Transitions */
    transition: background-color 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease, border-color 0.3s ease,
    /* Add smooth transition for position changes ONLY when switching states */
    top 0.3s ease, bottom 0.3s ease;
    opacity: 1; /* Ensure visible by default */
  }

    /* Class applied by JS when pagination should be absolutely positioned */
    .pagination-container.is-absolute {
      /* Overrides for absolute state (positioning set by inline style 'top' from JS) */
      position: absolute; /* JS will set this inline too, but good for clarity */
      bottom: auto; /* Remove fixed bottom constraint */
      backdrop-filter: none;
      background-color: var(--bg-light);
      box-shadow: none;
      border-color: transparent;
    }

    /* Ensure the inner ul doesn't have extra margin/padding */
    .pagination-container .pagination {
      margin: 0;
      padding: 0;
      display: flex;
      gap: 0.5rem;
    }


  /* Adjust padding on the grid container */
  .product-listing-section .product-grid,
  .product-listing-section .skeleton-grid {
    min-height: 300px;
    padding-bottom: calc(50px + 16px + 6rem); /* Ensure enough space below grid */
  }

  /* Fade Transition for grid content */
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>
