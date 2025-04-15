<template>
  <div id="cart-popup-overlay" class="popup-overlay" :class="{ active: isActive }" @click="$emit('close')"></div>
  <div id="cart-popup" :class="{ active: isActive }" role="dialog" aria-modal="true" aria-labelledby="cart-popup-title">
    <div class="popup-header">
      <h2 id="cart-popup-title">{{ t('cartPopup.title') }}</h2>
      <button class="popup-close-btn" id="cart-popup-close" :aria-label="t('cartPopup.closeAriaLabel')" @click="$emit('close')">×</button>
    </div>

    <div class="cart-items-container">
      <div v-if="cartItems && cartItems.length > 0">
        <div v-for="item in cartItems"
             :key="getItemKey(item)"
             class="cart-item"
             :data-product-id="item.productId">

          <router-link :to="{ name: 'product-detail', params: { id: item.productId } }" class="cart-item-image-link" @click="$emit('close')">
            <img :src="item.image" :alt="item.name" class="cart-item-image" loading="lazy"> <!-- Alt text remains dynamic -->
          </router-link>

          <div class="cart-item-details">
            <router-link :to="{ name: 'product-detail', params: { id: item.productId } }" class="cart-item-name-link" @click="$emit('close')">
              <span class="cart-item-name">{{ item.name }}</span> <!-- Name remains dynamic -->
            </router-link>

            <div v-if="item.attributes && Object.keys(item.attributes).length > 0" class="cart-item-attributes">
              <div v-for="(value, key) in item.attributes" :key="key" class="attribute">
                <span class="attribute-key">{{ capitalize(key) }}:</span> {{ value }} <!-- Attribute key/value remain dynamic -->
              </div>
            </div>

            <span class="cart-item-price">{{ formatCurrency(item.price) }}</span> <!-- Price remains dynamic -->

            <div class="cart-item-quantity">
              <button class="quantity-btn minus"
                      :aria-label="t('cartPopup.item.decreaseQuantityAriaLabel', { name: item.name })"
                      @click="updateQuantity(item, -1)"
                      :disabled="item.quantity <= 1">
                -
              </button>
              <span class="quantity-display">{{ item.quantity }}</span>
              <button class="quantity-btn plus"
                      :aria-label="t('cartPopup.item.increaseQuantityAriaLabel', { name: item.name })"
                      @click="updateQuantity(item, 1)"
                      :disabled="item.quantity >= MAX_QUANTITY">
                +
              </button>
            </div>
          </div>

          <!-- ** Inline Confirmation Area ** -->
          <div class="cart-item-remove-action">
            <transition name="fade-confirm" mode="out-in">
              <!-- Show confirm/cancel if this item is pending -->
              <div v-if="itemPendingRemovalKey === getItemKey(item)" class="confirm-remove-controls" :key="'confirm-' + getItemKey(item)">
                <button @click="confirmRemove(item)" class="confirm-btn-inline yes" :aria-label="t('cartPopup.item.confirmRemoveAriaLabel')">{{ t('cartPopup.item.confirmRemoveYes') }}</button>
                <button @click="cancelRemove" class="confirm-btn-inline no" :aria-label="t('cartPopup.item.cancelRemoveAriaLabel')">{{ t('cartPopup.item.confirmRemoveNo') }}</button>
              </div>
              <!-- Otherwise, show the standard remove button -->
              <button v-else
                      @click="requestRemoveItem(item)"
                      class="cart-item-remove"
                      :aria-label="t('cartPopup.item.removeAriaLabel', { name: item.name })"
                      :key="'remove-' + getItemKey(item)">
                ×
              </button>
            </transition>
          </div>
          <!-- ** End Inline Confirmation Area ** -->

        </div>
      </div>
      <p v-else class="cart-empty-message">{{ t('cartPopup.emptyMessage') }}</p>
    </div>

    <div class="cart-summary" v-if="cartItems && cartItems.length > 0">
      <div class="cart-subtotal">
        <span>{{ t('cartPopup.summary.subtotal') }}</span>
        <strong id="cart-subtotal-value">{{ formatCurrency(subtotal) }}</strong> <!-- Subtotal value remains dynamic -->
      </div>
      <div class="cart-actions">
        <router-link to="/cart" class="button secondary-button" @click="$emit('close')">{{ t('cartPopup.summary.viewCart') }}</router-link>
        <router-link to="/checkout" class="button primary-button" @click="$emit('close')">{{ t('cartPopup.summary.checkout') }}</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, watch } from 'vue';
  import { useI18n } from 'vue-i18n'; // <-- Import useI18n
  import { useRouter } from 'vue-router';

  // --- Get translation function ---
  const { t } = useI18n();

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
  const router = useRouter();

  const MAX_QUANTITY = 99;
  const itemPendingRemovalKey = ref(null);

  const getItemKey = (item) => {
    return `${item.productId}_${JSON.stringify(item.attributes || {})}`;
  };

  // Using Intl.NumberFormat for currency formatting (more robust than manual string building)
  // Note: This assumes USD. For multi-currency, you'd need to pass the currency code.
  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });
  const formatCurrency = (amount) => currencyFormatter.format(amount);


  const capitalize = (s) => {
    if (typeof s !== 'string' || !s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const updateQuantity = (item, change) => {
    itemPendingRemovalKey.value = null;
    emit('update-quantity', {
      productId: item.productId,
      change: change,
      attributes: item.attributes || {}
    });
  };

  const requestRemoveItem = (item) => {
    itemPendingRemovalKey.value = getItemKey(item);
  };

  const confirmRemove = (item) => {
    if (itemPendingRemovalKey.value === getItemKey(item)) {
      emit('remove-item', {
        productId: item.productId,
        attributes: item.attributes || {}
      });
      itemPendingRemovalKey.value = null;
    }
  };

  const cancelRemove = () => {
    itemPendingRemovalKey.value = null;
  };

  const handleKeydown = (event) => {
    if (event.key === 'Escape' && props.isActive) {
      emit('close');
    }
  };

  watch(() => props.isActive, (newValue) => {
    if (newValue) {
      document.addEventListener('keydown', handleKeydown);
      itemPendingRemovalKey.value = null;
    } else {
      document.removeEventListener('keydown', handleKeydown);
      itemPendingRemovalKey.value = null;
    }
  });

</script>

<style scoped>
  /* Styles remain the same */
  .cart-item-image-link, .cart-item-name-link {
    color: inherit;
    text-decoration: none;
    display: contents;
  }

  .cart-item-image {
    display: block;
  }

  .cart-item-name-link .cart-item-name {
    transition: color 0.2s ease;
  }

  .cart-item-name-link:hover .cart-item-name {
    color: var(--primary);
  }

  .cart-item-attributes {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin-top: 0.3rem;
    margin-bottom: 0.5rem;
    line-height: 1.4;
  }

  .attribute {
    display: block;
  }

  .attribute-key {
    font-weight: 600;
    margin-right: 0.3em;
  }

  .cart-actions .button {
    flex-grow: 1;
    text-align: center;
  }

  .quantity-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .cart-item-remove-action {
    margin-left: 0.5rem;
    align-self: center;
    position: relative;
    min-width: 40px;
    text-align: center;
  }

  .confirm-remove-controls {
    display: flex;
    gap: 0.4rem;
    align-items: center;
  }

  .confirm-btn-inline {
    background: none;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 0.2rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s, border-color 0.2s;
  }

    .confirm-btn-inline.yes {
      color: var(--secondary);
      border-color: var(--secondary);
    }

      .confirm-btn-inline.yes:hover {
        background-color: var(--secondary);
        color: white;
      }

    .confirm-btn-inline.no {
      color: var(--text-muted);
    }

      .confirm-btn-inline.no:hover {
        background-color: var(--bg-off-light);
        border-color: var(--text-muted);
      }

  .cart-item-remove {
    min-width: 30px;
    min-height: 26px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .fade-confirm-enter-active, .fade-confirm-leave-active {
    transition: opacity 0.2s ease;
  }

  .fade-confirm-enter-from, .fade-confirm-leave-to {
    opacity: 0;
  }
</style>
