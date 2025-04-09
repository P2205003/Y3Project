<template>
  <main>
    <!-- Hero Section -->
    <section class="hero" id="hero" ref="heroSectionRef">
      <div class="hero-content">
        <h1 data-animate-heading>Sustainable Craftsmanship,<br>Illuminated Design.</h1>
        <p>Discover furniture crafted from responsibly sourced materials, blending timeless aesthetics with modern comfort. Elevate your space consciously with AURORA.</p>
        <div class="cta-button-wrapper">
          <router-link to="/products" class="cta-button">Explore Collections</router-link>
        </div>
      </div>
      <div class="hero-image-container">
        <div class="hero-image"
             id="hero-interactive-image"
             ref="heroImageRef">
          <!-- Hotspots are complex, skipping for initial conversion -->
        </div>
      </div>
    </section>

    <!-- Philosophy Section -->
    <section class="philosophy" id="philosophy">
      <div class="philosophy-content">
        <h2>Our Philosophy</h2>
        <p>We believe great design should coexist with nature. AURORA is committed to sustainable practices, using responsibly sourced materials and timeless design principles to create furniture that lasts, both in style and substance. Illuminate your home with pieces that feel good, inside and out.</p>
      </div>
    </section>

    <!-- Featured Products Section -->
    <section class="products" id="products">
      <div class="section-header">
        <h2>Curated Comfort, Consciously Crafted</h2>
        <p>Explore signature pieces designed with sustainable materials to bring harmony and style to your everyday living.</p>
      </div>

      <!-- Category Links -->
      <div class="category-links-container">
        <ul class="category-links-list">
          <li class="category-link-item"><router-link to="/products?category=new" class="category-link-button">New Arrivals</router-link></li>
          <li class="category-link-item"><router-link to="/products?category=living-room" class="category-link-button">Living Room</router-link></li>
          <li class="category-link-item"><router-link to="/products?category=bedroom" class="category-link-button">Bedroom</router-link></li>
          <li class="category-link-item"><router-link to="/products?category=dining" class="category-link-button">Dining</router-link></li>
          <li class="category-link-item"><router-link to="/products?category=lighting" class="category-link-button">Lighting</router-link></li>
          <li class="category-link-item"><router-link to="/products" class="category-link-button all-products">View All</router-link></li>
        </ul>
      </div>

      <!-- Featured Product Grid -->
      <!-- Add loading/error/empty states -->
      <div v-if="isLoading" class="loading-indicator">Loading featured products...</div>
      <div v-else-if="errorLoading" class="error-message">{{ errorLoading }}</div>
      <div v-else-if="featuredProducts.length > 0" class="product-grid">
        <ProductCard v-for="product in featuredProducts"
                     :key="product.id"
                     :product="product"
                     @add-to-cart="emitAddToCart"
                     :linkTo="`/product-detail/${product.id}`"
                     :apply-tilt="true" />
      </div>
      <div v-else class="empty-message">No featured products available at the moment.</div>
    </section>

    <!-- Showcase Section -->
    <section class="showcase" id="showcase">
      <div class="showcase-content">
        <h2>Inspiring Spaces</h2>
        <p>See how our consciously crafted pieces create inviting and stylish environments. Find inspiration for your own illuminated space.</p>
        <div class="cta-button-wrapper">
          <router-link to="/products" class="cta-button">View Inspiration</router-link>
        </div>
      </div>
      <div class="showcase-image-wrapper">
        <div class="showcase-image" id="parallax-image"></div> <!-- Add parallax JS later -->
      </div>
    </section>

    <!-- Testimonials Section -->
    <section class="testimonials" id="testimonials">
      <div class="section-header">
        <h2>Voices of Delight</h2>
        <p>Hear from clients who have transformed their homes with AURORA.</p>
      </div>
      <div class="testimonial-grid">
        <!-- Example Testimonial Card (Repeat or v-for) -->
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
        <!-- ... more testimonials ... -->
      </div>
    </section>

    <!-- Newsletter Section -->
    <section class="newsletter" id="newsletter">
      <div class="section-header">
        <h2>Stay Illuminated</h2>
        <p>Join our newsletter for exclusive access to new collections, sustainable design tips, and special offers.</p>
      </div>
      <form class="newsletter-form" @submit.prevent="handleNewsletterSubmit">
        <input type="email" class="newsletter-input" placeholder="Enter your email address" required aria-label="Email address" v-model="newsletterEmail">
        <button type="submit" class="cta-button newsletter-button">Subscribe</button>
      </form>
      <p v-if="newsletterMessage" :class="newsletterSuccess ? 'success-message' : 'error-message'">{{ newsletterMessage }}</p>
    </section>

  </main>
</template>

<script setup>
  import { ref, onMounted, onUnmounted } from 'vue';
  import ProductCard from '../components/ui/ProductCard.vue';

  // Define emits to pass event up to App.vue
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

  // Check for reduced motion preference
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
      // Use the paginated endpoint: fetch page 1 with a limit
      const url = `/api/products?page=1&limit=${FEATURED_PRODUCT_LIMIT}`;
      // Optional: Add sort parameter if backend supports it e.g., &sort=featured or &sort=newest
      // const url = `/api/products?page=1&limit=${FEATURED_PRODUCT_LIMIT}&sort=newest`;

      const response = await fetch(url);
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorBody}`);
      }
      // The data now contains { products, currentPage, totalPages, totalProducts }
      const data = await response.json();

      // Define max description length for the home page cards
      const maxDescriptionLength = 32; // Keep short for home page

      // Map the products array from the response data
      featuredProducts.value = data.products.map(product => {
        const originalDescription = product.description || "High-quality, sustainable furniture piece.";
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

      console.log("Featured products loaded:", featuredProducts.value);

    } catch (error) {
      console.error("Error fetching featured products:", error);
      errorLoading.value = "Failed to load featured products. Please try again later.";
      featuredProducts.value = []; // Ensure empty array on error
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

</style>
