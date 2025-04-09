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
             :key="getItemKey(item)"
             class="cart-item"
             :data-product-id="item.productId">

          <router-link :to="{ name: 'product-detail', params: { id: item.productId } }" class="cart-item-image-link" @click="$emit('close')">
            <img :src="item.image" :alt="item.name" class="cart-item-image" loading="lazy">
          </router-link>

          <div class="cart-item-details">
            <router-link :to="{ name: 'product-detail', params: { id: item.productId } }" class="cart-item-name-link" @click="$emit('close')">
              <span class="cart-item-name">{{ item.name }}</span>
            </router-link>

            <div v-if="item.attributes && Object.keys(item.attributes).length > 0" class="cart-item-attributes">
              <div v-for="(value, key) in item.attributes" :key="key" class="attribute">
                <span class="attribute-key">{{ capitalize(key) }}:</span> {{ value }}
              </div>
            </div>

            <span class="cart-item-price">{{ formatCurrency(item.price) }}</span>

            <div class="cart-item-quantity">
              <button class="quantity-btn minus"
                      :aria-label="`Decrease quantity of ${item.name}`"
                      @click="updateQuantity(item, -1)"
                      :disabled="item.quantity <= 1">
                -
              </button>
              <span class="quantity-display">{{ item.quantity }}</span>
              <button class="quantity-btn plus"
                      :aria-label="`Increase quantity of ${item.name}`"
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
                <button @click="confirmRemove(item)" class="confirm-btn-inline yes" aria-label="Confirm remove">Yes</button>
                <button @click="cancelRemove" class="confirm-btn-inline no" aria-label="Cancel remove">No</button>
              </div>
              <!-- Otherwise, show the standard remove button -->
              <button v-else
                      @click="requestRemoveItem(item)"
                      class="cart-item-remove"
                      :aria-label="`Remove ${item.name}`"
                      :key="'remove-' + getItemKey(item)">
                ×
              </button>
            </transition>
          </div>
          <!-- ** End Inline Confirmation Area ** -->

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
        <router-link to="/cart" class="button secondary-button" @click="$emit('close')">View Cart</router-link>
        <router-link to="/checkout" class="button primary-button" @click="$emit('close')">Checkout</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'; // Import ref
import { useRouter } from 'vue-router';

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

// --- State for inline confirmation ---
const itemPendingRemovalKey = ref(null); // Store the key of the item pending removal

// --- Helper to generate a unique key for an item ---
const getItemKey = (item) => {
    // Creates a stable string identifier based on product and attributes
    return `${item.productId}_${JSON.stringify(item.attributes || {})}`;
};

const formatCurrency = (amount) => `$${Number(amount).toFixed(2)}`;

const capitalize = (s) => {
  if (typeof s !== 'string' || !s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const updateQuantity = (item, change) => {
  itemPendingRemovalKey.value = null; // Cancel pending removal if quantity changes
  emit('update-quantity', {
    productId: item.productId,
    change: change,
    attributes: item.attributes || {}
  });
};

// --- MODIFIED: Request remove, doesn't remove immediately ---
const requestRemoveItem = (item) => {
  itemPendingRemovalKey.value = getItemKey(item); // Set the item key as pending
};

// --- NEW: Confirm remove ---
const confirmRemove = (item) => {
    if (itemPendingRemovalKey.value === getItemKey(item)) {
        emit('remove-item', {
            productId: item.productId,
            attributes: item.attributes || {}
        });
        itemPendingRemovalKey.value = null; // Clear pending state
    }
};

// --- NEW: Cancel remove ---
const cancelRemove = () => {
    itemPendingRemovalKey.value = null; // Clear pending state
};
// --- End Modifications ---

const handleKeydown = (event) => {
    if (event.key === 'Escape' && props.isActive) {
        emit('close');
    }
};

watch(() => props.isActive, (newValue) => {
    if (newValue) {
        document.addEventListener('keydown', handleKeydown);
        itemPendingRemovalKey.value = null; // Reset pending removal when popup opens/closes
    } else {
        document.removeEventListener('keydown', handleKeydown);
        itemPendingRemovalKey.value = null;
    }
});

</script>

<style scoped>
  /* ... (existing styles) ... */

  .cart-item-image-link,
  .cart-item-name-link {
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

  /* --- Styles for Inline Confirmation --- */
  .cart-item-remove-action {
    /* Position it similarly to the original remove button */
    margin-left: 0.5rem;
    align-self: center;
    position: relative; /* Needed for transition sizing */
    min-width: 40px; /* Ensure space */
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

  /* Make original remove button same size for transition */
  .cart-item-remove {
    min-width: 30px; /* Adjust as needed */
    min-height: 26px; /* Adjust based on confirm buttons */
    display: inline-flex; /* Use flex to center */
    align-items: center;
    justify-content: center;
  }

  /* Simple fade transition for the buttons */
  .fade-confirm-enter-active,
  .fade-confirm-leave-active {
    transition: opacity 0.2s ease;
  }

  .fade-confirm-enter-from,
  .fade-confirm-leave-to {
    opacity: 0;
  }
</style>
