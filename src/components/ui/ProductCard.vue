<template>
  <!-- Conditionally wrap with router-link if linkTo is provided -->
  <router-link v-if="linkTo"
               :to="linkTo"
               class="product-card-link"
               :aria-label="`View details for ${product.name}`">
    <!-- The actual card content, apply tilt conditionally -->
    <div class="product-card" :class="{ 'has-tilt': applyTilt }" v-if="applyTilt" v-tilt>
      <div class="tilt-shine-overlay"></div>
      <div class="product-image"
           :style="{ backgroundImage: `url('${product.image}')` }"
           loading="lazy"></div>
      <div class="product-info">
        <h3>{{ product.name }}</h3>
        <p>{{ product.description || defaultDescription }}</p>
        <div class="price-tag">{{ formatCurrency(product.price) }}</div>
        <!-- Use .prevent to stop the link navigation when button is clicked -->
        <button class="add-to-cart-btn"
                @click.prevent="addToCart"
                :aria-label="`Add ${product.name} to cart`">
          <font-awesome-icon icon="shopping-cart" />
          <span>Add to Cart</span>
        </button>
      </div>
    </div>
    <!-- Same card structure, but without v-tilt if applyTilt is false -->
    <div class="product-card" v-else>
      <!-- No shine overlay -->
      <div class="product-image"
           :style="{ backgroundImage: `url('${product.image}')` }"
           loading="lazy"></div>
      <div class="product-info">
        <h3>{{ product.name }}</h3>
        <p>{{ product.description || defaultDescription }}</p>
        <div class="price-tag">{{ formatCurrency(product.price) }}</div>
        <!-- Use .prevent here too for consistency, though less critical -->
        <button class="add-to-cart-btn"
                @click.prevent="addToCart"
                :aria-label="`Add ${product.name} to cart`">
          <font-awesome-icon icon="shopping-cart" />
          <span>Add to Cart</span>
        </button>
      </div>
    </div>
  </router-link>

  <!-- Render without router-link if linkTo is not provided -->
  <div v-else>
    <!-- Apply tilt conditionally -->
    <div class="product-card" :class="{ 'has-tilt': applyTilt }" v-if="applyTilt" v-tilt>
      <div class="tilt-shine-overlay"></div>
      <div class="product-image"
           :style="{ backgroundImage: `url('${product.image}')` }"
           loading="lazy"
           :aria-label="product.name"></div>
      <div class="product-info">
        <h3>{{ product.name }}</h3>
        <p>{{ product.description || defaultDescription }}</p>
        <div class="price-tag">{{ formatCurrency(product.price) }}</div>
        <!-- No .prevent needed here as there's no link to prevent -->
        <button class="add-to-cart-btn"
                @click="addToCart"
                :aria-label="`Add ${product.name} to cart`">
          <font-awesome-icon icon="shopping-cart" />
          <span>Add to Cart</span>
        </button>
      </div>
    </div>
    <!-- No tilt, no link -->
    <div class="product-card" v-else>
      <!-- No shine overlay -->
      <div class="product-image"
           :style="{ backgroundImage: `url('${product.image}')` }"
           loading="lazy"
           :aria-label="product.name"></div>
      <div class="product-info">
        <h3>{{ product.name }}</h3>
        <p>{{ product.description || defaultDescription }}</p>
        <div class="price-tag">{{ formatCurrency(product.price) }}</div>
        <button class="add-to-cart-btn"
                @click="addToCart"
                :aria-label="`Add ${product.name} to cart`">
          <font-awesome-icon icon="shopping-cart" />
          <span>Add to Cart</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
  // v-tilt directive is globally registered in main.js

  const props = defineProps({
    product: {
      type: Object,
      required: true,
      validator: (value) => {
        return value && value.id && value.name && typeof value.price === 'number' && value.image;
      }
    },
    // Optional: Path or route object for router-link
    linkTo: {
      type: [String, Object],
      default: null
    },
    // Optional: Boolean to enable/disable the v-tilt directive
    applyTilt: {
      type: Boolean,
      default: false // Default to no tilt
    }
  });

  const emit = defineEmits(['add-to-cart']);

  const defaultDescription = "High-quality, sustainable furniture piece.";

  const formatCurrency = (amount) => {
    return `$${Number(amount).toFixed(2)}`;
  };

  const addToCart = () => {
    // Emit necessary data for App.vue to handle
    emit('add-to-cart', {
      id: props.product.id,
      name: props.product.name,
      price: props.product.price,
      // Use thumbImage if available, otherwise full image
      image: props.product.thumbImage || props.product.image,
      quantity: 1
    });
  };
</script>

<style scoped>
  /* Styles for .product-card, .product-image, .product-info etc. are in main.css */

  /* Ensure the button is clickable OVER the link wrapper */
  .add-to-cart-btn {
    position: relative; /* Needed for z-index */
    z-index: 5; /* Ensure it's above the link */
  }

  /* Style the link wrapper */
  .product-card-link {
    display: block; /* Takes up grid space */
    height: 100%; /* Fills the grid cell height */
    text-decoration: none;
    color: inherit; /* Inherit text color from parent */
    border-radius: var(--border-radius); /* For focus outline */
    position: relative; /* Positioning context */
    -webkit-tap-highlight-color: transparent; /* Remove tap highlight on mobile */
  }

    /* Link focus styles */
    .product-card-link:focus-visible {
      outline: 2px solid var(--primary);
      outline-offset: 4px;
      box-shadow: none; /* Remove potential inherited shadows */
      /* Ensure focus outline is above card content if needed */
      z-index: 10;
    }

    /* Ensure the inner card fills the link */
    .product-card-link .product-card {
      height: 100%;
      /* The link itself will handle hover/focus transforms from main.css */
      /* Reset transforms potentially applied directly to the card if needed */
      transform: none;
      transition: none; /* Handled by link wrapper */
    }

  /* Adjust shine overlay position if needed (should be fine with absolute positioning) */
  .product-card .tilt-shine-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    /* Styles in main.css or directive */
    z-index: 2; /* Below info/button, above image */
    pointer-events: none;
    border-radius: var(--border-radius); /* Match card shape */
  }

  /* Optional: Add subtle transition for non-tilt hover on the card itself */
  .product-card:not(.has-tilt):hover .product-image {
    transform: scale(1.03); /* Simple zoom if no tilt */
    transition: transform 0.4s ease-out;
  }
</style>
