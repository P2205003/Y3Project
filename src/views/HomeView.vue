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
        <ul class="category-links-list">
          <li class="category-link-item"><router-link to="/products?category=new" class="category-link-button">{{ t('homeView.categories.newArrivals') }}</router-link></li>
          <li class="category-link-item"><router-link to="/products?category=living-room" class="category-link-button">{{ t('homeView.categories.livingRoom') }}</router-link></li>
          <li class="category-link-item"><router-link to="/products?category=bedroom" class="category-link-button">{{ t('homeView.categories.bedroom') }}</router-link></li>
          <li class="category-link-item"><router-link to="/products?category=dining" class="category-link-button">{{ t('homeView.categories.dining') }}</router-link></li>
          <li class="category-link-item"><router-link to="/products?category=lighting" class="category-link-button">{{ t('homeView.categories.lighting') }}</router-link></li>
          <li class="category-link-item"><router-link to="/products" class="category-link-button all-products">{{ t('homeView.categories.viewAll') }}</router-link></li>
        </ul>
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

    <!-- Showcase Section - COMMENTED OUT -->
    <!-- ... -->
    <!-- Testimonials Section - COMMENTED OUT -->
    <!-- ... -->
    <!-- Newsletter Section - COMMENTED OUT -->
    <!-- ... -->
    <!-- Philosophy Section -->
    <section class="philosophy" id="philosophy">
      <div class="philosophy-content">
        <h2>{{ t('homeView.philosophy.title') }}</h2>
        <p>{{ t('homeView.philosophy.text') }}</p>
      </div>
    </section>

  </main>
</template>

<script setup>
  // --- *** IMPORT watch *** ---
  import { ref, onMounted, onUnmounted, watch } from 'vue';
  import { useI18n } from 'vue-i18n';
  import ProductCard from '../components/ui/ProductCard.vue';

  const { t, locale } = useI18n();
  const emit = defineEmits(['addToCart']);

  // Constants (remain the same)
  const FEATURED_PRODUCT_LIMIT = 4;
  const HERO_PERSPECTIVE = 1500;
  const HERO_MAX_ROTATE = 2;
  const HERO_DEFAULT_TRANSFORM = `perspective(${HERO_PERSPECTIVE}px) rotateX(3deg) rotateY(-5deg)`;

  // Refs (remain the same)
  const heroSectionRef = ref(null);
  const heroImageRef = ref(null);

  // State (remain the same)
  const featuredProducts = ref([]);
  const isLoading = ref(true);
  const errorLoading = ref(null);
  const newsletterEmail = ref('');
  const newsletterMessage = ref('');
  const newsletterSuccess = ref(false);
  const prefersReducedMotion = ref(false);
  if (typeof window !== 'undefined') {
    prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // --- Methods (remain the same) ---
  const emitAddToCart = (productData) => {
    emit('addToCart', productData);
  };

  const handleNewsletterSubmit = async () => {
    newsletterMessage.value = '';
    newsletterSuccess.value = false;
    if (!newsletterEmail.value) return;
    console.log('Submitting newsletter:', newsletterEmail.value);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
    const success = Math.random() > 0.3;
    if (success) {
      newsletterMessage.value = 'Thank you for subscribing!';
      newsletterSuccess.value = true;
      newsletterEmail.value = '';
    } else {
      newsletterMessage.value = 'Subscription failed. Please try again.';
      newsletterSuccess.value = false;
    }
    setTimeout(() => { newsletterMessage.value = ''; }, 4000);
  };

  // --- Hero Image Interaction Logic ---
  const handleHeroMouseMove = (event) => {
    if (!heroSectionRef.value || !heroImageRef.value || prefersReducedMotion.value) return;
    const heroRect = heroSectionRef.value.getBoundingClientRect();
    const mouseX = event.clientX - heroRect.left;
    const mouseY = event.clientY - heroRect.top;
    if (mouseX < 0 || mouseX > heroRect.width || mouseY < 0 || mouseY > heroRect.height) {
      handleHeroMouseLeave();
      return;
    }
    const centerX = heroRect.width / 2;
    const centerY = heroRect.height / 2;
    const rotateY = -5 - ((mouseX - centerX) / centerX) * HERO_MAX_ROTATE;
    const rotateX = 3 + ((mouseY - centerY) / centerY) * HERO_MAX_ROTATE;
    requestAnimationFrame(() => {
      if (heroImageRef.value) {
        heroImageRef.value.style.transition = 'transform 0.05s linear';
        heroImageRef.value.style.transform = `perspective(${HERO_PERSPECTIVE}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      }
    });
  };

  const handleHeroMouseLeave = () => {
    if (!heroImageRef.value || prefersReducedMotion.value) return;
    requestAnimationFrame(() => {
      if (heroImageRef.value) {
        heroImageRef.value.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)';
        heroImageRef.value.style.transform = HERO_DEFAULT_TRANSFORM;
      }
    });
  };

  function truncateText(text, maxLength) {
    if (!text) return '';
    const cleanedText = text.trim();
    if (cleanedText.length <= maxLength) return cleanedText;
    let truncated = cleanedText.slice(0, maxLength);
    let lastSpaceIndex = truncated.lastIndexOf(' ');
    // Ensure last word isn't tiny if we cut at a space
    if (lastSpaceIndex > 0 && lastSpaceIndex > maxLength - 15) {
      truncated = truncated.slice(0, lastSpaceIndex);
    }
    return truncated + "...";
  }

  // --- Fetch Featured Products (remains the same, uses reactive locale) ---
  const fetchFeaturedProducts = async () => {
    isLoading.value = true;
    errorLoading.value = null;
    console.log(`Fetching ${FEATURED_PRODUCT_LIMIT} featured products from backend... Lang: ${locale.value}`);
    try {
      const url = `/api/products?page=1&limit=${FEATURED_PRODUCT_LIMIT}`;
      const headers = { 'Accept-Language': locale.value };
      const response = await fetch(url, { headers });
      if (!response.ok) { /* ... error handling ... */ }
      const data = await response.json();
      const maxDescriptionLength = 75; // Increased length slightly
      const defaultDesc = t('productCard.defaultDescription');

      featuredProducts.value = data.products.map(product => ({
        id: product.id, // Use the 'id' from translated backend response
        name: product.name,
        description: truncateText(product.description || defaultDescription, maxDescriptionLength),
        price: product.price,
        image: product.image,
        averageRating: product.averageRating || 0,
        reviewCount: product.reviewCount || 0,
      }));
      console.log("Featured products loaded:", featuredProducts.value);
    } catch (error) { /* ... error handling ... */ }
    finally {
      isLoading.value = false;
    }
  };

  // --- *** WATCH locale CHANGES *** ---
  watch(locale, (newLocale, oldLocale) => {
    console.log(`Locale changed from ${oldLocale} to ${newLocale}. Refetching products.`);
    if (newLocale !== oldLocale) {
      fetchFeaturedProducts(); // Re-fetch data when the locale changes
    }
  });
  // --- *** END WATCH *** ---


  // --- Lifecycle Hooks ---
  onMounted(() => {
    // Fetch featured product data efficiently
    fetchFeaturedProducts();

    // Setup Hero Interaction Listeners
    if (heroSectionRef.value && heroImageRef.value && !prefersReducedMotion.value) {
      heroImageRef.value.style.transform = HERO_DEFAULT_TRANSFORM;
      heroImageRef.value.style.willChange = 'transform';
      heroSectionRef.value.addEventListener('mousemove', handleHeroMouseMove, { passive: true });
      heroSectionRef.value.addEventListener('mouseleave', handleHeroMouseLeave, { passive: true });
      console.log("Hero interaction listeners added.");
    } else if (prefersReducedMotion.value) {
      if (heroImageRef.value) heroImageRef.value.style.transform = HERO_DEFAULT_TRANSFORM;
      console.log("Hero interaction skipped due to reduced motion preference.");
    }
    // TODO: Add IntersectionObserver logic for reveal animations if needed
    // TODO: Add Parallax logic for showcase section if needed
  });

  onUnmounted(() => {
    // Cleanup Hero Interaction Listeners
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
