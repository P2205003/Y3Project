<template>
  <!-- Link Wrapper -->
  <router-link v-if="linkTo" :to="linkTo" class="product-card-link" :aria-label="t('productCard.viewDetailsAriaLabel', { name: product.name })">
    <!-- Actual Card Content -->
    <div class="product-card" :class="{ 'has-tilt': applyTilt }" v-tilt="tiltOptions">
      <div v-if="applyTilt" class="tilt-shine-overlay"></div>
      <!-- Background image label usually handled by context, but could add: :aria-label="t('productCard.imageAriaLabel', { name: product.name })" -->
      <div class="product-image" :style="{ backgroundImage: `url('${product.image}')` }" loading="lazy"></div>
      <div class="product-info">
        <h3>{{ product.name }}</h3>
        <!-- Display Rating -->
        <div v-if="product.reviewCount > 0" class="product-card__rating">
          <StarRatingDisplay :rating="product.averageRating" />
          <!-- Optionally translate count format -->
          <span class="product-card__review-count">{{ t('productCard.ratingCount', { count: product.reviewCount }) }}</span>
        </div>
        <!-- End Rating Display -->
        <!-- Use translated default description -->
        <p>{{ product.description || defaultDescription }}</p>
        <div class="price-tag">{{ formatCurrency(product.price) }}</div>
        <button class="add-to-cart-btn" @click.prevent="addToCart" :aria-label="t('productCard.addToCartAriaLabel', { name: product.name })">
          <font-awesome-icon icon="shopping-cart" />
          <span>{{ t('productCard.addToCart') }}</span>
        </button>
      </div>
    </div>
  </router-link>

  <!-- Card without link -->
  <div v-else>
    <div class="product-card" :class="{ 'has-tilt': applyTilt }" v-tilt="tiltOptions">
      <div v-if="applyTilt" class="tilt-shine-overlay"></div>
      <div class="product-image" :style="{ backgroundImage: `url('${product.image}')` }" loading="lazy" :aria-label="product.name"></div> <!-- Dynamic -->
      <div class="product-info">
        <h3>{{ product.name }}</h3> <!-- Dynamic -->
        <!-- Display Rating -->
        <div v-if="product.reviewCount > 0" class="product-card__rating">
          <StarRatingDisplay :rating="product.averageRating" />
          <span class="product-card__review-count">{{ t('productCard.ratingCount', { count: product.reviewCount }) }}</span> <!-- Optional Translation -->
        </div>
        <!-- End Rating Display -->
        <p>{{ product.description || defaultDescription }}</p> <!-- Use translated default -->
        <div class="price-tag">{{ formatCurrency(product.price) }}</div> <!-- Dynamic -->
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
  import { useI18n } from 'vue-i18n'; // Import useI18n
  import StarRatingDisplay from './StarRatingDisplay.vue';

  // --- Get translation function ---
  const { t } = useI18n();

  const props = defineProps({
    product: {
      type: Object,
      required: true,
      validator: (value) => {
        return value && value.id && value.name && typeof value.price === 'number' && value.image;
      }
    },
    linkTo: { type: [String, Object], default: null },
    applyTilt: { type: Boolean, default: false }
  });

  const emit = defineEmits(['add-to-cart']);

  // --- Use translated default description ---
  const defaultDescription = computed(() => t('productCard.defaultDescription'));
  const tiltOptions = computed(() => ({}));

  const formatCurrency = (amount) => `$${Number(amount).toFixed(2)}`;

  const addToCart = () => {
    emit('add-to-cart', {
      id: props.product.id,
      name: props.product.name,
      price: props.product.price,
      image: props.product.image,
      quantity: 1
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
