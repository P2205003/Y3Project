<template>
  <main>
    <!-- Hero Section -->
    <!-- Add ref="heroSectionRef" -->
    <section class="hero" id="hero" ref="heroSectionRef">
      <div class="hero-content">
        <!-- Add reveal later -->
        <!-- Add data-animate-heading for potential future text animation -->
        <h1 data-animate-heading>Sustainable Craftsmanship,<br>Illuminated Design.</h1>
        <p>Discover furniture crafted from responsibly sourced materials, blending timeless aesthetics with modern comfort. Elevate your space consciously with AURORA.</p>
        <div class="cta-button-wrapper">
          <router-link to="/products" class="cta-button">Explore Collections</router-link>
        </div>
      </div>
      <div class="hero-image-container">
        <!-- Add reveal later -->
        <!-- Add ref="heroImageRef" -->
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
        <!-- Add reveal later -->
        <h2>Our Philosophy</h2>
        <p>We believe great design should coexist with nature. AURORA is committed to sustainable practices, using responsibly sourced materials and timeless design principles to create furniture that lasts, both in style and substance. Illuminate your home with pieces that feel good, inside and out.</p>
      </div>
    </section>

    <!-- Featured Products Section -->
    <section class="products" id="products">
      <div class="section-header">
        <!-- Add reveal later -->
        <h2>Curated Comfort, Consciously Crafted</h2>
        <p>Explore signature pieces designed with sustainable materials to bring harmony and style to your everyday living.</p>
      </div>

      <!-- Category Links -->
      <div class="category-links-container">
        <!-- Add reveal later -->
        <ul class="category-links-list">
          <!-- Use router-link for main categories, could add query params later -->
          <li class="category-link-item"><router-link to="/products?category=new" class="category-link-button">New Arrivals</router-link></li>
          <li class="category-link-item"><router-link to="/products?category=living-room" class="category-link-button">Living Room</router-link></li>
          <li class="category-link-item"><router-link to="/products?category=bedroom" class="category-link-button">Bedroom</router-link></li>
          <li class="category-link-item"><router-link to="/products?category=dining" class="category-link-button">Dining</router-link></li>
          <li class="category-link-item"><router-link to="/products?category=lighting" class="category-link-button">Lighting</router-link></li>
          <li class="category-link-item"><router-link to="/products" class="category-link-button all-products">View All</router-link></li>
        </ul>
      </div>

      <!-- Featured Product Grid -->
      <div class="product-grid">
        <ProductCard v-for="product in featuredProducts"
                     :key="product.id"
                     :product="product"
                     @add-to-cart="emitAddToCart"
                     :linkTo="`/product-detail/${product.id}`"
                     :apply-tilt="true" />
        <!-- Add reveal + delay classes later -->
      </div>
    </section>

    <!-- Showcase Section -->
    <section class="showcase" id="showcase">
      <div class="showcase-content">
        <!-- Add reveal later -->
        <h2>Inspiring Spaces</h2>
        <p>See how our consciously crafted pieces create inviting and stylish environments. Find inspiration for your own illuminated space.</p>
        <div class="cta-button-wrapper">
          <router-link to="/products" class="cta-button">View Inspiration</router-link>
        </div>
      </div>
      <div class="showcase-image-wrapper">
        <!-- Add reveal later -->
        <div class="showcase-image" id="parallax-image"></div> <!-- Add parallax JS later -->
      </div>
    </section>

    <!-- Testimonials Section -->
    <section class="testimonials" id="testimonials">
      <div class="section-header">
        <!-- Add reveal later -->
        <h2>Voices of Delight</h2>
        <p>Hear from clients who have transformed their homes with AURORA.</p>
      </div>
      <div class="testimonial-grid">
        <!-- Example Testimonial Card (Repeat or v-for) -->
        <div class="testimonial-card">
          <!-- Add reveal later -->
          <p class="quote">"The quality exceeded my expectations. It's beautiful, and knowing it's sustainably made makes it even better. The Serene Sofa is the heart of our living room."</p>
          <div class="author">
            <div class="author-img" style="background-image: url('https://randomuser.me/api/portraits/women/44.jpg');" loading="lazy" aria-hidden="true"></div>
            <div class="author-info"><h4>Elena Rodriguez</h4><p>Interior Designer</p></div>
          </div>
        </div>
        <div class="testimonial-card">
          <!-- Add reveal later -->
          <p class="quote">"From browsing online to the white-glove delivery, the experience was seamless. The Aerial Chair is even more stunning in person, amazing craftsmanship."</p>
          <div class="author">
            <div class="author-img" style="background-image: url('https://randomuser.me/api/portraits/men/32.jpg');" loading="lazy" aria-hidden="true"></div>
            <div class="author-info"><h4>Marcus Chen</h4><p>Software Engineer</p></div>
          </div>
        </div>
        <div class="testimonial-card">
          <!-- Add reveal later -->
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
        <!-- Add reveal later -->
        <h2>Stay Illuminated</h2>
        <p>Join our newsletter for exclusive access to new collections, sustainable design tips, and special offers.</p>
      </div>
      <form class="newsletter-form" @submit.prevent="handleNewsletterSubmit">
        <!-- Add reveal later -->
        <input type="email" class="newsletter-input" placeholder="Enter your email address" required aria-label="Email address" v-model="newsletterEmail">
        <button type="submit" class="cta-button newsletter-button">Subscribe</button>
      </form>
      <!-- Add success/error message area -->
      <p v-if="newsletterMessage" :class="newsletterSuccess ? 'success-message' : 'error-message'">{{ newsletterMessage }}</p>
    </section>

  </main>
</template>

<script setup>
  import { ref, onMounted, onUnmounted } from 'vue'; // Import necessary functions
  import ProductCard from '../components/ui/ProductCard.vue';

  // Define emits to pass event up to App.vue
  const emit = defineEmits(['addToCart']);

  // --- Refs for DOM Elements ---
  const heroSectionRef = ref(null); // Ref for the entire hero section
  const heroImageRef = ref(null); // Ref for the interactive hero image

  // --- Constants for Animation ---
  const HERO_PERSPECTIVE = 1500; // Matches TILT_OPTIONS.perspective
  const HERO_MAX_ROTATE = 2; // Subtle rotation amount
  const HERO_DEFAULT_TRANSFORM = `perspective(${HERO_PERSPECTIVE}px) rotateX(3deg) rotateY(-5deg)`; // Default resting state

  // --- State ---
  const featuredProducts = ref([
    { id: 'prod1', name: 'Serene Sofa', description: 'Plush comfort in eco-friendly fabric.', price: 1899, image: 'https://via.placeholder.com/400x250/4ECDC4/FFFFFF?text=Serene+Sofa', thumbImage: 'https://via.placeholder.com/100x100/4ECDC4/FFFFFF?text=Sofa' },
    { id: 'prod2', name: 'Aerial Chair', description: 'Lightweight form in reclaimed teak.', price: 649, image: 'https://via.placeholder.com/400x250/FF6B6B/FFFFFF?text=Aerial+Chair', thumbImage: 'https://via.placeholder.com/100x100/FF6B6B/FFFFFF?text=Chair' },
    { id: 'prod3', name: 'Horizon Console', description: 'Sleek storage, FSC-certified walnut.', price: 1199, image: 'https://via.placeholder.com/400x250/FECA57/FFFFFF?text=Horizon+Console', thumbImage: 'https://via.placeholder.com/100x100/FECA57/FFFFFF?text=Console' },
    { id: 'prod4', name: 'Solstice Lamp', description: 'Warm illumination, recycled glass base.', price: 379, image: 'https://via.placeholder.com/400x250/2F3640/FFFFFF?text=Solstice+Lamp', thumbImage: 'https://via.placeholder.com/100x100/2F3640/FFFFFF?text=Lamp' },
  ]);

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
    await new Promise(resolve => setTimeout(resolve, 500));
    const success = Math.random() > 0.3;

    if (success) {
      newsletterMessage.value = 'Thank you for subscribing!';
      newsletterSuccess.value = true;
      newsletterEmail.value = '';
    } else {
      newsletterMessage.value = 'Subscription failed. Please try again.';
      newsletterSuccess.value = false;
    }

    setTimeout(() => {
      newsletterMessage.value = '';
    }, 4000);
  };


  // --- Hero Image Interaction Logic ---
  const handleHeroMouseMove = (event) => {
    // Ensure elements exist and motion is preferred
    if (!heroSectionRef.value || !heroImageRef.value || prefersReducedMotion.value) return;

    const heroRect = heroSectionRef.value.getBoundingClientRect();
    const mouseX = event.clientX - heroRect.left;
    const mouseY = event.clientY - heroRect.top;

    // Only proceed if mouse is within hero bounds (optional, but can prevent edge jumps)
    if (mouseX < 0 || mouseX > heroRect.width || mouseY < 0 || mouseY > heroRect.height) {
      handleHeroMouseLeave(); // Reset if mouse goes out quickly
      return;
    }

    const centerX = heroRect.width / 2;
    const centerY = heroRect.height / 2;

    // Calculate rotation (adjust multipliers as needed)
    // Original logic: RotateY based on X, RotateX based on Y
    // RotateY: Negative makes right side tilt away when mouse is on right
    // RotateX: Positive makes bottom tilt away when mouse is on bottom
    const rotateY = -5 - ((mouseX - centerX) / centerX) * HERO_MAX_ROTATE; // Start from -5, add variation
    const rotateX = 3 + ((mouseY - centerY) / centerY) * HERO_MAX_ROTATE; // Start from 3, add variation

    requestAnimationFrame(() => {
      if (heroImageRef.value) {
        // Apply immediate transform during move
        heroImageRef.value.style.transition = 'transform 0.05s linear';
        heroImageRef.value.style.transform = `perspective(${HERO_PERSPECTIVE}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      }
    });
  };

  const handleHeroMouseLeave = () => {
    // Ensure element exists and motion is preferred
    if (!heroImageRef.value || prefersReducedMotion.value) return;

    requestAnimationFrame(() => {
      if (heroImageRef.value) {
        // Apply smooth transition back to default state
        heroImageRef.value.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)'; // Slower transition on exit
        heroImageRef.value.style.transform = HERO_DEFAULT_TRANSFORM;
      }
    });
  };

  // --- Lifecycle Hooks ---
  onMounted(() => {
    // Setup Hero Interaction Listeners
    if (heroSectionRef.value && heroImageRef.value && !prefersReducedMotion.value) {
      // Set initial transform and will-change for performance
      heroImageRef.value.style.transform = HERO_DEFAULT_TRANSFORM;
      heroImageRef.value.style.willChange = 'transform';

      heroSectionRef.value.addEventListener('mousemove', handleHeroMouseMove, { passive: true });
      heroSectionRef.value.addEventListener('mouseleave', handleHeroMouseLeave, { passive: true });
      console.log("Hero interaction listeners added.");
    } else if (prefersReducedMotion.value) {
      // Apply default static transform if reduced motion is on
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
  /* Add scoped styles if needed, most are global */
  .newsletter .success-message { /* Target specific class */
    color: var(--primary); /* Use theme color */
    margin-top: 1rem;
    font-size: 0.9rem;
    text-align: center;
  }

  .newsletter .error-message {
    color: var(--secondary); /* Use theme color */
    margin-top: 1rem;
    font-size: 0.9rem;
    text-align: center;
  }

  /* Ensure hero image has will-change for performance if not already global */
  .hero-image {
    /* will-change: transform; */ /* Handled in JS now, or can be added here */
  }
</style>
