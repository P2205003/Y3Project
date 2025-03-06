<template>
  <div class="checkout-page">
    <h1>Checkout</h1>

    <!-- Loading state -->
    <div v-if="loading" class="loading-container">
      <div class="loader"></div>
      <p>Preparing your order...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-container">
      <h2>There was a problem</h2>
      <p>{{ error }}</p>
      <router-link to="/shopping-cart" class="btn-secondary">
        Return to Cart
      </router-link>
    </div>

    <!-- Success state -->
    <div v-else-if="orderComplete" class="success-container">
      <div class="success-icon">✓</div>
      <h2>Order Placed Successfully!</h2>
      <p>Your order number is: <strong>{{ orderNumber }}</strong></p>
      <p>We'll process your order as soon as possible.</p>
      <div class="checkout-actions">
        <router-link :to="{ name: 'OrdersHistory' }" class="btn-primary">
          View My Orders
        </router-link>
        <router-link to="/" class="btn-secondary">
          Continue Shopping
        </router-link>
      </div>
    </div>

    <!-- Checkout form -->
    <div v-else class="checkout-container">
      <div class="checkout-summary">
        <h2>Order Summary</h2>
        <div v-if="!cart.items.length" class="empty-cart">
          <p>Your cart is empty.</p>
          <router-link to="/" class="btn-primary">
            Return to Shop
          </router-link>
        </div>
        <div v-else>
          <!-- Cart items summary -->
          <div class="summary-items">
            <div v-for="(item, index) in cart.items" :key="index" class="summary-item">
              <div class="item-image">
                <img :src="item.image || placeholderImage" :alt="item.name">
              </div>
              <div class="item-details">
                <div class="item-name">{{ item.name }}</div>
                <div class="item-meta">
                  <span class="quantity">Qty: {{ item.quantity }}</span>
                  <span class="price">${{ (item.price * item.quantity).toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Order totals -->
          <div class="order-totals">
            <div class="total-row">
              <span>Subtotal</span>
              <span>${{ subtotal.toFixed(2) }}</span>
            </div>
            <div class="total-row">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div class="total-row total">
              <span>Total</span>
              <span>${{ subtotal.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="checkout-form">
        <h2>Shipping Information</h2>
        <form @submit.prevent="placeOrder">
          <div class="form-group">
            <label for="shippingAddress">Shipping Address</label>
            <textarea id="shippingAddress"
                      v-model="shippingAddress"
                      rows="4"
                      required></textarea>
          </div>

          <div v-if="checkoutError" class="checkout-error">
            {{ checkoutError }}
          </div>

          <div class="checkout-actions">
            <button type="submit"
                    class="btn-primary"
                    :disabled="isSubmitting || !cart.items.length">
              <span v-if="isSubmitting">Processing...</span>
              <span v-else>Place Order</span>
            </button>
            <router-link to="/shopping-cart" class="btn-secondary">
              Return to Cart
            </router-link>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import cartService from '@/services/cartService';
import orderService from '@/services/orderService';
import { ElMessage } from 'element-plus';

export default {
  name: 'Checkout',
  data() {
    return {
      loading: true,
      error: null,
      checkoutError: null,
      cart: { items: [] },
      shippingAddress: '',
      isSubmitting: false,
      orderComplete: false,
      orderNumber: null,
      placeholderImage: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22200%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20200%20200%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_1a3f85814e0%20text%20%7B%20fill%3A%23AAAAAA%3Bfont-weight%3Abold%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A10pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_1a3f85814e0%22%3E%3Crect%20width%3D%22200%22%20height%3D%22200%22%20fill%3D%22%23EEEEEE%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2274.5%22%20y%3D%22104.8%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E'
    };
  },
  computed: {
    subtotal() {
      return this.cart.items.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);
    }
  },
  inject: ['appContext'], // Get access to global app context
  async created() {
    // Redirect to login if not logged in
    if (!this.appContext.isLoggedIn) {
      ElMessage.warning('You must be logged in to checkout');
      this.$router.push('/login');
      return;
    }

    try {
      // Load cart data
      this.cart = await cartService.getCart(true);

      // Check if cart is empty
      if (!this.cart.items.length) {
        this.error = 'Your cart is empty. Please add items before checkout.';
      }

      // Get user data for pre-filling shipping address
      const response = await fetch('/api/users/check-login', {
        credentials: 'include'
      });

      if (response.ok) {
        const userData = await response.json();
        if (userData.user && userData.user.shippingAddress) {
          this.shippingAddress = userData.user.shippingAddress;
        }
      }
    } catch (error) {
      this.error = 'Failed to load checkout data. Please try again.';
      console.error('Checkout error:', error);
    } finally {
      this.loading = false;
    }
  },
  methods: {
    async placeOrder() {
      if (!this.shippingAddress.trim()) {
        this.checkoutError = 'Please enter your shipping address';
        return;
      }

      if (!this.cart.items.length) {
        this.checkoutError = 'Your cart is empty';
        return;
      }

      this.isSubmitting = true;
      this.checkoutError = null;

      try {
        const order = await orderService.createOrder();
        this.orderComplete = true;
        this.orderNumber = order.orderNumber;

        // Update the cart in the UI
        cartService.notifyCartUpdated();

        ElMessage.success('Order placed successfully!');
      } catch (error) {
        this.checkoutError = error.message || 'Failed to place your order. Please try again.';
        console.error('Order placement error:', error);
      } finally {
        this.isSubmitting = false;
      }
    }
  }
};
</script>

<style scoped>
  .checkout-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }

  h1 {
    text-align: center;
    margin-bottom: 2rem;
    color: #333;
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
  }

  .loader {
    border: 5px solid #f3f3f3;
    border-top: 5px solid #5D5CDE;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }

  .error-container, .success-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
    border-radius: 8px;
    text-align: center;
  }

  .error-container {
    background-color: #fff5f5;
    border: 1px solid #f5c6cb;
  }

  .success-container {
    background-color: #f0fff4;
    border: 1px solid #c3e6cb;
  }

  .success-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 60px;
    background-color: #48bb78;
    color: white;
    font-size: 2rem;
    border-radius: 50%;
    margin-bottom: 1rem;
  }

  .checkout-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }

  .checkout-summary, .checkout-form {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  h2 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid #eee;
    padding-bottom: 0.75rem;
    color: #333;
  }

  .summary-items {
    max-height: 400px;
    overflow-y: auto;
    margin-bottom: 1.5rem;
  }

  .summary-item {
    display: flex;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #f0f0f0;
  }

    .summary-item:last-child {
      border-bottom: none;
    }

  .item-image {
    width: 60px;
    height: 60px;
    margin-right: 1rem;
  }

    .item-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 4px;
    }

  .item-details {
    flex: 1;
  }

  .item-name {
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .item-meta {
    display: flex;
    justify-content: space-between;
    color: #666;
    font-size: 0.9rem;
  }

  .order-totals {
    margin-top: 1rem;
  }

  .total-row {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
  }

    .total-row.total {
      border-top: 1px solid #eee;
      margin-top: 0.5rem;
      padding-top: 1rem;
      font-weight: 600;
      font-size: 1.1rem;
      color: #333;
    }

  .form-group {
    margin-bottom: 1.5rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #333;
  }

  textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    resize: vertical;
    font-size: 1rem;
    font-family: inherit;
  }

    textarea:focus {
      outline: none;
      border-color: #5D5CDE;
      box-shadow: 0 0 0 2px rgba(93,92,222,0.2);
    }

  .checkout-error {
    background-color: #fff5f5;
    border: 1px solid #f5c6cb;
    color: #d32f2f;
    padding: 0.75rem;
    border-radius: 4px;
    margin-bottom: 1.5rem;
  }

  .checkout-actions {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
  }

  .btn-primary, .btn-secondary {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    font-weight: 600;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
  }

  .btn-primary {
    background-color: #5D5CDE;
    color: white;
    border: none;
  }

    .btn-primary:hover:not(:disabled) {
      background-color: #4a49b8;
    }

    .btn-primary:disabled {
      background-color: #9998e8;
      cursor: not-allowed;
    }

  .btn-secondary {
    background-color: white;
    color: #5D5CDE;
    border: 1px solid #5D5CDE;
  }

    .btn-secondary:hover {
      background-color: #f5f5ff;
    }

  .empty-cart {
    text-align: center;
    padding: 2rem 0;
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .checkout-container {
      grid-template-columns: 1fr;
    }

    .checkout-summary {
      order: 2;
    }

    .checkout-form {
      order: 1;
    }

    .checkout-actions {
      flex-direction: column;
    }

    .btn-primary, .btn-secondary {
      width: 100%;
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .checkout-page {
      color: #e0e0e0;
    }

    h1, h2 {
      color: #e0e0e0;
    }

    .checkout-summary, .checkout-form {
      background-color: #1e1e1e;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }

    h2 {
      border-bottom-color: #333;
    }

    .summary-item {
      border-bottom-color: #333;
    }

    .total-row.total {
      border-top-color: #333;
      color: #e0e0e0;
    }

    label {
      color: #e0e0e0;
    }

    textarea {
      background-color: #333;
      border-color: #444;
      color: #e0e0e0;
    }

      textarea:focus {
        border-color: #5D5CDE;
        box-shadow: 0 0 0 2px rgba(93,92,222,0.3);
      }

    .error-container {
      background-color: #2c1515;
      border-color: #5c3131;
    }

    .success-container {
      background-color: #0f2712;
      border-color: #1e4a28;
    }

    .checkout-error {
      background-color: #2c1515;
      border-color: #5c3131;
    }

    .btn-secondary {
      background-color: #1e1e1e;
    }

      .btn-secondary:hover {
        background-color: #2a2a2a;
      }
  }
</style>
