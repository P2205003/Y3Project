<template>
  <!-- Link Wrapper -->
  <router-link v-if="linkTo" :to="linkTo" class="product-card-link" :aria-label="t('productCard.viewDetailsAriaLabel', { name: product.name })">
    <!-- Actual Card Content -->
    <div class="product-card" :class="{ 'has-tilt': applyTilt }" v-tilt="tiltOptions">
      <div v-if="applyTilt" class="tilt-shine-overlay"></div>
      <div class="product-image" :style="{ backgroundImage: `url('${product.image}')` }" :aria-label="t('productCard.imageAriaLabel', { name: product.name })" loading="lazy"></div>
      <div class="product-info">
        <h3>{{ product.name }}</h3> <!-- Already translated by parent view -->
        <div v-if="product.reviewCount > 0" class="product-card__rating">
          <StarRatingDisplay :rating="product.averageRating" />
          <span class="product-card__review-count">{{ t('productCard.ratingCount', { count: product.reviewCount }) }}</span>
        </div>
        <p>{{ product.description || defaultDescription }}</p> <!-- Already translated by parent view -->
        <div class="price-tag">{{ formatCurrency(product.price) }}</div>
        <button class="add-to-cart-btn" @click.prevent="addToCart" :aria-label="t('productCard.addToCartAriaLabel', { name: product.name })">
          <font-awesome-icon icon="shopping-cart" />
          <span>{{ t('productCard.addToCart') }}</span>
        </button>
      </div>
    </div>
  </router-link>

  <!-- Card without link (If you use this variant, ensure addToCart is called) -->
  <div v-else>
    <div class="product-card" :class="{ 'has-tilt': applyTilt }" v-tilt="tiltOptions">
      <div v-if="applyTilt" class="tilt-shine-overlay"></div>
      <div class="product-image" :style="{ backgroundImage: `url('${product.image}')` }" loading="lazy" :aria-label="product.name"></div>
      <div class="product-info">
        <h3>{{ product.name }}</h3>
        <div v-if="product.reviewCount > 0" class="product-card__rating">
          <StarRatingDisplay :rating="product.averageRating" />
          <span class="product-card__review-count">{{ t('productCard.ratingCount', { count: product.reviewCount }) }}</span>
        </div>
        <p>{{ product.description || defaultDescription }}</p>
        <div class="price-tag">{{ formatCurrency(product.price) }}</div>
        <button class="add-to-cart-btn" @click="addToCart" :aria-label="t('productCard.addToCartAriaLabel', { name: product.name })">
          <font-awesome-icon icon="shopping-cart" />
          <span>{{ t('productCard.addToCart') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { computed } from 'vue';
  import { useI18n } from 'vue-i18n';
  import StarRatingDisplay from './StarRatingDisplay.vue';
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'; // Import FontAwesomeIcon here

  const { t } = useI18n();

  const props = defineProps({
    product: {
      type: Object,
      required: true,
      // Simplified validator, assuming parent view ensures correct data structure
      validator: (value) => value && value.id && value.name && typeof value.price === 'number' && typeof value.image === 'string'
    },
    linkTo: { type: [String, Object], default: null },
    applyTilt: { type: Boolean, default: false }
  });

  const emit = defineEmits(['add-to-cart']);
  const defaultDescription = computed(() => t('productCard.defaultDescription'));
  const tiltOptions = computed(() => ({}));
  const formatCurrency = (amount) => `$${Number(amount).toFixed(2)}`;

  const addToCart = () => {
    // Emit minimal essential data for adding to cart
    emit('add-to-cart', {
      productId: props.product.id, // Send product ID
      quantity: 1,
      attributes: {}, // Product card typically doesn't handle attributes
      // Pass display details for local storage fallback in cartService
      name: props.product.name,
      price: props.product.price,
      image: props.product.image,
    });
  };
</script>

<style scoped>
  /* Styles remain the same */
  .product-card__rating {
    display: flex;
    align-items: center;
    gap: 0.4em;
    margin-bottom: 0.6rem;
    font-size: 0.85rem;
  }

  .product-card__review-count {
    color: var(--text-muted);
    font-size: 0.9em;
  }

  .product-info {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }

    .product-info p {
      flex-grow: 1;
      margin-bottom: 0.8rem;
    }

    .product-info .price-tag {
      margin-top: auto;
      margin-bottom: 0.8rem;
    }
</style>
