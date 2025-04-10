<template>
  <div class="admin-orders">
    <h2>Order Management</h2>

    <!-- Filter controls -->
    <div class="filter-controls">
      <div class="filter-group">
        <label for="statusFilter">Status:</label>
        <select id="statusFilter" v-model="filters.status" @change="fetchOrders(1)">
          <option value="">All Statuses</option>
          <option v-for="status in statusOptions" :key="status.value" :value="status.value">
            {{ status.label }}
          </option>
        </select>
      </div>

      <div class="date-range-filters">
        <div class="filter-group">
          <label for="startDate">From:</label>
          <input type="date"
                 id="startDate"
                 v-model="filters.startDate"
                 @change="handleDateChange">
        </div>

        <div class="filter-group">
          <label for="endDate">To:</label>
          <input type="date"
                 id="endDate"
                 v-model="filters.endDate"
                 @change="handleDateChange">
        </div>
      </div>

      <button @click="resetFilters" class="reset-btn">Reset Filters</button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-container">
      <div class="loader"></div>
      <p>Loading orders...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-container">
      <p>{{ error }}</p>
      <button @click="fetchOrders()" class="retry-btn">Try Again</button>
    </div>

    <!-- Empty state -->
    <div v-else-if="!orders.length" class="empty-state">
      <h3>No Orders Found</h3>
      <p>No orders match your current filter criteria.</p>
    </div>

    <!-- Orders table -->
    <div v-else class="orders-table-container">
      <table class="orders-table">
        <thead>
          <tr>
            <th>Order #</th>
            <th>Date</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Total</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order._id">
            <td>{{ order.orderNumber }}</td>
            <td>{{ formatDate(order.purchaseDate) }}</td>
            <td>{{ order.userId }}</td>
            <td>{{ order.items.length }}</td>
            <td>${{ order.totalAmount.toFixed(2) }}</td>
            <td>
              <span :class="['status-badge', `status-${order.status}`]">
                {{ getStatusLabel(order.status) }}
              </span>
            </td>
            <td>
              <router-link :to="{ name: 'OrderDetails', params: { id: order._id } }">
                <button class="view-btn">View Details</button>
              </router-link>
            </td>
          </tr>
        </tbody>
      </table>

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
  name: 'AdminOrderManagement',
  data() {
    return {
      orders: [],
      loading: true,
      error: null,
      filters: {
        status: '',
        startDate: '',
        endDate: ''
      },
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 1
      }
    };
  },
  computed: {
    statusOptions() {
      return orderService.getStatusOptions();
    }
  },
  created() {
    this.fetchOrders();
  },
  methods: {
    async fetchOrders(page = 1) {
      this.loading = true;
      this.error = null;

      try {
        const result = await orderService.getAllOrders(
          this.filters,
          page,
          this.pagination.limit
        );

        this.orders = result.orders;
        this.pagination = result.pagination;
      } catch (error) {
        this.error = 'Failed to load orders. Please try again.';
        console.error('Error fetching admin orders:', error);
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
    handleDateChange() {
      // Only fetch if both dates are set or both are empty
      if (
        (this.filters.startDate && this.filters.endDate) ||
        (!this.filters.startDate && !this.filters.endDate)
      ) {
        this.fetchOrders(1);
      }
    },
    resetFilters() {
      this.filters = {
        status: '',
        startDate: '',
        endDate: ''
      };
      this.fetchOrders(1);
    }
  }
};
</script>

<style scoped>
  .admin-orders {
    width: 100%;
  }

  h2 {
    margin-bottom: 1.5rem;
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
    align-items: flex-end;
  }

  .date-range-filters {
    display: flex;
    gap: 1rem;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    min-width: 150px;
  }

    .filter-group label {
      margin-bottom: 0.5rem;
      font-weight: 600;
      font-size: 0.9rem;
      color: #666;
    }

  select, input[type="date"] {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: white;
    font-size: 1rem;
  }

  .reset-btn {
    padding: 0.5rem 1rem;
    background-color: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    height: 38px;
  }

    .reset-btn:hover {
      background-color: #e0e0e0;
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
    background-color: #f9f9f9;
    border-radius: 8px;
  }

    .empty-state h3 {
      margin-bottom: 1rem;
      color: #333;
    }

    .empty-state p {
      color: #666;
    }

  /* Orders table */
  .orders-table-container {
    width: 100%;
    overflow-x: auto;
  }

  .orders-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1.5rem;
  }

    .orders-table th,
    .orders-table td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid #eee;
    }

    .orders-table th {
      background-color: #f5f5f5;
      font-weight: 600;
      color: #333;
    }

    .orders-table tr:hover {
      background-color: #f9f9f9;
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

  .view-btn {
    padding: 0.4rem 0.75rem;
    background-color: #5D5CDE;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
  }

    .view-btn:hover {
      background-color: #4a49b8;
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
  @media (max-width: 768px) {
    .filter-controls {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }

    .date-range-filters {
      flex-direction: column;
      gap: 1rem;
    }

    .filter-group {
      width: 100%;
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .admin-orders {
      color: #e0e0e0;
    }

    h2, h3 {
      color: #e0e0e0;
    }

    .filter-controls {
      background-color: #1e1e1e;
    }

    .filter-group label {
      color: #bbb;
    }

    select, input[type="date"] {
      background-color: #333;
      border-color: #444;
      color: #e0e0e0;
    }

    .reset-btn {
      background-color: #333;
      border-color: #444;
      color: #e0e0e0;
    }

      .reset-btn:hover {
        background-color: #444;
      }

    .orders-table th {
      background-color: #262626;
      color: #e0e0e0;
    }

    .orders-table td {
      border-bottom-color: #333;
    }

    .orders-table tr:hover {
      background-color: #1a1a1a;
    }

    .empty-state {
      background-color: #1e1e1e;
    }

      .empty-state p {
        color: #bbb;
      }

    .error-container {
      background-color: #2c1515;
    }

    .pagination-btn {
      background-color: #262626;
      border-color: #444;
      color: #7e7dff;
    }

      .pagination-btn:hover:not(:disabled) {
        background-color: #333;
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
