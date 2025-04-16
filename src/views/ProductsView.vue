<template>
  <main>
    <!-- Enhanced Page Header -->
    <section class="page-header enhanced-page-header">
      <h1>{{ t('productsPage.title') }}</h1>
      <p>{{ t('productsPage.tagline') }}</p>
    </section>

    <!-- Product Listing Section -->
    <section class="product-listing-section">

      <!-- Enhanced Filter Controls -->
      <div class="filter-controls enhanced-filter-controls">
        <!-- Search Input -->
        <div class="filter-group search-group">
          <label for="search-products">
            <font-awesome-icon icon="search" /> {{ t('productsPage.filters.searchLabel') }}
          </label>
          <input type="search" id="search-products" name="search" :placeholder="t('productsPage.filters.searchPlaceholder')" v-model="filters.searchQuery" @input="debounceApplyFilters" @keyup.enter="applyFilters">
        </div>
        <!-- Category Select -->
        <div class="filter-group">
          <label for="filter-category">{{ t('productsPage.filters.categoryLabel') }}</label>
          <select id="filter-category" name="category" v-model="filters.category" @change="applyFilters" :disabled="isLoading || categoriesLoading">
            <option value="">{{ t('productsPage.filters.allCategories') }}</option>
            <option v-for="category in categories" :key="category" :value="category">
              {{ category }} <!-- Category names are dynamic data (base English) -->
            </option>
          </select>
        </div>
        <!-- Price Range -->
        <div class="filter-group price-range-group">
          <label>{{ t('productsPage.filters.priceRangeLabel') }}</label>
          <div class="price-inputs">
            <div>
              <!-- Wrapper for relative positioning -->
              <span class="price-prefix">$</span>
              <input type="number" min="0" placeholder="Min" :aria-label="t('productsPage.filters.minPriceAriaLabel')" v-model.number="filters.minPrice" @input="debounceApplyFilters" @change="applyFilters">
            </div>
            <span class="price-separator">–</span>
            <div>
              <!-- Wrapper for relative positioning -->
              <span class="price-prefix">$</span>
              <input type="number" min="0" placeholder="Max" :aria-label="t('productsPage.filters.maxPriceAriaLabel')" v-model.number="filters.maxPrice" @input="debounceApplyFilters" @change="applyFilters">
            </div>
          </div>
        </div>
        <!-- Sort Select -->
        <div class="filter-group">
          <label for="filter-sort">{{ t('productsPage.filters.sortLabel') }}</label>
          <select id="filter-sort" name="sort" v-model="filters.sort" @change="applyFilters" :disabled="isLoading">
            <option value="featured">{{ t('productsPage.filters.sortOptions.featured') }}</option>
            <option value="newest">{{ t('productsPage.filters.sortOptions.newest') }}</option>
            <option value="price-asc">{{ t('productsPage.filters.sortOptions.priceAsc') }}</option>
            <option value="price-desc">{{ t('productsPage.filters.sortOptions.priceDesc') }}</option>
            <option value="name-asc">{{ t('productsPage.filters.sortOptions.nameAsc') }}</option>
            <option value="name-desc">{{ t('productsPage.filters.sortOptions.nameDesc') }}</option>
            <!-- Add rating sort if implemented -->
            <!-- <option value="rating">{{ t('productsPage.filters.sortOptions.rating') }}</option> -->
          </select>
        </div>
        <!-- Action Buttons -->
        <div class="filter-actions">
          <button @click="resetFilters" class="filter-button secondary" :disabled="isLoading">{{ t('productsPage.filters.resetButton') }}</button>
        </div>
      </div>

      <!-- Results Count -->
      <div class="results-summary" v-if="!isLoading && !errorLoading">
        <!-- Use $t for pluralization -->
        {{ $t('productsPage.resultsSummary.showing', { count: products.length, total: totalProducts }) }}
        <span v-if="filters.searchQuery">{{ t('productsPage.resultsSummary.forQuery', { query: filters.searchQuery }) }}</span>
        <span v-if="filters.category">{{ t('productsPage.resultsSummary.inCategory', { category: filters.category }) }}</span>.
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
          <h2>{{ t('productsPage.error.title') }}</h2>
          <p>{{ errorLoading }}</p>
          <button @click="fetchProducts(1)" class="filter-button primary">{{ t('productsPage.error.tryAgain') }}</button>
        </div>

        <!-- Product Grid -->
        <div v-else-if="products.length > 0" key="grid" class="product-grid">
          <ProductCard v-for="(product, index) in products"
                       :key="product.id"
                       :product="product"
                       :linkTo="{ name: 'product-detail', params: { id: product.id } }"
                       @add-to-cart="emitAddToCart"
                       :apply-tilt="true"
                       class="product-card-item"
                       :style="{ '--stagger-delay': `${index * 0.05}s` }" />
        </div>

        <!-- Empty State -->
        <div v-else key="empty" class="message-container empty-container">
          <font-awesome-icon icon="box-open" class="message-icon empty-icon" />
          <h2>{{ t('productsPage.empty.title') }}</h2>
          <p>{{ t('productsPage.empty.message') }}</p>
          <button v-if="hasActiveFilters" @click="resetFilters" class="filter-button secondary">{{ t('productsPage.empty.clearFilters') }}</button>
        </div>
      </transition>

    </section>

    <!-- Pagination -->
    <nav v-if="!isLoading && !errorLoading && totalPages > 1"
         ref="paginationRef"
         class="pagination-container"
         :class="{ 'is-absolute': !isPaginationFixed }"
         :aria-label="t('productsPage.pagination.pageAriaLabel')">
      <ul class="pagination">
        <li class="page-item" :class="{ disabled: currentPage === 1 }">
          <button class="page-link" @click="goToPage(currentPage - 1)" :disabled="currentPage === 1 || isLoading" :aria-label="t('productsPage.pagination.previousAriaLabel')">
            <span aria-hidden="true">{{ t('productsPage.pagination.previousText') }}</span>
            <span class="visually-hidden">Previous</span>
          </button>
        </li>
        <li v-for="page in paginationRange"
            :key="`page-${page}`"
            class="page-item"
            :class="{ active: currentPage === page, ellipsis: page === '...' }">
          <span v-if="page === '...'" class="page-link ellipsis">...</span>
          <button v-else class="page-link" @click="goToPage(page)" :disabled="isLoading" :aria-current="currentPage === page ? 'page' : null">
            {{ page }}
          </button>
        </li>
        <li class="page-item" :class="{ disabled: currentPage === totalPages }">
          <button class="page-link" @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages || isLoading" :aria-label="t('productsPage.pagination.nextAriaLabel')">
            <span aria-hidden="true">{{ t('productsPage.pagination.nextText') }}</span>
            <span class="visually-hidden">Next</span>
          </button>
        </li>
      </ul>
    </nav>
  </main>
</template>

<script setup>
  import { ref, onMounted, onUnmounted, nextTick, computed, watch } from 'vue';
  import { useI18n } from 'vue-i18n';
  import ProductCard from '../components/ui/ProductCard.vue';
  import SkeletonCard from '../components/ui/SkeletonCard.vue';
  import { useRoute, useRouter } from 'vue-router';
  import { debounce, throttle } from 'lodash-es';
  import { library } from '@fortawesome/fontawesome-svg-core';
  import { faSearch, faExclamationTriangle, faBoxOpen } from '@fortawesome/free-solid-svg-icons';
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

  library.add(faSearch, faExclamationTriangle, faBoxOpen);

  const { t } = useI18n();

  // --- Constants ---
  const DEFAULT_LIMIT = 12;
  const DEBOUNCE_DELAY = 400;
  const GAP_BETWEEN_PAGINATION_AND_FOOTER = 90; // Adjust as needed
  const THROTTLE_TIME = 100; // Throttle scroll checks

  // --- Emits, Refs, State ---
  const emit = defineEmits(['addToCart']);
  const products = ref([]);
  const isLoading = ref(true);
  const errorLoading = ref(null);
  const route = useRoute();
  const router = useRouter();
  const currentPage = ref(1);
  const totalPages = ref(1);
  const limit = ref(DEFAULT_LIMIT);
  const totalProducts = ref(0);
  const defaultDescription = t('productCard.defaultDescription');
  const paginationRef = ref(null);
  const categories = ref([]);
  const categoriesLoading = ref(false);
  const isPaginationFixed = ref(true); // Assume fixed initially
  let footerEl = null; // To store footer element reference

  const filters = ref({
    searchQuery: '',
    category: '',
    sort: 'featured',
    minPrice: null,
    maxPrice: null,
  });

  const hasActiveFilters = computed(() => {
    return filters.value.searchQuery ||
      filters.value.category ||
      filters.value.minPrice !== null ||
      filters.value.maxPrice !== null ||
      filters.value.sort !== 'featured'; // Include sort if it differs from default
  });

  // --- Methods ---
  function truncateText(text, maxLength) {
    if (!text) return '';
    const cleanedText = text.trim();
    if (cleanedText.length <= maxLength) return cleanedText;
    let truncated = cleanedText.slice(0, maxLength);
    let lastSpaceIndex = truncated.lastIndexOf(' ');
    if (lastSpaceIndex > 0 && lastSpaceIndex > maxLength - 15) { // Ensure last word isn't tiny
      truncated = truncated.slice(0, lastSpaceIndex);
    }
    return truncated + "...";
  }

  // --- Category Fetching ---
  const fetchCategories = async () => {
    categoriesLoading.value = true;
    try {
      const response = await fetch('/api/products/categories'); // Fetches base English categories
      if (!response.ok) throw new Error('Failed to fetch categories');
      categories.value = await response.json();
    } catch (error) {
      console.error("Error fetching categories:", error);
      categories.value = [];
    } finally {
      categoriesLoading.value = false;
    }
  };

  // --- Product Fetching Logic (Backend Powered) ---
  const fetchProducts = async (page = 1) => {
    isLoading.value = true;
    errorLoading.value = null;
    console.log(`Fetching products for page ${page}, limit ${limit.value}, filters:`, filters.value);

    try {
      let url = `/api/products/search?page=${page}&limit=${limit.value}`;
      // Add filter parameters
      if (filters.value.searchQuery) url += `&q=${encodeURIComponent(filters.value.searchQuery)}`;
      if (filters.value.category) url += `&category=${encodeURIComponent(filters.value.category)}`;
      if (filters.value.minPrice !== null && filters.value.minPrice >= 0) url += `&minPrice=${filters.value.minPrice}`;
      if (filters.value.maxPrice !== null && filters.value.maxPrice >= 0) {
        if (filters.value.minPrice === null || filters.value.maxPrice >= filters.value.minPrice) {
          url += `&maxPrice=${filters.value.maxPrice}`;
        } else {
          console.warn("Max price is less than min price, ignoring max price filter.");
        }
      }
      if (filters.value.sort) url += `&sort=${filters.value.sort}`;


      const response = await fetch(url); // Backend handles language via header
      if (!response.ok) {
        let errorMessage = `HTTP error! Status: ${response.status}`;
        try { const errorBody = await response.json(); errorMessage = errorBody.message || errorMessage; } catch (e) { /* Ignore */ }
        throw new Error(errorMessage);
      }
      const data = await response.json();

      const maxDescriptionLength = 75;
      // Backend now sends translated name/description/category directly
      products.value = data.products.map(product => ({
        id: product.id, // Assuming backend sends 'id' or map from '_id'
        name: product.name, // Already translated
        description: truncateText(product.description || defaultDescription, maxDescriptionLength), // Already translated
        price: product.price,
        image: product.image, // Already formatted by backend
        averageRating: product.averageRating || 0,
        reviewCount: product.reviewCount || 0,
      }));

      currentPage.value = data.currentPage;
      totalPages.value = data.totalPages;
      totalProducts.value = data.totalProducts;

      isLoading.value = false;

      updateURLQueryParams(page);

      await nextTick(); // Wait for DOM updates

      // ** CALL handleScroll AFTER data is loaded and DOM updated **
      handleScroll(); // Recalculate pagination position

      // Scroll logic
      const sectionElement = document.querySelector('.product-listing-section');
      if (sectionElement && page !== 1 && route.query.q === undefined && route.query.category === undefined) { // Avoid scroll on filter change
        const sectionTop = sectionElement.getBoundingClientRect().top + window.scrollY;
        const headerOffset = document.getElementById('header')?.offsetHeight || 80;
        window.scrollTo({ top: sectionTop - headerOffset - 20, behavior: 'smooth' });
      }

    } catch (error) {
      console.error("Error fetching products:", error);
      errorLoading.value = error.message || t('productsPage.error.title'); // Use translated fallback
      products.value = [];
      currentPage.value = 1;
      totalPages.value = 1;
      totalProducts.value = 0;
      isLoading.value = false;
      await nextTick();
      handleScroll(); // Still check scroll position
    }
  };

  // --- URL Query Parameter Management ---
  const updateURLQueryParams = (page) => {
    const query = {};
    if (page > 1) query.page = page;
    if (filters.value.searchQuery) query.q = filters.value.searchQuery;
    if (filters.value.category) query.category = filters.value.category;
    if (filters.value.minPrice !== null && filters.value.minPrice >= 0) query.minPrice = filters.value.minPrice;
    // Ensure maxPrice >= minPrice if both are set
    if (filters.value.maxPrice !== null && filters.value.maxPrice >= 0 && (filters.value.minPrice === null || filters.value.maxPrice >= filters.value.minPrice)) {
      query.maxPrice = filters.value.maxPrice;
    }
    if (filters.value.sort && filters.value.sort !== 'featured') query.sort = filters.value.sort;

    // Only push if the query is different from the current route query
    if (JSON.stringify(query) !== JSON.stringify(route.query)) {
      router.replace({ query }).catch(err => {
        if (err.name !== 'NavigationDuplicated') { console.error('Router replace error:', err); }
      });
    }
  };

  const readFiltersFromURL = () => {
    filters.value.searchQuery = route.query.q || '';
    filters.value.category = route.query.category || '';
    filters.value.minPrice = route.query.minPrice ? Number(route.query.minPrice) : null;
    filters.value.maxPrice = route.query.maxPrice ? Number(route.query.maxPrice) : null;
    filters.value.sort = route.query.sort || 'featured';
    return parseInt(route.query.page) || 1;
  };

  // --- Filter Methods ---
  const applyFilters = () => {
    if (isLoading.value) return;
    // Ensure max price >= min price if both exist
    if (filters.value.minPrice !== null && filters.value.maxPrice !== null && filters.value.maxPrice < filters.value.minPrice) {
      filters.value.maxPrice = filters.value.minPrice; // Adjust max to be at least min
    }
    fetchProducts(1);
  };
  const debounceApplyFilters = debounce(applyFilters, DEBOUNCE_DELAY);
  const resetFilters = () => {
    if (isLoading.value) return;
    filters.value = { searchQuery: '', category: '', sort: 'featured', minPrice: null, maxPrice: null };
    fetchProducts(1);
  };

  // --- Pagination Logic ---
  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages.value && pageNumber !== currentPage.value && !isLoading.value) {
      fetchProducts(pageNumber);
    }
  };
  const paginationRange = computed(() => {
    const current = currentPage.value; const last = totalPages.value; const delta = 1; // Show 1 page left/right
    const left = current - delta; const right = current + delta + 1;
    const range = []; const rangeWithDots = []; let l;
    for (let i = 1; i <= last; i++) { if (i === 1 || i === last || (i >= left && i < right)) range.push(i); }
    for (const i of range) { if (l) { if (i - l === 2) rangeWithDots.push(l + 1); else if (i - l > 2) rangeWithDots.push('...'); } rangeWithDots.push(i); l = i; }
    return rangeWithDots;
  });
  const emitAddToCart = (productData) => { emit('addToCart', productData); };


  // --- Sticky Pagination Logic ---
  const handleScroll = () => {
    if (!paginationRef.value || !footerEl || totalPages.value <= 1) {
      if (paginationRef.value) {
        paginationRef.value.classList.remove('is-absolute'); // Ensure fixed state via CSS
        isPaginationFixed.value = true;
      }
      return;
    }

    const paginationHeight = paginationRef.value.offsetHeight;
    const scrollY = window.scrollY || window.pageYOffset;
    const footerOffsetTop = footerEl.offsetTop;
    const viewportHeight = window.innerHeight;
    const collisionPoint = footerOffsetTop - paginationHeight - GAP_BETWEEN_PAGINATION_AND_FOOTER;

    if (scrollY + viewportHeight >= collisionPoint) {
      // Switch to Absolute
      if (isPaginationFixed.value) {
        paginationRef.value.classList.add('is-absolute');
        paginationRef.value.style.top = `${footerOffsetTop - paginationHeight - GAP_BETWEEN_PAGINATION_AND_FOOTER}px`;
        isPaginationFixed.value = false;
      } else {
        // Already absolute, update top position if footer moved (less common but possible)
        paginationRef.value.style.top = `${footerOffsetTop - paginationHeight - GAP_BETWEEN_PAGINATION_AND_FOOTER}px`;
      }
    } else {
      // Switch to Fixed (by removing absolute class)
      if (!isPaginationFixed.value) {
        paginationRef.value.classList.remove('is-absolute');
        paginationRef.value.style.top = ''; // Remove inline style
        isPaginationFixed.value = true;
      }
    }
  };
  const throttledScrollHandler = throttle(handleScroll, THROTTLE_TIME);


  // --- Lifecycle Hooks ---
  onMounted(async () => {
    footerEl = document.querySelector('footer');
    if (!footerEl) { console.error("Footer element not found! Sticky pagination may not work."); }

    await fetchCategories();
    const initialPage = readFiltersFromURL();
    await fetchProducts(initialPage);

    window.addEventListener('scroll', throttledScrollHandler);
    window.addEventListener('resize', throttledScrollHandler);

    await nextTick();
    handleScroll(); // Initial check
  });

  onUnmounted(() => {
    window.removeEventListener('scroll', throttledScrollHandler);
    window.removeEventListener('resize', throttledScrollHandler);
  });

  // Watch route changes to refetch if query params change externally
  watch(() => route.fullPath, (newPath, oldPath) => {
    if (newPath !== oldPath && route.name === 'products') {
      console.log('Route changed, re-fetching products...');
      const newPage = readFiltersFromURL();
      fetchProducts(newPage);
    }
  });

</script>

<style scoped>
  /* Enhanced Filters Styles */
  .enhanced-filter-controls {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); /* Flexible columns */
    gap: 1.5rem 1.2rem; /* Row gap, Column gap */
    align-items: end; /* Align items to the bottom */
    margin-bottom: 3.5rem;
    padding: 1.8rem;
    background-color: var(--bg-off-light); /* Use off-light background */
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-soft); /* Softer shadow */
    border: none; /* Remove default border */
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

    .filter-group label {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-dark);
      display: flex;
      align-items: center;
      gap: 0.4em;
    }

      .filter-group label .svg-inline--fa {
        color: var(--primary);
        font-size: 0.9em;
      }

  /* Enhanced inputs/selects */
  .enhanced-filter-controls input[type="search"],
  .enhanced-filter-controls input[type="number"],
  .enhanced-filter-controls select {
    width: 100%;
    padding: 0.8rem 1rem;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-small);
    font-size: 0.95rem;
    font-family: var(--font-body);
    background-color: var(--white); /* White background for inputs */
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast), background-color var(--transition-fast);
    height: 44px; /* Consistent height */
    box-sizing: border-box;
  }

  .enhanced-filter-controls select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%236c757d'%3E%3Cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.9rem center;
    background-size: 16px 12px;
    padding-right: 2.8rem;
    cursor: pointer;
  }

    .enhanced-filter-controls input:focus,
    .enhanced-filter-controls select:focus,
    .enhanced-filter-controls input:focus-visible,
    .enhanced-filter-controls select:focus-visible {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px var(--glow-primary);
      background-color: var(--white);
    }

  /* Price Range Specifics */
  .price-range-group .price-inputs {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    height: 44px; /* Match height */
    background-color: var(--white); /* Container background */
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-small);
    padding: 0 0.5rem;
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  }

    .price-range-group .price-inputs:focus-within {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px var(--glow-primary);
    }


  .price-range-group input[type="number"] {
    width: 100%;
    text-align: center;
    border: none; /* Remove individual input borders */
    padding: 0.5rem 0.2rem;
    height: auto; /* Let input size naturally */
    background: none;
    box-shadow: none;
    -moz-appearance: textfield; /* Firefox */
  }

    .price-range-group input[type="number"]::-webkit-outer-spin-button,
    .price-range-group input[type="number"]::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    .price-range-group input[type="number"]:focus {
      outline: none;
      box-shadow: none; /* No focus ring on input itself */
    }

  .price-range-group .price-prefix {
    color: var(--text-muted);
    pointer-events: none;
    padding-left: 0.3rem;
  }

  .price-range-group .price-separator {
    color: var(--text-muted);
    font-weight: 500;
  }

  /* Filter Actions */
  .filter-actions {
    grid-column: 1 / -1; /* Span full width */
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 0.8rem;
    margin-top: 0.5rem; /* Space above actions */
    padding-top: 1rem;
    border-top: 1px solid var(--border-color);
  }

  .filter-button {
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

  .results-summary { /* Styles from main.css */
  }

  .product-grid { /* Styles from main.css */
  }

  .skeleton-grid { /* Styles from main.css */
  }

  .product-card-item { /* Styles from main.css */
  }

  .message-container { /* Styles from main.css */
  }

  .pagination-container { /* Styles from main.css */
  }

  .pagination { /* Styles from main.css */
  }

  .page-item { /* Styles from main.css */
  }

  .page-link { /* Styles from main.css */
  }

  /* Ensure absolute pagination is correctly positioned */
  .pagination-container.is-absolute {
    position: absolute;
    bottom: auto; /* Remove fixed bottom constraint */
    left: 50%; /* Center horizontally */
    transform: translateX(-50%); /* Fine-tune centering */
    /* Styles from main.css for appearance might need adjustment */
    background-color: var(--bg-light);
    box-shadow: none;
    border-color: transparent;
    backdrop-filter: none;
  }

  @media (max-width: 768px) {
    .enhanced-filter-controls {
      grid-template-columns: 1fr 1fr;
      padding: 1.2rem;
    }

    .filter-actions {
      justify-content: center;
    }
  }

  @media (max-width: 576px) {
    .enhanced-filter-controls {
      grid-template-columns: 1fr;
    }

    .price-range-group .price-inputs {
      padding: 0 0.3rem;
    }
    /* Reduce padding */
    .price-range-group input[type="number"] {
      font-size: 0.9rem;
    }
    /* Smaller font */
  }

  /* Ensure transitions are defined */
  .fade-enter-active, .fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .fade-enter-from, .fade-leave-to {
    opacity: 0;
  }
</style>
