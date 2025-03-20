<template>
  <div class="order-details">
    <div class="page-header">
      <router-link :to="{ name: 'OrdersHistory' }" class="back-link">
        ← Back to Orders
      </router-link>
      <h1>Order Details</h1>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-container">
      <div class="loader"></div>
      <p>Loading order details...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-container">
      <p>{{ error }}</p>
      <button @click="fetchOrderDetails" class="retry-btn">Try Again</button>
    </div>

    <!-- Order details -->
    <div v-else-if="order" class="order-container">
      <!-- Order header section -->
      <div class="order-header-section">
        <div class="order-header-content">
          <div class="order-title-section">
            <h2>Order #{{ order.orderNumber }}</h2>
            <div :class="['status-badge', `status-${order.status}`]">
              {{ getStatusLabel(order.status) }}
            </div>
          </div>

          <div class="order-meta">
            <div class="meta-group">
              <span class="meta-label">Order Date:</span>
              <span class="meta-value">{{ formatDate(order.purchaseDate) }}</span>
            </div>

            <div v-if="order.statusDates && order.statusDates[order.status]" class="meta-group">
              <span class="meta-label">Status Updated:</span>
              <span class="meta-value">{{ formatDate(order.statusDates[order.status]) }}</span>
            </div>

            <div class="meta-group">
              <span class="meta-label">Total Amount:</span>
              <span class="meta-value">${{ order.totalAmount.toFixed(2) }}</span>
            </div>
          </div>

          <!-- Cancel Order Button for Users -->
          <div v-if="canCancelOrder" class="user-actions">
            <button @click="showCancelConfirmation = true" class="cancel-order-btn" :disabled="isCancelling">
              {{ isCancelling ? 'Cancelling...' : 'Cancel Order' }}
            </button>
            <div v-if="cancelError" class="cancel-error">{{ cancelError }}</div>
          </div>

          <!-- Cancel Confirmation Modal -->
          <div v-if="showCancelConfirmation" class="cancel-confirmation-modal">
            <div class="modal-content">
              <h3>Confirm Cancellation</h3>
              <p>Are you sure you want to cancel this order?</p>
              <div class="form-group">
                <label for="cancelReason">Reason for cancellation (optional):</label>
                <textarea id="cancelReason" v-model="cancelReason" placeholder="Please provide a reason for cancellation..." rows="3"></textarea>
              </div>
              <div class="modal-actions">
                <button @click="cancelOrder" class="confirm-cancel-btn" :disabled="isCancelling">
                  {{ isCancelling ? 'Cancelling...' : 'Yes, Cancel Order' }}
                </button>
                <button @click="showCancelConfirmation = false" class="cancel-btn" :disabled="isCancelling">
                  No, Keep Order
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Status update section for Admin -->
        <div class="status-update-section">
          <h3>Update Status</h3>

          <div class="status-update-form">
            <div class="form-group">
              <label for="statusSelect">New Status:</label>
              <select id="statusSelect"
                      v-model="newStatus"
                      :disabled="isUpdating || allowedStatusTransitions.length === 0">
                <option value="" disabled>Select New Status</option>
                <option v-for="status in allowedStatusTransitions"
                        :key="status"
                        :value="status">
                  {{ getStatusLabel(status) }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="statusNotes">Notes:</label>
              <textarea id="statusNotes"
                        v-model="statusNotes"
                        placeholder="Add any notes about this status change..."
                        :disabled="isUpdating || !newStatus"
                        rows="2"></textarea>
            </div>

            <div v-if="updateError" class="update-error">
              {{ updateError }}
            </div>

            <button @click="updateOrderStatus"
                    class="update-btn"
                    :disabled="isUpdating || !newStatus">
              <span v-if="isUpdating">Updating...</span>
              <span v-else>Update Status</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Order information section -->
      <div class="order-info-section">
        <div class="info-card shipping-info">
          <h3>Shipping Information</h3>
          <p>{{ order.shippingAddress }}</p>
        </div>

        <div class="info-card status-history">
          <h3>Status History</h3>
          <div v-if="order.statusHistory && order.statusHistory.length" class="status-timeline">
            <div v-for="(record, index) in sortedStatusHistory"
                 :key="index"
                 class="timeline-item">
              <div class="timeline-icon">
                <div :class="['status-dot', `status-${record.status}`]"></div>
              </div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <span class="timeline-status">{{ getStatusLabel(record.status) }}</span>
                  <span class="timeline-date">{{ formatDate(record.date) }}</span>
                </div>
                <div v-if="record.changedBy && record.changedBy.username" class="timeline-user">
                  Updated by: {{ record.changedBy.username }}
                </div>
                <div v-if="record.notes" class="timeline-notes">
                  {{ record.notes }}
                </div>
              </div>
            </div>
          </div>
          <p v-else class="empty-history">No status updates yet.</p>
        </div>
      </div>

      <!-- Order items section -->
      <div class="order-items-section">
        <h3>Order Items</h3>
        <div class="order-items-list">
          <div v-for="(item, index) in order.items" :key="index" class="order-item">
            <div class="item-image">
              <img :src="item.image || placeholderImage" :alt="item.name">
            </div>
            <div class="item-details">
              <div class="item-name">{{ item.name }}</div>
              <div class="item-meta">
                <span class="item-price">${{ item.price.toFixed(2) }} each</span>
                <span class="item-quantity">Quantity: {{ item.quantity }}</span>
              </div>
            </div>
            <div class="item-subtotal">
              <div class="subtotal-label">Subtotal:</div>
              <div class="subtotal-value">${{ item.subtotal.toFixed(2) }}</div>
            </div>
          </div>
        </div>

        <!-- Order summary -->
        <div class="order-summary">
          <div class="summary-row">
            <span>Total</span>
            <span>${{ order.totalAmount.toFixed(2) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import orderService from '@/services/orderService';
  import { ElMessage } from 'element-plus';

  export default {
    name: 'OrderDetails',
    data() {
      return {
        order: null,
        loading: true,
        error: null,
        newStatus: '',
        statusNotes: '',
        isUpdating: false,
        updateError: null,
        placeholderImage: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22200%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20200%20200%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_1a3f85814e0%20text%20%7B%20fill%3A%23AAAAAA%3Bfont-weight%3Abold%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A10pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_1a3f85814e0%22%3E%3Crect%20width%3D%22200%22%20height%3D%22200%22%20fill%3D%22%23EEEEEE%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2274.5%22%20y%3D%22104.8%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E',
        // New properties for order cancellation
        showCancelConfirmation: false,
        cancelReason: '',
        isCancelling: false,
        cancelError: null
      };
    },
    computed: {
      // Get the ID from route params
      orderId() {
        return this.$route.params.id;
      },
      // Get status options with labels
      statusOptions() {
        return orderService.getStatusOptions();
      },
      // Get allowed transitions for current status
      allowedStatusTransitions() {
        if (!this.order) return [];
        return orderService.getAllowedTransitions(this.order.status);
      },
      // Sort status history by date (newest first)
      sortedStatusHistory() {
        if (!this.order || !this.order.statusHistory) return [];
        return [...this.order.statusHistory].sort((a, b) => {
          return new Date(b.date) - new Date(a.date);
        });
      },
      // Check if order can be cancelled by customer
      canCancelOrder() {
        if (!this.order) return false;

        // Check if current status allows cancellation by customer
        return orderService.canBeCancelled(this.order.status);
      }
    },
    created() {
      this.fetchOrderDetails();
    },
    methods: {
      async fetchOrderDetails() {
        this.loading = true;
        this.error = null;

        try {
          this.order = await orderService.getOrderById(this.orderId);
          this.newStatus = ''; // Reset status dropdown
        } catch (error) {
          this.error = 'Failed to load order details. Please try again.';
          console.error('Error fetching order details:', error);
        } finally {
          this.loading = false;
        }
      },
      formatDate(dateString) {
        return orderService.formatDate(dateString);
      },
      getStatusLabel(statusValue) {
        const status = this.statusOptions.find(s => s.value === statusValue);
        return status ? status.label : statusValue;
      },
      async updateOrderStatus() {
        if (!this.newStatus) {
          this.updateError = 'Please select a new status';
          return;
        }

        this.isUpdating = true;
        this.updateError = null;

        try {
          this.order = await orderService.updateOrderStatus(
            this.orderId,
            this.newStatus,
            this.statusNotes
          );

          // Reset form
          this.newStatus = '';
          this.statusNotes = '';

          ElMessage.success(`Order status updated to ${this.getStatusLabel(this.order.status)}`);
        } catch (error) {
          this.updateError = error.message || 'Failed to update order status';
          console.error('Error updating order status:', error);
        } finally {
          this.isUpdating = false;
        }
      },
      // New method for cancelling order - now uses the dedicated cancelOrder method
      async cancelOrder() {
        this.isCancelling = true;
        this.cancelError = null;

        try {
          // Call the new cancelOrder method
          this.order = await orderService.cancelOrder(
            this.orderId,
            this.cancelReason
          );

          // Hide confirmation modal and reset form
          this.showCancelConfirmation = false;
          this.cancelReason = '';

          ElMessage.success('Your order has been cancelled successfully');
        } catch (error) {
          this.cancelError = error.message || 'Failed to cancel order';
          console.error('Error cancelling order:', error);
        } finally {
          this.isCancelling = false;
        }
      }
    }
  };
</script>

<style scoped>
  .order-details {
    max-width: 1000px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }

  .page-header {
    margin-bottom: 2rem;
  }

  .back-link {
    display: inline-block;
    margin-bottom: 1rem;
    color: #5D5CDE;
    text-decoration: none;
  }

    .back-link:hover {
      text-decoration: underline;
    }

  h1 {
    margin: 0;
    color: #333;
  }

  /* Loading and error states */
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

  .error-container {
    text-align: center;
    padding: 2rem;
    background-color: #fff5f5;
    border-radius: 8px;
    margin-bottom: 2rem;
  }

  .retry-btn {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background-color: #5D5CDE;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  /* Order container */
  .order-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  /* Order header section */
  .order-header-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    background-color: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .order-header-content {
    padding: 1.5rem;
    position: relative; /* For modal positioning */
  }

  .order-title-section {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

    .order-title-section h2 {
      margin: 0;
      color: #333;
    }

  .status-badge {
    display: inline-block;
    padding: 0.4rem 0.75rem;
    border-radius: 50px;
    font-size: 0.85rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .status-pending {
    background-color: #fff8e1;
    color: #f57c00;
  }

  .status-shipped {
    background-color: #e8f5e9;
    color: #43a047;
  }

  .status-delivered {
    background-color: #e3f2fd;
    color: #1976d2;
  }

  .status-cancelled {
    background-color: #ffebee;
    color: #e53935;
  }

  .status-hold {
    background-color: #f3e5f5;
    color: #8e24aa;
  }

  .order-meta {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .meta-group {
    display: flex;
    align-items: center;
  }

  .meta-label {
    min-width: 130px;
    font-weight: 600;
    color: #666;
  }

  .meta-value {
    color: #333;
  }

  /* New styles for cancel order button */
  .user-actions {
    margin-top: 1.5rem;
  }

  .cancel-order-btn {
    padding: 0.75rem 1.5rem;
    background-color: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
  }

    .cancel-order-btn:hover:not(:disabled) {
      background-color: #d32f2f;
    }

    .cancel-order-btn:disabled {
      background-color: #e57373;
      cursor: not-allowed;
    }

  .cancel-error {
    background-color: #fff5f5;
    border: 1px solid #f5c6cb;
    color: #d32f2f;
    padding: 0.75rem;
    border-radius: 4px;
    margin-top: 1rem;
  }

  /* Cancel confirmation modal */
  .cancel-confirmation-modal {
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
    border-radius: 8px;
    padding: 2rem;
    width: 90%;
    max-width: 500px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

    .modal-content h3 {
      margin-top: 0;
      color: #333;
    }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1.5rem;
  }

  .confirm-cancel-btn {
    padding: 0.75rem 1.5rem;
    background-color: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    font-weight: 600;
    cursor: pointer;
  }

    .confirm-cancel-btn:hover:not(:disabled) {
      background-color: #d32f2f;
    }

  .cancel-btn {
    padding: 0.75rem 1.5rem;
    background-color: #e0e0e0;
    color: #333;
    border: none;
    border-radius: 4px;
    font-weight: 600;
    cursor: pointer;
  }

    .cancel-btn:hover:not(:disabled) {
      background-color: #bdbdbd;
    }

  /* Status update section */
  .status-update-section {
    padding: 1.5rem;
    background-color: #f9f9f9;
    border-left: 1px solid #eee;
  }

    .status-update-section h3 {
      margin-top: 0;
      margin-bottom: 1rem;
      color: #333;
    }

  .form-group {
    margin-bottom: 1rem;
  }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: #333;
    }

  select, textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }

  textarea {
    resize: vertical;
    font-family: inherit;
  }

    select:focus, textarea:focus {
      outline: none;
      border-color: #5D5CDE;
      box-shadow: 0 0 0 2px rgba(93,92,222,0.2);
    }

  .update-error {
    background-color: #fff5f5;
    border: 1px solid #f5c6cb;
    color: #d32f2f;
    padding: 0.75rem;
    border-radius: 4px;
    margin-bottom: 1rem;
  }

  .update-btn {
    width: 100%;
    padding: 0.75rem;
    background-color: #5D5CDE;
    color: white;
    border: none;
    border-radius: 4px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
  }

    .update-btn:hover:not(:disabled) {
      background-color: #4a49b8;
    }

    .update-btn:disabled {
      background-color: #9998e8;
      cursor: not-allowed;
    }

  /* Order information section */
  .order-info-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }

  .info-card {
    background-color: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

    .info-card h3 {
      margin-top: 0;
      margin-bottom: 1rem;
      color: #333;
      border-bottom: 1px solid #eee;
      padding-bottom: 0.5rem;
    }

  /* Status timeline */
  .status-timeline {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .timeline-item {
    display: flex;
    gap: 1rem;
  }

  .timeline-icon {
    padding-top: 0.25rem;
  }

  .status-dot {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    margin-right: 0.5rem;
  }

    .status-dot.status-pending {
      background-color: #f57c00;
    }

    .status-dot.status-shipped {
      background-color: #43a047;
    }

    .status-dot.status-delivered {
      background-color: #1976d2;
    }

    .status-dot.status-cancelled {
      background-color: #e53935;
    }

    .status-dot.status-hold {
      background-color: #8e24aa;
    }

  .timeline-content {
    flex: 1;
  }

  .timeline-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.25rem;
  }

  .timeline-status {
    font-weight: 600;
    color: #333;
  }

  .timeline-date {
    color: #666;
    font-size: 0.9rem;
  }

  .timeline-user {
    font-size: 0.9rem;
    color: #666;
    margin-bottom: 0.25rem;
  }

  .timeline-notes {
    background-color: #f5f5f5;
    padding: 0.75rem;
    border-radius: 4px;
    font-size: 0.9rem;
    color: #333;
  }

  .empty-history {
    color: #666;
    font-style: italic;
  }

  /* Order items section */
  .order-items-section {
    background-color: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

    .order-items-section h3 {
      margin-top: 0;
      margin-bottom: 1.5rem;
      color: #333;
      border-bottom: 1px solid #eee;
      padding-bottom: 0.5rem;
    }

  .order-items-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .order-item {
    display: grid;
    grid-template-columns: 80px 1fr auto;
    gap: 1.5rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid #eee;
  }

  .item-image {
    width: 80px;
    height: 80px;
  }

    .item-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 4px;
    }

  .item-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .item-name {
    font-weight: 600;
    color: #333;
  }

  .item-meta {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.9rem;
    color: #666;
  }

  .item-subtotal {
    text-align: right;
  }

  .subtotal-label {
    font-size: 0.9rem;
    color: #666;
    margin-bottom: 0.25rem;
  }

  .subtotal-value {
    font-weight: 600;
    color: #333;
    font-size: 1.1rem;
  }

  .order-summary {
    margin-top: 2rem;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .summary-row {
    display: grid;
    grid-template-columns: 100px auto;
    gap: 1rem;
    font-weight: 600;
    font-size: 1.2rem;
    color: #333;
  }

  /* Responsive adjustments */
  @media (max-width: 800px) {
    .order-header-section,
    .order-info-section {
      grid-template-columns: 1fr;
    }

    .status-update-section {
      border-left: none;
      border-top: 1px solid #eee;
    }
  }

  @media (max-width: 600px) {
    .order-item {
      grid-template-columns: 60px 1fr;
    }

    .item-subtotal {
      grid-column: 1 / -1;
      text-align: right;
      margin-top: 0.5rem;
    }

    .modal-actions {
      flex-direction: column;
    }

    .confirm-cancel-btn, .cancel-btn {
      width: 100%;
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .order-details {
      color: #e0e0e0;
    }

    h1, h2, h3 {
      color: #e0e0e0;
    }

    .back-link {
      color: #7e7dff;
    }

    .order-header-section,
    .info-card,
    .order-items-section {
      background-color: #1e1e1e;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }

    .status-update-section {
      background-color: #262626;
      border-color: #333;
    }

    .info-card h3,
    .order-items-section h3 {
      border-bottom-color: #333;
    }

    .meta-label {
      color: #bbb;
    }

    .meta-value {
      color: #e0e0e0;
    }

    select, textarea {
      background-color: #333;
      border-color: #444;
      color: #e0e0e0;
    }

    .form-group label {
      color: #e0e0e0;
    }

    .timeline-status {
      color: #e0e0e0;
    }

    .timeline-date,
    .timeline-user {
      color: #bbb;
    }

    .timeline-notes {
      background-color: #262626;
      color: #e0e0e0;
    }

    .empty-history {
      color: #bbb;
    }

    .order-item {
      border-bottom-color: #333;
    }

    .item-name {
      color: #e0e0e0;
    }

    .item-meta {
      color: #bbb;
    }

    .subtotal-label {
      color: #bbb;
    }

    .subtotal-value,
    .summary-row {
      color: #e0e0e0;
    }

    .error-container {
      background-color: #2c1515;
    }

    .update-error, .cancel-error {
      background-color: #2c1515;
      border-color: #5c3131;
    }

    /* Modal dark mode */
    .modal-content {
      background-color: #1e1e1e;
      color: #e0e0e0;
    }

    .cancel-btn {
      background-color: #424242;
      color: #e0e0e0;
    }

      .cancel-btn:hover:not(:disabled) {
        background-color: #616161;
      }

    /* Adjust status badge colors for dark mode */
    .status-pending {
      background-color: rgba(255, 152, 0, 0.15);
      color: #ffb74d;
    }

    .status-shipped {
      background-color: rgba(76, 175, 80, 0.15);
      color: #81c784;
    }

    .status-delivered {
      background-color: rgba(33, 150, 243, 0.15);
      color: #64b5f6;
    }

    .status-cancelled {
      background-color: rgba(244, 67, 54, 0.15);
      color: #e57373;
    }

    .status-hold {
      background-color: rgba(156, 39, 176, 0.15);
      color: #ba68c8;
    }
  }
</style>
