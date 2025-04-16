// src/views/ProductsView.vue
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
          <input type="search" id="search-products" name="search" :placeholder="t('productsPage.filters.searchPlaceholder')" v-model="filters.searchQuery" @input="debounceApplyFilters" @keyup.enter="applyFilters" class="enhanced-input">
        </div>
        <!-- Category Select -->
        <div class="filter-group">
          <label for="filter-category">{{ t('productsPage.filters.categoryLabel') }}</label>
          <select id="filter-category" name="category" v-model="filters.category" @change="applyFilters" :disabled="isLoading || categoriesLoading" class="enhanced-input">
            <option value="">{{ t('productsPage.filters.allCategories') }}</option>
            <!-- MODIFIED v-for loop -->
            <option v-for="category in categories" :key="category.base" :value="category.base">
              {{ category.display }} <!-- Display translated name -->
            </option>
          </select>
        </div>
        <!-- Price Range -->
        <div class="filter-group price-range-group">
          <label>{{ t('productsPage.filters.priceRangeLabel') }}</label>
          <div class="price-inputs">
            <!-- Price inputs remain the same -->
            <span class="price-prefix">$</span>
            <input type="number" min="0" placeholder="Min" :aria-label="t('productsPage.filters.minPriceAriaLabel')" v-model.number="filters.minPrice" @input="debounceApplyFilters" @change="applyFilters" class="enhanced-input">
            <span class="price-separator">–</span>
            <span class="price-prefix">$</span>
            <input type="number" min="0" placeholder="Max" :aria-label="t('productsPage.filters.maxPriceAriaLabel')" v-model.number="filters.maxPrice" @input="debounceApplyFilters" @change="applyFilters" class="enhanced-input">
          </div>
        </div>
        <!-- Sort Select -->
        <div class="filter-group">
          <label for="filter-sort">{{ t('productsPage.filters.sortLabel') }}</label>
          <select id="filter-sort" name="sort" v-model="filters.sort" @change="applyFilters" :disabled="isLoading" class="enhanced-input">
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

      <!-- Results Count (MODIFIED to show translated category) -->
      <div class="results-summary" v-if="!isLoading && !errorLoading">
        {{ t('productsPage.resultsSummary.showing', { count: products.length, total: totalProducts }) }}
        <span v-if="filters.searchQuery">{{ t('productsPage.resultsSummary.forQuery', { query: filters.searchQuery }) }}</span>
        <!-- Find the display name for the selected base category -->
        <span v-if="filters.category && selectedCategoryDisplayName">{{ t('productsPage.resultsSummary.inCategory', { category: selectedCategoryDisplayName }) }}</span>.
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

  // --- Get i18n essentials ---
  const { t, locale } = useI18n(); // Get locale ref

  // --- Constants ---
  const DEFAULT_LIMIT = 12;
  const DEBOUNCE_DELAY = 400;
  const GAP_BETWEEN_PAGINATION_AND_FOOTER = 90;
  const THROTTLE_TIME = 100;

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
  const categories = ref([]); // Now expects array of { base: string, display: string }
  const categoriesLoading = ref(false);
  const isPaginationFixed = ref(true);
  let footerEl = null;

  const filters = ref({
    searchQuery: '',
    category: '', // This will hold the BASE category name for filtering
    sort: 'featured',
    minPrice: null,
    maxPrice: null,
  });

  const hasActiveFilters = computed(() => {
    return filters.value.searchQuery ||
      filters.value.category ||
      filters.value.minPrice !== null ||
      filters.value.maxPrice !== null ||
      filters.value.sort !== 'featured';
  });

  // --- Computed Property for Selected Category Display Name ---
  const selectedCategoryDisplayName = computed(() => {
    if (!filters.value.category) return '';
    const selectedCat = categories.value.find(cat => cat.base === filters.value.category);
    // Use the display name if found, otherwise fallback to the base name (which might happen briefly before categories load)
    return selectedCat ? selectedCat.display : filters.value.category;
  });

  // --- Methods ---
  function truncateText(text, maxLength) {
    if (!text) return '';
    const cleanedText = text.trim();
    if (cleanedText.length <= maxLength) return cleanedText;
    let truncated = cleanedText.slice(0, maxLength);
    let lastSpaceIndex = truncated.lastIndexOf(' ');
    if (lastSpaceIndex > 0 && lastSpaceIndex > maxLength - 15) {
      truncated = truncated.slice(0, lastSpaceIndex);
    }
    return truncated + "...";
  }

  // --- Category Fetching (Using new translated endpoint) ---
  const fetchCategories = async () => {
    categoriesLoading.value = true;
    try {
      const headers = { 'Accept-Language': locale.value };
      const response = await fetch('/api/products/categories/translated', { headers });
      if (!response.ok) throw new Error('Failed to fetch translated categories');
      categories.value = await response.json();
      console.log("Fetched translated categories:", categories.value);
    } catch (error) {
      console.error("Error fetching translated categories:", error);
      categories.value = [];
    } finally {
      categoriesLoading.value = false;
    }
  };

  // --- Product Fetching Logic (Backend Powered) ---
  const fetchProducts = async (page = 1) => {
    isLoading.value = true;
    errorLoading.value = null;
    console.log(`Fetching products for page ${page}, limit ${limit.value}, filters:`, filters.value, `Lang: ${locale.value}`);

    try {
      let url = `/api/products/search?page=${page}&limit=${limit.value}`;
      if (filters.value.searchQuery) url += `&q=${encodeURIComponent(filters.value.searchQuery)}`;
      // Use the BASE category name (stored in filters.category) for the API call
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

      const headers = { 'Accept-Language': locale.value };
      const response = await fetch(url, { headers });

      if (!response.ok) {
        let errorMessage = `HTTP error! Status: ${response.status}`;
        try { const errorBody = await response.json(); errorMessage = errorBody.message || errorMessage; } catch (e) { /* Ignore */ }
        throw new Error(errorMessage);
      }
      const data = await response.json();

      const maxDescriptionLength = 75;
      products.value = data.products.map(product => ({
        id: product.id,
        name: product.name,
        description: truncateText(product.description || defaultDescription, maxDescriptionLength),
        price: product.price,
        image: product.image,
        averageRating: product.averageRating || 0,
        reviewCount: product.reviewCount || 0,
      }));

      currentPage.value = data.currentPage;
      totalPages.value = data.totalPages;
      totalProducts.value = data.totalProducts;
      isLoading.value = false;
      updateURLQueryParams(page);
      await nextTick();
      handleScroll();

      const isFilterChange = route.query.page === undefined || route.query.page === '1';
      const sectionElement = document.querySelector('.product-listing-section');
      if (sectionElement && page !== 1 && !isFilterChange) {
        const sectionTop = sectionElement.getBoundingClientRect().top + window.scrollY;
        const headerOffset = document.getElementById('header')?.offsetHeight || 80;
        window.scrollTo({ top: sectionTop - headerOffset - 20, behavior: 'smooth' });
      }

    } catch (error) {
      console.error("Error fetching products:", error);
      errorLoading.value = error.message || t('productsPage.error.title');
      products.value = [];
      currentPage.value = 1;
      totalPages.value = 1;
      totalProducts.value = 0;
      isLoading.value = false;
      await nextTick();
      handleScroll();
    }
  };

  // --- URL Query Parameter Management ---
  const updateURLQueryParams = (page) => {
    const query = {};
    if (page > 1) query.page = page;
    if (filters.value.searchQuery) query.q = filters.value.searchQuery;
    // Store the BASE category in the URL
    if (filters.value.category) query.category = filters.value.category;
    if (filters.value.minPrice !== null && filters.value.minPrice >= 0) query.minPrice = filters.value.minPrice;
    if (filters.value.maxPrice !== null && filters.value.maxPrice >= 0 && (filters.value.minPrice === null || filters.value.maxPrice >= filters.value.minPrice)) {
      query.maxPrice = filters.value.maxPrice;
    }
    if (filters.value.sort && filters.value.sort !== 'featured') query.sort = filters.value.sort;

    if (JSON.stringify(query) !== JSON.stringify(route.query)) {
      router.replace({ query }).catch(err => {
        if (err.name !== 'NavigationDuplicated') { console.error('Router replace error:', err); }
      });
    }
  };

  const readFiltersFromURL = () => {
    filters.value.searchQuery = route.query.q || '';
    // Read the BASE category name from the URL
    filters.value.category = route.query.category || '';
    filters.value.minPrice = route.query.minPrice ? Number(route.query.minPrice) : null;
    filters.value.maxPrice = route.query.maxPrice ? Number(route.query.maxPrice) : null;
    filters.value.sort = route.query.sort || 'featured';
    return parseInt(route.query.page) || 1;
  };

  // --- Filter Methods ---
  const applyFilters = () => {
    if (isLoading.value) return;
    if (filters.value.minPrice !== null && filters.value.maxPrice !== null && filters.value.maxPrice < filters.value.minPrice) {
      filters.value.maxPrice = filters.value.minPrice;
    }
    fetchProducts(1); // Always go to page 1 on filter change
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
    const current = currentPage.value; const last = totalPages.value; const delta = 1;
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
        paginationRef.value.classList.remove('is-absolute');
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
      if (isPaginationFixed.value) {
        paginationRef.value.classList.add('is-absolute');
        paginationRef.value.style.top = `${footerOffsetTop - paginationHeight - GAP_BETWEEN_PAGINATION_AND_FOOTER}px`;
        isPaginationFixed.value = false;
      } else {
        paginationRef.value.style.top = `${footerOffsetTop - paginationHeight - GAP_BETWEEN_PAGINATION_AND_FOOTER}px`;
      }
    } else {
      if (!isPaginationFixed.value) {
        paginationRef.value.classList.remove('is-absolute');
        paginationRef.value.style.top = '';
        isPaginationFixed.value = true;
      }
    }
  };
  const throttledScrollHandler = throttle(handleScroll, THROTTLE_TIME);

  // --- WATCH locale CHANGES ---
  watch(locale, (newLocale, oldLocale) => {
    console.log(`Locale changed in ProductsView from ${oldLocale} to ${newLocale}. Refetching.`);
    if (newLocale !== oldLocale) {
      // When language changes, refetch BOTH categories and products
      fetchCategories(); // Refetch translated categories
      fetchProducts(currentPage.value); // Refetch products for the current page with current filters
    }
  });
  // --- END WATCH ---

  // --- Lifecycle Hooks ---
  onMounted(async () => {
    footerEl = document.querySelector('footer');
    if (!footerEl) { console.error("Footer element not found! Sticky pagination may not work."); }

    await fetchCategories(); // Fetch categories first
    const initialPage = readFiltersFromURL(); // Read filters after categories might be available
    await fetchProducts(initialPage); // Fetch products based on URL state

    window.addEventListener('scroll', throttledScrollHandler);
    window.addEventListener('resize', throttledScrollHandler);

    await nextTick();
    handleScroll(); // Initial check
  });

  onUnmounted(() => {
    window.removeEventListener('scroll', throttledScrollHandler);
    window.removeEventListener('resize', throttledScrollHandler);
  });

  // Watch route changes
  watch(() => route.fullPath, (newPath, oldPath) => {
    const newQuery = { ...route.query }; delete newQuery.hash;
    const oldQuery = { ...router.options.history.location.query }; delete oldQuery.hash;

    if (newPath !== oldPath && route.name === 'products' && JSON.stringify(newQuery) !== JSON.stringify(oldQuery)) {
      console.log('Route query changed, reading filters and re-fetching products...');
      const newPage = readFiltersFromURL(); // This will update filters.value
      // Only refetch products; categories don't depend on query params other than potentially language
      // which is handled by the locale watcher.
      fetchProducts(newPage);
    }
  }, { deep: true });

</script>

<style scoped>
  /* Enhanced Page Header */
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
      /* background-image: url('/path/to/subtle-pattern.svg'); Add a background pattern if desired */
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

  .product-listing-section {
    padding: 4rem 8%; /* Standard padding */
  }

  /* Enhanced Filters Styles */
  .enhanced-filter-controls {
    display: grid;
    grid-template-columns: minmax(250px, 1.5fr) repeat(3, 1fr); /* Search wider */
    gap: 1.5rem 1.2rem;
    align-items: end;
    margin-bottom: 3.5rem;
    padding: 1.8rem;
    background-color: var(--bg-off-light);
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-soft);
    border: none;
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

  .enhanced-filter-controls input[type="search"],
  .enhanced-filter-controls input[type="number"],
  .enhanced-filter-controls select {
    width: 100%;
    padding: 0.8rem 1rem;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-small);
    font-size: 0.95rem;
    font-family: var(--font-body);
    background-color: var(--white);
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast), background-color var(--transition-fast);
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

    .enhanced-filter-controls input:focus,
    .enhanced-filter-controls select:focus,
    .enhanced-filter-controls input:focus-visible,
    .enhanced-filter-controls select:focus-visible {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px var(--glow-primary);
      background-color: var(--white);
    }

  .price-range-group .price-inputs {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    position: relative;
    height: 44px;
    border: 1px solid var(--border-color); /* Add border to container */
    border-radius: var(--border-radius-small);
    background-color: var(--white);
    padding: 0 0.5rem;
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  }
    /* Add focus state to the container */
    .price-range-group .price-inputs:focus-within {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px var(--glow-primary);
    }

  .price-range-group input[type="number"] {
    flex: 1; /* Allow inputs to share space */
    text-align: center;
    border: none; /* Remove individual input borders */
    padding: 0.5rem 0.2rem 0.5rem 1.5rem; /* Adjust padding for prefix */
    height: auto;
    background: none;
    box-shadow: none;
    -moz-appearance: textfield;
  }

    .price-range-group input[type="number"]::-webkit-outer-spin-button,
    .price-range-group input[type="number"]::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    .price-range-group input[type="number"]:focus {
      outline: none;
      box-shadow: none;
    }

  .price-range-group .price-prefix {
    position: absolute;
    left: 0.8rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
    pointer-events: none;
    z-index: 1;
  }
  /* Target the second prefix based on structure */
  .price-range-group .price-inputs > input:last-of-type ~ .price-prefix {
    /* This might need adjustment based on exact DOM order or use nth-child */
    left: calc(50% + 0.8rem); /* Rough estimate */
  }


  .price-range-group .price-separator {
    color: var(--text-muted);
    font-weight: 500;
    flex: 0 0 auto;
  }

  .filter-actions {
    grid-column: 1 / -1;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 0.8rem;
    margin-top: 0.5rem;
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
    height: 44px;
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

  .results-summary {
    margin-bottom: 2rem;
    text-align: center;
    font-size: 0.95rem;
    color: var(--text-muted);
  }

  /* Product Grid & Loading/Error States */
  .product-grid, .skeleton-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); /* Responsive grid */
    gap: 2.5rem;
    min-height: 300px; /* Ensure some height while loading */
    padding-bottom: calc(50px + 16px + 6rem); /* Padding for fixed pagination */
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

  /* Pagination Styles */
  .pagination-container {
    position: fixed;
    bottom: 1.5rem;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(255, 255, 255, 0.95);
    padding: 0.8rem 1.5rem;
    border-radius: 50px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    z-index: 900; /* Ensure above content */
    border: 1px solid var(--border-color);
    backdrop-filter: blur(5px);
    transition: opacity 0.3s ease, transform 0.3s ease, top 0.3s ease, bottom 0.3s ease, position 0s 0.3s;
    opacity: 1;
  }

    .pagination-container.is-absolute {
      position: absolute;
      bottom: auto;
      background-color: var(--bg-light);
      box-shadow: none;
      border-color: transparent;
      backdrop-filter: none;
      transition: top 0.3s ease;
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

  .page-item:not(.disabled) .page-link:hover, .page-item:not(.disabled) .page-link:focus-visible {
    border-color: var(--primary);
    color: var(--primary);
    background-color: var(--bg-off-light);
    outline: none;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
    z-index: 2;
    transform: translateY(-1px);
  }

  .page-item.active .page-link {
    background-color: var(--primary);
    border-color: var(--primary);
    color: var(--white);
    cursor: default;
    box-shadow: none;
    z-index: 1;
    transform: none;
  }

  .page-item.disabled .page-link {
    opacity: 0.6;
    cursor: not-allowed;
    background-color: var(--bg-light);
    transform: none;
    box-shadow: none;
  }

  .page-link.ellipsis {
    border-color: transparent;
    background-color: transparent;
    color: var(--text-muted);
    cursor: default;
    box-shadow: none;
    transform: none;
  }

  .visually-hidden { /* Accessibility helper */
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }


  /* Responsive Adjustments */
  @media (max-width: 992px) {
    .enhanced-filter-controls {
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    }
  }

  @media (max-width: 768px) {
    .enhanced-filter-controls {
      grid-template-columns: 1fr 1fr;
      padding: 1.2rem;
    }

    .filter-actions {
      grid-column: 1 / -1;
      justify-content: center;
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

    .price-range-group .price-inputs {
      /* Style adjustments might be needed if layout breaks */
    }
  }

  /* Fade transition for content switching */
  .fade-enter-active, .fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .fade-enter-from, .fade-leave-to {
    opacity: 0;
  }
</style>
