// src/views/HomeView.vue
<template>
  <main>
    <!-- Hero Section -->
    <section class="hero" id="hero" ref="heroSectionRef">
      <div class="hero-content">
        <!-- Use v-html for the title because the key contains <br> -->
        <h1 data-animate-heading v-html="t('homeView.hero.title')"></h1>
        <p>{{ t('homeView.hero.subtitle') }}</p>
        <div class="cta-button-wrapper">
          <router-link to="/products" class="cta-button">{{ t('homeView.hero.ctaButton') }}</router-link>
        </div>
      </div>
      <div class="hero-image-container">
        <div class="hero-image" id="hero-interactive-image" ref="heroImageRef">
          <!-- Hotspots are complex, skipping for initial conversion -->
        </div>
      </div>
    </section>

    <!-- Featured Products Section -->
    <section class="products" id="products">
      <div class="section-header">
        <h2>{{ t('homeView.featured.title') }}</h2>
        <p>{{ t('homeView.featured.subtitle') }}</p>
      </div>

      <!-- Category Links -->
      <div class="category-links-container">
        <!-- Loading State -->
        <div v-if="categoriesLoading" class="category-loading">
          {{ t('homeView.categories.loading') }}
        </div>
        <!-- Error State -->
        <div v-else-if="categoriesError" class="category-error">
          {{ t('homeView.categories.error') }}
        </div>
        <!-- Category List -->
        <ul v-else-if="displayedCategories.length > 0" class="category-links-list">
          <!-- Dynamic Categories -->
          <li v-for="category in displayedCategories" :key="category.baseName" class="category-link-item">
            <router-link :to="category.link" class="category-link-button">
              {{ category.displayName }}
            </router-link>
          </li>
          <!-- Static "View All" Link -->
          <li class="category-link-item">
            <router-link to="/products" class="category-link-button all-products">
              {{ t('homeView.categories.viewAll') }}
            </router-link>
          </li>
        </ul>
        <!-- No Categories Found (Optional) -->
        <div v-else class="category-empty">
          {{ t('homeView.categories.noneFound') }}
          <!-- Still show View All even if no specific categories found -->
          <router-link to="/products" class="category-link-button all-products">
            {{ t('homeView.categories.viewAll') }}
          </router-link>
        </div>
      </div>

      <!-- Featured Product Grid -->
      <!-- *** Transition Key for Data Change *** -->
      <transition name="fade" mode="out-in">
        <div v-if="isLoading" class="loading-indicator" key="loading">{{ t('homeView.featured.loading') }}</div>
        <div v-else-if="errorLoading" class="error-message" key="error">{{ errorLoading }}</div>
        <div v-else-if="featuredProducts.length > 0" class="product-grid" key="products">
          <ProductCard v-for="product in featuredProducts"
                       :key="product.id"
                       :product="product"
                       @add-to-cart="emitAddToCart"
                       :linkTo="`/product-detail/${product.id}`"
                       :apply-tilt="true" />
        </div>
        <div v-else class="empty-message" key="empty">{{ t('homeView.featured.empty') }}</div>
      </transition>
      <!-- *** END Transition Key *** -->

    </section>

    <section class="philosophy" id="philosophy">
      <div class="philosophy-content">
        <h2>{{ t('homeView.philosophy.title') }}</h2>
        <p>{{ t('homeView.philosophy.text') }}</p>
      </div>
    </section>

  </main>
</template>

<script setup>
  import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
  import { useI18n } from 'vue-i18n';
  import ProductCard from '../components/ui/ProductCard.vue'; // Assuming path is correct

  // --- i18n & Emits ---
  const { t, locale } = useI18n(); // Get translation function and locale ref
  const emit = defineEmits(['addToCart']); // Define events this component can emit

  // --- Constants ---
  const FEATURED_PRODUCT_LIMIT = 4; // Number of featured products to fetch
  const HERO_PERSPECTIVE = 1500;    // CSS perspective for hero image tilt effect
  const HERO_MAX_ROTATE = 2;        // Max rotation degrees for hero image tilt
  const HERO_DEFAULT_TRANSFORM = `perspective(${HERO_PERSPECTIVE}px) rotateX(3deg) rotateY(-5deg)`; // Initial hero image transform
  const TOP_CATEGORY_LIMIT = 4;     // Max number of top categories to display dynamically

  // --- Refs for DOM Elements ---
  const heroSectionRef = ref(null); // Ref for the hero section container
  const heroImageRef = ref(null);   // Ref for the interactive hero image element

  // --- State for Featured Products ---
  const featuredProducts = ref([]); // Array to hold fetched featured products
  const isLoading = ref(true);      // Loading state for featured products
  const errorLoading = ref(null);   // Error state for featured products

  // --- State for Top Categories ---
  const topCategories = ref([]);    // Array to hold raw category data from API [{ baseName, displayName, count }]
  const categoriesLoading = ref(true); // Loading state for categories
  const categoriesError = ref(null);   // Error state for categories

  // --- Other Component State ---
  // Note: Newsletter functionality might be simplified or removed if not fully implemented
  const newsletterEmail = ref('');      // Email input for newsletter signup
  const newsletterMessage = ref('');    // Feedback message for newsletter signup
  const newsletterSuccess = ref(false); // Success state for newsletter signup
  const prefersReducedMotion = ref(false); // Detect user's accessibility preference

  // Check for reduced motion preference on client-side
  if (typeof window !== 'undefined') {
    prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // --- Methods ---

  // Emit 'addToCart' event upwards (to App.vue or parent)
  const emitAddToCart = (productData) => {
    emit('addToCart', productData);
  };

  // Example Newsletter Submit Handler (Simulated)
  const handleNewsletterSubmit = async () => {
    newsletterMessage.value = '';
    newsletterSuccess.value = false;
    if (!newsletterEmail.value) return;
    console.log('Simulating newsletter subscription:', newsletterEmail.value);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    // Simulate success/failure
    const success = Math.random() > 0.3;
    if (success) {
      newsletterMessage.value = t('homeView.newsletter.success'); // Use i18n key
      newsletterSuccess.value = true;
      newsletterEmail.value = '';
    } else {
      newsletterMessage.value = t('homeView.newsletter.failure'); // Use i18n key
      newsletterSuccess.value = false;
    }
    // Clear message after a delay
    setTimeout(() => { newsletterMessage.value = ''; }, 4000);
  };

  // --- Hero Image Interaction Logic ---

  // Handles mouse movement over the hero section for the tilt effect
  const handleHeroMouseMove = (event) => {
    if (!heroSectionRef.value || !heroImageRef.value || prefersReducedMotion.value) return;

    const heroRect = heroSectionRef.value.getBoundingClientRect();
    const mouseX = event.clientX - heroRect.left;
    const mouseY = event.clientY - heroRect.top;

    // Check if mouse is outside the bounds (can happen with fast movements)
    if (mouseX < 0 || mouseX > heroRect.width || mouseY < 0 || mouseY > heroRect.height) {
      handleHeroMouseLeave(); // Reset if mouse leaves bounds
      return;
    }

    const centerX = heroRect.width / 2;
    const centerY = heroRect.height / 2;

    // Calculate rotation based on mouse position relative to center
    // Base rotation + delta based on mouse position * max rotation allowed
    const rotateY = -5 - ((mouseX - centerX) / centerX) * HERO_MAX_ROTATE;
    const rotateX = 3 + ((mouseY - centerY) / centerY) * HERO_MAX_ROTATE;

    // Use requestAnimationFrame for smoother updates
    requestAnimationFrame(() => {
      if (heroImageRef.value) {
        heroImageRef.value.style.transition = 'transform 0.05s linear'; // Fast transition while moving
        heroImageRef.value.style.transform = `perspective(${HERO_PERSPECTIVE}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      }
    });
  };

  // Resets the hero image transform when the mouse leaves the section
  const handleHeroMouseLeave = () => {
    if (!heroImageRef.value || prefersReducedMotion.value) return;

    requestAnimationFrame(() => {
      if (heroImageRef.value) {
        heroImageRef.value.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)'; // Slower, easing transition back
        heroImageRef.value.style.transform = HERO_DEFAULT_TRANSFORM; // Reset to default tilt
      }
    });
  };

  // Utility function to truncate text (consider moving to a shared utility file)
  function truncateText(text, maxLength) {
    if (!text) return '';
    const cleanedText = text.trim();
    if (cleanedText.length <= maxLength) return cleanedText;
    let truncated = cleanedText.slice(0, maxLength);
    let lastSpaceIndex = truncated.lastIndexOf(' ');
    // Avoid cutting mid-word or leaving very short words
    if (lastSpaceIndex > 0 && lastSpaceIndex > maxLength - 15) {
      truncated = truncated.slice(0, lastSpaceIndex);
    }
    return truncated + "...";
  }

  // --- Data Fetching ---

  // Fetches featured products from the backend API
  const fetchFeaturedProducts = async () => {
    isLoading.value = true; // Set loading state
    errorLoading.value = null; // Clear previous errors
    console.log(`Fetching ${FEATURED_PRODUCT_LIMIT} featured products... Lang: ${locale.value}`);
    try {
      // Construct API URL - adjust sort param if needed (e.g., ?sort=featured)
      const url = `/api/products/search?page=1&limit=${FEATURED_PRODUCT_LIMIT}&sort=featured`;
      // Set Accept-Language header for backend translation
      const headers = { 'Accept-Language': locale.value };
      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();

      // Process the received product data
      const maxDescriptionLength = 75; // Max length for product card description
      const defaultDesc = t('productCard.defaultDescription'); // Fallback description

      featuredProducts.value = data.products.map(product => ({
        id: product.id, // Use 'id' provided by backend
        name: product.name, // Use potentially translated name
        description: truncateText(product.description || defaultDesc, maxDescriptionLength), // Truncate description
        price: product.price,
        image: product.image, // Use primary image from backend data
        averageRating: product.averageRating || 0,
        reviewCount: product.reviewCount || 0,
      }));
      console.log("Featured products loaded:", featuredProducts.value.length);
    } catch (error) {
      console.error("Error fetching featured products:", error);
      errorLoading.value = t('homeView.featured.error'); // Set translated error message
      featuredProducts.value = []; // Clear products on error
    } finally {
      isLoading.value = false; // Reset loading state
    }
  };

  // Fetches top categories based on product count from the backend API
  const fetchTopCategories = async () => {
    categoriesLoading.value = true; // Set loading state
    categoriesError.value = null;   // Clear previous errors
    topCategories.value = [];       // Clear previous results
    console.log(`Fetching top categories... Lang: ${locale.value}`);
    try {
      const url = '/api/products/categories/top'; // API endpoint for top categories
      // Set Accept-Language header for backend translation of category names
      const headers = { 'Accept-Language': locale.value };
      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      // Expecting data format: [{ baseName, displayName, count }, ...]
      const data = await response.json();
      topCategories.value = data; // Store raw data from API
      console.log("Top categories fetched:", topCategories.value.length);
    } catch (error) {
      console.error("Error fetching top categories:", error);
      categoriesError.value = t('homeView.categories.error'); // Set translated error message
      topCategories.value = []; // Clear categories on error
    } finally {
      categoriesLoading.value = false; // Reset loading state
    }
  };

  // --- Computed Properties ---

  // Computes the array of categories to be displayed in the links section
  const displayedCategories = computed(() => {
    if (!topCategories.value || topCategories.value.length === 0) {
      return []; // Return empty if no data or data is empty
    }
    // Take the top N categories (defined by TOP_CATEGORY_LIMIT)
    // Map them to include the router link destination
    return topCategories.value.slice(0, TOP_CATEGORY_LIMIT).map(cat => ({
      baseName: cat.baseName, // Original category name (for URL query)
      displayName: cat.displayName, // Translated name (for button text)
      // Construct the link to the products page with the category filter
      link: `/products?category=${encodeURIComponent(cat.baseName)}`
    }));
  });

  // --- Watchers ---

  // Watch for changes in the i18n locale
  watch(locale, (newLocale, oldLocale) => {
    console.log(`Locale changed in HomeView from ${oldLocale} to ${newLocale}. Refetching data.`);
    if (newLocale !== oldLocale) {
      // Re-fetch data when the language changes to get updated translations
      fetchFeaturedProducts();
      fetchTopCategories();
    }
  });

  // --- Lifecycle Hooks ---

  onMounted(() => {
    // Fetch initial data when component mounts
    fetchFeaturedProducts();
    fetchTopCategories();

    // Setup Hero Interaction Listeners if not preferring reduced motion
    if (heroSectionRef.value && heroImageRef.value && !prefersReducedMotion.value) {
      heroImageRef.value.style.transform = HERO_DEFAULT_TRANSFORM; // Set initial state
      heroImageRef.value.style.willChange = 'transform'; // Optimize rendering
      // Add event listeners for mouse interaction
      heroSectionRef.value.addEventListener('mousemove', handleHeroMouseMove, { passive: true });
      heroSectionRef.value.addEventListener('mouseleave', handleHeroMouseLeave, { passive: true });
      console.log("Hero interaction listeners added.");
    } else if (prefersReducedMotion.value) {
      // Set default static transform if reduced motion is preferred
      if (heroImageRef.value) heroImageRef.value.style.transform = HERO_DEFAULT_TRANSFORM;
      console.log("Hero interaction skipped due to reduced motion preference.");
    }

    // TODO: Add IntersectionObserver logic for reveal animations if needed
    // TODO: Add Parallax logic for showcase section if needed
  });

  onUnmounted(() => {
    // Cleanup Hero Interaction Listeners when component is destroyed
    if (heroSectionRef.value) {
      heroSectionRef.value.removeEventListener('mousemove', handleHeroMouseMove);
      heroSectionRef.value.removeEventListener('mouseleave', handleHeroMouseLeave);
      console.log("Hero interaction listeners removed.");
    }
    // TODO: Disconnect IntersectionObservers if used
  });

</script>

<style scoped>
  /* Scoped styles remain the same */
  .loading-indicator,
  .error-message,
  .empty-message {
    text-align: center;
    padding: 3rem 1rem;
    font-size: 1.1rem;
    color: var(--text-muted);
    font-style: italic;
  }

  .error-message {
    color: var(--secondary);
    font-weight: 600;
  }

  /* Fade transition for content change */
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease-out;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>
