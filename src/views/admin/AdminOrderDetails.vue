<template>
  <div class="admin-order-details">
    <div class="admin-page-header">
      <router-link to="/admin/orders" class="back-link">
        ← Back to Orders
      </router-link>
      <h1>Order Details</h1>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading order details...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-container">
      <p>{{ error }}</p>
      <button @click="fetchOrderDetails" class="retry-btn">Try Again</button>
    </div>

    <!-- Order details -->
    <div v-else-if="order" class="admin-panel">
      <div class="order-header">
        <div class="order-id">
          Order #{{ order.orderNumber }}
          <span :class="['status-badge', `status-${order.status}`]">
            {{ getStatusLabel(order.status) }}
          </span>
        </div>
        <div class="order-date">
          Ordered on: {{ formatDate(order.purchaseDate) }}
        </div>
      </div>

      <div class="order-grid">
        <!-- Customer information -->
        <div class="order-section">
          <h3>Customer Information</h3>
          <div class="info-item">
            <span class="label">Customer ID:</span>
            <span class="value">{{ order.userId }}</span>
          </div>
          <div class="info-item">
            <span class="label">Shipping Address:</span>
            <span class="value">{{ order.shippingAddress }}</span>
          </div>
        </div>

        <!-- Order status management -->
        <div class="order-section">
          <h3>Status Management</h3>

          <div class="status-form">
            <div class="form-group">
              <label for="status-select">Update Status:</label>
              <select id="status-select"
                      v-model="newStatus"
                      :disabled="statusUpdateLoading || !allowedTransitions.length">
                <option value="" disabled selected>Select new status</option>
                <option v-for="status in allowedTransitions"
                        :key="status"
                        :value="status">
                  {{ getStatusLabel(status) }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="status-notes">Notes:</label>
              <textarea id="status-notes"
                        v-model="statusNotes"
                        :disabled="statusUpdateLoading || !newStatus"
                        placeholder="Add notes about this status change"></textarea>
            </div>

            <button @click="updateOrderStatus"
                    class="update-status-btn"
                    :disabled="statusUpdateLoading || !newStatus">
              <span v-if="statusUpdateLoading">Updating...</span>
              <span v-else>Update Status</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Status history -->
      <div class="order-section">
        <h3>Status History</h3>
        <div class="status-history">
          <div v-for="(entry, index) in sortedStatusHistory" :key="index" class="history-entry">
            <div class="history-status">
              <span :class="['status-dot', `status-${entry.status}`]"></span>
              <span class="status-name">{{ getStatusLabel(entry.status) }}</span>
            </div>
            <div class="history-details">
              <div class="history-date">
                {{ formatDate(entry.date) }}
              </div>
              <div v-if="entry.changedBy && entry.changedBy.username" class="history-user">
                By: {{ entry.changedBy.username }}
              </div>
              <div v-if="entry.notes" class="history-notes">
                "{{ entry.notes }}"
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Order items -->
      <div class="order-section">
        <h3>Order Items</h3>
        <table class="items-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in order.items" :key="index">
              <td class="product-cell">
                <img :src="item.image || placeholderImage"
                     :alt="item.name"
                     class="product-thumbnail" />
                <div class="product-name">{{ item.name }}</div>
              </td>
              <td>${{ item.price.toFixed(2) }}</td>
              <td>{{ item.quantity }}</td>
              <td>${{ item.subtotal.toFixed(2) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" class="total-label">Total:</td>
              <td class="total-value">${{ order.totalAmount.toFixed(2) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminOrderDetails',
  data() {
    return {
      orderId: null,
      order: null,
      loading: true,
      error: null,
      statusUpdateLoading: false,
      newStatus: '',
      statusNotes: '',
      placeholderImage: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22200%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20200%20200%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_1a3f85814e0%20text%20%7B%20fill%3A%23AAAAAA%3Bfont-weight%3Abold%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A10pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_1a3f85814e0%22%3E%3Crect%20width%3D%22200%22%20height%3D%22200%22%20fill%3D%22%23EEEEEE%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2274.5%22%20y%3D%22104.8%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E'
    };
  },
  computed: {
    allowedTransitions() {
      if (!this.order) return [];

      // Define allowed status transitions
      const transitions = {
        'pending': ['shipped', 'cancelled', 'hold'],
        'hold': ['shipped', 'cancelled'],
        'shipped': ['delivered'],
        'cancelled': [],
        'delivered': []
      };

      return transitions[this.order.status] || [];
    },
    sortedStatusHistory() {
      if (!this.order || !this.order.statusHistory) return [];

      // Sort by date, newest first
      return [...this.order.statusHistory].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
      });
    }
  },
  methods: {
    formatDate(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleString();
    },
    getStatusLabel(status) {
      const statusLabels = {
        'pending': 'Pending',
        'shipped': 'Shipped',
        'cancelled': 'Cancelled',
        'hold': 'On Hold',
        'delivered': 'Delivered'
      };

      return statusLabels[status] || status;
    },
    async fetchOrderDetails() {
      this.loading = true;
      this.error = null;

      try {
        const response = await fetch(`/api/orders/${this.orderId}`, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        this.order = await response.json();
      } catch (error) {
        console.error('Error fetching order details:', error);
        this.error = 'Failed to load order details. Please try again.';
      } finally {
        this.loading = false;
      }
    },
    async updateOrderStatus() {
      if (!this.newStatus) return;

      this.statusUpdateLoading = true;

      try {
        const response = await fetch(`/api/orders/${this.orderId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            status: this.newStatus,
            notes: this.statusNotes
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
        }

        this.order = await response.json();

        // Reset form
        this.newStatus = '';
        this.statusNotes = '';

        // Show success message
        alert(`Order status updated to ${this.getStatusLabel(this.order.status)}`);
      } catch (error) {
        console.error('Error updating order status:', error);
        alert(`Error updating order status: ${error.message}`);
      } finally {
        this.statusUpdateLoading = false;
      }
    }
  },
  created() {
    this.orderId = this.$route.params.id;
    this.fetchOrderDetails();
  }
};
</script>

<style scoped>
  .admin-order-details {
    width: 100%;
  }

  .admin-page-header {
    display: flex;
    flex-direction: column;
    margin-bottom: 1.5rem;
  }

  .back-link {
    color: #5D5CDE;
    text-decoration: none;
    margin-bottom: 0.5rem;
    display: inline-block;
  }

    .back-link:hover {
      text-decoration: underline;
    }

  .admin-page-header h1 {
    margin: 0;
    font-size: 1.8rem;
    color: #333;
  }

  .admin-panel {
    background-color: white;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .order-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #eee;
  }

  .order-id {
    font-size: 1.2rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .order-date {
    color: #666;
  }

  .status-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.8rem;
    font-weight: 500;
  }

  .status-pending {
    background-color: #fff8e1;
    color: #f57c00;
  }

  .status-shipped {
    background-color: #e8f5e9;
    color: #388e3c;
  }

  .status-delivered {
    background-color: #e3f2fd;
    color: #1976d2;
  }

  .status-cancelled {
    background-color: #ffebee;
    color: #d32f2f;
  }

  .status-hold {
    background-color: #f3e5f5;
    color: #8e24aa;
  }

  .order-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .order-section {
    margin-bottom: 1.5rem;
  }

    .order-section h3 {
      margin-top: 0;
      margin-bottom: 1rem;
      font-size: 1.2rem;
      color: #333;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #eee;
    }

  .info-item {
    margin-bottom: 0.75rem;
  }

  .label {
    color: #666;
    font-weight: 500;
    margin-right: 0.5rem;
  }

  .value {
    color: #333;
  }

  .status-form {
    margin-top: 1rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #333;
    }

    .form-group select,
    .form-group textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }

    .form-group textarea {
      min-height: 80px;
      resize: vertical;
    }

  .update-status-btn {
    background-color: #5D5CDE;
    color: white;
    border: none;
    padding: 0.75rem 1rem;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
  }

    .update-status-btn:hover:not(:disabled) {
      background-color: #4a49b8;
    }

    .update-status-btn:disabled {
      background-color: #a5a5a5;
      cursor: not-allowed;
    }

  .status-history {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .history-entry {
    display: flex;
    gap: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #f5f5f5;
  }

    .history-entry:last-child {
      border-bottom: none;
    }

  .history-status {
    display: flex;
    align-items: center;
    min-width: 120px;
  }

  .status-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    margin-right: 0.5rem;
  }

    .status-dot.status-pending {
      background-color: #f57c00;
    }

    .status-dot.status-shipped {
      background-color: #388e3c;
    }

    .status-dot.status-delivered {
      background-color: #1976d2;
    }

    .status-dot.status-cancelled {
      background-color: #d32f2f;
    }

    .status-dot.status-hold {
      background-color: #8e24aa;
    }

  .status-name {
    font-weight: 500;
  }

  .history-details {
    flex: 1;
  }

  .history-date {
    font-size: 0.9rem;
    color: #666;
    margin-bottom: 0.25rem;
  }

  .history-user {
    font-size: 0.9rem;
    color: #666;
    margin-bottom: 0.25rem;
  }

  .history-notes {
    background-color: #f9f9f9;
    padding: 0.5rem 0.75rem;
    border-radius: 4px;
    font-style: italic;
    color: #555;
  }

  .items-table {
    width: 100%;
    border-collapse: collapse;
  }

    .items-table th,
    .items-table td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #eee;
    }

    .items-table th {
      font-weight: 600;
      color: #333;
    }

  .product-cell {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .product-thumbnail {
    width: 50px;
    height: 50px;
    object-fit: cover;
    border-radius: 4px;
  }

  .product-name {
    font-weight: 500;
  }

  .total-label {
    text-align: right;
    font-weight: 600;
  }

  .total-value {
    font-weight: 600;
    font-size: 1.1rem;
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #5D5CDE;
    border-radius: 50%;
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
    padding: 1.5rem;
    background-color: #ffebee;
    color: #d32f2f;
    border-radius: 4px;
    text-align: center;
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

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .admin-page-header h1 {
      color: #e2e8f0;
    }

    .back-link {
      color: #7e7dff;
    }

    .admin-panel {
      background-color: #2d3748;
    }

    .order-header {
      border-bottom-color: #4a5568;
    }

    .order-date {
      color: #a0aec0;
    }

    .order-section h3 {
      color: #e2e8f0;
      border-bottom-color: #4a5568;
    }

    .label {
      color: #a0aec0;
    }

    .value {
      color: #e2e8f0;
    }

    .form-group label {
      color: #e2e8f0;
    }

    .form-group select,
    .form-group textarea {
      background-color: #1a202c;
      border-color: #4a5568;
      color: #e2e8f0;
    }

    .items-table th,
    .items-table td {
      border-bottom-color: #4a5568;
    }

    .items-table th {
      color: #e2e8f0;
    }

    .history-entry {
      border-bottom-color: #2a374a;
    }

    .history-date,
    .history-user {
      color: #a0aec0;
    }

    .history-notes {
      background-color: #1a202c;
      color: #cbd5e0;
    }

    /* Adjust status badge colors for dark mode */
    .status-pending {
      background-color: rgba(245, 124, 0, 0.2);
      color: #ffb74d;
    }

    .status-shipped {
      background-color: rgba(56, 142, 60, 0.2);
      color: #81c784;
    }

    .status-delivered {
      background-color: rgba(25, 118, 210, 0.2);
      color: #64b5f6;
    }

    .status-cancelled {
      background-color: rgba(211, 47, 47, 0.2);
      color: #e57373;
    }

    .status-hold {
      background-color: rgba(142, 36, 170, 0.2);
      color: #ba68c8;
    }

    .error-container {
      background-color: rgba(211, 47, 47, 0.2);
      color: #e57373;
    }
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .order-grid {
      grid-template-columns: 1fr;
    }

    .product-cell {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .items-table {
      display: block;
      overflow-x: auto;
    }
  }
</style>
