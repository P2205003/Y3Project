<template>
  <div class="shopping-cart">
    <h1>Shopping Cart</h1>

    <!-- Loading state -->
    <div v-if="loading" class="cart-loading">
      <div class="loader"></div>
      <p>Loading your cart...</p>
    </div>

    <!-- Empty cart message -->
    <div v-else-if="!cart.items.length" class="empty-cart">
      <div class="empty-cart-icon">🛒</div>
      <h2>Your shopping cart is empty</h2>
      <p>Looks like you haven't added any items to your cart yet.</p>
      <router-link to="/" class="continue-shopping-btn">Continue Shopping</router-link>
    </div>

    <!-- Cart items -->
    <div v-else class="cart-content">
      <div class="cart-items">
        <div v-for="(item, index) in cart.items" :key="index" class="cart-item">
          <div class="item-image">
            <img :src="item.image || placeholderImage" :alt="item.name">
          </div>

          <div class="item-details">
            <div class="item-name">{{ item.name }}</div>

            <div v-if="Object.keys(item.attributes || {}).length" class="item-attributes">
              <div v-for="(value, key) in item.attributes" :key="key" class="attribute">
                <span class="attribute-name">{{ key }}:</span>
                <span class="attribute-value">{{ value }}</span>
              </div>
            </div>

            <div class="item-price">${{ item.price.toFixed(2) }}</div>
          </div>

          <div class="item-quantity">
            <button @click="decrementQuantity(item)"
                    :disabled="item.quantity <= 1"
                    class="quantity-btn">
              −
            </button>
            <span class="quantity-value">{{ item.quantity }}</span>
            <button @click="incrementQuantity(item)"
                    class="quantity-btn">
              +
            </button>
          </div>

          <div class="item-total">
            ${{ (item.price * item.quantity).toFixed(2) }}
          </div>

          <button @click="showRemoveConfirmation(item)" class="remove-btn">
            <span aria-hidden="true">×</span>
            <span class="sr-only">Remove</span>
          </button>
        </div>
      </div>

      <div class="cart-summary">
        <h2>Order Summary</h2>

        <div class="summary-row">
          <span>Subtotal</span>
          <span>${{ subtotal.toFixed(2) }}</span>
        </div>

        <div class="summary-row">
          <span>Tax ({{ taxRate * 100 }}%)</span>
          <span>${{ tax.toFixed(2) }}</span>
        </div>

        <div class="summary-row" v-if="shipping > 0">
          <span>Shipping</span>
          <span>${{ shipping.toFixed(2) }}</span>
        </div>

        <div class="summary-row" v-else>
          <span>Shipping</span>
          <span>Free</span>
        </div>

        <div class="summary-row total">
          <span>Total</span>
          <span>${{ total.toFixed(2) }}</span>
        </div>

        <button @click="checkout" class="checkout-btn">
          Proceed to Checkout
        </button>

        <router-link to="/" class="continue-shopping-link">
          Continue Shopping
        </router-link>

        <button @click="showClearConfirmation" class="clear-cart-btn">
          Clear Cart
        </button>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <div v-if="showConfirmation" class="confirmation-modal">
      <div class="modal-content">
        <h3>{{ confirmationMessage }}</h3>
        <div class="modal-actions">
          <button @click="cancelConfirmation" class="cancel-btn">Cancel</button>
          <button @click="confirmAction" class="confirm-btn">Confirm</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import cartService from '@/services/cartService';
  import { ElMessage } from 'element-plus';

  export default {
    name: 'ShoppingCart',
    data() {
      return {
        loading: true,
        cart: { items: [] },
        taxRate: 0.07, // 7% tax rate
        shipping: 0, // Free shipping by default
        placeholderImage: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22200%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20200%20200%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_1a3f85814e0%20text%20%7B%20fill%3A%23AAAAAA%3Bfont-weight%3Abold%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A10pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_1a3f85814e0%22%3E%3Crect%20width%3D%22200%22%20height%3D%22200%22%20fill%3D%22%23EEEEEE%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2274.5%22%20y%3D%22104.8%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E',
        // For confirmation modal
        showConfirmation: false,
        confirmationMessage: '',
        confirmationCallback: null,
        itemToRemove: null
      };
    },
    computed: {
      subtotal() {
        return this.cart.items.reduce((total, item) => {
          return total + (item.price * item.quantity);
        }, 0);
      },
      tax() {
        return this.subtotal * this.taxRate;
      },
      total() {
        return this.subtotal + this.tax + this.shipping;
      }
    },
    inject: ['appContext'], // Inject the app context to check login status
    methods: {
      async loadCart() {
        this.loading = true;
        try {
          this.cart = await cartService.getCart(this.appContext.isLoggedIn);
        } catch (error) {
          console.error('Error loading cart:', error);
          ElMessage.error('Failed to load your shopping cart');
        } finally {
          this.loading = false;
        }
      },
      async incrementQuantity(item) {
        try {
          const newQuantity = item.quantity + 1;
          this.cart = await cartService.updateItemQuantity(
            item.productId,
            newQuantity,
            item.attributes || {},
            this.appContext.isLoggedIn
          );
          ElMessage.success('Quantity updated');
        } catch (error) {
          console.error('Error updating quantity:', error);
          ElMessage.error('Failed to update quantity');
        }
      },
      async decrementQuantity(item) {
        if (item.quantity <= 1) return;

        try {
          const newQuantity = item.quantity - 1;
          this.cart = await cartService.updateItemQuantity(
            item.productId,
            newQuantity,
            item.attributes || {},
            this.appContext.isLoggedIn
          );
          ElMessage.success('Quantity updated');
        } catch (error) {
          console.error('Error updating quantity:', error);
          ElMessage.error('Failed to update quantity');
        }
      },
      showRemoveConfirmation(item) {
        this.itemToRemove = item;
        this.confirmationMessage = `Remove "${item.name}" from your cart?`;
        this.confirmationCallback = this.removeItem;
        this.showConfirmation = true;
      },
      async removeItem() {
        if (!this.itemToRemove) return;

        try {
          this.cart = await cartService.removeItem(
            this.itemToRemove.productId,
            this.itemToRemove.attributes || {},
            this.appContext.isLoggedIn
          );
          ElMessage.success('Item removed from cart');
        } catch (error) {
          console.error('Error removing item:', error);
          ElMessage.error('Failed to remove item');
        } finally {
          this.itemToRemove = null;
        }
      },
      showClearConfirmation() {
        this.confirmationMessage = 'Are you sure you want to clear your entire cart?';
        this.confirmationCallback = this.clearCart;
        this.showConfirmation = true;
      },
      async clearCart() {
        try {
          this.cart = await cartService.clearCart(this.appContext.isLoggedIn);
          ElMessage.success('Cart cleared');
        } catch (error) {
          console.error('Error clearing cart:', error);
          ElMessage.error('Failed to clear cart');
        }
      },
      confirmAction() {
        if (this.confirmationCallback) {
          this.confirmationCallback();
        }
        this.showConfirmation = false;
      },
      cancelConfirmation() {
        this.showConfirmation = false;
        this.itemToRemove = null;
      },
      checkout() {
        if (!this.appContext.isLoggedIn) {
          ElMessage.warning('Please login to checkout');
          this.$router.push('/login');
          return;
        }

        if (this.cart.items.length === 0) {
          ElMessage.warning('Your cart is empty');
          return;
        }

        this.$router.push('/checkout');
      }
    },
    created() {
      this.loadCart();
    },
    watch: {
      // Reload cart when login status changes
      'appContext.isLoggedIn'() {
        this.loadCart();
      }
    }
  };
</script>

<style scoped>
  .shopping-cart {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1rem;
    position: relative;
  }

  h1 {
    font-size: 2rem;
    margin-bottom: 2rem;
    color: #333;
  }

  /* Loading State */
  .cart-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 300px;
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

  /* Empty Cart */
  .empty-cart {
    text-align: center;
    padding: 3rem 1rem;
    background-color: #f9f9f9;
    border-radius: 8px;
  }

  .empty-cart-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  .empty-cart h2 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: #333;
  }

  .empty-cart p {
    color: #666;
    margin-bottom: 2rem;
  }

  .continue-shopping-btn {
    display: inline-block;
    background-color: #5D5CDE;
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    text-decoration: none;
    font-weight: 500;
    transition: background-color 0.2s;
  }

    .continue-shopping-btn:hover {
      background-color: #4a49b8;
    }

  /* Cart Content Layout */
  .cart-content {
    display: grid;
    grid-template-columns: 1fr 350px;
    gap: 2rem;
  }

  /* Cart Items */
  .cart-items {
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    overflow: hidden;
  }

  .cart-item {
    display: grid;
    grid-template-columns: 100px 1fr auto auto auto;
    gap: 1rem;
    padding: 1.5rem;
    border-bottom: 1px solid #eee;
    align-items: center;
  }

    .cart-item:last-child {
      border-bottom: none;
    }

  .item-image {
    width: 100px;
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

    .item-image img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

  .item-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .item-name {
    font-weight: 600;
    font-size: 1.1rem;
    color: #333;
  }

  .item-attributes {
    font-size: 0.9rem;
    color: #666;
  }

  .attribute {
    margin-bottom: 0.25rem;
  }

  .attribute-name {
    font-weight: 500;
    margin-right: 0.5rem;
  }

  .item-price {
    color: #5D5CDE;
    font-weight: 500;
  }

  .item-quantity {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .quantity-btn {
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f1f1f1;
    border: none;
    border-radius: 4px;
    font-size: 1.2rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }

    .quantity-btn:hover:not(:disabled) {
      background-color: #e0e0e0;
    }

    .quantity-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

  .quantity-value {
    font-weight: 600;
    min-width: 25px;
    text-align: center;
  }

  .item-total {
    font-weight: 600;
    color: #333;
  }

  .remove-btn {
    border: none;
    background: none;
    color: #999;
    font-size: 1.5rem;
    cursor: pointer;
    transition: color 0.2s;
    padding: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

    .remove-btn:hover {
      color: #f44336;
    }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  /* Cart Summary */
  .cart-summary {
    background-color: #fff;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    position: sticky;
    top: 20px;
    height: fit-content;
  }

    .cart-summary h2 {
      font-size: 1.3rem;
      margin-bottom: 1.5rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #eee;
      color: #333;
    }

  .summary-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1rem;
    font-size: 1rem;
    color: #555;
  }

    .summary-row.total {
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid #eee;
      font-weight: 600;
      font-size: 1.2rem;
      color: #333;
    }

  .checkout-btn {
    width: 100%;
    background-color: #5D5CDE;
    color: white;
    border: none;
    padding: 1rem;
    border-radius: 4px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    margin-top: 1rem;
    transition: background-color 0.2s;
  }

    .checkout-btn:hover {
      background-color: #4a49b8;
    }

  .continue-shopping-link {
    display: block;
    text-align: center;
    margin-top: 1rem;
    color: #5D5CDE;
    text-decoration: none;
    font-weight: 500;
  }

    .continue-shopping-link:hover {
      text-decoration: underline;
    }

  .clear-cart-btn {
    width: 100%;
    background-color: transparent;
    color: #f44336;
    border: 1px solid #f44336;
    padding: 0.75rem;
    border-radius: 4px;
    font-size: 0.9rem;
    cursor: pointer;
    margin-top: 1.5rem;
    transition: all 0.2s;
  }

    .clear-cart-btn:hover {
      background-color: #fff5f5;
    }

  /* Confirmation Modal */
  .confirmation-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background-color: white;
    padding: 2rem;
    border-radius: 8px;
    width: 90%;
    max-width: 400px;
  }

    .modal-content h3 {
      margin-bottom: 1.5rem;
      color: #333;
    }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
  }

  .cancel-btn, .confirm-btn {
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .cancel-btn {
    background-color: transparent;
    color: #666;
    border: 1px solid #ccc;
  }

    .cancel-btn:hover {
      background-color: #f5f5f5;
    }

  .confirm-btn {
    background-color: #f44336;
    color: white;
    border: none;
  }

    .confirm-btn:hover {
      background-color: #e53935;
    }

  /* Responsive Adjustments */
  @media (max-width: 900px) {
    .cart-content {
      grid-template-columns: 1fr;
    }

    .cart-summary {
      margin-top: 2rem;
      position: static; /* Remove sticky positioning on mobile */
    }
  }

  @media (max-width: 600px) {
    .cart-item {
      grid-template-columns: 80px 1fr;
      grid-template-areas:
        "image details"
        "image quantity"
        "total total"
        "remove remove";
      gap: 0.75rem;
    }

    .item-image {
      grid-area: image;
      width: 80px;
      height: 80px;
    }

    .item-details {
      grid-area: details;
    }

    .item-quantity {
      grid-area: quantity;
      justify-content: flex-start;
    }

    .item-total {
      grid-area: total;
      justify-self: flex-end;
      margin-top: 0.5rem;
    }

    .remove-btn {
      grid-area: remove;
      justify-self: flex-end;
    }
  }

  /* Dark Mode Support */
  @media (prefers-color-scheme: dark) {
    .shopping-cart {
      color: #e0e0e0;
    }

    h1 {
      color: #000000;
    }

    .empty-cart {
      background-color: #1e1e1e;
    }

      .empty-cart h2 {
        color: #e0e0e0;
      }

      .empty-cart p {
        color: #aaa;
      }

    .cart-items {
      background-color: #1e1e1e;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    .cart-item {
      border-bottom-color: #333;
    }

    .item-name {
      color: #e0e0e0;
    }

    .item-attributes {
      color: #aaa;
    }

    .quantity-btn {
      background-color: #333;
      color: #e0e0e0;
    }

      .quantity-btn:hover:not(:disabled) {
        background-color: #444;
      }

    .item-total {
      color: #e0e0e0;
    }

    .cart-summary {
      background-color: #1e1e1e;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

      .cart-summary h2 {
        color: #e0e0e0;
        border-bottom-color: #333;
      }

    .summary-row {
      color: #bbb;
    }

      .summary-row.total {
        border-top-color: #333;
        color: #e0e0e0;
      }

    .continue-shopping-link {
      color: #7e7dff;
    }

    .clear-cart-btn:hover {
      background-color: rgba(244, 67, 54, 0.1);
    }

    .modal-content {
      background-color: #1e1e1e;
    }

      .modal-content h3 {
        color: #e0e0e0;
      }

    .cancel-btn {
      color: #ccc;
      border-color: #444;
    }

      .cancel-btn:hover {
        background-color: #333;
      }
  }
</style>
