<template>
  <div id="cart-popup-overlay" class="popup-overlay" :class="{ active: isActive }" @click="$emit('close')"></div>
  <div id="cart-popup" :class="{ active: isActive }" role="dialog" aria-modal="true" aria-labelledby="cart-popup-title">
    <div class="popup-header">
      <h2 id="cart-popup-title">{{ t('cartPopup.title') }}</h2>
      <button class="popup-close-btn" id="cart-popup-close" :aria-label="t('cartPopup.closeAriaLabel')" @click="$emit('close')">×</button>
    </div>

    <div class="cart-items-container">
      <!-- Check if cartItems is defined and has items -->
      <div v-if="cartItems && cartItems.length > 0">
        <div v-for="item in cartItems"
             :key="getItemKey(item)"
             class="cart-item"
             :data-product-id="item.productId">

          <router-link :to="{ name: 'product-detail', params: { id: item.productId } }" class="cart-item-image-link" @click="$emit('close')">
            <!-- Display item.image; item.name is dynamic -->
            <img :src="item.image" :alt="item.name" class="cart-item-image" loading="lazy">
          </router-link>

          <div class="cart-item-details">
            <router-link :to="{ name: 'product-detail', params: { id: item.productId } }" class="cart-item-name-link" @click="$emit('close')">
              <!-- Display item.name; already translated when added -->
              <span class="cart-item-name">{{ item.name }}</span>
            </router-link>

            <!-- Display item.attributes; already translated when added -->
            <div v-if="item.attributes && Object.keys(item.attributes).length > 0" class="cart-item-attributes">
              <div v-for="(value, key) in item.attributes" :key="key" class="attribute">
                <span class="attribute-key">{{ capitalize(key) }}:</span> {{ value }}
              </div>
            </div>

            <!-- Display item.price; price is language-independent -->
            <span class="cart-item-price">{{ formatCurrency(item.price) }}</span>

            <!-- Quantity Controls -->
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

          <!-- Inline Confirmation Area for Removal -->
          <div class="cart-item-remove-action">
            <transition name="fade-confirm" mode="out-in">
              <div v-if="itemPendingRemovalKey === getItemKey(item)" class="confirm-remove-controls" :key="'confirm-' + getItemKey(item)">
                <button @click="confirmRemove(item)" class="confirm-btn-inline yes" :aria-label="t('cartPopup.item.confirmRemoveAriaLabel')">{{ t('cartPopup.item.confirmRemoveYes') }}</button>
                <button @click="cancelRemove" class="confirm-btn-inline no" :aria-label="t('cartPopup.item.cancelRemoveAriaLabel')">{{ t('cartPopup.item.confirmRemoveNo') }}</button>
              </div>
              <button v-else
                      @click="requestRemoveItem(item)"
                      class="cart-item-remove"
                      :aria-label="t('cartPopup.item.removeAriaLabel', { name: item.name })"
                      :key="'remove-' + getItemKey(item)">
                ×
              </button>
            </transition>
          </div>
          <!-- End Inline Confirmation Area -->

        </div>
      </div>
      <!-- Empty Cart Message -->
      <p v-else class="cart-empty-message">{{ t('cartPopup.emptyMessage') }}</p>
    </div>

    <!-- Cart Summary (only if items exist) -->
    <div class="cart-summary" v-if="cartItems && cartItems.length > 0">
      <div class="cart-subtotal">
        <span>{{ t('cartPopup.summary.subtotal') }}</span>
        <strong id="cart-subtotal-value">{{ formatCurrency(subtotal) }}</strong>
      </div>
      <div class="cart-actions">
        <!-- ======== MODIFIED SECTION START ======== -->
        <!-- If Logged In: Show Checkout Link -->
        <router-link v-if="isUserLoggedIn"
                     to="/checkout"
                     class="button primary-button checkout-btn"
                     @click="$emit('close')">
          {{ t('cartPopup.summary.checkout') }}
        </router-link>
        <!-- If Logged Out: Show Login Button -->
        <button v-else
                @click="handleLoginForCheckout"
                class="button primary-button login-required-btn">
          <!-- Optional: Add lock icon -->
          <font-awesome-icon icon="lock" class="button-icon" />
          {{ t('cartPopup.summary.loginToCheckout') }}
        </button>
        <!-- ======== MODIFIED SECTION END ======== -->
      </div>
    </div>
  </div>
</template>

<script setup>
  // --- Import `inject` and `computed` ---
  import { ref, watch, inject, computed } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useRouter } from 'vue-router';
  // --- Make sure FontAwesomeIcon is imported if you add the icon ---
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
  // --- Ensure 'lock' icon is added in main.js or locally ---

  // Get translation function
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

  // --- Inject App Context ---
  const appContext = inject('appContext', {
    isLoggedIn: ref(false), // Default state if not provided
    openAccountPopup: () => console.warn('openAccountPopup called before appContext provided')
  });

  // --- Computed property for login state ---
  const isUserLoggedIn = computed(() => appContext?.isLoggedIn?.value ?? false);

  const MAX_QUANTITY = 99;
  const itemPendingRemovalKey = ref(null);

  // Generates a unique key for v-for based on product ID and attributes
  const getItemKey = (item) => {
    const attrString = JSON.stringify(item.attributes && typeof item.attributes === 'object' ? item.attributes : {});
    return `${item.productId}_${attrString}`;
  };

  // Formats currency
  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });
  const formatCurrency = (amount) => {
    return currencyFormatter.format(Number(amount) || 0);
  }

  // Capitalizes the first letter
  const capitalize = (s) => {
    if (typeof s !== 'string' || !s) return '';
    const formatted = s.replace(/([-_][a-z])/ig, ($1) => $1.toUpperCase().replace('-', '').replace('_', ' '));
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  // Emits event to update quantity
  const updateQuantity = (item, change) => {
    itemPendingRemovalKey.value = null;
    emit('update-quantity', {
      productId: item.productId,
      change: change,
      attributes: item.attributes || {}
    });
  };

  // Sets the item key pending removal
  const requestRemoveItem = (item) => {
    itemPendingRemovalKey.value = getItemKey(item);
  };

  // Emits event to remove item
  const confirmRemove = (item) => {
    if (itemPendingRemovalKey.value === getItemKey(item)) {
      emit('remove-item', {
        productId: item.productId,
        attributes: item.attributes || {}
      });
      itemPendingRemovalKey.value = null;
    }
  };

  // Cancels removal request
  const cancelRemove = () => {
    itemPendingRemovalKey.value = null;
  };

  // --- Function to handle clicking the "Log in to Checkout" button ---
  const handleLoginForCheckout = () => {
    console.log("Login required for checkout. Opening account popup.");
    appContext?.openAccountPopup?.('login'); // Request login view
    if (!appContext?.openAccountPopup) {
      console.warn("App Context or openAccountPopup method not available.");
    }
    emit('close'); // Close the cart popup
  };
  // --- End new function ---

  // Handles Escape key press
  const handleKeydown = (event) => {
    if (event.key === 'Escape' && props.isActive) {
      emit('close');
    }
  };

  // Adds/removes Escape key listener
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
  /* Scoped styles specific to CartPopup */
  .cart-item-image-link, .cart-item-name-link {
    color: inherit;
    text-decoration: none;
    display: contents; /* Allows clicks to pass through */
  }

  .cart-item-image {
    display: block; /* Prevent extra space below image */
    width: 60px; /* Slightly smaller image */
    height: 60px;
    object-fit: cover;
    border-radius: var(--border-radius-small);
    border: 1px solid var(--border-color);
  }

  .cart-item-name-link .cart-item-name {
    transition: color 0.2s ease;
    font-weight: 600;
    font-size: 0.9rem; /* Slightly smaller name */
    line-height: 1.3;
    margin-bottom: 0.2rem;
  }

  .cart-item-name-link:hover .cart-item-name {
    color: var(--primary);
  }

  .cart-item-attributes {
    font-size: 0.75rem; /* Smaller attribute text */
    color: var(--text-muted);
    margin-top: 0.1rem;
    margin-bottom: 0.4rem;
    line-height: 1.3;
  }

  .attribute {
    display: block; /* Each attribute on new line */
  }

  .attribute-key {
    font-weight: 500; /* Slightly less bold */
    margin-right: 0.3em;
    color: var(--text-dark); /* Darker key */
  }

  .cart-item-price {
    font-size: 0.9rem;
    color: var(--primary);
    margin-bottom: 0.5rem;
    display: block;
  }

  .cart-actions {
    margin-top: 1rem; /* Added margin for separation */
    display: flex; /* Use flex for single button alignment */
    justify-content: center; /* Center the button */
  }

    /* Ensure both buttons take full width within actions */
    .cart-actions .button {
      flex-grow: 1;
      text-align: center;
      display: inline-flex; /* Aligns icon and text */
      align-items: center;
      justify-content: center;
      gap: 0.5em; /* Space between icon and text */
    }

  .quantity-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .cart-item-remove-action {
    margin-left: 0.5rem;
    align-self: center;
    position: relative; /* For transition positioning */
    min-width: 40px; /* Ensure space for buttons */
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
    line-height: 1.2; /* Adjust line height */
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

  /* Ensure original remove button has min dimensions */
  .cart-item-remove {
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 1.2rem;
    line-height: 1;
    padding: 0.2rem;
    transition: color var(--transition-fast);
    min-width: 30px; /* Minimum clickable area */
    min-height: 26px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

    .cart-item-remove:hover {
      color: var(--secondary);
    }


  /* Transition for confirmation buttons */
  .fade-confirm-enter-active, .fade-confirm-leave-active {
    transition: opacity 0.2s ease;
  }

  .fade-confirm-enter-from, .fade-confirm-leave-to {
    opacity: 0;
  }

  /* Global Styles (already in main.css) */
  /* .popup-overlay, .popup-header, #cart-popup, etc. */

  /* Ensure quantity display looks okay */
  .quantity-display {
    min-width: 25px; /* Ensure space for number */
    padding: 0 0.4rem; /* Adjust padding */
    font-size: 0.9rem;
    font-weight: 600;
    text-align: center;
  }

  .quantity-btn {
    padding: 0.3rem 0.6rem; /* Adjust padding */
    font-size: 1rem; /* Adjust size */
  }

  /* Optional: Style for the icon if added */
  .button-icon {
    font-size: 0.9em; /* Adjust icon size relative to text */
    /* margin-right: 0.5em; /* Use gap in flex instead */
  }
</style>
