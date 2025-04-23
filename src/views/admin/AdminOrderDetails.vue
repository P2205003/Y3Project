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
                    class="update-status-btn button enhanced-button primary"
                    :class="{ 'is-loading': statusUpdateLoading }"
                    :disabled="statusUpdateLoading || !newStatus">
              <span class="btn-content">
                <font-awesome-icon v-if="!statusUpdateLoading" icon="save" class="btn-icon" />
                <span class="btn-text">
                  {{ statusUpdateLoading ? 'Updating...' : 'Update Status' }}
                </span>
                <!-- Optional: Add a simple CSS spinner for loading state -->
                <span v-if="statusUpdateLoading" class="btn-spinner"></span>
              </span>
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

  /* Back Link in Header */
  .admin-page-header .back-link {
    color: var(--primary);
    text-decoration: none;
    font-size: 0.9rem;
    font-weight: 600;
    transition: color var(--transition-fast);
    display: inline-block; /* Needed for margin */
    margin-bottom: 0.75rem; /* Space below link */
  }

    .admin-page-header .back-link:hover {
      text-decoration: underline;
      color: #3dbbab; /* Darker primary */
    }

  /* Order Header Section within the Panel */
  .order-header {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem 1.5rem;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-color);
  }

  .order-id {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-dark);
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .order-date {
    font-size: 0.9rem;
    color: var(--text-muted);
  }

  /* Grid Layout for Main Info Sections */
  .order-grid {
    display: grid;
    grid-template-columns: 1fr; /* Default: single column */
    gap: 2rem;
    margin-bottom: 2rem;
  }

  @media (min-width: 768px) {
    .order-grid {
      grid-template-columns: repeat(2, 1fr); /* Two columns on larger screens */
      gap: 2.5rem;
    }
  }

  /* Styling for Individual Sections */
  .order-section {
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid var(--border-color);
  }

    .order-section:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .order-section h3 {
      margin-top: 0;
      margin-bottom: 1rem;
      font-size: 1.1rem;
      color: var(--text-dark);
      font-weight: 600;
      position: relative;
      padding-bottom: 0.5rem;
    }

      .order-section h3::after {
        content: '';
        position: absolute;
        left: 0;
        bottom: 0;
        width: 40px;
        height: 2px;
        background-color: var(--primary);
      }

  /* Customer/Shipping Info Items */
  .info-item {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 0.5rem;
    font-size: 0.95rem;
    margin-bottom: 0.75rem;
    line-height: 1.5;
  }

    .info-item .label {
      font-weight: 600;
      color: var(--text-dark);
      min-width: 120px;
      flex-shrink: 0;
    }

    .info-item .value {
      color: var(--text-muted);
      flex-grow: 1;
    }

  /* Status Update Form */
  .status-form {
    /* Uses .form-group styles from main.css */
  }

    .status-form .form-group {
      margin-bottom: 1rem; /* Reduced margin */
    }

    .status-form textarea {
      min-height: 80px;
      resize: vertical;
    }

  .update-status-btn {
    /* Inherits from .button.enhanced-button.primary */
    min-width: 150px; /* Ensure a decent minimum size */
    transition: all var(--transition-fast), background-color 0.4s ease; /* Smoother bg transition */
    position: relative; /* For spinner positioning */
    overflow: hidden; /* Hide overflow if needed */
  }

    /* Align icon and text */
    .update-status-btn .btn-content {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.6em; /* Spacing between icon and text */
      width: 100%; /* Ensure content fills button */
    }

    .update-status-btn .btn-icon {
      font-size: 0.95em; /* Slightly smaller icon */
      line-height: 1; /* Prevent extra space */
    }

    /* Loading State Adjustments */
    .update-status-btn.is-loading {
      cursor: wait; /* Indicate waiting */
      background-color: #3dbbab; /* Use the hover color */
      /* Slightly reduce opacity to differ from normal disabled */
      opacity: 0.8;
      box-shadow: none;
      transform: none;
    }

      .update-status-btn.is-loading:hover {
        /* Prevent hover effects during loading */
        transform: none;
        box-shadow: none;
      }

    /* Optional: CSS Spinner (if you added the .btn-spinner span) */
    .update-status-btn .btn-spinner {
      display: inline-block;
      width: 1em; /* Size relative to font size */
      height: 1em;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: var(--white);
      border-radius: 50%;
      animation: admin-spin 0.8s linear infinite; /* Reuse admin spin */
      margin-left: 0.6em; /* Space from text */
    }

  @media (min-width: 768px) {
    .update-status-btn {
      width: auto; /* Auto width on larger screens */
    }
  }


  /* Status History Styling */
  .status-history {
    margin-top: 1rem;
    position: relative;
    padding-left: 25px; /* Space for dots and line */
  }

    .status-history::before {
      content: '';
      position: absolute;
      left: 7px; /* Align with center of dots */
      top: 10px;
      bottom: 10px;
      width: 2px;
      background-color: var(--border-color);
    }

  .history-entry {
    position: relative;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
  }

    .history-entry:last-child {
      margin-bottom: 0;
      padding-bottom: 0;
    }

  .history-status {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .status-dot {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background-color: var(--bg-off-light); /* Default dot color */
    border: 2px solid var(--border-color); /* Default border */
    position: absolute;
    left: -21px; /* Position over the timeline */
    top: 2px;
    z-index: 1; /* Above the line */
    box-sizing: border-box;
  }
    /* Status Dot Colors (using status badge definitions) */
    .status-dot.status-pending {
      background-color: #fff3cd;
      border-color: #ffe69c;
    }

    .status-dot.status-shipped {
      background-color: #cfe2ff;
      border-color: #b6d4fe;
    }

    .status-dot.status-delivered {
      background-color: #d1e7dd;
      border-color: #badbcc;
    }

    .status-dot.status-cancelled {
      background-color: #f8d7da;
      border-color: #f5c2c7;
    }

    .status-dot.status-hold {
      background-color: #e2e3e5;
      border-color: #d3d6d8;
    }


  .status-name {
    font-weight: 600;
    font-size: 1rem;
    color: var(--text-dark);
  }

  .history-details {
    font-size: 0.85rem;
    color: var(--text-muted);
    line-height: 1.5;
    padding-left: 2px; /* Align with text */
  }

  .history-date {
    font-weight: 500;
    margin-bottom: 0.25rem;
  }

  .history-user {
    margin-bottom: 0.25rem;
  }

  .history-notes {
    font-style: italic;
    margin-top: 0.3rem;
    padding-left: 1em;
    border-left: 2px solid var(--bg-off-light);
  }

  /* Order Items Table */
  .items-table {
    /* Inherits .data-table styles */
    margin-top: 1rem;
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }

    .items-table th,
    .items-table td {
      padding: 0.9rem 1rem;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
      vertical-align: middle;
    }

    .items-table th {
      font-weight: 600;
      color: var(--text-muted);
      background-color: var(--bg-off-light);
      text-transform: uppercase;
      font-size: 0.8rem;
      letter-spacing: 0.5px;
    }

    .items-table tbody tr:last-child td {
      /* If using tfoot, this is not needed */
      /* border-bottom: none; */
    }

    .items-table tbody tr:hover td {
      background-color: var(--bg-off-light);
    }

    /* Product Cell Styling */
    .items-table .product-cell {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

  .product-thumbnail {
    width: 50px;
    height: 50px;
    object-fit: cover;
    border-radius: var(--border-radius-small);
    border: 1px solid var(--border-color);
    background-color: var(--bg-light);
  }

  .product-name {
    font-weight: 600;
    color: var(--text-dark);
  }

  /* Table Footer */
  .items-table tfoot td {
    border-top: 2px solid var(--border-color);
    font-weight: 700;
    font-size: 1rem;
  }

  .items-table .total-label {
    text-align: right;
    color: var(--text-dark);
    padding-right: 0.5rem;
  }

  .items-table .total-value {
    color: var(--primary);
  }

  /* Responsive Adjustments */
  @media (max-width: 768px) {
    .order-id {
      font-size: 1.3rem;
    }

    .order-header {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
