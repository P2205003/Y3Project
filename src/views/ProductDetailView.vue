// src/views/ProductDetailView.vue
<template>
  <main class="product-detail-page">
    <transition name="fade" mode="out-in">
      <!-- Loading State -->
      <div v-if="isLoading" key="loading" class="loading-container detail-loading">
        <div class="spinner"></div>
        <p>{{ t('productDetail.loading') }}</p>
      </div>
      <!-- Error State -->
      <div v-else-if="errorLoading" key="error" class="message-container error-container detail-error">
        <font-awesome-icon icon="exclamation-triangle" class="message-icon error-icon"></font-awesome-icon>
        <h2>{{ t('productDetail.error.title') }}</h2>
        <p>{{ errorLoading }}</p> <!-- Keep specific error -->
        <router-link to="/products" class="button enhanced-button secondary">{{ t('productDetail.error.backToProducts') }}</router-link>
      </div>
      <!-- Not Found State -->
      <div v-else-if="!product" key="notfound" class="message-container empty-container detail-notfound">
        <font-awesome-icon icon="box-open" class="message-icon empty-icon"></font-awesome-icon>
        <h2>{{ t('productDetail.notFound.title') }}</h2>
        <p>{{ t('productDetail.notFound.message') }}</p>
        <router-link to="/products" class="button enhanced-button secondary">{{ t('productDetail.error.backToProducts') }}</router-link>
      </div>
      <!-- Product Content -->
      <div v-else key="content" class="product-content-wrapper">
        <div class="product-detail-layout">
          <!-- ======== Product Gallery (Left Column) ======== -->
          <div class="product-gallery-container" :style="{ '--enter-delay': '0.1s' }">
            <div class="product-gallery">
              <div class="main-image-wrapper clickable-image" @click="openLightbox(currentImageIndex)">
                <transition :name="transitionName" mode="in-out">
                  <img :key="selectedImage" :src="selectedImage" :alt="t('productDetail.gallery.imageAlt', { name: product.name })" class="main-product-image" loading="eager">
                </transition>
                <div v-if="product.images && product.images.length > 1" class="image-count-indicator">
                  {{ t('productDetail.gallery.imageCountIndicator', { current: currentImageIndex + 1, total: product.images.length }) }}
                </div>
                <button v-if="product.images && product.images.length > 1" @click.stop="prevImage" class="gallery-nav-button prev" :aria-label="t('productDetail.gallery.previousAriaLabel')">
                  <font-awesome-icon icon="chevron-left"></font-awesome-icon>
                </button>
                <button v-if="product.images && product.images.length > 1" @click.stop="nextImage" class="gallery-nav-button next" :aria-label="t('productDetail.gallery.nextAriaLabel')">
                  <font-awesome-icon icon="chevron-right"></font-awesome-icon>
                </button>
              </div>
              <div v-if="product.images && product.images.length > 1" class="thumbnail-strip">
                <button v-for="(image, index) in product.images" :key="index" @click="handleThumbnailClick(index)" class="thumbnail-button" :class="{ active: index === currentImageIndex }" :aria-label="t('productDetail.gallery.thumbnailAriaLabel', { index: index + 1 })">
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
                  <!-- Link uses original category for filtering, displays translated category -->
                  <router-link :to="`/products?category=${product.baseCategory?.toLowerCase().replace(' ', '-') || product.category.toLowerCase().replace(' ', '-')}`" class="category-link">
                    {{ product.category }} <!-- Already translated -->
                  </router-link>
                </span>
              </div>
              <h1 class="product-title">{{ product.name }}</h1> <!-- Already translated -->
              <!-- Specs - Use base attributes if available, otherwise fallback to translated -->
              <div class="key-specs">
                <div v-if="getBaseAttributeValue('dimensions')" class="spec-item">
                  <font-awesome-icon icon="ruler-combined" class="spec-icon"></font-awesome-icon>
                  <span>{{ getBaseAttributeValue('dimensions') }}</span>
                </div>
                <div v-if="getBaseAttributeValue('material')" class="spec-item">
                  <font-awesome-icon icon="gem" class="spec-icon"></font-awesome-icon>
                  <span>{{ getBaseAttributeValue('material', true) }}</span>
                </div>
                <div v-if="getBaseAttributeValue('weight')" class="spec-item">
                  <font-awesome-icon icon="weight-hanging" class="spec-icon"></font-awesome-icon>
                  <span>{{ getBaseAttributeValue('weight') }}</span>
                </div>
              </div>
              <!-- Rating Summary -->
              <div class="product-detail__rating-summary">
                <RatingSummary :average-rating="product.averageRating" :review-count="product.reviewCount" />
                <a v-if="product.reviewCount > 0" href="#reviews-section" class="scroll-to-reviews">
                  {{ t('ratingSummary.reviewCount', product.reviewCount) }}
                </a>
              </div>
              <p class="product-price">{{ formatCurrency(product.price) }}</p>
              <!-- Attributes Selection (Uses translated attributes from backend) -->
              <div v-if="product.attributes && Object.keys(product.attributes).length > 0" class="product-attributes">
                <div v-for="(options, key) in product.attributes" :key="key" class="attribute-group">
                  <label :for="`attr-${key}`" class="attribute-label">
                    {{ key }}: <!-- Display the translated key directly -->
                    <span v-if="isSwatchAttribute(key)" class="selected-swatch-label">{{ selectedAttributes[key] }}</span>
                  </label>
                  <!-- Check if options is an array before iterating -->
                  <div v-if="Array.isArray(options)">
                    <div v-if="isSwatchAttribute(key)" class="swatch-options">
                      <button v-for="option in options" :key="option" class="swatch-button"
                              :class="{ active: selectedAttributes[key] === option, color: key.toLowerCase() === 'color' || key.toLowerCase() === 'colour', texture: isTextureAttribute(key) }"
                              :style="getSwatchStyle(key, option)" @click="selectAttribute(key, option)"
                              :aria-pressed="selectedAttributes[key] === option" :title="option">
                        <span v-if="!(key.toLowerCase() === 'color' || key.toLowerCase() === 'colour')">{{ option }}</span>
                        <span v-if="selectedAttributes[key] === option" class="swatch-checkmark"><font-awesome-icon icon="check" /></span>
                      </button>
                    </div>
                    <select v-else :id="`attr-${key}`" v-model="selectedAttributes[key]" class="attribute-select">
                      <option v-for="option in options" :key="option" :value="option">{{ option }}</option>
                    </select>
                  </div>
                  <div v-else>
                    <!-- Handle cases where options might not be an array (fallback/error) -->
                    <p class="attribute-error-text">Invalid options for {{ key }}</p>
                  </div>
                </div>
              </div>
              <!-- Quantity & Add to Cart -->
              <div class="product-actions">
                <div class="quantity-selector">
                  <label for="quantity" class="sr-only">{{ t('productDetail.actions.quantityAriaLabel') }}</label>
                  <div class="quantity-controls">
                    <button @click="decreaseQuantity" :disabled="quantity <= 1" class="quantity-btn minus" :aria-label="t('productDetail.actions.decreaseQuantityAriaLabel')">-</button>
                    <input type="number" id="quantity" v-model.number="quantity" min="1" max="99" @change="validateQuantity" class="quantity-input" :aria-label="t('productDetail.actions.quantityAriaLabel')">
                    <button @click="increaseQuantity" :disabled="quantity >= 99" class="quantity-btn plus" :aria-label="t('productDetail.actions.increaseQuantityAriaLabel')">+</button>
                  </div>
                </div>
                <button @click="handleAddToCart" class="cta-button detail-add-btn" :class="{ 'added': justAdded, 'pulse-add': shouldPulseAddBtn }" :disabled="justAdded">
                  <span class="btn-icon-wrapper">
                    <font-awesome-icon :icon="justAdded ? 'check' : 'shopping-cart'"></font-awesome-icon>
                  </span>
                  <span class="btn-text">{{ t(justAdded ? 'productDetail.actions.addedToCart' : 'productDetail.actions.addToCart') }}</span>
                </button>
              </div>
              <hr class="info-divider subtle">
              <!-- Description -->
              <div class="product-description-wrapper">
                <h4 class="section-subheading">{{ t('productDetail.info.descriptionTitle') }}</h4>
                <div class="product-description" v-html="product.description || t('productDetail.info.noDescription')"></div> <!-- Already translated -->
              </div>
              <!-- Additional Info -->
              <div class="additional-info">
                <details class="info-accordion" open>
                  <summary>{{ t('productDetail.info.specificationsTitle') }}</summary>
                  <div class="info-content">
                    <ul>
                      <li v-for="(value, key) in filteredSpecifications" :key="key">
                        <strong>{{ capitalize(key) }}:</strong> <!-- Use base key name -->
                        <span>{{ value }}</span> <!-- Show base value -->
                      </li>
                      <li v-if="Object.keys(filteredSpecifications).length === 0">
                        <span>{{ t('productDetail.info.noSpecifications') }}</span>
                      </li>
                    </ul>
                  </div>
                </details>
                <details class="info-accordion">
                  <summary>{{ t('productDetail.info.shippingReturnsTitle') }}</summary>
                  <div class="info-content">
                    <p v-html="t('productDetail.info.shippingInfo')"></p>
                    <p v-html="t('productDetail.info.returnsInfo')"></p>
                  </div>
                </details>
                <details class="info-accordion">
                  <summary>{{ t('productDetail.info.careInstructionsTitle') }}</summary>
                  <div class="info-content">
                    <p>{{ getBaseAttributeValue('care') || t('productDetail.info.defaultCare') }}</p>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>

        <!-- Reviews Section -->
        <div id="reviews-section" class="product-reviews-section">
          <h2 class="reviews-section__title">{{ t('productDetail.reviews.title') }}</h2>
          <RatingDistribution v-if="product.reviewCount > 0" :distribution="product.ratingDistribution" />
          <div class="write-review-section">
            <div v-if="isUserLoggedIn">
              <button v-if="!showReviewForm" @click="showReviewForm = true" class="button enhanced-button primary">
                {{ t('productDetail.reviews.writeReviewButton') }}
              </button>
              <ReviewForm v-else :product-id="product.id" @review-submitted="handleReviewSubmitted" @cancel="showReviewForm = false" />
            </div>
            <div v-else class="login-prompt" @click.capture="handleLoginPromptClick">
              <p v-html="t('productDetail.actions.loginToReview')"></p>
            </div>
          </div>
          <ReviewList :product-id="product.id" :current-user-id="userId" ref="reviewListRef" />
        </div>
      </div>
    </transition>

    <!-- Lightbox -->
    <LightboxModal v-if="product && product.images"
                   :images="product.images"
                   :start-index="lightboxStartIndex"
                   :is-active="isLightboxActive"
                   :image-alt-text="t('productDetail.gallery.imageAlt', { name: product?.name || 'Product' })"
                   @close="closeLightbox" />
  </main>
</template>

<script setup>
  import { ref, onMounted, watch, computed, nextTick, inject } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { useI18n } from 'vue-i18n';
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
  // Icons are imported and added in main.js now
  import LightboxModal from '../components/ui/LightboxModal.vue';
  import RatingSummary from '../components/ui/RatingSummary.vue';
  import RatingDistribution from '../components/ui/RatingDistribution.vue';
  import ReviewList from '../components/features/ReviewList.vue';
  import ReviewForm from '../components/features/ReviewForm.vue';

  const { t } = useI18n();
  const route = useRoute();
  const router = useRouter();
  const emit = defineEmits(['add-to-cart']);

  // Inject App Context
  const appContext = inject('appContext', {
    isLoggedIn: ref(false),
    currentUser: ref(null),
    openAccountPopup: () => console.warn('openAccountPopup called before appContext provided')
  });

  // State
  const product = ref(null); // Holds the *translated* product data from API
  const baseAttributes = ref({}); // Store original attributes separately if needed
  const isLoading = ref(true);
  const errorLoading = ref(null);
  const selectedImage = ref('');
  const currentImageIndex = ref(0);
  const quantity = ref(1);
  const selectedAttributes = ref({}); // Holds selected *translated* attribute values { [translatedKey]: translatedValue }
  const transitionName = ref('image-slide-next');
  const justAdded = ref(false);
  const shouldPulseAddBtn = ref(false);
  const isLightboxActive = ref(false);
  const lightboxStartIndex = ref(0);
  const showReviewForm = ref(false);
  const reviewListRef = ref(null);

  // Computed
  const productId = computed(() => route.params.id);
  const userId = computed(() => appContext?.currentUser?.value?._id ?? null);
  const isUserLoggedIn = computed(() => appContext?.isLoggedIn?.value ?? false);

  // Filtered Specifications - Now explicitly uses `baseAttributes` ref
  const filteredSpecifications = computed(() => {
    const specs = {};
    const includedKeys = ['dimensions', 'material', 'weight', 'care'];
    if (!baseAttributes.value) return specs; // Check if baseAttributes is populated

    for (const key in baseAttributes.value) {
      const lowerKey = key.toLowerCase();
      if (includedKeys.includes(lowerKey)) {
        const value = baseAttributes.value[key];
        specs[capitalize(key)] = Array.isArray(value) ? value.join(', ') : value;
      }
    }
    return specs;
  });

  // Helper to get base attribute value (uses the separate ref)
  const getBaseAttributeValue = (key, joinArray = false) => {
    const baseValue = baseAttributes.value?.[key]; // Access the separate ref
    if (Array.isArray(baseValue) && joinArray) return baseValue.join(', ');
    return baseValue || '';
  };


  // Methods
  const formatCurrency = (amount) => `$${Number(amount || 0).toFixed(2)}`;
  const capitalize = (s) => {
    if (typeof s !== 'string' || !s) return '';
    const spaced = s.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ');
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
  };

  const fetchProductDetails = async (id) => {
    isLoading.value = true; errorLoading.value = null; product.value = null;
    baseAttributes.value = {}; // Reset base attributes
    // ... reset other states ...
    try {
      // Backend applies translation based on request header
      const response = await fetch(`/api/products/${id}`);
      if (!response.ok) {
        const status = response.status;
        if (status === 404) throw new Error(t('productDetail.notFound.message'));
        let errorMessage = `Failed to load product (Status: ${status})`;
        try { const errorBody = await response.json(); errorMessage = errorBody.message || errorMessage; } catch (e) { /* Ignore */ }
        throw new Error(errorMessage);
      }
      const data = await response.json();
      if (!data || !data._id) throw new Error('Invalid product data received.');

      // Store the main (potentially translated) data
      product.value = {
        id: data._id,
        name: data.name,
        description: data.description,
        price: data.price,
        category: data.category,
        images: data.images?.length ? data.images : [`https://via.placeholder.com/600?text=No+Image`],
        attributes: data.attributes || {}, // This now holds TRANSLATED key/value pairs
        averageRating: data.averageRating || 0,
        reviewCount: data.reviewCount || 0,
        ratingDistribution: data.ratingDistribution || { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
        // Store original base category if needed for linking (requires backend change)
        baseCategory: data.baseCategory || data.category, // Fallback to translated if base not sent
      };

      // Store original attributes IF backend sends them separately
      baseAttributes.value = data.baseAttributes || {}; // Assuming backend adds this field

      // Initialize selectedAttributes based on the received (translated) attributes
      selectedAttributes.value = {};
      if (product.value.attributes) {
        for (const translatedKey in product.value.attributes) {
          const options = product.value.attributes[translatedKey];
          if (Array.isArray(options) && options.length > 0) {
            selectedAttributes.value[translatedKey] = options[0]; // Select first translated option by default
          }
        }
      }

      changeMainImage(0, false);
      document.title = `${data.name || t('productDetail.notFound.title')} | ${t('appName')}`;
      // ... pulse logic ...
      await nextTick();
      shouldPulseAddBtn.value = true;
      setTimeout(() => shouldPulseAddBtn.value = false, 1200);

    } catch (error) { /* ... (error handling) ... */ }
    finally { isLoading.value = false; }
  };

  const handleReviewSubmitted = async () => {
    console.log("Review submitted, refreshing...");
    showReviewForm.value = false;
    // Refresh list first for immediate feedback
    reviewListRef.value?.refreshReviews(1);
    // Then refetch product data to update counts/ratings
    await fetchProductDetails(productId.value);
  };

  const requestLogin = () => {
    appContext?.openAccountPopup?.('login');
    if (!appContext?.openAccountPopup) {
      console.warn("App Context or openAccountPopup method not available.");
    }
  };

  const handleLoginPromptClick = (event) => {
    if (event.target.tagName === 'BUTTON' && event.target.classList.contains('link-button')) {
      requestLogin();
    }
  };


  // Gallery & Lightbox Methods (no changes needed)
  const changeMainImage = (index, openLightboxAfter = false) => { /* ... */ };
  const nextImage = () => { /* ... */ };
  const prevImage = () => { /* ... */ };
  const handleThumbnailClick = (index) => changeMainImage(index);
  const openLightbox = (index = 0) => { /* ... */ };
  const closeLightbox = () => { /* ... */ };

  // Attributes & Quantity Methods
  const isSwatchAttribute = (key) => ['color', 'colour', 'material', 'finish', 'wood', // Base English keys
    '颜色', '材料', '饰面' // Example Translated keys
  ].includes(key.toLowerCase());
  const isTextureAttribute = (key) => ['material', 'finish', 'wood', // Base
    '材料', '饰面' // Translated
  ].includes(key.toLowerCase());

  const getSwatchStyle = (key, option) => {
    // Swatch styling might need more robust logic if options are translated
    // This simple version maps common English color names OR uses the value directly
    const k = key.toLowerCase();
    if (k === 'color' || k === 'colour' || k === '颜色') {
      const colors = { black: '#333', white: '#f8f8f8', grey: '#aaa', gray: '#aaa', blue: '#3498db', red: '#e74c3c', green: '#2ecc71', natural: '#f5deb3', oak: '#c19a6b', walnut: '#705446', /* Add translated colors if needed */ '红色': '#e74c3c', '白色': '#f8f8f8' };
      return { backgroundColor: colors[option.toLowerCase()] || option };
    } return {};
  };

  // Selecting attributes now uses the (potentially translated) key
  const selectAttribute = (key, value) => { selectedAttributes.value[key] = value; };
  const increaseQuantity = () => { quantity.value = Math.min(99, (quantity.value || 0) + 1); };
  const decreaseQuantity = () => { quantity.value = Math.max(1, (quantity.value || 1) - 1); };
  const validateQuantity = () => { quantity.value = Math.max(1, Math.min(99, parseInt(quantity.value) || 1)); };

  // Add to Cart - Sends *selected* (possibly translated) attributes
  const handleAddToCart = () => {
    if (!product.value || justAdded.value) return;
    justAdded.value = true;

    // Create the map to send to the cart service
    // This uses the currently selected translated keys and values
    const attributesToSend = { ...selectedAttributes.value };

    // If `baseAttributes` were sent from backend, you *could* map back here,
    // but it's complex. Easier if cart service/backend handles the received attributes.
    // Example (conceptual, requires `baseAttributes` and careful mapping):
    // const baseAttributesToSend = {};
    // for (const translatedKey in selectedAttributes.value) {
    //    const selectedValue = selectedAttributes.value[translatedKey];
    //    // Find the baseKey that corresponds to this translatedKey (needs inverse mapping)
    //    const baseKey = findBaseKeyForTranslatedKey(translatedKey);
    //    // Find the baseValue that corresponds to this selectedValue (needs inverse mapping)
    //    const baseValue = findBaseValueForTranslatedValue(baseKey, selectedValue);
    //    if (baseKey && baseValue) {
    //       baseAttributesToSend[baseKey] = baseValue;
    //    }
    // }

    emit('add-to-cart', {
      id: product.value.id,
      name: product.value.name, // Send current display name
      price: product.value.price,
      image: product.value.images[0],
      quantity: quantity.value,
      attributes: attributesToSend, // Send the selected (translated) attributes map
    });
    setTimeout(() => { justAdded.value = false; }, 1500);
  };

  // Lifecycle & Watchers
  onMounted(() => {
    console.log("ProductDetailView Mounted. Injected isLoggedIn:", isUserLoggedIn.value);
    fetchProductDetails(productId.value);
  });
  watch(productId, (newId) => { if (newId) fetchProductDetails(newId); });
  watch(route, () => { if (isLightboxActive.value) closeLightbox(); });
  watch(() => appContext?.isLoggedIn?.value, (newLoginState) => {
    console.log("ProductDetailView detected login state change:", newLoginState);
    // Potentially refresh reviews or other user-specific data if needed
  });

</script>

<style scoped>
  /* Reusing styles from previous example (main.css + scoped additions) */
  .product-detail-page {
    padding-bottom: 6rem;
  }

  .product-detail-layout { /* ... grid styles ... */
  }

  .product-detail__rating-summary { /* ... flex styles ... */
  }

  .scroll-to-reviews { /* ... link styles ... */
  }

  .product-reviews-section { /* ... padding/border styles ... */
  }

  .reviews-section__title { /* ... heading styles ... */
  }

  .write-review-section { /* ... card styles ... */
  }

  .login-prompt p { /* ... text styles ... */
  }

  .login-prompt .link-button { /* ... button styles ... */
  }

  .loading-container, .message-container { /* ... flex/padding styles ... */
  }

  .detail-loading .spinner::after { /* ... animation styles ... */
  }

  .message-icon { /* ... icon styles ... */
  }

  .spec-icon { /* ... icon styles ... */
  }

  .key-specs { /* ... flex/border styles ... */
  }

  .spec-item { /* ... flex styles ... */
  }

  .info-divider.subtle { /* ... border styles ... */
  }

  .product-description-wrapper { /* ... margin styles ... */
  }

  .section-subheading { /* ... heading styles ... */
  }

  .product-description { /* ... text styles ... */
  }

  .additional-info { /* ... margin/padding styles ... */
  }

  .info-accordion { /* ... border styles ... */
  }

    .info-accordion summary { /* ... flex/cursor styles ... */
    }

      .info-accordion summary::after { /* ... pseudo-element marker ... */
      }

    .info-accordion[open] summary::after { /* ... marker rotation ... */
    }

    .info-accordion .info-content { /* ... padding/text styles ... */
    }

  .sr-only { /* ... accessibility styles ... */
  }

  .button.secondary-button { /* ... button styles ... */
  }

  .button.enhanced-button { /* ... button styles ... */
  }

    .button.enhanced-button.primary { /* ... button styles ... */
    }
  /* Gallery Styles */
  .product-gallery-container { /* ... sticky styles ... */
  }

  .product-gallery { /* ... flex styles ... */
  }

  .main-image-wrapper { /* ... aspect-ratio/shadow ... */
  }

    .main-image-wrapper.clickable-image {
      cursor: pointer;
    }

  .main-product-image { /* ... object-fit ... */
  }

  .image-slide-next-enter-active, .image-slide-next-leave-active, .image-slide-prev-enter-active, .image-slide-prev-leave-active { /* ... transition ... */
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

  .gallery-nav-button { /* ... absolute position, appearance ... */
  }

  .image-count-indicator { /* ... absolute position, appearance ... */
  }

  .thumbnail-strip { /* ... flex styles ... */
  }

  .thumbnail-button { /* ... appearance, active state ... */
  }

  .thumbnail-image { /* ... object-fit ... */
  }
  /* Info & Actions Styles */
  .product-info-container { /* ... padding ... */
  }

  .product-info-details { /* ... flex styles ... */
  }

  .product-meta-info { /* ... flex styles ... */
  }

  .product-category-badge { /* ... badge styles ... */
  }

  .product-title { /* ... heading styles ... */
  }

  .product-price { /* ... price styles ... */
  }

  .product-attributes { /* ... margin ... */
  }

  .attribute-group { /* ... margin ... */
  }

  .attribute-label { /* ... text styles ... */
  }

  .selected-swatch-label { /* ... text styles ... */
  }

  .swatch-options { /* ... flex styles ... */
  }

  .swatch-button { /* ... appearance, active state ... */
  }

  .swatch-checkmark { /* ... absolute position, checkmark ... */
  }

  .attribute-select { /* ... appearance, dropdown arrow ... */
  }

  .product-actions { /* ... flex styles ... */
  }

  .quantity-selector { /* ... flex styles ... */
  }

  .quantity-controls { /* ... flex, border ... */
  }

  .quantity-input { /* ... text align, border ... */
  }

  .quantity-btn { /* ... appearance, hover ... */
  }

  .cta-button.detail-add-btn { /* ... flex, appearance, transitions ... */
  }

    .cta-button.detail-add-btn.added { /* ... success state style ... */
    }

    .cta-button.detail-add-btn.pulse-add {
      animation: pulse-grow 1s ease-out 0.2s;
    }
  /* Animation */

  /* Handle potential errors in attribute display */
  .attribute-error-text {
    color: var(--secondary);
    font-size: 0.8em;
    font-style: italic;
    margin-top: 0.2em;
  }
</style>
