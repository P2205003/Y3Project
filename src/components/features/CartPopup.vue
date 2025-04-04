<template>
  <div id="cart-popup-overlay" class="popup-overlay" :class="{ active: isActive }" @click="$emit('close')"></div>
  <div id="cart-popup" :class="{ active: isActive }" role="dialog" aria-modal="true" aria-labelledby="cart-popup-title">
    <div class="popup-header">
      <h2 id="cart-popup-title">Your Cart</h2>
      <button class="popup-close-btn" id="cart-popup-close" aria-label="Close Cart Panel" @click="$emit('close')">×</button>
    </div>

    <div class="cart-items-container">
      <div v-if="cartItems && cartItems.length > 0">
        <div v-for="item in cartItems"
             :key="item.id"
             class="cart-item"
             :data-product-id="item.id">
          <img :src="item.image" :alt="item.name" class="cart-item-image" loading="lazy">
          <div class="cart-item-details">
            <span class="cart-item-name">{{ item.name }}</span>
            <span class="cart-item-price">{{ formatCurrency(item.price) }}</span>
            <div class="cart-item-quantity">
              <button class="quantity-btn minus"
                      :aria-label="`Decrease quantity of ${item.name}`"
                      @click="updateQuantity(item.id, -1)"
                      :disabled="item.quantity <= 1">
                -
              </button>
              <span class="quantity-display">{{ item.quantity }}</span>
              <button class="quantity-btn plus"
                      :aria-label="`Increase quantity of ${item.name}`"
                      @click="updateQuantity(item.id, 1)">
                +
              </button>
            </div>
          </div>
          <button class="cart-item-remove" :aria-label="`Remove ${item.name}`" @click="removeItem(item.id)">×</button>
        </div>
      </div>
      <p v-else class="cart-empty-message">Your cart is currently empty.</p>
    </div>

    <div class="cart-summary" v-if="cartItems && cartItems.length > 0">
      <div class="cart-subtotal">
        <span>Subtotal:</span>
        <strong id="cart-subtotal-value">{{ formatCurrency(subtotal) }}</strong>
      </div>
      <div class="cart-actions">
        <!-- TODO: Replace with router-links if Cart/Checkout pages exist -->
        <a href="#" class="button secondary-button">View Cart</a>
        <a href="#" class="button primary-button">Checkout</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { watch } from 'vue';

const props = defineProps({
  isActive: Boolean,
  cartItems: {
    type: Array,
    default: () => []
  },
  subtotal: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['close', 'update-quantity', 'remove-item']);

const formatCurrency = (amount) => {
  // Basic formatting, consider using Intl.NumberFormat for robustness
  return `$${Number(amount).toFixed(2)}`;
};

const updateQuantity = (productId, change) => {
  emit('update-quantity', { productId, change });
};

const removeItem = (productId) => {
  emit('remove-item', productId);
};

// Handle Escape key press
const handleKeydown = (event) => {
    if (event.key === 'Escape' && props.isActive) {
        emit('close');
    }
};

watch(() => props.isActive, (newValue) => {
    if (newValue) {
        document.addEventListener('keydown', handleKeydown);
    } else {
        document.removeEventListener('keydown', handleKeydown);
    }
});

// Cleanup handled by App.vue now
// onUnmounted(() => {
//     document.removeEventListener('keydown', handleKeydown);
// });

</script>

<style scoped>

</style>
