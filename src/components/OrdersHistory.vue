<!-- src/components/OrdersHistory.vue -->
<template>
  <div class="orders-history">
    <h1>My Orders</h1>

    <!-- Status filter -->
    <div class="filter-controls">
      <div class="filter-group">
        <label for="status-filter">Filter by Status:</label>
        <select id="status-filter"
                v-model="statusFilter"
                @change="fetchOrders(1)">
          <option value="">All Orders</option>
          <option v-for="status in statusOptions" :key="status.value" :value="status.value">
            {{ status.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-container">
      <div class="loader"></div>
      <p>Loading your orders...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-container">
      <p>{{ error }}</p>
      <button @click="fetchOrders()" class="retry-btn">Try Again</button>
    </div>

    <!-- Empty state -->
    <div v-else-if="!orders.length" class="empty-state">
      <div class="empty-icon">📦</div>
      <h2>No Orders Found</h2>
      <p v-if="statusFilter">You don't have any {{ getStatusLabel(statusFilter) }} orders.</p>
      <p v-else>You haven't placed any orders yet.</p>
      <router-link to="/" class="btn-primary">Start Shopping</router-link>
    </div>

    <!-- Orders list -->
    <div v-else class="orders-container">
      <div v-for="order in orders" :key="order._id" class="order-card">
        <div class="order-header">
          <div>
            <h3>Order #{{ order.orderNumber }}</h3>
            <div class="order-date">
              {{ formatDate(order.purchaseDate) }}
            </div>
          </div>
          <div class="order-status">
            <span :class="['status-badge', `status-${order.status}`]">
              {{ getStatusLabel(order.status) }}
            </span>
          </div>
        </div>

        <div class="order-summary">
          <div class="order-summary-item">
            <span class="label">Items:</span>
            <span class="value">{{ order.items.length }}</span>
          </div>
          <div class="order-summary-item">
            <span class="label">Total:</span>
            <span class="value">${{ order.totalAmount.toFixed(2) }}</span>
          </div>
          <div class="order-summary-item">
            <span class="label">Status Updated:</span>
            <span class="value">{{ getStatusDate(order) }}</span>
          </div>
        </div>

        <div class="order-actions">
          <router-link :to="{ name: 'OrderDetails', params: { id: order._id } }"
                       class="btn-secondary">
            View Details
          </router-link>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.pages > 1" class="pagination">
        <button :disabled="pagination.page === 1"
                @click="fetchOrders(pagination.page - 1)"
                class="pagination-btn">
          Previous
        </button>
        <span class="pagination-info">
          Page {{ pagination.page }} of {{ pagination.pages }}
        </span>
        <button :disabled="pagination.page === pagination.pages"
                @click="fetchOrders(pagination.page + 1)"
                class="pagination-btn">
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import orderService from '@/services/orderService';

export default {
  name: 'OrdersHistory',
  data() {
    return {
      orders: [],
      loading: true,
      error: null,
      statusFilter: '',
      statusOptions: orderService.getStatusOptions(),
      pagination: {
        page: 1,
        limit: 5,
        total: 0,
        pages: 1
      }
    };
  },
  created() {
    // Check for status filter in query params
    if (this.$route.query.status) {
      this.statusFilter = this.$route.query.status;
    }

    this.fetchOrders();
  },
  methods: {
    async fetchOrders(page = 1) {
      this.loading = true;
      this.error = null;

      try {
        // Update URL with current filter (without page reload)
        if (this.statusFilter) {
          this.$router.replace({
            query: { ...this.$route.query, status: this.statusFilter }
          });
        } else {
          // Remove status param if filter cleared
          const query = { ...this.$route.query };
          delete query.status;
          this.$router.replace({ query });
        }

        const result = await orderService.getOrders(
          this.statusFilter,
          page,
          this.pagination.limit
        );

        this.orders = result.orders;
        this.pagination = result.pagination;
      } catch (error) {
        this.error = 'Failed to load your orders. Please try again.';
        console.error('Error fetching orders:', error);
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
    getStatusDate(order) {
      // Find the most recent status date
      if (order.status && order.statusDates && order.statusDates[order.status]) {
        return this.formatDate(order.statusDates[order.status]);
      }
      return this.formatDate(order.updatedAt || order.purchaseDate);
    }
  }
};
</script>

<style scoped>
  .orders-history {
    max-width: 1000px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }

  h1 {
    text-align: center;
    margin-bottom: 2rem;
    color: #333;
  }

  /* Filter controls */
  .filter-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    margin-bottom: 2rem;
    padding: 1rem;
    background-color: #f5f5f5;
    border-radius: 8px;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    min-width: 200px;
  }

    .filter-group label {
      margin-bottom: 0.5rem;
      font-weight: 600;
      font-size: 0.9rem;
      color: #666;
    }

  select {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: white;
    font-size: 1rem;
  }

  /* Loading state */
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

  /* Error state */
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

  /* Empty state */
  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .empty-state h2 {
    margin-bottom: 1rem;
    color: #333;
  }

  .empty-state p {
    margin-bottom: 2rem;
    color: #666;
  }

  /* Orders container */
  .orders-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  /* Order card */
  .order-card {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    overflow: hidden;
  }

  .order-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem;
    border-bottom: 1px solid #eee;
  }

    .order-header h3 {
      margin: 0;
      font-size: 1.2rem;
      color: #333;
    }

  .order-date {
    font-size: 0.9rem;
    color: #666;
    margin-top: 0.25rem;
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

  .order-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    padding: 1.25rem;
    border-bottom: 1px solid #eee;
  }

  .order-summary-item {
    display: flex;
    flex-direction: column;
  }

    .order-summary-item .label {
      font-size: 0.85rem;
      color: #666;
      margin-bottom: 0.25rem;
    }

    .order-summary-item .value {
      font-weight: 600;
      color: #333;
    }

  .order-actions {
    padding: 1.25rem;
    display: flex;
    justify-content: flex-end;
  }

  /* Button styles */
  .btn-primary, .btn-secondary {
    display: inline-block;
    padding: 0.6rem 1.25rem;
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

    .btn-primary:hover {
      background-color: #4a49b8;
    }

  .btn-secondary {
    background-color: white;
    color: #5D5CDE;
    border: 1px solid #5D5CDE;
  }

    .btn-secondary:hover {
      background-color: #f5f5ff;
    }

  /* Pagination */
  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 2rem;
    gap: 1rem;
  }

  .pagination-btn {
    padding: 0.5rem 1rem;
    background-color: white;
    color: #5D5CDE;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
  }

    .pagination-btn:hover:not(:disabled) {
      background-color: #f5f5ff;
      border-color: #5D5CDE;
    }

    .pagination-btn:disabled {
      color: #ccc;
      cursor: not-allowed;
    }

  .pagination-info {
    color: #666;
  }

  /* Responsive adjustments */
  @media (max-width: 600px) {
    .order-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .order-status {
      align-self: flex-start;
    }

    .order-summary {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }

    .filter-controls {
      flex-direction: column;
      gap: 1rem;
    }

    .filter-group {
      width: 100%;
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .orders-history {
      color: #e0e0e0;
    }

    h1, h2 {
      color: #e0e0e0;
    }

    .filter-controls {
      background-color: #1e1e1e;
    }

    .filter-group label {
      color: #bbb;
    }

    select {
      background-color: #333;
      border-color: #444;
      color: #e0e0e0;
    }

    .order-card {
      background-color: #1e1e1e;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }

    .order-header {
      border-bottom-color: #333;
    }

      .order-header h3 {
        color: #e0e0e0;
      }

    .order-date {
      color: #bbb;
    }

    .order-summary {
      border-bottom-color: #333;
    }

    .order-summary-item .label {
      color: #bbb;
    }

    .order-summary-item .value {
      color: #e0e0e0;
    }

    .error-container {
      background-color: #2c1515;
    }

    .btn-secondary {
      background-color: #1e1e1e;
    }

      .btn-secondary:hover {
        background-color: #2a2a2a;
      }

    .pagination-btn {
      background-color: #1e1e1e;
      border-color: #444;
    }

      .pagination-btn:hover:not(:disabled) {
        background-color: #2a2a2a;
      }

      .pagination-btn:disabled {
        color: #666;
      }

    .pagination-info {
      color: #bbb;
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
