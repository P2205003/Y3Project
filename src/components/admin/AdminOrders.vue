<template>
  <div class="admin-orders">
    <div class="admin-page-header">
      <h1>Order Management</h1>
    </div>

    <!-- Filters panel -->
    <div class="admin-panel">
      <div class="filters-container">
        <div class="filter-group">
          <label for="status-filter">Status:</label>
          <select id="status-filter" v-model="filters.status" @change="applyFilters">
            <option value="">All Statuses</option>
            <option v-for="status in statusOptions" :key="status.value" :value="status.value">
              {{ status.label }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label for="start-date">From:</label>
          <input type="date"
                 id="start-date"
                 v-model="filters.startDate"
                 @change="applyFilters" />
        </div>

        <div class="filter-group">
          <label for="end-date">To:</label>
          <input type="date"
                 id="end-date"
                 v-model="filters.endDate"
                 @change="applyFilters" />
        </div>

        <button @click="resetFilters" class="reset-btn">Reset Filters</button>
      </div>
    </div>

    <!-- Orders table -->
    <div class="admin-panel">
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading orders...</p>
      </div>

      <div v-else-if="error" class="error-container">
        <p>{{ error }}</p>
        <button @click="fetchOrders" class="retry-btn">Try Again</button>
      </div>

      <table v-else-if="orders.length > 0" class="data-table">
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
            <td>{{ getUserName(order) }}</td>
            <td>{{ order.items.length }}</td>
            <td>${{ order.totalAmount.toFixed(2) }}</td>
            <td>
              <span :class="['status-badge', `status-${order.status}`]">
                {{ getStatusLabel(order.status) }}
              </span>
            </td>
            <td>
              <router-link :to="`/admin/orders/${order._id}`" class="action-btn view-btn">
                View Details
              </router-link>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="empty-state">
        <p>No orders found.</p>
        <p v-if="hasActiveFilters">Try adjusting your filters.</p>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.pages > 1" class="pagination">
        <button :disabled="pagination.page === 1"
                @click="changePage(pagination.page - 1)"
                class="page-btn">
          Previous
        </button>
        <div class="page-info">
          Page {{ pagination.page }} of {{ pagination.pages }}
        </div>
        <button :disabled="pagination.page === pagination.pages"
                @click="changePage(pagination.page + 1)"
                class="page-btn">
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'AdminOrders',
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
        },
        statusOptions: [
          { value: 'pending', label: 'Pending' },
          { value: 'shipped', label: 'Shipped' },
          { value: 'delivered', label: 'Delivered' },
          { value: 'cancelled', label: 'Cancelled' },
          { value: 'hold', label: 'On Hold' }
        ]
      };
    },
    computed: {
      hasActiveFilters() {
        return this.filters.status || this.filters.startDate || this.filters.endDate;
      }
    },
    methods: {
      async fetchOrders(page = 1) {
        this.loading = true;
        this.error = null;

        try {
          // Build query string
          let queryParams = `page=${page}&limit=${this.pagination.limit}`;

          if (this.filters.status) {
            queryParams += `&status=${this.filters.status}`;
          }

          if (this.filters.startDate && this.filters.endDate) {
            queryParams += `&startDate=${this.filters.startDate}&endDate=${this.filters.endDate}`;
          }

          const response = await fetch(`/api/orders/admin/all?${queryParams}`, {
            credentials: 'include'
          });

          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }

          const data = await response.json();
          this.orders = data.orders;
          this.pagination = data.pagination;
        } catch (error) {
          console.error('Error fetching orders:', error);
          this.error = 'Failed to load orders. Please try again.';
        } finally {
          this.loading = false;
        }
      },

      formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString();
      },

      getStatusLabel(status) {
        const statusOption = this.statusOptions.find(option => option.value === status);
        return statusOption ? statusOption.label : status;
      },

      getUserName(order) {
        // Check if userId is populated with user object
        if (order.userId && typeof order.userId === 'object') {
          // If fully populated, return full name
          if (order.userId.fullName) {
            return order.userId.fullName;
          }
          // Fallback to username if available
          if (order.userId.username) {
            return order.userId.username;
          }
        }

        // If userId is still a string (not populated), display it as 'Customer #ID'
        return `Customer #${typeof order.userId === 'string' ? order.userId.substring(0, 8) : 'Unknown'}`;
      },

      applyFilters() {
        this.pagination.page = 1; // Reset to first page when filters change
        this.fetchOrders(1);
      },

      resetFilters() {
        this.filters = {
          status: '',
          startDate: '',
          endDate: ''
        };
        this.applyFilters();
      },

      changePage(page) {
        this.fetchOrders(page);
      }
    },
    created() {
      this.fetchOrders();
    }
  };
</script>

<style scoped>
  .admin-orders {
    width: 100%;
  }

  .admin-page-header {
    margin-bottom: 1.5rem;
  }

    .admin-page-header h1 {
      margin: 0;
      font-size: 1.8rem;
      color: #20c264;
    }

  .admin-panel {
    background-color: white;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .filters-container {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: flex-end;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    min-width: 150px;
  }

    .filter-group label {
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #666;
      font-size: 0.9rem;
    }

    .filter-group select,
    .filter-group input {
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }

  .reset-btn {
    padding: 0.75rem 1rem;
    background-color: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    align-self: flex-end;
  }

    .reset-btn:hover {
      background-color: #e5e5e5;
    }

  .data-table {
    width: 100%;
    border-collapse: collapse;
  }

    .data-table th,
    .data-table td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid #eee;
    }

    .data-table th {
      font-weight: 600;
      color: #333;
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

  .action-btn {
    padding: 0.4rem 0.6rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 500;
    display: inline-block;
    text-decoration: none;
  }

  .view-btn {
    background-color: #e3f2fd;
    color: #1976d2;
  }

    .view-btn:hover {
      background-color: #bbdefb;
    }

  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 1.5rem;
    gap: 1rem;
  }

  .page-btn {
    padding: 0.5rem 1rem;
    border: 1px solid #ddd;
    background-color: white;
    border-radius: 4px;
    cursor: pointer;
  }

    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

  .page-info {
    font-size: 0.9rem;
    color: #666;
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

  .empty-state {
    text-align: center;
    padding: 2rem;
    color: #666;
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .admin-page-header h1 {
      color: #e2e8f0;
    }

    .admin-panel {
      background-color: #2d3748;
    }

    .filter-group label {
      color: #a0aec0;
    }

    .filter-group select,
    .filter-group input {
      background-color: #1a202c;
      border-color: #4a5568;
      color: #e2e8f0;
    }

    .reset-btn {
      background-color: #2d3748;
      border-color: #4a5568;
      color: #e2e8f0;
    }

      .reset-btn:hover {
        background-color: #3a4a5f;
      }

    .data-table th,
    .data-table td {
      border-bottom-color: #4a5568;
    }

    .data-table th {
      color: #e2e8f0;
    }

    .page-btn {
      background-color: #2d3748;
      border-color: #4a5568;
      color: #e2e8f0;
    }

    .page-info {
      color: #a0aec0;
    }

    .empty-state {
      color: #a0aec0;
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

    .view-btn {
      background-color: rgba(25, 118, 210, 0.2);
      color: #64b5f6;
    }

      .view-btn:hover {
        background-color: rgba(25, 118, 210, 0.3);
      }
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .filters-container {
      flex-direction: column;
      align-items: stretch;
    }

    .filter-group {
      width: 100%;
    }

    .reset-btn {
      width: 100%;
      margin-top: 1rem;
    }

    .data-table {
      display: block;
      overflow-x: auto;
    }
  }
</style>
