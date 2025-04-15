<template>
  <main class="checkout-page">
    <!-- Page Header -->
    <section class="page-header enhanced-page-header checkout-view__header">
      <h1>{{ t('checkout.pageTitle') }}</h1>
      <p>{{ t('checkout.pageSubtitle') }}</p>
    </section>

    <!-- Main Content Area -->
    <section class="checkout-view__content">
      <transition name="fade" mode="out-in">
        <!-- Loading State -->
        <div v-if="loading" key="loading" class="loading-container checkout-view__loading">
          <div class="spinner"></div>
          <p>{{ t('checkout.loading') }}</p>
        </div>

        <!-- Error State -->
        <div v-else-if="loadError" key="error" class="message-container error-container checkout-view__error">
          <font-awesome-icon icon="exclamation-triangle" class="message-icon error-icon" />
          <h2>{{ t('checkout.error.title') }}</h2>
          <p>{{ loadError }}</p> <!-- Keep raw error message -->
          <router-link to="/products" class="button enhanced-button secondary">{{ t('checkout.error.backToProducts') }}</router-link>
        </div>

        <!-- Success State -->
        <div v-else-if="orderComplete" key="success" class="message-container success-container checkout-view__success">
          <font-awesome-icon icon="check-circle" class="message-icon success-icon" />
          <h2>{{ t('checkout.success.title') }}</h2>
          <p>{{ t('checkout.success.orderNumberLabel') }} <strong class="order-number">#{{ orderNumber }}</strong></p>
          <p>{{ t('checkout.success.thankYouMessage') }}</p>
          <div class="checkout-view__success-actions">
            <router-link :to="{ name: 'orders-history' }" class="button enhanced-button primary">
              {{ t('checkout.success.viewMyOrdersButton') }}
            </router-link>
            <router-link to="/products" class="button enhanced-button secondary">
              {{ t('checkout.success.continueShoppingButton') }}
            </router-link>
          </div>
        </div>

        <!-- Checkout Form & Summary -->
        <div v-else key="form" class="checkout-layout">

          <!-- Left Column: Shipping & Payment -->
          <div class="checkout-layout__form-column">
            <!-- Shipping Address Card -->
            <div class="order-card checkout-view__shipping-card">
              <div class="order-card__header">
                <h3>{{ t('checkout.shipping.title') }}</h3>
              </div>
              <form @submit.prevent="placeOrder" id="checkout-form">
                <div class="order-card__body">
                  <div class="form-group">
                    <label for="shippingAddress">{{ t('checkout.shipping.addressLabel') }}</label>
                    <textarea id="shippingAddress"
                              class="enhanced-textarea"
                              v-model="shippingAddress"
                              rows="4"
                              required
                              :placeholder="t('checkout.shipping.addressPlaceholder')"
                              aria-describedby="shipping-address-hint"></textarea>
                    <p id="shipping-address-hint" class="form-text">{{ t('checkout.shipping.addressHint') }}</p>
                  </div>
                </div>
                <!-- Form submit is handled by the button in the summary column -->
              </form>
            </div>

            <!-- Payment Information Card (Placeholder) -->
            <div class="order-card checkout-view__payment-card">
              <div class="order-card__header">
                <h3>{{ t('checkout.payment.title') }}</h3>
              </div>
              <div class="order-card__body">
                <div class="payment-placeholder">
                  <font-awesome-icon icon="credit-card" class="payment-icon" />
                  <p>{{ t('checkout.payment.placeholderText') }}</p>
                  <p class="payment-note">{{ t('checkout.payment.simulationNote') }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Order Summary -->
          <div class="checkout-layout__summary-column">
            <div class="order-card checkout-view__summary-card">
              <div class="order-card__header">
                <h3>{{ t('checkout.summary.title') }}</h3>
              </div>
              <div class="order-card__body checkout-view__summary-body">
                <div v-if="!cart.items || cart.items.length === 0" class="checkout-view__empty-cart">
                  <p>{{ t('checkout.summary.emptyCart') }}</p>
                  <router-link to="/products" class="button enhanced-button secondary">{{ t('checkout.summary.startShoppingButton') }}</router-link>
                </div>
                <div v-else class="checkout-view__items-list">
                  <!-- Items Loop (Item details are dynamic, no text changes here) -->
                  <div v-for="(item) in cart.items" :key="`${item.productId}-${JSON.stringify(item.attributes || {})}`" class="order-item">
                    <router-link :to="{ name: 'product-detail', params: { id: item.productId } }" class="order-item__image-link" tabindex="-1">
                      <img :src="item.image || placeholderImage" :alt="item.name" class="order-item__image">
                    </router-link>
                    <div class="order-item__details">
                      <router-link :to="{ name: 'product-detail', params: { id: item.productId } }" class="order-item__name">
                        {{ item.name }}
                      </router-link>
                      <div v-if="item.attributes && Object.keys(item.attributes).length > 0" class="order-item__attributes">
                        <span v-for="(value, key) in item.attributes" :key="key" class="order-item__attribute">
                          {{ capitalize(key) }}: {{ value }}
                        </span>
                      </div>
                      <div class="order-item__meta">
                        <span>{{ formatCurrency(item.price) }}</span>
                        <span>× {{ item.quantity }}</span>
                      </div>
                    </div>
                    <div class="order-item__subtotal">
                      {{ formatCurrency(item.price * item.quantity) }}
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="cart.items && cart.items.length > 0" class="order-card__footer checkout-view__summary-footer">
                <div class="checkout-totals">
                  <div class="total-row">
                    <span>{{ t('checkout.summary.subtotal') }}</span>
                    <span>{{ formatCurrency(subtotal) }}</span>
                  </div>
                  <div class="total-row">
                    <span>{{ t('checkout.summary.shipping') }}</span>
                    <span>{{ t('checkout.summary.shippingValue') }}</span>
                  </div>
                  <div class="total-row total">
                    <span>{{ t('checkout.summary.total') }}</span>
                    <strong>{{ formatCurrency(subtotal) }}</strong>
                  </div>
                </div>
                <div v-if="submitError" class="checkout-submit-error">
                  {{ submitError }} <!-- Keep raw error message -->
                </div>
                <button type="submit"
                        form="checkout-form"
                        class="button enhanced-button primary checkout-view__place-order-btn"
                        :disabled="isSubmitting || !cart.items || cart.items.length === 0">
                  <font-awesome-icon icon="spinner" spin v-if="isSubmitting" />
                  <font-awesome-icon icon="lock" v-else />
                  <span>{{ isSubmitting ? t('checkout.summary.processingButton') : t('checkout.summary.placeOrderButton') }}</span>
                </button>
              </div>
            </div>
          </div>

        </div> <!-- End checkout-layout -->
      </transition>
    </section>
  </main>
</template>

<script setup>
  import { ref, computed, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { useI18n } from 'vue-i18n'; // Import useI18n
  import cartService from '@/services/cartService';
  import orderService from '@/services/orderService';
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
  import { library } from '@fortawesome/fontawesome-svg-core';
  import {
    faExclamationTriangle, faCheckCircle, faCreditCard, faLock, faSpinner
  } from '@fortawesome/free-solid-svg-icons';

  // --- Get translation function ---
  const { t } = useI18n();

  library.add(faExclamationTriangle, faCheckCircle, faCreditCard, faLock, faSpinner);

  // --- State ---
  const loading = ref(true);
  const loadError = ref(null);
  const submitError = ref(null);
  const cart = ref({ items: [] });
  const shippingAddress = ref('');
  const isSubmitting = ref(false);
  const orderComplete = ref(false);
  const orderNumber = ref(null);
  const placeholderImage = `https://via.placeholder.com/100x100/cccccc/FFFFFF?text=N/A`;
  const router = useRouter();

  // --- Computed ---
  const subtotal = computed(() => {
    if (!cart.value || !cart.value.items) return 0;
    return cart.value.items.reduce((total, item) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 0;
      return total + (price * quantity);
    }, 0);
  });

  // --- Methods ---
  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '$--.--';
    return `$${Number(amount).toFixed(2)}`;
  };

  const capitalize = (s) => {
    if (typeof s !== 'string' || !s) return '';
    const formatted = s.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const loadCheckoutData = async () => {
    loading.value = true;
    loadError.value = null;
    try {
      const fetchedCart = await cartService.getCart(true);
      cart.value = fetchedCart || { items: [] };

      if (!cart.value.items || cart.value.items.length === 0) {
        console.warn("Cart is empty, proceeding to checkout page display.");
      }

      try {
        const response = await fetch('/api/users/check-login', { credentials: 'include' });
        if (response.ok) {
          const userData = await response.json();
          if (userData.isLoggedIn && userData.user?.shippingAddress) {
            shippingAddress.value = userData.user.shippingAddress;
          } else if (!userData.isLoggedIn) {
            // Use translated error message
            throw new Error(t('checkout.error.userSession'));
          }
        } else {
          console.warn("Could not fetch user data to prefill address.");
          // Optionally set a non-blocking warning message
        }
      } catch (userError) {
        console.error("Error fetching user data:", userError);
        // Display translated error from catch or a generic one
        loadError.value = userError.message || t('checkout.error.userSession');
        return;
      }

    } catch (error) {
      console.error('Checkout loading error:', error);
      // Use translated error message with interpolation
      loadError.value = t('checkout.error.loadData', { message: error.message || t('checkout.error.genericLoad') });
      cart.value = { items: [] };
    } finally {
      loading.value = false;
    }
  };

  const placeOrder = async () => {
    // Use translated validation messages
    if (!shippingAddress.value.trim()) {
      submitError.value = t('checkout.error.shippingRequired');
      document.getElementById('shippingAddress')?.focus();
      return;
    }
    if (!cart.value.items || cart.value.items.length === 0) {
      submitError.value = t('checkout.error.emptyCart');
      return;
    }

    isSubmitting.value = true;
    submitError.value = null;

    try {
      console.log('Placing order with address:', shippingAddress.value);
      const order = await orderService.createOrder(shippingAddress.value);
      console.log('Order created successfully:', order);

      orderComplete.value = true;
      orderNumber.value = order.orderNumber;

      await cartService.clearCart(true);

      // Use alert or a more sophisticated UI notification system
      // alert('Order placed successfully!'); // Keep if no UI library

      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
      console.error('Order placement error:', error);
      // Keep backend error if available, otherwise use translated generic error
      submitError.value = error.message || t('checkout.error.submitGeneric');
      // alert(`Order Error: ${submitError.value}`); // Keep if no UI library
    } finally {
      isSubmitting.value = false;
    }
  };

  // --- Lifecycle ---
  onMounted(() => {
    loadCheckoutData();
  });

</script>

<style scoped>
  /* Styles remain the same */
  /* --- Base & Layout --- */
  .checkout-page {
    padding-bottom: 6rem;
  }

  .checkout-view__header {
    padding-top: calc(var(--header-height) + 2rem);
    padding-bottom: 2.5rem;
    text-align: center;
  }

  .checkout-view__content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1.5rem 4%;
  }
  /* --- Loading/Error/Success/Empty States --- */
  .checkout-view__loading, .checkout-view__error, .checkout-view__success, .checkout-view__empty-cart {
    min-height: 40vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 2rem;
    background-color: var(--bg-light);
    border-radius: var(--border-radius);
  }

  .checkout-view__empty-cart {
    min-height: 15vh;
    padding: 1rem;
    background-color: transparent;
  }

  .checkout-view__loading .spinner::after {
    content: '';
    width: 40px;
    height: 40px;
    border: 4px solid var(--accent);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    display: block;
    margin: 0 auto 1.5rem;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .checkout-view__error .button, .checkout-view__success-actions .button {
    margin: 1.5rem 0.5rem 0;
  }

  .checkout-view__success .message-icon {
    font-size: 3.5rem;
    color: #2ecc71;
    margin-bottom: 1rem;
  }

  .checkout-view__success h2 {
    color: var(--text-dark);
    margin-bottom: 0.5rem;
  }

  .checkout-view__success p {
    color: var(--text-muted);
    margin-bottom: 0.5rem;
    line-height: 1.6;
  }

  .checkout-view__success .order-number {
    color: var(--primary);
    font-weight: 600;
  }
  /* --- Checkout Layout Grid --- */
  .checkout-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  @media (min-width: 992px) {
    .checkout-layout {
      grid-template-columns: 1fr minmax(320px, 400px);
      gap: 2.5rem;
      align-items: flex-start;
    }

    .checkout-layout__summary-column {
      position: sticky;
      top: calc(var(--header-height) + 1.5rem);
    }
  }
  /* --- Reusable Card Styles --- */
  .order-card {
    background-color: var(--white);
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-soft);
    border: 1px solid var(--border-color);
    overflow: hidden;
    margin-bottom: 1.5rem;
  }

  .order-card__header {
    padding: 1rem 1.5rem;
    background-color: var(--bg-off-light);
    border-bottom: 1px solid var(--border-color);
  }

    .order-card__header h3 {
      font-size: 1.2rem;
      font-weight: 600;
      margin: 0;
      color: var(--text-dark);
    }

  .order-card__body {
    padding: 1.5rem;
  }

  .order-card__footer {
    padding: 1rem 1.5rem;
    background-color: var(--bg-off-light);
    border-top: 1px solid var(--border-color);
  }
  /* --- Form Styles --- */
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-dark);
  }

  .form-text {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin-top: 0.5rem;
  }
  /* --- Payment Placeholder --- */
  .payment-placeholder {
    text-align: center;
    padding: 2rem 1rem;
    color: var(--text-muted);
    border: 2px dashed var(--border-color);
    border-radius: var(--border-radius-small);
    background-color: var(--bg-light);
  }

  .payment-icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    opacity: 0.6;
  }

  .payment-placeholder p {
    font-size: 0.95rem;
    margin-bottom: 0.5rem;
  }

  .payment-note {
    font-size: 0.8rem;
    font-style: italic;
  }
  /* --- Order Summary --- */
  .checkout-view__summary-card .order-card__body {
    padding: 0;
  }

  .checkout-view__items-list {
    max-height: 40vh;
    overflow-y: auto;
    border-bottom: 1px solid var(--border-color);
  }

  .order-item {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--border-color);
    background-color: var(--white);
  }

    .order-item:last-child {
      border-bottom: none;
    }

  .order-item__image-link {
    flex-shrink: 0;
  }

  .order-item__image {
    display: block;
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: var(--border-radius-small);
    border: 1px solid var(--border-color);
  }

  .order-item__details {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .order-item__name {
    font-weight: 600;
    color: var(--text-dark);
    text-decoration: none;
    font-size: 0.9rem;
    transition: color var(--transition-fast);
  }

    .order-item__name:hover {
      color: var(--primary);
    }

  .order-item__attributes {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .order-item__meta {
    font-size: 0.8rem;
    color: var(--text-muted);
    display: flex;
    gap: 0.75rem;
  }

  .order-item__subtotal {
    text-align: right;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-dark);
    margin-left: auto;
    flex-shrink: 0;
  }

  .checkout-totals {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    margin-bottom: 1.5rem;
  }

  .total-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.95rem;
    color: var(--text-muted);
  }

    .total-row.total {
      margin-top: 0.5rem;
      padding-top: 0.8rem;
      border-top: 1px solid var(--border-color);
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-dark);
    }

      .total-row.total strong {
        color: var(--primary);
        font-size: 1.2rem;
      }

  .checkout-submit-error {
    color: var(--secondary);
    font-size: 0.85rem;
    text-align: center;
    margin-bottom: 1rem;
    font-weight: 500;
  }

  .checkout-view__place-order-btn {
    width: 100%;
    padding-top: 0.9rem;
    padding-bottom: 0.9rem;
    font-size: 1rem;
  }

    .checkout-view__place-order-btn svg {
      margin-right: 0.6em;
    }
  /* --- Responsive --- */
  @media (max-width: 768px) {
    .checkout-view__content {
      padding: 1.5rem 3%;
    }

    .order-card__header, .order-card__footer, .order-card__body {
      padding: 1rem;
    }

    .order-item {
      padding: 0.8rem 1rem;
    }

    .order-item__image {
      width: 50px;
      height: 50px;
    }

    .checkout-layout__summary-column {
      position: static;
      top: auto;
    }
  }
</style>
