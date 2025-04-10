// src/views/ProductDetailView.vue
<template>
  <main class="product-detail-page">
    <transition name="fade" mode="out-in">
      <!-- Loading State -->
      <div v-if="isLoading" key="loading" class="loading-container detail-loading">
        <div class="spinner"></div>
        <p>Illuminating Product Details...</p>
      </div>
      <!-- Error State -->
      <div v-else-if="errorLoading" key="error" class="message-container error-container detail-error">
        <font-awesome-icon icon="exclamation-triangle" class="message-icon error-icon"></font-awesome-icon>
        <h2>Failed to Load Product</h2>
        <p>{{ errorLoading }}</p>
        <router-link to="/products" class="button secondary-button">Back to Products</router-link>
      </div>
      <!-- Not Found State -->
      <div v-else-if="!product" key="notfound" class="message-container empty-container detail-notfound">
        <font-awesome-icon icon="box-open" class="message-icon empty-icon"></font-awesome-icon>
        <h2>Product Not Found</h2>
        <p>Sorry, we couldn't find the product you were looking for.</p>
        <router-link to="/products" class="button secondary-button">Back to Products</router-link>
      </div>
      <!-- Product Content -->
      <div v-else key="content" class="product-content-wrapper">
        <div class="product-detail-layout">
          <!-- ======== Product Gallery (Left Column) ======== -->
          <div class="product-gallery-container" :style="{ '--enter-delay': '0.1s' }">
            <div class="product-gallery">
              <div class="main-image-wrapper clickable-image" @click="openLightbox(currentImageIndex)">
                <transition :name="transitionName" mode="in-out">
                  <img :key="selectedImage" :src="selectedImage" :alt="`Image of ${product.name}`" class="main-product-image" loading="eager">
                </transition>
                <div v-if="product.images && product.images.length > 1" class="image-count-indicator">
                  {{ currentImageIndex + 1 }} / {{ product.images.length }}
                </div>
                <button v-if="product.images && product.images.length > 1" @click.stop="prevImage" class="gallery-nav-button prev" aria-label="Previous image">
                  <font-awesome-icon icon="chevron-left"></font-awesome-icon>
                </button>
                <button v-if="product.images && product.images.length > 1" @click.stop="nextImage" class="gallery-nav-button next" aria-label="Next image">
                  <font-awesome-icon icon="chevron-right"></font-awesome-icon>
                </button>
              </div>
              <div v-if="product.images && product.images.length > 1" class="thumbnail-strip">
                <button v-for="(image, index) in product.images" :key="index" @click="handleThumbnailClick(index)" class="thumbnail-button" :class="{ active: index === currentImageIndex }" :aria-label="`View image ${index + 1}`">
                  <img :src="image" :alt="`${product.name} thumbnail ${index + 1}`" class="thumbnail-image" loading="lazy">
                </button>
              </div>
            </div>
          </div>
          <!-- ======== Product Information & Actions (Right Column) ======== -->
          <div class="product-info-container" :style="{ '--enter-delay': '0.2s' }">
            <div class="product-info-details">
              <div class="product-meta-info">
                <span v-if="product.category" class="product-category-badge">
                  <router-link :to="`/products?category=${product.category.toLowerCase().replace(' ', '-')}`" class="category-link">
                    {{ product.category }}
                  </router-link>
                </span>
              </div>
              <h1 class="product-title">{{ product.name }}</h1>
              <div class="key-specs">
                <div v-if="product.attributes?.dimensions" class="spec-item">
                  <font-awesome-icon icon="ruler-combined" class="spec-icon"></font-awesome-icon>
                  <span>{{ product.attributes.dimensions }}</span>
                </div>
                <div v-if="product.attributes?.material" class="spec-item">
                  <font-awesome-icon icon="gem" class="spec-icon"></font-awesome-icon>
                  <span>{{ Array.isArray(product.attributes.material) ? product.attributes.material.join(', ') : product.attributes.material }}</span>
                </div>
                <div v-if="product.attributes?.weight" class="spec-item">
                  <font-awesome-icon icon="weight-hanging" class="spec-icon"></font-awesome-icon>
                  <span>{{ product.attributes.weight }}</span>
                </div>
              </div>
              <!-- Rating Summary -->
              <div class="product-detail__rating-summary">
                <RatingSummary :average-rating="product.averageRating" :review-count="product.reviewCount" />
                <a v-if="product.reviewCount > 0" href="#reviews-section" class="scroll-to-reviews">
                  ({{ product.reviewCount }} review{{ product.reviewCount !== 1 ? 's' : '' }})
                </a>
              </div>
              <p class="product-price">{{ formatCurrency(product.price) }}</p>
              <!-- Attributes Selection -->
              <div v-if="product.attributes && Object.keys(filteredAttributes).length > 0" class="product-attributes">
                <div v-for="(options, key) in filteredAttributes" :key="key" class="attribute-group">
                  <label :for="`attr-${key}`" class="attribute-label">
                    {{ capitalize(key) }}:
                    <span v-if="isSwatchAttribute(key)" class="selected-swatch-label">{{ selectedAttributes[key] }}</span>
                  </label>
                  <div v-if="isSwatchAttribute(key)" class="swatch-options">
                    <button v-for="option in options" :key="option" class="swatch-button" :class="{ active: selectedAttributes[key] === option, color: key.toLowerCase() === 'color' || key.toLowerCase() === 'colour', texture: isTextureAttribute(key) }" :style="getSwatchStyle(key, option)" @click="selectAttribute(key, option)" :aria-pressed="selectedAttributes[key] === option" :title="option">
                      <span v-if="!(key.toLowerCase() === 'color' || key.toLowerCase() === 'colour')">{{ option }}</span>
                      <span v-if="selectedAttributes[key] === option" class="swatch-checkmark">
                        <font-awesome-icon icon="check"></font-awesome-icon>
                      </span>
                    </button>
                  </div>
                  <select v-else :id="`attr-${key}`" v-model="selectedAttributes[key]" class="attribute-select">
                    <option v-for="option in options" :key="option" :value="option">{{ option }}</option>
                  </select>
                </div>
              </div>
              <!-- Quantity & Add to Cart -->
              <div class="product-actions">
                <div class="quantity-selector">
                  <label for="quantity" class="sr-only">Quantity</label>
                  <div class="quantity-controls">
                    <button @click="decreaseQuantity" :disabled="quantity <= 1" class="quantity-btn minus" aria-label="Decrease quantity">-</button>
                    <input type="number" id="quantity" v-model.number="quantity" min="1" @change="validateQuantity" class="quantity-input" aria-label="Product quantity">
                    <button @click="increaseQuantity" class="quantity-btn plus" aria-label="Increase quantity">+</button>
                  </div>
                </div>
                <button @click="handleAddToCart" class="cta-button detail-add-btn" :class="{ 'added': justAdded, 'pulse-add': shouldPulseAddBtn }" :disabled="justAdded">
                  <span class="btn-icon-wrapper">
                    <font-awesome-icon :icon="justAdded ? 'check' : 'shopping-cart'"></font-awesome-icon>
                  </span>
                  <span class="btn-text">{{ justAdded ? 'Added!' : 'Add to Cart' }}</span>
                </button>
              </div>
              <hr class="info-divider subtle">
              <!-- Description -->
              <div class="product-description-wrapper">
                <h4 class="section-subheading">Description</h4>
                <div class="product-description" v-html="product.description || 'No description available.'"></div>
              </div>
              <!-- Additional Info -->
              <div class="additional-info">
                <details class="info-accordion" open>
                  <summary>Specifications</summary>
                  <div class="info-content">
                    <ul>
                      <li v-for="(value, key) in filteredSpecifications" :key="key">
                        <strong>{{ capitalize(key) }}:</strong>
                        <span>{{ value }}</span>
                      </li>
                      <li v-if="Object.keys(filteredSpecifications).length === 0">
                        <span>No specific details provided.</span>
                      </li>
                    </ul>
                  </div>
                </details>
                <details class="info-accordion">
                  <summary>Shipping & Returns</summary>
                  <div class="info-content">
                    <p>Standard delivery within 5-7 business days. Expedited options available at checkout.</p>
                    <p>We offer a 30-day return policy for items in original condition. See our full <router-link to="/shipping-policy">Shipping & Returns Policy</router-link> for details.</p>
                  </div>
                </details>
                <details class="info-accordion">
                  <summary>Care Instructions</summary>
                  <div class="info-content">
                    <p>{{ product.attributes?.care || 'Please refer to the product tag for specific care instructions. Generally, wipe clean with a soft, damp cloth. Avoid harsh chemicals.' }}</p>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>

        <!-- Reviews Section -->
        <div id="reviews-section" class="product-reviews-section">
          <h2 class="reviews-section__title">Customer Reviews & Ratings</h2>
          <!-- Rating Breakdown -->
          <RatingDistribution v-if="product.reviewCount > 0" :distribution="product.ratingDistribution" />
          <!-- Write Review Section -->
          <div class="write-review-section">
            <!-- Show form/button if logged in -->
            <div v-if="isUserLoggedIn">
              <button v-if="!showReviewForm" @click="showReviewForm = true" class="button enhanced-button primary">
                Write a Review
              </button>
              <ReviewForm v-else :product-id="product.id" @review-submitted="handleReviewSubmitted" @cancel="showReviewForm = false" />
            </div>
            <!-- Show login prompt if not logged in -->
            <div v-else class="login-prompt">
              <p>Please <button class="link-button" @click="requestLogin">log in</button> to write a review.</p>
            </div>
          </div>
          <!-- Review List -->
          <ReviewList :product-id="product.id" :current-user-id="userId" ref="reviewListRef" />
        </div>
      </div>
    </transition>

    <!-- Lightbox -->
    <LightboxModal v-if="product && product.images"
                   :images="product.images"
                   :start-index="lightboxStartIndex"
                   :is-active="isLightboxActive"
                   :image-alt-text="`${product?.name || 'Product'} image`"
                   @close="closeLightbox" />
  </main>
</template>

<script setup>
  import { ref, onMounted, watch, computed, nextTick, inject } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
  import { library } from '@fortawesome/fontawesome-svg-core';
  import {
    faShoppingCart, faExclamationTriangle, faBoxOpen, faChevronLeft,
    faChevronRight, faCheck, faRulerCombined, faGem, faSeedling,
    faStar, faStarHalfAlt, faWeightHanging // Ensure faWeightHanging is imported
  } from '@fortawesome/free-solid-svg-icons';
  import LightboxModal from '../components/ui/LightboxModal.vue';
  import RatingSummary from '../components/ui/RatingSummary.vue';
  import RatingDistribution from '../components/ui/RatingDistribution.vue';
  import ReviewList from '../components/features/ReviewList.vue';
  import ReviewForm from '../components/features/ReviewForm.vue';

  library.add(
    faShoppingCart, faExclamationTriangle, faBoxOpen, faChevronLeft,
    faChevronRight, faCheck, faRulerCombined, faGem, faSeedling,
    faStar, faStarHalfAlt, faWeightHanging // Ensure faWeightHanging is added
  );

  const route = useRoute();
  const router = useRouter();
  const emit = defineEmits(['add-to-cart']);

  // --- Inject App Context ---
  // Use a default object structure matching what you provide in App.vue
  // Ensure the default refs match the types expected (ref(boolean), ref(object|null))
  const appContext = inject('appContext', {
    isLoggedIn: ref(false), // Default to a ref(false)
    currentUser: ref(null), // Default to a ref(null)
    openAccountPopup: () => console.warn('openAccountPopup called before appContext provided')
  });

  // --- State ---
  const product = ref(null);
  const isLoading = ref(true);
  const errorLoading = ref(null);
  const selectedImage = ref('');
  const currentImageIndex = ref(0);
  const quantity = ref(1);
  const selectedAttributes = ref({});
  const transitionName = ref('image-slide-next');
  const justAdded = ref(false);
  const shouldPulseAddBtn = ref(false);
  const isLightboxActive = ref(false);
  const lightboxStartIndex = ref(0);
  const showReviewForm = ref(false);
  const reviewListRef = ref(null);

  // --- Computed ---
  const productId = computed(() => route.params.id);

  // --- CORRECTED: Access the .value of the injected refs ---
  const userId = computed(() => appContext?.currentUser?.value?._id ?? null); // Access .value
  const isUserLoggedIn = computed(() => appContext?.isLoggedIn?.value ?? false); // Access .value

  // ... (filteredAttributes, filteredSpecifications computed properties remain the same) ...
   const filteredAttributes = computed(() => {
        if (!product.value?.attributes) return {};
        const excludedKeys = ['dimensions', 'material', 'care', 'weight']; // Add 'weight' if needed
        const attributes = {};
        for (const key in product.value.attributes) {
             // Check if the key exists directly on the object
            if (Object.prototype.hasOwnProperty.call(product.value.attributes, key)) {
                const lowerKey = key.toLowerCase();
                const value = product.value.attributes[key];
                // Check if it's not excluded and is an array (common pattern for options)
                if (!excludedKeys.includes(lowerKey) && Array.isArray(value) && value.length > 0) {
                    attributes[key] = value;
                }
                 // Optionally handle non-array attributes if needed for display elsewhere
                 // else if (!excludedKeys.includes(lowerKey)) {
                 //    console.log(`Attribute '${key}' is not an array or excluded.`);
                 // }
            }
        }
        return attributes;
    });

    const filteredSpecifications = computed(() => {
        if (!product.value?.attributes) return {};
        const includedKeys = ['dimensions', 'material', 'weight', 'care']; // Add more if needed
        const specs = {};
        for (const key in product.value.attributes) {
            if (Object.prototype.hasOwnProperty.call(product.value.attributes, key)) {
                const lowerKey = key.toLowerCase();
                if (includedKeys.includes(lowerKey)) {
                    const value = product.value.attributes[key];
                    // Ensure values are presentable, join arrays if needed
                    specs[key] = Array.isArray(value) ? value.join(', ') : value;
                }
            }
        }
        return specs;
    });

  // --- Methods ---
  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '$--.--';
    return `$${Number(amount).toFixed(2)}`;
  };

  const capitalize = (s) => {
    if (typeof s !== 'string' || !s) return '';
    // Improved capitalization for camelCase or snake_case
    const spaced = s.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ');
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
  };

  // ... (fetchProductDetails remains the same, it correctly sets product.value which includes ratings) ...
  const fetchProductDetails = async (id) => {
    isLoading.value = true; errorLoading.value = null; product.value = null;
    showReviewForm.value = false; selectedAttributes.value = {}; quantity.value = 1;
    currentImageIndex.value = 0; selectedImage.value = ''; isLightboxActive.value = false;
    console.log(`Fetching product details for ID: ${id}`);
    try {
        const response = await fetch(`/api/products/${id}`);
        if (!response.ok) {
            const status = response.status; console.error(`HTTP error! Status: ${status}`);
            if (status === 404) throw new Error('Product not found.');
            let errorMessage = `Failed to load product (Status: ${status})`;
            try { const errorBody = await response.json(); errorMessage = errorBody.message || errorMessage; } catch (e) { /* Ignore */ }
            throw new Error(errorMessage);
        }
        const data = await response.json();
        console.log("Product data received:", data);
        if (!data || !data._id) throw new Error('Invalid product data received.');

        product.value = {
            id: data._id, name: data.name, description: data.description, price: data.price,
            category: data.category,
            images: data.images?.length ? data.images : [`https://via.placeholder.com/600?text=${encodeURIComponent(data.name||'No+Image')}`],
            attributes: data.attributes || {}, averageRating: data.averageRating || 0,
            reviewCount: data.reviewCount || 0,
            ratingDistribution: data.ratingDistribution || { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
        };
        console.log("Processed product object:", product.value);

        // Initialize selectedAttributes based on the *filtered* attributes
        if (product.value.attributes) {
            selectedAttributes.value = {}; // Reset first
            for (const key in filteredAttributes.value) { // Iterate over computed property keys
                const options = product.value.attributes[key]; // Get options from original data
                if (Array.isArray(options) && options.length > 0) {
                    selectedAttributes.value[key] = options[0]; // Set default
                }
            }
            console.log("Default attributes selected:", selectedAttributes.value);
        }

        changeMainImage(0, false);
        document.title = `${data.name || 'Product'} | AURORA Furnishings`;
        await nextTick();
        shouldPulseAddBtn.value = true;
        setTimeout(() => shouldPulseAddBtn.value = false, 1200);

    } catch (error) {
        console.error("Error fetching product details:", error);
        errorLoading.value = error.message || "An unknown error occurred.";
        product.value = null;
        document.title = 'Product Not Found | AURORA Furnishings';
    } finally {
        isLoading.value = false;
    }
  };


  const handleReviewSubmitted = async (newReview) => {
    console.log("Review submitted successfully, refreshing list and product data...");
    showReviewForm.value = false;
    // Use optional chaining for safety
    reviewListRef.value?.refreshReviews(1);
    // Refetch the product data to get updated rating summary and distribution
    await fetchProductDetails(productId.value);
  };

  const requestLogin = () => {
    // Use the injected method
    appContext?.openAccountPopup?.('login');
    // Add a check if the method doesn't exist (though it should with provide)
    if (!appContext?.openAccountPopup) {
        console.warn("App Context or openAccountPopup method not available.");
        // Optionally redirect or show a generic message
        // router.push('/login'); // If you have a dedicated login page
    }
  };

  // ... (changeMainImage, next/prev, thumbnail, lightbox, attribute/quantity, addToCart methods remain the same) ...
    const changeMainImage = (index, openLightboxAfter = false) => {
        if (!product.value?.images || index < 0 || index >= product.value.images.length) return;
        transitionName.value = index > currentImageIndex.value ? 'image-slide-next' : 'image-slide-prev';
        currentImageIndex.value = index;
        selectedImage.value = product.value.images[index];
        if (openLightboxAfter) openLightbox(index);
    };
    const nextImage = () => { if (!product.value?.images?.length) return; const newIndex = (currentImageIndex.value + 1) % product.value.images.length; changeMainImage(newIndex); };
    const prevImage = () => { if (!product.value?.images?.length) return; const newIndex = (currentImageIndex.value - 1 + product.value.images.length) % product.value.images.length; changeMainImage(newIndex); };
    const handleThumbnailClick = (index) => changeMainImage(index);
    const openLightbox = (index = 0) => { lightboxStartIndex.value = index; isLightboxActive.value = true; document.body.classList.add('lightbox-open'); };
    const closeLightbox = () => { isLightboxActive.value = false; document.body.classList.remove('lightbox-open'); };
    const isSwatchAttribute = (key) => ['color', 'colour', 'material', 'finish', 'wood'].includes(key.toLowerCase());
    const isTextureAttribute = (key) => ['material', 'finish', 'wood'].includes(key.toLowerCase());
    const getSwatchStyle = (key, option) => {
        const k = key.toLowerCase();
        if (k === 'color' || k === 'colour') {
        const colors = { black: '#333', white: '#f8f8f8', grey: '#aaa', gray: '#aaa', blue: '#3498db', red: '#e74c3c', green: '#2ecc71', natural: '#f5deb3', oak: '#c19a6b', walnut: '#705446' };
        return { backgroundColor: colors[option.toLowerCase()] || option };
        } return {};
    };
    const selectAttribute = (key, value) => { selectedAttributes.value[key] = value; };
    const increaseQuantity = () => { quantity.value = Math.min(99, (quantity.value || 0) + 1); }; // Add upper limit maybe
    const decreaseQuantity = () => { quantity.value = Math.max(1, (quantity.value || 1) - 1); };
    const validateQuantity = () => { quantity.value = Math.max(1, Math.min(99, parseInt(quantity.value) || 1)); }; // Clamp between 1 and 99
    const handleAddToCart = () => {
        if (!product.value || justAdded.value) return;
        justAdded.value = true;
        const attributesToSend = {};
        for(const key in filteredAttributes.value){ if(selectedAttributes.value[key]){ attributesToSend[key] = selectedAttributes.value[key]; } }
        emit('add-to-cart', {
            id: product.value.id,
            name: product.value.name,
            price: product.value.price,
            image: product.value.images[0],
            quantity: quantity.value,
            attributes: attributesToSend, // Send selected attributes
        });
        setTimeout(() => { justAdded.value = false; }, 1500);
    };

  // --- Lifecycle & Watchers ---
  onMounted(() => {
      console.log("ProductDetailView Mounted. Injected isLoggedIn:", isUserLoggedIn.value); // Log injected state
      fetchProductDetails(productId.value);
  });
  watch(productId, (newId) => { if (newId) fetchProductDetails(newId); });
  watch(route, () => { if (isLightboxActive.value) closeLightbox(); });
  // Watch the injected reactive ref for changes
  watch(() => appContext?.isLoggedIn?.value, (newLoginState) => {
      console.log("ProductDetailView detected login state change:", newLoginState);
      // You might re-evaluate computed properties or perform actions if needed
  });

</script>

<style scoped>
  /* Only include styles specific to ProductDetailView layout and reviews section */

  .product-detail-page {
    padding-bottom: 6rem;
  }

  .product-content-wrapper {
  }

  .product-detail-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
    max-width: 1300px;
    margin: 2rem auto 0;
    padding: 0 4%;
  }

  /* --- Rating Summary layout --- */
  .product-detail__rating-summary {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    margin-bottom: 1rem;
    margin-top: 0.5rem;
    flex-wrap: wrap;
  }

  .scroll-to-reviews {
    font-size: 0.85rem;
    color: var(--primary);
    text-decoration: none;
    font-weight: 600;
    border-bottom: 1px solid transparent;
    transition: border-color var(--transition-fast);
    margin-left: 0.2em; /* Small space after stars */
  }

    .scroll-to-reviews:hover {
      border-bottom-color: var(--primary);
    }

  /* --- Reviews Section Layout --- */
  .product-reviews-section {
    max-width: 1300px; /* Match layout width */
    margin: 3rem auto 0;
    padding: 2rem 4%;
    border-top: 1px solid var(--border-color);
    /* Removed grid-column span as it's outside the main layout grid now */
  }

  .reviews-section__title {
    font-family: var(--font-heading);
    font-size: 1.8rem;
    margin-bottom: 2rem;
    text-align: center;
    color: var(--text-dark);
  }

  .write-review-section {
    margin-bottom: 2.5rem;
    padding: 1.5rem;
    background-color: var(--white);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    max-width: 800px; /* Constrain form width */
    margin-left: auto;
    margin-right: auto;
  }

    .write-review-section .button {
      margin-bottom: 1rem;
    }

  .login-prompt p {
    margin: 0;
    font-size: 0.95rem;
    color: var(--text-muted);
    text-align: center;
  }

  .login-prompt .link-button {
    background: none;
    border: none;
    padding: 0;
    color: var(--primary);
    font-weight: 600;
    cursor: pointer;
    text-decoration: underline;
    font-size: inherit;
  }

  .cannot-review-message {
    font-style: italic;
    margin-top: 1rem;
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  /* Responsive adjustments */
  @media (min-width: 768px) {
    .product-detail-layout {
      grid-template-columns: minmax(0, 5fr) minmax(0, 4fr);
      gap: 3rem;
      align-items: flex-start;
    }
  }

  @media (min-width: 1024px) {
    .product-detail-layout {
      grid-template-columns: minmax(0, 6fr) minmax(0, 4fr);
      gap: 4rem;
    }
  }

  @media (max-width: 768px) {
    .product-detail-layout {
      padding: 0 5%;
      margin-top: 1rem;
    }

    .product-reviews-section {
      margin-top: 2rem;
      padding: 1.5rem 3%;
    }

    .reviews-section__title {
      font-size: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .write-review-section {
      padding: 1rem;
    }
  }

  /* Keep Loading/Error/Not Found styles */
  .loading-container, .message-container {
    min-height: 60vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    text-align: center;
  }

  .detail-loading .spinner::after {
    content: '';
    width: 40px;
    height: 40px;
    border: 4px solid var(--accent);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    display: block;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .message-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .error-icon {
    color: var(--secondary);
  }

  .empty-icon {
    color: var(--text-muted);
  }

  .message-container h2 {
    margin-bottom: 0.5rem;
    color: var(--text-dark);
  }

  .message-container p {
    color: var(--text-muted);
    margin-bottom: 1.5rem;
  }

  .message-container .button {
    margin-top: 1rem;
  }

  /* Keep Inherited Styles Note & Placeholders */
  .spec-icon {
    color: var(--primary);
    width: 14px;
    text-align: center;
    margin-right: 0.5em;
  }

  .key-specs {
    gap: 0.5rem 1.5rem;
    margin: 0.5rem 0 1rem 0;
    padding: 0.75rem 0;
    border-top: 1px solid var(--border-color);
    border-bottom: 1px solid var(--border-color);
  }

  .info-divider.subtle {
    border: none;
    height: 1px;
    background-color: var(--border-color);
    margin: 1.5rem 0;
    opacity: 0.5;
  }

  .product-description-wrapper {
    margin-top: 1rem;
  }

  .section-subheading {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-dark);
    margin-bottom: 0.8rem;
    padding-bottom: 0.4rem;
    border-bottom: 2px solid var(--primary);
    display: inline-block;
  }

  .product-description {
    color: var(--text-muted);
    line-height: 1.7;
    font-size: 0.95rem;
  }

    .product-description p:last-child {
      margin-bottom: 0;
    }

  .additional-info {
    margin-top: 2rem;
    border-top: 1px solid var(--border-color);
    padding-top: 1.5rem;
  }

  .sr-only {
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

  .button.secondary-button {
    background-color: var(--white);
    color: var(--primary);
    border: 1px solid var(--primary);
    padding: 0.6rem 1.2rem;
    border-radius: var(--border-radius-small);
    font-weight: 600;
  }

  .button.enhanced-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5em;
    border-radius: var(--border-radius-small);
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    transition: all var(--transition-fast);
    padding: 0.6rem 1.2rem;
    font-size: 0.9rem;
    border: 1px solid transparent;
    line-height: 1.4;
    white-space: nowrap;
  }

    .button.enhanced-button.primary {
      background-color: var(--primary);
      color: var(--white);
      border-color: var(--primary);
    }

  /* Ensure all other gallery/info/actions styles from previous version are present */
  .product-gallery-container {
    position: sticky;
    top: calc(var(--header-height) + 1.5rem);
    max-height: calc(100vh - var(--header-height) - 3rem);
    align-self: start;
  }

  .product-gallery {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .main-image-wrapper {
    position: relative;
    overflow: hidden;
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-medium);
    background-color: var(--bg-off-light);
    aspect-ratio: 1 / 1;
  }

    .main-image-wrapper.clickable-image {
      cursor: pointer;
    }

  .main-product-image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    position: absolute;
    top: 0;
    left: 0;
  }

  .image-slide-next-enter-active, .image-slide-next-leave-active, .image-slide-prev-enter-active, .image-slide-prev-leave-active {
    transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
  }

  .image-slide-next-enter-from {
    transform: translateX(100%);
  }

  .image-slide-next-leave-to {
    transform: translateX(-100%);
  }

  .image-slide-prev-enter-from {
    transform: translateX(-100%);
  }

  .image-slide-prev-leave-to {
    transform: translateX(100%);
  }

  .gallery-nav-button {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 10;
    background-color: rgba(33, 37, 41, 0.5);
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--white);
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.3s ease, background-color 0.3s ease, transform 0.3s ease;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }

    .gallery-nav-button.prev {
      left: 1rem;
    }

    .gallery-nav-button.next {
      right: 1rem;
    }

  @media (hover: hover) {
    .main-image-wrapper:hover .gallery-nav-button {
      opacity: 0.7;
    }

    .gallery-nav-button:hover {
      background-color: rgba(33, 37, 41, 0.8);
      transform: translateY(-50%) scale(1.1);
      opacity: 1;
    }
  }

  @media (max-width: 1024px) {
    .gallery-nav-button {
      opacity: 0.6;
      background-color: rgba(33, 37, 41, 0.4);
      width: 36px;
      height: 36px;
    }

      .gallery-nav-button.prev {
        left: 0.5rem;
      }

      .gallery-nav-button.next {
        right: 0.5rem;
      }

      .gallery-nav-button:hover {
        transform: translateY(-50%);
      }

      .gallery-nav-button:active {
        background-color: rgba(33, 37, 41, 0.7);
      }
  }

  .gallery-nav-button:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
    opacity: 1;
    background-color: rgba(33, 37, 41, 0.7);
  }

  .gallery-nav-button svg {
    font-size: 1rem;
  }

  .image-count-indicator {
    position: absolute;
    bottom: 0.8rem;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(0, 0, 0, 0.6);
    color: var(--white);
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.25rem 0.6rem;
    border-radius: 20px;
    z-index: 5;
    pointer-events: none;
  }

  .thumbnail-strip {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: flex-start;
    padding: 0 0.25rem;
  }

  .thumbnail-button {
    background: none;
    border: 2px solid transparent;
    padding: 0;
    border-radius: var(--border-radius-small);
    cursor: pointer;
    overflow: hidden;
    width: 65px;
    height: 65px;
    transition: border-color 0.25s ease, transform 0.25s ease, opacity 0.25s ease;
    opacity: 0.7;
    position: relative;
  }

    .thumbnail-button::before {
      content: '';
      position: absolute;
      inset: -2px;
      border: 2px solid var(--border-color);
      border-radius: inherit;
      transition: border-color 0.25s ease;
      z-index: -1;
    }

    .thumbnail-button:hover {
      opacity: 1;
      transform: scale(1.05);
    }

      .thumbnail-button:hover::before {
        border-color: var(--text-muted);
      }

    .thumbnail-button.active {
      opacity: 1;
      transform: scale(1);
    }

      .thumbnail-button.active::before {
        border-color: var(--primary);
      }

    .thumbnail-button:focus-visible {
      outline: 2px solid var(--primary);
      outline-offset: 2px;
      opacity: 1;
    }

  .thumbnail-image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: calc(var(--border-radius-small) - 2px);
  }

  .product-info-container {
    padding-top: 0;
  }

  .product-info-details {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .product-meta-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.25rem;
  }

  .product-category-badge {
    display: inline-block;
    background-color: var(--bg-off-light);
    border-radius: 20px;
    padding: 0.3rem 0.9rem;
    border: 1px solid var(--border-color);
  }

    .product-category-badge .category-link {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      text-decoration: none;
      transition: color var(--transition-fast);
    }

      .product-category-badge .category-link:hover {
        color: var(--primary);
      }

  .product-title {
    font-family: var(--font-heading);
    font-size: clamp(1.8rem, 4vw, 2.4rem);
    line-height: 1.25;
    margin: 0;
    color: var(--text-dark);
  }

  .product-price {
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--primary);
    margin: 0.25rem 0 1rem 0;
  }

  .product-attributes {
    margin: 0.5rem 0;
    padding: 0;
    background-color: transparent;
    border: none;
  }

  .attribute-group {
    margin-bottom: 1.2rem;
  }

  .attribute-label {
    display: block;
    font-weight: 600;
    font-size: 0.9rem;
    margin-bottom: 0.6rem;
    color: var(--text-dark);
  }

  .selected-swatch-label {
    font-weight: 400;
    color: var(--text-muted);
    margin-left: 0.5rem;
  }

  .swatch-options {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .swatch-button {
    min-width: 45px;
    height: 45px;
    padding: 0 0.8rem;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-small);
    background-color: var(--white);
    cursor: pointer;
    transition: all var(--transition-fast);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-dark);
    box-shadow: none;
    position: relative;
    overflow: hidden;
  }

    .swatch-button.color {
      width: 45px;
      border-radius: 50%;
      padding: 0;
      font-size: 0;
      box-shadow: inset 0 0 0 1px rgba(0,0,0,0.1);
      border: 2px solid var(--white);
    }

      .swatch-button.color.active {
        box-shadow: inset 0 0 0 1px rgba(0,0,0,0.1), 0 0 0 2px var(--white), 0 0 0 4px var(--primary);
      }

    .swatch-button.texture {
      background-size: cover;
      background-position: center;
      background-image: linear-gradient(45deg, var(--bg-off-light) 25%, transparent 25%, transparent 50%, var(--bg-off-light) 50%, var(--bg-off-light) 75%, transparent 75%, transparent);
      background-size: 10px 10px;
    }

    .swatch-button:not(.color).active {
      border-color: var(--primary);
      background-color: var(--primary);
      color: var(--white);
    }

    .swatch-button:hover:not(.active) {
      border-color: var(--text-muted);
      transform: translateY(-1px);
    }

    .swatch-button:focus-visible {
      outline: 2px solid var(--primary);
      outline-offset: 2px;
      border-color: var(--primary);
    }

  .swatch-checkmark {
    position: absolute;
    top: -2px;
    right: -2px;
    background-color: var(--primary);
    color: white;
    width: 18px;
    height: 18px;
    border-radius: 0 0 0 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    line-height: 1;
    opacity: 0;
    transform: scale(0.5) translate(50%, -50%);
    transition: opacity 0.2s ease, transform 0.2s ease;
  }

  .swatch-button.active .swatch-checkmark {
    opacity: 1;
    transform: scale(1) translate(0, 0);
  }

  .swatch-button.color .swatch-checkmark {
    background-color: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
    width: 20px;
    height: 20px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0);
    font-size: 0.8rem;
    opacity: 0;
  }

  .swatch-button.color.active .swatch-checkmark {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }

  .attribute-select {
    flex-grow: 1;
    padding: 0.6rem 1rem;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-small);
    font-size: 0.9rem;
    font-family: var(--font-body);
    background-color: var(--white);
    cursor: pointer;
    height: 45px;
    box-sizing: border-box;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%236c757d'%3E%3Cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.8rem center;
    background-size: 14px 10px;
    padding-right: 2.5rem;
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  }

    .attribute-select:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 2px var(--glow-primary);
    }

  .product-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: center;
    margin: 1.5rem 0;
  }

  .quantity-selector {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .quantity-controls {
    display: flex;
    align-items: center;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-small);
    overflow: hidden;
    background-color: var(--white);
    height: 48px;
    box-shadow: none;
  }

  .quantity-input {
    width: 55px;
    text-align: center;
    border: none;
    border-left: 1px solid var(--border-color);
    border-right: 1px solid var(--border-color);
    padding: 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-dark);
    height: 100%;
    box-sizing: border-box;
    background-color: var(--bg-light);
    -moz-appearance: textfield;
    transition: box-shadow 0.2s ease;
  }

    .quantity-input::-webkit-outer-spin-button, .quantity-input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    .quantity-input:focus {
      outline: none;
      box-shadow: inset 0 0 0 2px var(--primary);
      background-color: var(--white);
    }

  .quantity-btn {
    background: var(--bg-off-light);
    border: none;
    color: var(--text-muted);
    padding: 0 1rem;
    font-size: 1.2rem;
    line-height: 1;
    transition: background-color var(--transition-fast), color var(--transition-fast);
    cursor: pointer;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

    .quantity-btn:hover:not(:disabled) {
      background-color: #d8e0e6;
      color: var(--primary);
    }

    .quantity-btn:focus-visible {
      outline: 2px solid var(--primary);
      outline-offset: -2px;
      background-color: #d8e0e6;
      color: var(--primary);
      z-index: 1;
    }

    .quantity-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      background-color: var(--bg-light);
    }

  .cta-button.detail-add-btn {
    padding: 0 2rem;
    height: 48px;
    font-size: 0.95rem;
    flex-grow: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.8rem;
    min-width: 180px;
    position: relative;
    overflow: hidden;
    transition: background-color 0.3s ease, color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
  }

    .cta-button.detail-add-btn .btn-icon-wrapper {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s ease-out;
    }

    .cta-button.detail-add-btn .btn-text {
      transition: opacity 0.3s ease;
    }

  @keyframes pulse-grow {
    0% {
      transform: scale(1);
      box-shadow: var(--shadow-soft);
    }

    50% {
      transform: scale(1.03);
      box-shadow: 0 10px 25px rgba(78, 205, 196, 0.3);
    }

    100% {
      transform: scale(1);
      box-shadow: var(--shadow-soft);
    }
  }

  .cta-button.detail-add-btn.pulse-add {
    animation: pulse-grow 1s ease-out 0.2s;
  }

  .cta-button.detail-add-btn.added {
    background: linear-gradient(45deg, #27ae60, #2ecc71);
    box-shadow: 0 6px 15px rgba(46, 204, 113, 0.3);
    transform: translateY(0);
    cursor: default;
    color: var(--white);
  }

    .cta-button.detail-add-btn.added .btn-icon-wrapper {
      transform: scale(1.1);
    }
</style>
