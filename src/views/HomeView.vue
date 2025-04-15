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
      <div v-if="isLoading" class="loading-indicator">{{ t('homeView.featured.loading') }}</div>
      <div v-else-if="errorLoading" class="error-message">{{ errorLoading }}</div>
      <div v-else-if="featuredProducts.length > 0" class="product-grid">
        <ProductCard v-for="product in featuredProducts"
                     :key="product.id"
                     :product="product"
                     @add-to-cart="emitAddToCart"
                     :linkTo="`/product-detail/${product.id}`"
                     :apply-tilt="true" />
      </div>
      <div v-else class="empty-message">{{ t('homeView.featured.empty') }}</div>
    </section>

    <!-- Showcase Section - COMMENTED OUT -->
    <!--
    <section class="showcase" id="showcase">
      <div class="showcase-content">
        <h2>{{ t('homeView.showcase.title') }}</h2>
        <p>{{ t('homeView.showcase.text') }}</p>
        <div class="cta-button-wrapper">
          <router-link to="/products" class="cta-button">{{ t('homeView.showcase.ctaButton') }}</router-link>
        </div>
      </div>
      <div class="showcase-image-wrapper">
        <div class="showcase-image" id="parallax-image"></div>
      </div>
    </section>
    -->
    <!-- Testimonials Section - COMMENTED OUT -->
    <!--
    <section class="testimonials" id="testimonials">
      <div class="section-header">
        <h2>{{ t('homeView.testimonials.title') }}</h2>
        <p>{{ t('homeView.testimonials.subtitle') }}</p>
      </div>
      <div class="testimonial-grid">
        <! -- Testimonial cards content would need dynamic data binding or translation if static ->
        <div class="testimonial-card">
          <p class="quote">"The quality exceeded my expectations. It's beautiful, and knowing it's sustainably made makes it even better. The Serene Sofa is the heart of our living room."</p>
          <div class="author">
            <div class="author-img" style="background-image: url('https://randomuser.me/api/portraits/women/44.jpg');" loading="lazy" aria-hidden="true"></div>
            <div class="author-info"><h4>Elena Rodriguez</h4><p>Interior Designer</p></div>
          </div>
        </div>
        <div class="testimonial-card">
          <p class="quote">"From browsing online to the white-glove delivery, the experience was seamless. The Aerial Chair is even more stunning in person, amazing craftsmanship."</p>
          <div class="author">
            <div class="author-img" style="background-image: url('https://randomuser.me/api/portraits/men/32.jpg');" loading="lazy" aria-hidden="true"></div>
            <div class="author-info"><h4>Marcus Chen</h4><p>Software Engineer</p></div>
          </div>
        </div>
        <div class="testimonial-card">
          <p class="quote">"AURORA helped me find the perfect balance between style and function for my small apartment. The Horizon Console's sustainable walnut is gorgeous!"</p>
          <div class="author">
            <div class="author-img" style="background-image: url('https://randomuser.me/api/portraits/women/68.jpg');" loading="lazy" aria-hidden="true"></div>
            <div class="author-info"><h4>Aisha Khan</h4><p>Graphic Artist</p></div>
          </div>
        </div>
      </div>
    </section>
    -->
    <!-- Newsletter Section - COMMENTED OUT -->
    <!--
    <section class="newsletter" id="newsletter">
      <div class="section-header">
        <h2>{{ t('homeView.newsletter.title') }}</h2>
        <p>{{ t('homeView.newsletter.subtitle') }}</p>
      </div>
      <form class="newsletter-form" @submit.prevent="handleNewsletterSubmit">
        <input type="email" class="newsletter-input" :placeholder="t('homeView.newsletter.placeholder')" required aria-label="Email address" v-model="newsletterEmail">
        <button type="submit" class="cta-button newsletter-button">{{ t('homeView.newsletter.ctaButton') }}</button>
      </form>
      <p v-if="newsletterMessage" :class="newsletterSuccess ? 'success-message' : 'error-message'">{{ t(newsletterSuccess ? 'homeView.newsletter.successMessage' : 'homeView.newsletter.errorMessage') }}</p>
    </section>
    -->
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
  // --- Add useI18n ---
  import { ref, onMounted, onUnmounted } from 'vue';
  import { useI18n } from 'vue-i18n'; // <-- Import useI18n
  import ProductCard from '../components/ui/ProductCard.vue';

  // --- Get translation function ---
  const { t } = useI18n(); // <-- Get t function

  // --- Define emits to pass event up to App.vue ---
  const emit = defineEmits(['addToCart']);

  // --- Constants ---
  const FEATURED_PRODUCT_LIMIT = 4; // How many products to show on the home page
  const HERO_PERSPECTIVE = 1500;
  const HERO_MAX_ROTATE = 2;
  const HERO_DEFAULT_TRANSFORM = `perspective(${HERO_PERSPECTIVE}px) rotateX(3deg) rotateY(-5deg)`;

  // --- Refs for DOM Elements ---
  const heroSectionRef = ref(null);
  const heroImageRef = ref(null);

  // --- State ---
  const featuredProducts = ref([]); // Initialize as empty array
  const isLoading = ref(true);
  const errorLoading = ref(null);
  const newsletterEmail = ref('');
  const newsletterMessage = ref('');
  const newsletterSuccess = ref(false);
  const prefersReducedMotion = ref(false);
  if (typeof window !== 'undefined') {
    prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // --- Methods ---
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
      // Set success flag, template will show translated message
      newsletterSuccess.value = true;
      newsletterEmail.value = '';
      newsletterMessage.value = 'placeholder'; // Need a value to trigger v-if
    } else {
      // Set error flag, template will show translated message
      newsletterSuccess.value = false;
      newsletterMessage.value = 'placeholder'; // Need a value to trigger v-if
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

  // --- Fetch Featured Products (Using Paginated API) ---
  const fetchFeaturedProducts = async () => {
    isLoading.value = true;
    errorLoading.value = null;
    console.log(`Fetching ${FEATURED_PRODUCT_LIMIT} featured products from backend...`);
    try {
      const url = `/api/products?page=1&limit=${FEATURED_PRODUCT_LIMIT}`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorBody}`);
      }
      const data = await response.json();
      const maxDescriptionLength = 32;
      // Use translated default if product.description is missing
      const defaultDesc = t('productCard.defaultDescription');

      featuredProducts.value = data.products.map(product => {
        const originalDescription = product.description || defaultDesc;
        const truncatedDescription = truncateText(originalDescription, maxDescriptionLength);
        return {
          id: product._id,
          name: product.name,
          description: truncatedDescription,
          price: product.price,
          image: product.images && product.images.length > 0
            ? product.images[0]
            : `https://via.placeholder.com/400x250/cccccc/FFFFFF?text=${encodeURIComponent(product.name)}`,
          averageRating: product.averageRating || 0,
          reviewCount: product.reviewCount || 0,
        };
      });
      console.log("Featured products loaded:", featuredProducts.value);
    } catch (error) {
      console.error("Error fetching featured products:", error);
      // Use translated default error message
      errorLoading.value = error.message || t('productsPage.error.title'); // Or a more specific home view error key
      featuredProducts.value = [];
    } finally {
      isLoading.value = false;
    }
  };

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
  /* Scoped styles for loading/error messages */
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
  /* Note: Other styles in HomeView are expected to be global (main.css) or part of ProductCard */
</style>
