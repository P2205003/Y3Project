// src/views/CheckoutView.vue
<template>
  <main class="checkout-page">
    <!-- Page Header -->
    <section class="page-header enhanced-page-header checkout-view__header">
      <h1>Checkout</h1>
      <p>Review your order and provide shipping details.</p>
    </section>

    <!-- Main Content Area -->
    <section class="checkout-view__content">
      <transition name="fade" mode="out-in">
        <!-- Loading State -->
        <div v-if="loading" key="loading" class="loading-container checkout-view__loading">
          <div class="spinner"></div>
          <p>Preparing your checkout...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="loadError" key="error" class="message-container error-container checkout-view__error">
          <font-awesome-icon icon="exclamation-triangle" class="message-icon error-icon" />
          <h2>Checkout Unavailable</h2>
          <p>{{ loadError }}</p>
          <router-link to="/products" class="button enhanced-button secondary">Back to Products</router-link>
        </div>

        <!-- Success State -->
        <div v-else-if="orderComplete" key="success" class="message-container success-container checkout-view__success">
          <font-awesome-icon icon="check-circle" class="message-icon success-icon" />
          <h2>Order Placed Successfully!</h2>
          <p>Your order number is: <strong class="order-number">#{{ orderNumber }}</strong></p>
          <p>Thank you for your purchase. We'll process your order shortly.</p>
          <div class="checkout-view__success-actions">
            <router-link :to="{ name: 'orders-history' }" class="button enhanced-button primary">
              View My Orders
            </router-link>
            <router-link to="/products" class="button enhanced-button secondary">
              Continue Shopping
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
                <h3>Shipping Information</h3>
              </div>
              <form @submit.prevent="placeOrder" id="checkout-form">
                <div class="order-card__body">
                  <div class="form-group">
                    <label for="shippingAddress">Full Shipping Address</label>
                    <textarea id="shippingAddress"
                              class="enhanced-textarea"
                              v-model="shippingAddress"
                              rows="4"
                              required
                              placeholder="Enter your street address, city, state, and zip code"
                              aria-describedby="shipping-address-hint"></textarea>
                    <p id="shipping-address-hint" class="form-text">Please provide the complete address for delivery.</p>
                  </div>
                </div>
                <!-- Form submit is handled by the button in the summary column -->
              </form>
            </div>

            <!-- Payment Information Card (Placeholder) -->
            <div class="order-card checkout-view__payment-card">
              <div class="order-card__header">
                <h3>Payment Details</h3>
              </div>
              <div class="order-card__body">
                <div class="payment-placeholder">
                  <font-awesome-icon icon="credit-card" class="payment-icon" />
                  <p>Secure payment processing will be integrated here.</p>
                  <p class="payment-note">(Currently simulates successful payment on order placement)</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Order Summary -->
          <div class="checkout-layout__summary-column">
            <div class="order-card checkout-view__summary-card">
              <div class="order-card__header">
                <h3>Order Summary</h3>
              </div>
              <div class="order-card__body checkout-view__summary-body">
                <div v-if="!cart.items || cart.items.length === 0" class="checkout-view__empty-cart">
                  <p>Your cart is empty.</p>
                  <router-link to="/products" class="button enhanced-button secondary">Start Shopping</router-link>
                </div>
                <div v-else class="checkout-view__items-list">
                  <!-- Reuse order-item styles from OrderDetailView -->
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
                    <span>Subtotal</span>
                    <span>{{ formatCurrency(subtotal) }}</span>
                  </div>
                  <div class="total-row">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <div class="total-row total">
                    <span>Total</span>
                    <strong>{{ formatCurrency(subtotal) }}</strong>
                  </div>
                </div>
                <div v-if="submitError" class="checkout-submit-error">
                  {{ submitError }}
                </div>
                <button type="submit"
                        form="checkout-form"
                        class="button enhanced-button primary checkout-view__place-order-btn"
                        :disabled="isSubmitting || !cart.items || cart.items.length === 0">
                  <font-awesome-icon icon="spinner" spin v-if="isSubmitting" />
                  <font-awesome-icon icon="lock" v-else />
                  <span>{{ isSubmitting ? 'Processing...' : 'Place Secure Order' }}</span>
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
import cartService from '@/services/cartService';
import orderService from '@/services/orderService';
// Assuming Element Plus is not installed/used based on request, using simple alerts or refs for errors
// import { ElMessage } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faExclamationTriangle, faCheckCircle, faCreditCard, faLock, faSpinner
} from '@fortawesome/free-solid-svg-icons';

library.add(faExclamationTriangle, faCheckCircle, faCreditCard, faLock, faSpinner);

// --- State ---
const loading = ref(true);
const loadError = ref(null); // Error during initial load
const submitError = ref(null); // Error during order submission
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
    // Ensure price and quantity are numbers
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
    // Handle camelCase or snake_case slightly better
    const formatted = s.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

const loadCheckoutData = async () => {
  loading.value = true;
  loadError.value = null;
  try {
    // Fetch cart data (assuming user must be logged in, handled by route guard)
    const fetchedCart = await cartService.getCart(true); // Pass true for logged-in user
    cart.value = fetchedCart || { items: [] }; // Ensure cart is an object

    if (!cart.value.items || cart.value.items.length === 0) {
      // Don't set loadError, let the template handle empty cart message
      console.warn("Cart is empty, proceeding to checkout page display.");
    }

    // Fetch user data to pre-fill shipping address if available
    // Note: Assumes user is logged in due to route guard.
    // A more robust solution might involve a dedicated user store/service.
    try {
        const response = await fetch('/api/users/check-login', { credentials: 'include' });
        if (response.ok) {
            const userData = await response.json();
            if (userData.isLoggedIn && userData.user?.shippingAddress) {
                shippingAddress.value = userData.user.shippingAddress;
            } else if (!userData.isLoggedIn) {
                // This case should ideally be caught by the route guard, but handle defensively
                throw new Error("User is not logged in.");
            }
        } else {
            console.warn("Could not fetch user data to prefill address.");
        }
    } catch (userError) {
        // If user check fails or not logged in (guard missed?), redirect or show error
        console.error("Error fetching user data:", userError);
        loadError.value = "Could not verify user session. Please log in again.";
        // Optionally redirect: router.push('/login');
        return; // Stop further execution if user data fails critically
    }

  } catch (error) {
    console.error('Checkout loading error:', error);
    loadError.value = `Failed to load checkout data: ${error.message || 'Please try again.'}`;
    cart.value = { items: [] }; // Ensure cart is reset on error
  } finally {
    loading.value = false;
  }
};

const placeOrder = async () => {
  // Basic validation
  if (!shippingAddress.value.trim()) {
    submitError.value = 'Please enter your full shipping address.';
    // Focus the textarea
    document.getElementById('shippingAddress')?.focus();
    return;
  }
  if (!cart.value.items || cart.value.items.length === 0) {
    submitError.value = 'Your cart is empty. Cannot place order.';
    return;
  }

  isSubmitting.value = true;
  submitError.value = null; // Clear previous errors

  try {
    console.log('Placing order with address:', shippingAddress.value);
    const order = await orderService.createOrder(shippingAddress.value);
    console.log('Order created successfully:', order);

    // Order success state
    orderComplete.value = true;
    orderNumber.value = order.orderNumber;

    // IMPORTANT: Clear the cart via the service AFTER successful order creation
    // The service should handle both API and local storage if needed,
    // but for logged-in users, it primarily hits the API.
    await cartService.clearCart(true); // Pass true for logged-in user

    // Use a simple alert or console log as Element Plus is not used
    // ElMessage.success('Order placed successfully!');
    alert('Order placed successfully!'); // Replace with a better UI notification if possible

    // Scroll to top to show success message
    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch (error) {
    console.error('Order placement error:', error);
    submitError.value = error.message || 'Failed to place your order. Please check your details and try again.';
    // ElMessage.error(submitError.value);
    alert(`Order Error: ${submitError.value}`); // Replace with a better UI notification
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
  /* --- Base & Layout --- */
  .checkout-page {
    padding-bottom: 6rem;
  }

  .checkout-view__header {
    padding-top: calc(var(--header-height) + 2rem); /* Adjust as needed */
    padding-bottom: 2.5rem;
    text-align: center;
  }

  .checkout-view__content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1.5rem 4%;
  }

  /* --- Loading/Error/Success/Empty States --- */
  .checkout-view__loading,
  .checkout-view__error,
  .checkout-view__success,
  .checkout-view__empty-cart {
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


  .checkout-view__loading .spinner::after { /* Reuse spinner style */
    content: '';
    width: 40px;
    height: 40px;
    border: 4px solid var(--accent);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    display: block;
    margin: 0 auto 1.5rem; /* Center spinner */
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .checkout-view__error .button,
  .checkout-view__success-actions .button {
    margin: 1.5rem 0.5rem 0;
  }

  .checkout-view__success .message-icon {
    font-size: 3.5rem;
    color: #2ecc71; /* Success green */
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
    grid-template-columns: 1fr; /* Default stack */
    gap: 2rem;
  }

  @media (min-width: 992px) {
    .checkout-layout {
      grid-template-columns: 1fr minmax(320px, 400px); /* Form | Summary */
      gap: 2.5rem;
      align-items: flex-start; /* Align tops */
    }

    .checkout-layout__summary-column {
      position: sticky; /* Make summary sticky */
      top: calc(var(--header-height) + 1.5rem); /* Adjust top offset */
    }
  }

  /* --- Reusable Card Styles (from main.css via OrderDetailView) --- */
  .order-card {
    background-color: var(--white);
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-soft);
    border: 1px solid var(--border-color);
    overflow: hidden;
    margin-bottom: 1.5rem; /* Space between cards in the same column */
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
  /* .form-group and .enhanced-textarea are defined in main.css */
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-dark);
  }

  .form-text { /* Hint text */
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
    padding: 0; /* Remove body padding, items list will handle it */
  }

  .checkout-view__items-list {
    max-height: 40vh; /* Limit height and allow scroll */
    overflow-y: auto;
    border-bottom: 1px solid var(--border-color);
  }
  /* Reuse item styles from OrderDetailView (already in main.css potentially) */
  .order-item {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--border-color);
    background-color: var(--white); /* Ensure background */
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

  .order-item__attribute { /* Style each attribute line if needed */
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
    margin-bottom: 1.5rem; /* Space before button */
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
    width: 100%; /* Make button full width */
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
    /* Unset sticky */
  }
</style>
