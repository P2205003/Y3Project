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
      <div v-else key="content" class="product-detail-layout">

        <!-- ======== Product Gallery (Left Column) ======== -->
        <div class="product-gallery-container" :style="{ '--enter-delay': '0.1s' }">
          <div class="product-gallery">
            <!-- Main Image Area -->
            <div class="main-image-wrapper clickable-image" @click="openLightbox(currentImageIndex)">
              <transition :name="transitionName" mode="in-out">
                <img :key="selectedImage"
                     :src="selectedImage"
                     :alt="`Image of ${product.name}`"
                     class="main-product-image"
                     loading="eager">
              </transition>
              <!-- Image Count -->
              <div v-if="product.images && product.images.length > 1" class="image-count-indicator">
                {{ currentImageIndex + 1 }} / {{ product.images.length }}
              </div>
              <!-- Navigation Arrows -->
              <button v-if="product.images && product.images.length > 1"
                      @click.stop="prevImage"
                      class="gallery-nav-button prev"
                      aria-label="Previous image">
                <font-awesome-icon icon="chevron-left"></font-awesome-icon>
              </button>
              <button v-if="product.images && product.images.length > 1"
                      @click.stop="nextImage"
                      class="gallery-nav-button next"
                      aria-label="Next image">
                <font-awesome-icon icon="chevron-right"></font-awesome-icon>
              </button>
            </div>

            <!-- Thumbnails -->
            <div v-if="product.images && product.images.length > 1" class="thumbnail-strip">
              <button v-for="(image, index) in product.images"
                      :key="index"
                      @click="handleThumbnailClick(index)"
                      class="thumbnail-button"
                      :class="{ active: index === currentImageIndex }"
                      :aria-label="`View image ${index + 1}`">
                <img :src="image" :alt="`${product.name} thumbnail ${index + 1}`" class="thumbnail-image" loading="lazy">
              </button>
            </div>
          </div>
        </div>

        <!-- ======== Product Information & Actions (Right Column) ======== -->
        <div class="product-info-container" :style="{ '--enter-delay': '0.2s' }">
          <div class="product-info-details">
            <!-- Category & Title -->
            <div class="product-meta-info">
              <span v-if="product.category" class="product-category-badge">
                <router-link :to="`/products?category=${product.category.toLowerCase().replace(' ', '-')}`" class="category-link">
                  {{ product.category }}
                </router-link>
              </span>
            </div>
            <h1 class="product-title">{{ product.name }}</h1>

            <!-- Key Specs -->
            <div class="key-specs">
              <div v-if="product.attributes?.dimensions" class="spec-item">
                <font-awesome-icon icon="ruler-combined" class="spec-icon"></font-awesome-icon>
                <span>{{ product.attributes.dimensions }}</span>
              </div>
              <div v-if="product.attributes?.material" class="spec-item">
                <font-awesome-icon icon="gem" class="spec-icon"></font-awesome-icon>
                <span>{{ Array.isArray(product.attributes.material) ? product.attributes.material.join(', ') : product.attributes.material }}</span>
              </div>
            </div>

            <p class="product-price">{{ formatCurrency(product.price) }}</p>

            <!-- Attributes Selection -->
            <div v-if="product.attributes && Object.keys(product.attributes).length > 0" class="product-attributes">
              <div v-for="(options, key) in filteredAttributes" :key="key" class="attribute-group">
                <label :for="`attr-${key}`" class="attribute-label">
                  {{ capitalize(key) }}:
                  <span v-if="isSwatchAttribute(key)" class="selected-swatch-label">{{ selectedAttributes[key] }}</span>
                </label>
                <!-- Swatches -->
                <div v-if="isSwatchAttribute(key)" class="swatch-options">
                  <button v-for="option in options"
                          :key="option"
                          class="swatch-button"
                          :class="{
                                  active: selectedAttributes[key] === option,
                                  color: key.toLowerCase() === 'color' || key.toLowerCase() === 'colour',
                                  texture: isTextureAttribute(key)
                                }"
                          :style="getSwatchStyle(key, option)"
                          @click="selectAttribute(key, option)"
                          :aria-pressed="selectedAttributes[key] === option"
                          :title="option">
                    <span v-if="!(key.toLowerCase() === 'color' || key.toLowerCase() === 'colour')">{{ option }}</span>
                    <span v-if="selectedAttributes[key] === option" class="swatch-checkmark">
                      <font-awesome-icon icon="check"></font-awesome-icon>
                    </span>
                  </button>
                </div>
                <!-- Select Fallback -->
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
              <button @click="handleAddToCart"
                      class="cta-button detail-add-btn"
                      :class="{ 'added': justAdded, 'pulse-add': shouldPulseAddBtn }"
                      :disabled="justAdded">
                <span class="btn-icon-wrapper">
                  <font-awesome-icon :icon="justAdded ? 'check' : 'shopping-cart'"></font-awesome-icon>
                </span>
                <span class="btn-text">{{ justAdded ? 'Added!' : 'Add to Cart' }}</span>
              </button>
            </div>

            <!-- CORRECTED hr TAG -->
            <hr class="info-divider subtle">

            <!-- Description -->
            <div class="product-description-wrapper">
              <h4 class="section-subheading">Description</h4>
              <div class="product-description" v-html="product.description || 'No description available.'"></div>
            </div>

            <!-- Additional Info (Accordion) -->
            <div class="additional-info">
              <details class="info-accordion">
                <summary>Specifications</summary>
                <div class="info-content">
                  <ul>
                    <li v-for="(value, key) in filteredSpecifications" :key="key">
                      <strong>{{ capitalize(key) }}:</strong>
                      <span>{{ Array.isArray(value) ? value.join(', ') : value }}</span>
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
    </transition>

    <!-- CORRECTED Lightbox Component -->
    <LightboxModal v-if="product && product.images"
                   :images="product.images"
                   :start-index="lightboxStartIndex"
                   :is-active="isLightboxActive"
                   :image-alt-text="`${product?.name || 'Product'} image`"
                   @close="closeLightbox"></LightboxModal> <!-- Explicit closing tag -->
  </main>
</template>

<script setup>
  // --- Imports ---
  import { ref, onMounted, watch, computed, nextTick } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
  import { library } from '@fortawesome/fontawesome-svg-core';
  import {
    faShoppingCart, faExclamationTriangle, faBoxOpen, faChevronLeft,
    faChevronRight, faCheck, faRulerCombined, faGem, faSeedling
  } from '@fortawesome/free-solid-svg-icons';
  import LightboxModal from '../components/ui/LightboxModal.vue'; // Corrected path assuming structure

  library.add(
    faShoppingCart, faExclamationTriangle, faBoxOpen, faChevronLeft,
    faChevronRight, faCheck, faRulerCombined, faGem, faSeedling
  );

  // --- Setup ---
  const route = useRoute();
  const router = useRouter();
  const emit = defineEmits(['add-to-cart']);

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

  // --- Computed ---
  const productId = computed(() => route.params.id);

  const filteredAttributes = computed(() => {
    if (!product.value?.attributes) return {};
    const excludedKeys = ['dimensions', 'material', 'care', 'weight'];
    return Object.entries(product.value.attributes)
      .filter(([key]) => !excludedKeys.includes(key.toLowerCase()) && Array.isArray(product.value.attributes[key]))
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});
  });

  const filteredSpecifications = computed(() => {
    if (!product.value?.attributes) return {};
    const includedKeys = ['dimensions', 'material', 'weight'];
    return Object.entries(product.value.attributes)
      .filter(([key]) => includedKeys.includes(key.toLowerCase()))
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});
  });

  // --- Methods ---
  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '$--.--';
    return `$${Number(amount).toFixed(2)}`;
  };

  const capitalize = (s) => {
    if (typeof s !== 'string') return '';
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  };

  const fetchProductDetails = async (id) => {
    isLoading.value = true;
    errorLoading.value = null;
    product.value = null;
    selectedImage.value = '';
    currentImageIndex.value = 0;
    quantity.value = 1;
    selectedAttributes.value = {};
    isLightboxActive.value = false;

    console.log(`Fetching product details for ID: ${id}`);
    try {
      const response = await fetch(`/api/products/${id}`);
      if (!response.ok) {
        const status = response.status;
        console.error(`HTTP error! Status: ${status}`);
        if (status === 404) throw new Error('Product not found.');
        let errorMessage = `Failed to load product (Status: ${status})`;
        try { const errorBody = await response.json(); errorMessage = errorBody.message || errorMessage; }
        catch (e) { /* Ignore */ }
        throw new Error(errorMessage);
      }
      const data = await response.json();
      console.log("Product data received:", data);
      if (!data || !data._id) throw new Error('Invalid product data received.');

      product.value = {
        id: data._id,
        name: data.name,
        description: data.description,
        price: data.price,
        category: data.category,
        images: data.images && data.images.length > 0
          ? data.images
          : [`https://via.placeholder.com/600x600/cccccc/FFFFFF?text=${encodeURIComponent(data.name || 'No Image')}`],
        attributes: data.attributes || {},
      };
      console.log("Processed product object:", product.value);

      if (product.value.attributes) {
        for (const key in product.value.attributes) {
          if (Array.isArray(product.value.attributes[key]) && product.value.attributes[key].length > 0) {
            selectedAttributes.value[key] = product.value.attributes[key][0];
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
      errorLoading.value = error.message || "An unknown error occurred while loading the product.";
      product.value = null;
      document.title = 'Product Not Found | AURORA Furnishings';
    } finally {
      isLoading.value = false;
    }
  };

  const changeMainImage = (index, openLightboxAfter = false) => {
    if (!product.value?.images || index < 0 || index >= product.value.images.length) return;
    if (index > currentImageIndex.value) transitionName.value = 'image-slide-next';
    else if (index < currentImageIndex.value) transitionName.value = 'image-slide-prev';
    currentImageIndex.value = index;
    selectedImage.value = product.value.images[index];
    if (openLightboxAfter) { openLightbox(index); }
  };

  const nextImage = () => {
    const newIndex = (currentImageIndex.value + 1) % product.value.images.length;
    changeMainImage(newIndex, false);
  };

  const prevImage = () => {
    const newIndex = (currentImageIndex.value - 1 + product.value.images.length) % product.value.images.length;
    changeMainImage(newIndex, false);
  };

  const handleThumbnailClick = (index) => {
    changeMainImage(index, false);
    // Optional: openLightbox(index);
  }

  const isSwatchAttribute = (key) => {
    const lowerKey = key.toLowerCase();
    return ['color', 'colour', 'material', 'finish', 'wood'].includes(lowerKey);
  };
  const isTextureAttribute = (key) => {
    const lowerKey = key.toLowerCase();
    return ['material', 'finish', 'wood'].includes(lowerKey);
  };
  const getSwatchStyle = (key, option) => {
    const lowerKey = key.toLowerCase();
    if (lowerKey === 'color' || lowerKey === 'colour') {
      const colorMap = { 'black': '#333', 'white': '#f8f8f8', 'grey': '#aaa', 'gray': '#aaa', 'blue': '#3498db', 'red': '#e74c3c', 'green': '#2ecc71', 'natural': '#f5deb3', 'oak': '#c19a6b', 'walnut': '#705446' };
      return { backgroundColor: colorMap[option.toLowerCase()] || option.toLowerCase() };
    }
    return {};
  };
  const selectAttribute = (key, value) => { selectedAttributes.value[key] = value; };
  const increaseQuantity = () => { quantity.value++; };
  const decreaseQuantity = () => { if (quantity.value > 1) quantity.value--; };
  const validateQuantity = () => { if (!quantity.value || quantity.value < 1) quantity.value = 1; };

  const handleAddToCart = () => {
    if (!product.value || justAdded.value) return;
    justAdded.value = true;
    emit('add-to-cart', {
      id: product.value.id,
      name: product.value.name,
      price: product.value.price,
      image: product.value.images[0],
      quantity: quantity.value,
      attributes: { ...selectedAttributes.value },
    });
    setTimeout(() => { justAdded.value = false; }, 1500);
  };

  const openLightbox = (index) => {
    console.log("Opening lightbox at index:", index);
    lightboxStartIndex.value = index;
    isLightboxActive.value = true;
    document.body.classList.add('lightbox-open');
  };

  const closeLightbox = () => {
    console.log("Closing lightbox");
    isLightboxActive.value = false;
    document.body.classList.remove('lightbox-open');
  };

  // --- Lifecycle & Watchers ---
  onMounted(() => { fetchProductDetails(productId.value); });
  watch(productId, (newId) => { if (newId) fetchProductDetails(newId); });
  watch(route, () => { if (isLightboxActive.value) { closeLightbox(); } });

</script>
