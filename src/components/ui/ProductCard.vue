<template>
  <!-- Link Wrapper -->
  <router-link v-if="linkTo" :to="linkTo" class="product-card-link" :aria-label="t('productCard.viewDetailsAriaLabel', { name: product.name })">
    <!-- Actual Card Content -->
    <div class="product-card" :class="{ 'has-tilt': applyTilt }" v-tilt="tiltOptions">
      <div v-if="applyTilt" class="tilt-shine-overlay"></div>
      <!-- Background image label usually handled by context, but could add: :aria-label="t('productCard.imageAriaLabel', { name: product.name })" -->
      <div class="product-image" :style="{ backgroundImage: `url('${product.image}')` }" loading="lazy"></div>
      <div class="product-info">
        <h3>{{ product.name }}</h3> <!-- Already translated by backend -->
        <!-- Display Rating -->
        <div v-if="product.reviewCount > 0" class="product-card__rating">
          <StarRatingDisplay :rating="product.averageRating" />
          <!-- Optionally translate count format -->
          <span class="product-card__review-count">{{ t('productCard.ratingCount', { count: product.reviewCount }) }}</span>
        </div>
        <!-- End Rating Display -->
        <!-- Use translated default description -->
        <p>{{ product.description || defaultDescription }}</p> <!-- Already translated by backend -->
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
      <div class="product-image" :style="{ backgroundImage: `url('${product.image}')` }" loading="lazy" :aria-label="product.name"></div>
      <div class="product-info">
        <h3>{{ product.name }}</h3> <!-- Already translated -->
        <div v-if="product.reviewCount > 0" class="product-card__rating">
          <StarRatingDisplay :rating="product.averageRating" />
          <span class="product-card__review-count">{{ t('productCard.ratingCount', { count: product.reviewCount }) }}</span>
        </div>
        <p>{{ product.description || defaultDescription }}</p> <!-- Already translated -->
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
  import { useI18n } from 'vue-i18n'; // Import useI18n
  import StarRatingDisplay from './StarRatingDisplay.vue';
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'; // Import if not global

  // --- Get translation function ---
  const { t } = useI18n();

  const props = defineProps({
    product: {
      type: Object,
      required: true,
      validator: (value) => {
        // Basic check, assumes backend sends translated name
        return value && value.id && value.name && typeof value.price === 'number' && value.image;
      }
    },
    linkTo: { type: [String, Object], default: null },
    applyTilt: { type: Boolean, default: false }
  });

  const emit = defineEmits(['add-to-cart']);

  // --- Use translated default description ---
  const defaultDescription = computed(() => t('productCard.defaultDescription'));
  const tiltOptions = computed(() => ({})); // Tilt options can be customized here if needed

  const formatCurrency = (amount) => `$${Number(amount || 0).toFixed(2)}`; // Handle null/undefined price

  const addToCart = () => {
    emit('add-to-cart', {
      id: props.product.id,
      name: props.product.name, // Use the potentially translated name received from backend
      price: props.product.price,
      image: props.product.image,
      quantity: 1
      // Attributes are typically selected on the detail page, not added from the card.
    });
  };
</script>

<style scoped>
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
    padding: 1.5rem; /* Ensure padding is defined */
  }

    .product-info h3 {
      font-size: 1.2rem;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: var(--text-dark);
      /* Ensure wrapping */
      overflow: hidden;
      text-overflow: ellipsis;
      /* white-space: nowrap; /* Remove this if long names should wrap */
      display: -webkit-box;
      -webkit-line-clamp: 2; /* Limit to 2 lines */
      -webkit-box-orient: vertical;
      min-height: 2.6em; /* Reserve space for 2 lines */
    }

    .product-info p {
      flex-grow: 1;
      margin-bottom: 0.8rem;
      color: var(--text-muted);
      font-size: 0.9rem;
      line-height: 1.5;
      /* Add ellipsis for description */
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 3; /* Limit to 3 lines */
      -webkit-box-orient: vertical;
      min-height: calc(1.5 * 3em); /* Reserve space for 3 lines */
    }

    .product-info .price-tag {
      margin-top: auto; /* Pushes price down */
      margin-bottom: 0.8rem; /* Space above button */
      font-weight: 700;
      font-size: 1.1rem;
      color: var(--primary);
      display: block;
    }

  /* Other styles from main.css apply (.product-card, .product-image, .add-to-cart-btn etc.) */
</style>
