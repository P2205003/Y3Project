<template>
  <!-- Link Wrapper -->
  <router-link v-if="linkTo" :to="linkTo" class="product-card-link" :aria-label="`View details for ${product.name}`">
    <!-- Actual Card Content -->
    <div class="product-card" :class="{ 'has-tilt': applyTilt }" v-tilt="tiltOptions">
      <div v-if="applyTilt" class="tilt-shine-overlay"></div>
      <div class="product-image" :style="{ backgroundImage: `url('${product.image}')` }" loading="lazy"></div>
      <div class="product-info">
        <h3>{{ product.name }}</h3>
        <!-- Display Rating -->
        <div v-if="product.reviewCount > 0" class="product-card__rating">
          <StarRatingDisplay :rating="product.averageRating" />
          <span class="product-card__review-count">({{ product.reviewCount }})</span>
        </div>
        <!-- End Rating Display -->
        <p>{{ product.description || defaultDescription }}</p>
        <div class="price-tag">{{ formatCurrency(product.price) }}</div>
        <button class="add-to-cart-btn" @click.prevent="addToCart" :aria-label="`Add ${product.name} to cart`">
          <font-awesome-icon icon="shopping-cart" />
          <span>Add to Cart</span>
        </button>
      </div>
    </div>
  </router-link>

  <!-- Card without link -->
  <div v-else>
    <div class="product-card" :class="{ 'has-tilt': applyTilt }" v-tilt="tiltOptions">
      <div v-if="applyTilt" class="tilt-shine-overlay"></div>
      <div class="product-image" :style="{ backgroundImage: `url('${product.image}')` }" loading="lazy" :aria-label="product.name"></div>
      <div class="product-info">
        <h3>{{ product.name }}</h3>
        <!-- Display Rating -->
        <div v-if="product.reviewCount > 0" class="product-card__rating">
          <StarRatingDisplay :rating="product.averageRating" />
          <span class="product-card__review-count">({{ product.reviewCount }})</span>
        </div>
        <!-- End Rating Display -->
        <p>{{ product.description || defaultDescription }}</p>
        <div class="price-tag">{{ formatCurrency(product.price) }}</div>
        <button class="add-to-cart-btn" @click="addToCart" :aria-label="`Add ${product.name} to cart`">
          <font-awesome-icon icon="shopping-cart" />
          <span>Add to Cart</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import StarRatingDisplay from './StarRatingDisplay.vue'; // Import rating display
// FontAwesomeIcon imported globally
// v-tilt directive is globally registered in main.js

const props = defineProps({
  product: {
    type: Object,
    required: true,
    validator: (value) => {
      // Adjusted validator to accept new rating fields (optional)
      return value && value.id && value.name && typeof value.price === 'number' && value.image;
    }
  },
  linkTo: { type: [String, Object], default: null },
  applyTilt: { type: Boolean, default: false }
});

const emit = defineEmits(['add-to-cart']);

const defaultDescription = "High-quality, sustainable furniture piece.";
const tiltOptions = computed(() => ({ /* Define custom tilt options here if needed */ }));

const formatCurrency = (amount) => `$${Number(amount).toFixed(2)}`;

const addToCart = () => {
  emit('add-to-cart', {
    id: props.product.id,
    name: props.product.name,
    price: props.product.price,
    image: props.product.image, // Use the image provided in the prop
    quantity: 1
  });
};
</script>

<style scoped>
  .product-card__rating {
    display: flex;
    align-items: center;
    gap: 0.4em;
    margin-bottom: 0.6rem; /* Space below rating */
    font-size: 0.85rem; /* Smaller size for card */
  }

  .product-card__review-count {
    color: var(--text-muted);
    font-size: 0.9em;
  }

  /* Ensure the rating display doesn't push content too much */
  .product-info {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }

    .product-info p {
      flex-grow: 1; /* Allow description to take space */
      margin-bottom: 0.8rem; /* Adjust spacing */
    }

    .product-info .price-tag {
      margin-top: auto; /* Push price/button towards bottom if needed */
      margin-bottom: 0.8rem;
    }
</style>
