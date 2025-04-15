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
          <!-- Use keyup.enter to trigger search immediately on enter -->
          <input type="search" id="search-products" name="search" :placeholder="t('productsPage.filters.searchPlaceholder')" v-model="filters.searchQuery" @input="debounceApplyFilters" @keyup.enter="applyFilters">
        </div>
        <!-- Category Select -->
        <div class="filter-group">
          <label for="filter-category">{{ t('productsPage.filters.categoryLabel') }}</label>
          <select id="filter-category" name="category" v-model="filters.category" @change="applyFilters" :disabled="isLoading || categoriesLoading">
            <option value="">{{ t('productsPage.filters.allCategories') }}</option>
            <option v-for="category in categories" :key="category" :value="category">
              {{ category }} <!-- Category names are dynamic data -->
            </option>
          </select>
        </div>
        <!-- Price Range -->
        <div class="filter-group price-range-group">
          <label>{{ t('productsPage.filters.priceRangeLabel') }}</label>
          <div class="price-inputs">
            <span class="price-prefix">$</span>
            <input type="number" min="0" placeholder="Min" :aria-label="t('productsPage.filters.minPriceAriaLabel')" v-model.number="filters.minPrice" @input="debounceApplyFilters" @change="applyFilters">
            <span class="price-separator">–</span>
            <span class="price-prefix">$</span>
            <input type="number" min="0" placeholder="Max" :aria-label="t('productsPage.filters.maxPriceAriaLabel')" v-model.number="filters.maxPrice" @input="debounceApplyFilters" @change="applyFilters">
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
          </select>
        </div>
        <!-- Action Buttons -->
        <div class="filter-actions">
          <button @click="resetFilters" class="filter-button secondary" :disabled="isLoading">{{ t('productsPage.filters.resetButton') }}</button>
        </div>
      </div>

      <!-- Results Count -->
      <div class="results-summary" v-if="!isLoading && !errorLoading">
        {{ t('productsPage.resultsSummary.showing', { count: products.length, total: totalProducts }) }}
        <span v-if="filters.searchQuery">{{ t('productsPage.resultsSummary.forQuery', { query: filters.searchQuery }) }}</span>
        <span v-if="filters.category">{{ t('productsPage.resultsSummary.inCategory', { category: filters.category }) }}</span>.
      </div>


      <!-- Transition Wrapper -->
      <transition name="fade" mode="out-in">
        <!-- Loading State with Skeletons -->
        <div v-if="isLoading" key="loading" class="product-grid skeleton-grid">
          <SkeletonCard v-for="n in limit" :key="`skel-${n}`" />
          <!-- Note: Loading text is removed as skeletons provide visual feedback -->
        </div>

        <!-- Error State -->
        <div v-else-if="errorLoading" key="error" class="message-container error-container">
          <font-awesome-icon icon="exclamation-triangle" class="message-icon error-icon" />
          <h2>{{ t('productsPage.error.title') }}</h2>
          <p>{{ errorLoading }}</p> <!-- Keep backend message for specifics -->
          <button @click="fetchProducts(1)" class="filter-button primary">{{ t('productsPage.error.tryAgain') }}</button>
        </div>

        <!-- Product Grid -->
        <div v-else-if="products.length > 0" key="grid" class="product-grid">
          <!-- ProductCard itself should eventually be translated if its internal text isn't passed via props -->
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
         :aria-label="t('productsPage.pagination.pageAriaLabel')">
      <ul class="pagination">
        <!-- Previous Button -->
        <li class="page-item" :class="{ disabled: currentPage === 1 }">
          <button class="page-link" @click="goToPage(currentPage - 1)" :disabled="currentPage === 1 || isLoading" :aria-label="t('productsPage.pagination.previousAriaLabel')">
            <span aria-hidden="true">{{ t('productsPage.pagination.previousText') }}</span>
            <span class="visually-hidden">Previous</span> <!-- Keep for accessibility -->
          </button>
        </li>
        <!-- Page Number Buttons -->
        <li v-for="page in paginationRange"
            :key="`page-${page}`"
            class="page-item"
            :class="{ active: currentPage === page, ellipsis: page === '...' }">
          <span v-if="page === '...'" class="page-link ellipsis">...</span>
          <button v-else class="page-link" @click="goToPage(page)" :disabled="isLoading" :aria-current="currentPage === page ? 'page' : null">
            {{ page }}
          </button>
        </li>
        <!-- Next Button -->
        <li class="page-item" :class="{ disabled: currentPage === totalPages }">
          <button class="page-link" @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages || isLoading" :aria-label="t('productsPage.pagination.nextAriaLabel')">
            <span aria-hidden="true">{{ t('productsPage.pagination.nextText') }}</span>
            <span class="visually-hidden">Next</span> <!-- Keep for accessibility -->
          </button>
        </li>
      </ul>
    </nav>
  </main>
</template>

<script setup>
  import { ref, onMounted, onUnmounted, nextTick, computed, watch } from 'vue';
  import { useI18n } from 'vue-i18n'; // <-- Import useI18n
  import ProductCard from '../components/ui/ProductCard.vue';
  import SkeletonCard from '../components/ui/SkeletonCard.vue';
  import { useRoute, useRouter } from 'vue-router';
  import { debounce, throttle } from 'lodash-es';
  import { library } from '@fortawesome/fontawesome-svg-core';
  import { faSearch, faExclamationTriangle, faBoxOpen } from '@fortawesome/free-solid-svg-icons';
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

  library.add(faSearch, faExclamationTriangle, faBoxOpen);

  // --- Get translation function ---
  const { t } = useI18n();

  // --- Constants ---
  const DEFAULT_LIMIT = 12;
  const DEBOUNCE_DELAY = 400;
  const GAP_BETWEEN_PAGINATION_AND_FOOTER = 90;
  const THRESHOLD_BUFFER = 90;
  const THROTTLE_TIME = 50;

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
  // Use a translated default description if needed, or keep it simple
  const defaultDescription = t('productCard.defaultDescription') || "High-quality, sustainable furniture piece.";
  const paginationRef = ref(null);
  const categories = ref([]);
  const categoriesLoading = ref(false);
  const isPaginationFixed = ref(true);
  let footerEl = null;

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
      filters.value.maxPrice !== null;
  });

  // --- Methods ---
  // (Keep fetchProducts, fetchCategories, applyFilters, pagination logic, etc. the same)
  // ... (all methods like fetchProducts, fetchCategories, applyFilters, etc. remain unchanged) ...
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

  // --- Category Fetching ---
  const fetchCategories = async () => {
    categoriesLoading.value = true;
    try {
      const response = await fetch('/api/products/categories');
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
      // Add filter parameters... (same as before)
      if (filters.value.searchQuery) url += `&q=${encodeURIComponent(filters.value.searchQuery)}`;
      if (filters.value.category) url += `&category=${encodeURIComponent(filters.value.category)}`;
      if (filters.value.minPrice !== null && filters.value.minPrice >= 0) url += `&minPrice=${filters.value.minPrice}`;
      if (filters.value.maxPrice !== null && filters.value.maxPrice >= 0) {
        if (filters.value.minPrice === null || filters.value.maxPrice >= filters.value.minPrice) url += `&maxPrice=${filters.value.maxPrice}`;
        else console.warn("Max price is less than min price, ignoring max price filter.");
      }
      if (filters.value.sort) url += `&sort=${filters.value.sort}`;


      const response = await fetch(url);
      if (!response.ok) {
        let errorMessage = `HTTP error! Status: ${response.status}`;
        try { const errorBody = await response.json(); errorMessage = errorBody.message || errorMessage; } catch (e) { /* Ignore */ }
        throw new Error(errorMessage);
      }
      const data = await response.json();
      const maxDescriptionLength = 75;

      products.value = data.products.map(product => ({
        id: product._id,
        name: product.name,
        description: truncateText(product.description || defaultDescription, maxDescriptionLength),
        price: product.price,
        image: product.images && product.images.length > 0
          ? product.images[0]
          : `https://via.placeholder.com/400x250/cccccc/FFFFFF?text=${encodeURIComponent(product.name)}`,
        averageRating: product.averageRating || 0,
        reviewCount: product.reviewCount || 0,
      }));

      currentPage.value = data.currentPage;
      totalPages.value = data.totalPages;
      totalProducts.value = data.totalProducts;

      isLoading.value = false;

      updateURLQueryParams(page);

      await nextTick(); // Wait for DOM updates (important for handleScroll)

      // ** CALL handleScroll AFTER data is loaded and DOM updated **
      handleScroll();

      // Scroll logic (remains the same)
      const sectionElement = document.querySelector('.product-listing-section');
      if (sectionElement && page !== 1) {
        const sectionTop = sectionElement.getBoundingClientRect().top + window.scrollY;
        const headerOffset = document.getElementById('header')?.offsetHeight || 80;
        window.scrollTo({ top: sectionTop - headerOffset - 20, behavior: 'smooth' });
      }

    } catch (error) {
      console.error("Error fetching products:", error);
      errorLoading.value = error.message || "Failed to load products. Please try again later.";
      products.value = [];
      currentPage.value = 1;
      totalPages.value = 1;
      totalProducts.value = 0;
      isLoading.value = false;
      await nextTick(); // Ensure handleScroll runs even after error
      handleScroll();
    }
  };

  // --- URL Query Parameter Management --- (remains the same)
  const updateURLQueryParams = (page) => {
    const query = {};
    if (page > 1) query.page = page;
    if (filters.value.searchQuery) query.q = filters.value.searchQuery;
    if (filters.value.category) query.category = filters.value.category;
    if (filters.value.minPrice !== null) query.minPrice = filters.value.minPrice;
    if (filters.value.maxPrice !== null) query.maxPrice = filters.value.maxPrice;
    if (filters.value.sort && filters.value.sort !== 'featured') query.sort = filters.value.sort;

    router.replace({ query }).catch(err => {
      if (err.name !== 'NavigationDuplicated') { console.error('Router replace error:', err); }
    });
  };

  const readFiltersFromURL = () => {
    filters.value.searchQuery = route.query.q || '';
    filters.value.category = route.query.category || '';
    filters.value.minPrice = route.query.minPrice ? Number(route.query.minPrice) : null;
    filters.value.maxPrice = route.query.maxPrice ? Number(route.query.maxPrice) : null;
    filters.value.sort = route.query.sort || 'featured';
    return parseInt(route.query.page) || 1;
  };

  // --- Filter Methods --- (remains the same)
  const applyFilters = () => {
    if (isLoading.value) return;
    fetchProducts(1);
  };
  const debounceApplyFilters = debounce(applyFilters, DEBOUNCE_DELAY);
  const resetFilters = () => {
    if (isLoading.value) return;
    filters.value = { searchQuery: '', category: '', sort: 'featured', minPrice: null, maxPrice: null };
    fetchProducts(1);
  };

  // --- Pagination Logic --- (remains the same)
  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages.value && pageNumber !== currentPage.value && !isLoading.value) {
      fetchProducts(pageNumber);
    }
  };
  const paginationRange = computed(() => {
    const current = currentPage.value; const last = totalPages.value; const delta = 2;
    const left = current - delta; const right = current + delta + 1;
    const range = []; const rangeWithDots = [];
    for (let i = 1; i <= last; i++) { if (i === 1 || i === last || (i >= left && i < right)) range.push(i); }
    let l;
    for (const i of range) { if (l) { if (i - l === 2) rangeWithDots.push(l + 1); else if (i - l !== 1) rangeWithDots.push('...'); } rangeWithDots.push(i); l = i; }
    return rangeWithDots;
  });
  const emitAddToCart = (productData) => { emit('addToCart', productData); };


  // --- ** Sticky Pagination Logic (Restored & Refined) ** ---
  const handleScroll = () => {
    // Need paginationRef AND footerEl to calculate
    if (!paginationRef.value || !footerEl || totalPages.value <= 1) {
      // If pagination isn't visible or needed, ensure it's not styled absolutely
      if (paginationRef.value && paginationRef.value.style.position === 'absolute') {
        paginationRef.value.style.position = ''; // Reset to default (fixed via CSS)
        paginationRef.value.style.top = '';
        paginationRef.value.style.bottom = '';
        paginationRef.value.style.left = '';
        paginationRef.value.style.transform = '';
      }
      isPaginationFixed.value = true; // Assume fixed if not visible/needed
      return;
    }

    const paginationHeight = paginationRef.value.offsetHeight;
    // Use pageYOffset for broader compatibility or window.scrollY
    const scrollY = window.scrollY || window.pageYOffset;
    // Get footer's position relative to the document, not just viewport
    const footerOffsetTop = footerEl.offsetTop;
    const viewportHeight = window.innerHeight;

    // Calculate the point where pagination bottom would hit the adjusted footer top
    const collisionPoint = footerOffsetTop - paginationHeight - GAP_BETWEEN_PAGINATION_AND_FOOTER;

    // Check if the bottom of the viewport is past the collision point
    if (scrollY + viewportHeight >= collisionPoint + THRESHOLD_BUFFER) {
      // Switch to Absolute
      if (isPaginationFixed.value) {
        // Calculate the precise top value for absolute positioning
        const absoluteTopPosition = collisionPoint - scrollY; // Relative to current scroll

        paginationRef.value.style.position = 'absolute';
        paginationRef.value.style.top = `${footerOffsetTop - paginationHeight - GAP_BETWEEN_PAGINATION_AND_FOOTER}px`; // Position relative to document
        paginationRef.value.style.bottom = 'auto';
        // Keep left/transform for centering
        paginationRef.value.style.left = '50%';
        paginationRef.value.style.transform = 'translateX(-50%)';
        isPaginationFixed.value = false;
      } else {
        // If already absolute, ensure the top position is recalculated (e.g., on resize)
        paginationRef.value.style.top = `${footerOffsetTop - paginationHeight - GAP_BETWEEN_PAGINATION_AND_FOOTER}px`;
      }
    } else {
      // Switch to Fixed
      if (!isPaginationFixed.value) {
        paginationRef.value.style.position = 'fixed'; // Revert to fixed (or remove style to use CSS default)
        paginationRef.value.style.top = 'auto';
        paginationRef.value.style.bottom = '1.5rem'; // Use the CSS fixed bottom value
        // Ensure centering is reapplied if needed
        paginationRef.value.style.left = '50%';
        paginationRef.value.style.transform = 'translateX(-50%)';
        isPaginationFixed.value = true;
      }
      // If already fixed, do nothing
    }
  };
  // Throttle the handler
  const throttledScrollHandler = throttle(handleScroll, THROTTLE_TIME);


  // --- Lifecycle Hooks ---
  onMounted(async () => {
    footerEl = document.querySelector('footer'); // Find footer once
    if (!footerEl) { console.error("Footer element not found! Sticky pagination may not work."); }

    await fetchCategories();
    const initialPage = readFiltersFromURL();
    await fetchProducts(initialPage); // Fetch data based on URL

    // Add listeners AFTER initial data load and DOM update
    window.addEventListener('scroll', throttledScrollHandler);
    window.addEventListener('resize', throttledScrollHandler);

    // Initial check in case content is short
    await nextTick(); // Ensure paginationRef is available if v-if is true
    handleScroll();
  });

  onUnmounted(() => {
    window.removeEventListener('scroll', throttledScrollHandler);
    window.removeEventListener('resize', throttledScrollHandler);
  });

  // Watch route changes (remains the same)
  watch(() => route.fullPath, (newPath, oldPath) => {
    if (newPath !== oldPath && route.name === 'products') {
      const newPage = readFiltersFromURL();
      fetchProducts(newPage);
    }
  });

</script>

<style scoped>
  /* Styles remain the same */
  /* Add specific styles for enhanced filters */
  .enhanced-filter-controls {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1.5rem;
    align-items: end;
    padding: 1.5rem 2rem;
    border-radius: var(--border-radius);
    background-color: var(--bg-off-light);
    margin-bottom: 3rem;
    box-shadow: var(--shadow-soft);
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

    .filter-group label {
      font-weight: 600;
      font-size: 0.9rem;
      color: var(--text-dark);
      display: flex;
      align-items: center;
      gap: 0.4em;
    }

  .enhanced-filter-controls input[type="search"], .enhanced-filter-controls input[type="number"], .enhanced-filter-controls select {
    padding: 0.8rem 1rem;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-small);
    font-size: 0.95rem;
    background-color: var(--white);
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
    height: 44px;
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

    .enhanced-filter-controls input:focus, .enhanced-filter-controls select:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px var(--glow-primary);
    }

  .price-range-group .price-inputs {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .price-range-group input[type="number"] {
    width: 100%;
    text-align: center;
    padding-left: 1.5rem;
    padding-right: 0.5rem;
  }

  .price-range-group .price-prefix {
    position: absolute;
    left: 0.8rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
    pointer-events: none;
  }

  .price-range-group .price-inputs > div {
    position: relative;
    flex: 1;
  }

  .price-range-group .price-separator {
    color: var(--text-muted);
    font-weight: bold;
  }

  .filter-actions {
    display: flex;
    gap: 0.75rem;
  }

  .filter-button {
    padding: 0.7rem 1.4rem;
    font-size: 0.9rem;
    font-weight: 600;
    border-radius: var(--border-radius-small);
    border: 1px solid;
    cursor: pointer;
    transition: all var(--transition-fast);
    white-space: nowrap;
  }

    .filter-button.primary {
      background-color: var(--primary);
      border-color: var(--primary);
      color: var(--white);
    }

      .filter-button.primary:hover {
        background-color: #3dbbab;
        border-color: #3dbbab;
      }

    .filter-button.secondary {
      background-color: transparent;
      border-color: var(--border-color);
      color: var(--text-muted);
    }

      .filter-button.secondary:hover {
        border-color: var(--text-dark);
        color: var(--text-dark);
        background-color: var(--bg-light);
      }

    .filter-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

  .results-summary {
    margin-bottom: 2rem;
    text-align: center;
    font-size: 0.95rem;
    color: var(--text-muted);
  }

  .product-card-item {
    opacity: 0;
    transform: translateY(20px);
    animation: card-fade-in 0.5s ease forwards;
    animation-delay: var(--stagger-delay);
  }

  @keyframes card-fade-in {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .message-container {
    padding: 4rem 1rem;
    text-align: center;
    border-radius: var(--border-radius);
    margin: 2rem 0;
  }

  .error-container {
    background-color: #fff3f3;
    border: 1px solid #ffcccc;
  }

  .empty-container {
    background-color: var(--bg-light);
    border: 1px solid var(--border-color);
  }

  .message-icon {
    font-size: 3rem;
    margin-bottom: 1.5rem;
  }

  .error-icon {
    color: var(--secondary);
  }

  .empty-icon {
    color: var(--text-muted);
  }

  .message-container h2 {
    margin-bottom: 0.75rem;
    color: var(--text-dark);
  }

  .message-container p {
    color: var(--text-muted);
    margin-bottom: 1.5rem;
    max-width: 500px;
    margin-left: auto;
    margin-right: auto;
  }

  .message-container .filter-button {
    margin-top: 0;
  }

  .pagination-container {
    position: fixed;
    bottom: 1.5rem;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(255, 255, 255, 0.9);
    padding: 0.8rem 1.5rem;
    border-radius: 50px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    z-index: 10;
    border: 1px solid var(--border-color);
    backdrop-filter: blur(5px);
    transition: opacity 0.3s ease, transform 0.3s ease, top 0.3s ease, bottom 0.3s ease;
  }

    .pagination-container.is-absolute {
      position: absolute;
      bottom: auto;
    }

  .pagination {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .page-link {
    display: block;
    padding: 0.5rem 0.9rem;
    min-width: 38px;
    text-align: center;
    border: 1px solid var(--border-color);
    background-color: var(--white);
    color: var(--text-muted);
    border-radius: var(--border-radius-small);
    cursor: pointer;
    transition: all var(--transition-fast);
    font-size: 0.9rem;
    font-weight: 500;
  }

  .page-item:not(.disabled) .page-link:hover, .page-item:not(.disabled) .page-link:focus {
    border-color: var(--primary-light);
    color: var(--primary);
    background-color: var(--bg-off-light);
    outline: none;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
    z-index: 2;
  }

  .page-item.active .page-link {
    background-color: var(--primary);
    border-color: var(--primary);
    color: var(--white);
    cursor: default;
    box-shadow: none;
    z-index: 1;
  }

  .page-item.disabled .page-link {
    opacity: 0.6;
    cursor: not-allowed;
    background-color: var(--bg-light);
  }

  .page-link.ellipsis {
    border-color: transparent;
    background-color: transparent;
    color: var(--text-muted);
    cursor: default;
    box-shadow: none;
  }

  @media (max-width: 768px) {
    .enhanced-filter-controls {
      grid-template-columns: 1fr 1fr;
      padding: 1rem 1.5rem;
      margin-bottom: 2rem;
    }

    .filter-actions {
      grid-column: 1 / -1;
      justify-content: center;
      margin-top: 0.5rem;
    }

    .results-summary {
      margin-bottom: 1.5rem;
      font-size: 0.9rem;
    }

    .product-grid {
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }

    .skeleton-grid {
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }

    .pagination-container {
      padding: 0.6rem 1rem;
      bottom: 1rem;
    }

    .page-link {
      padding: 0.4rem 0.7rem;
      min-width: 34px;
      font-size: 0.85rem;
    }
  }

  @media (max-width: 576px) {
    .enhanced-filter-controls {
      grid-template-columns: 1fr;
    }

    .product-grid {
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    }

    .skeleton-grid {
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    }
  }

  .fade-enter-active, .fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .fade-enter-from, .fade-leave-to {
    opacity: 0;
  }
</style>
