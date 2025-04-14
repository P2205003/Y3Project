<template>
  <div class="admin-order-management">
    <!-- Page Header -->
    <div class="admin-page-header">
      <h1>Order Management</h1>
      <!-- Optional: Add a refresh button or other actions here -->
      <button @click="fetchOrders(pagination.page, true)" class="button enhanced-button secondary" :disabled="loading">
        <font-awesome-icon icon="rotate-right" :spin="loading" /> Refresh Orders
      </button>
    </div>

    <!-- Filters Panel -->
    <div class="admin-panel filters-panel">
      <h2 class="panel-title">
        <font-awesome-icon icon="filter" /> Filter & Search Orders
      </h2>
      <div class="filters-grid order-filters-grid">
        <!-- Status Filter -->
        <div class="filter-group">
          <label for="order-status-filter">Status</label>
          <select id="order-status-filter" v-model="filters.status" @change="applyFilters" class="enhanced-input" :disabled="loading">
            <option value="">All Statuses</option>
            <option v-for="status in statusOptions" :key="status.value" :value="status.value">
              {{ status.label }}
            </option>
          </select>
        </div>

        <!-- Date Range Filter -->
        <div class="filter-group">
          <label for="start-date">Date From</label>
          <input type="date" id="start-date" v-model="filters.startDate" @change="applyFilters" class="enhanced-input" :disabled="loading" :max="filters.endDate || today" />
        </div>
        <div class="filter-group">
          <label for="end-date">Date To</label>
          <input type="date" id="end-date" v-model="filters.endDate" @change="applyFilters" class="enhanced-input" :disabled="loading" :min="filters.startDate" :max="today" />
        </div>

        <!-- Reset Button -->
        <div class="filter-group reset-group">
          <button @click="resetFilters" class="button enhanced-button secondary reset-btn" :disabled="loading || !hasActiveFilters">
            <font-awesome-icon icon="times-circle" /> Reset Filters
          </button>
        </div>
      </div>
    </div>

    <!-- Orders Table Panel -->
    <div class="admin-panel orders-table-panel">
      <transition name="fade-fast" mode="out-in">
        <!-- Loading State -->
        <div v-if="loading && !orders.length" key="loading" class="loading-container orders-loading">
          <div class="loading-spinner"></div>
          <p>Loading orders...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" key="error" class="message-container error-container">
          <font-awesome-icon icon="exclamation-triangle" class="message-icon error-icon" />
          <h2>Failed to Load Orders</h2>
          <p>{{ error }}</p>
          <button @click="fetchOrders(1)" class="button enhanced-button primary retry-btn">
            <font-awesome-icon icon="rotate-right" /> Try Again
          </button>
        </div>

        <!-- Table / Empty State Wrapper -->
        <div v-else key="content">
          <!-- Table Wrapper for Responsiveness -->
          <div class="table-wrapper">
            <table v-if="orders.length > 0" class="data-table orders-data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th class="text-center">Items</th>
                  <th class="text-right">Total</th>
                  <th class="text-center">Status</th>
                  <th class="text-center actions-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in orders" :key="order._id" class="order-row">
                  <!-- Order # -->
                  <td data-label="Order #" class="order-number-cell" :title="order.orderNumber">
                    <router-link :to="{ name: 'AdminOrderDetails', params: { id: order._id } }">
                      {{ order.orderNumber }}
                    </router-link>
                  </td>
                  <!-- Date -->
                  <td data-label="Date">{{ formatDate(order.purchaseDate) }}</td>
                  <!-- Customer -->
                  <td data-label="Customer" class="customer-cell" :title="getCustomerTooltip(order)">
                    <span class="customer-name">{{ getUserName(order) }}</span>
                    <span v-if="order.userId?.email" class="customer-email">{{ order.userId.email }}</span>
                  </td>
                  <!-- Items -->
                  <td data-label="Items" class="items-cell text-center">
                    {{ getTotalQuantity(order) }}
                    <span class="item-count-detail"> ({{ order.items.length }} type{{ order.items.length !== 1 ? 's' : '' }})</span>
                  </td>
                  <!-- Total -->
                  <td data-label="Total" class="price-cell text-right">${{ order.totalAmount.toFixed(2) }}</td>
                  <!-- Status -->
                  <td data-label="Status" class="text-center">
                    <span :class="['status-badge', `status-badge--${order.status}`]" :title="`Status: ${getStatusLabel(order.status)}`">
                      {{ getStatusLabel(order.status) }}
                    </span>
                  </td>
                  <!-- Actions -->
                  <td data-label="Actions" class="actions-cell text-center">
                    <router-link :to="{ name: 'AdminOrderDetails', params: { id: order._id } }" class="action-btn view-btn" title="View Order Details">
                      <font-awesome-icon icon="eye" />
                      <span class="action-label">Details</span>
                    </router-link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div> <!-- End Table Wrapper -->
          <!-- Empty State (if no orders match filters) -->
          <div v-if="orders.length === 0" class="message-container empty-container">
            <font-awesome-icon icon="search-minus" class="message-icon empty-icon" />
            <h2>No Orders Match Filters</h2>
            <p>Try adjusting your status or date range, or <button @click="resetFilters" class="link-button">reset all filters</button>.</p>
          </div>

          <!-- Pagination -->
          <nav v-if="pagination.pages > 1"
               class="pagination-container standalone-pagination orders-pagination"
               aria-label="Orders pagination">
            <ul class="pagination">
              <li class="page-item" :class="{ disabled: pagination.page === 1 }">
                <button class="page-link enhanced-page-link page-btn-icon" @click="changePage(pagination.page - 1)" :disabled="pagination.page === 1 || loading" aria-label="Previous page">
                  <font-awesome-icon icon="chevron-left" />
                </button>
              </li>
              <li v-for="page in paginationRange"
                  :key="`page-${page}`"
                  class="page-item"
                  :class="{ active: pagination.page === page, ellipsis: page === '...' }">
                <span v-if="page === '...'" class="page-link enhanced-page-link page-link--ellipsis">...</span>
                <button v-else class="page-link enhanced-page-link" @click="changePage(page)" :disabled="loading" :aria-current="pagination.page === page ? 'page' : null">
                  {{ page }}
                </button>
              </li>
              <li class="page-item" :class="{ disabled: pagination.page === pagination.pages }">
                <button class="page-link enhanced-page-link page-btn-icon" @click="changePage(pagination.page + 1)" :disabled="pagination.page === pagination.pages || loading" aria-label="Next page">
                  <font-awesome-icon icon="chevron-right" />
                </button>
              </li>
            </ul>
          </nav>

        </div> <!-- End Content Wrapper -->
      </transition>
    </div> <!-- End Table Panel -->
  </div>
</template>

<script setup>
  import { ref, onMounted, computed, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import orderService from '@/services/orderService';
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
  import { library } from '@fortawesome/fontawesome-svg-core';
  import {
    faFilter, faTimesCircle, faRotateRight, faExclamationTriangle, faReceipt,
    faSpinner, faEye, faChevronLeft, faChevronRight, faSearchMinus // Added icons
  } from '@fortawesome/free-solid-svg-icons';

  library.add(
    faFilter, faTimesCircle, faRotateRight, faExclamationTriangle, faReceipt,
    faSpinner, faEye, faChevronLeft, faChevronRight, faSearchMinus
  );

  // --- State ---
  const orders = ref([]);
  const loading = ref(true);
  const error = ref(null);
  const filters = ref({
    status: '',
    startDate: '',
    endDate: ''
  });
  const pagination = ref({
    page: 1,
    limit: 15, // Show more items per page for orders
    total: 0,
    pages: 1
  });
  const statusOptions = ref(orderService.getStatusOptions()); // Get status options from service
  const route = useRoute();
  const router = useRouter();
  const today = new Date().toISOString().split('T')[0]; // For max date on input

  // --- Computed ---
  const hasActiveFilters = computed(() => {
    return filters.value.status || filters.value.startDate || filters.value.endDate;
  });

  const paginationRange = computed(() => {
    // Reusing the pagination range logic
    const current = pagination.value.page; const last = pagination.value.pages; if (last <= 1) return []; const delta = 1; const left = current - delta; const right = current + delta + 1; const range = []; const rangeWithDots = []; for (let i = 1; i <= last; i++) { if (i === 1 || i === last || (i >= left && i < right)) { range.push(i); } } let l; for (const i of range) { if (l) { if (i - l === 2) rangeWithDots.push(l + 1); else if (i - l !== 1) rangeWithDots.push('...'); } rangeWithDots.push(i); l = i; } return rangeWithDots.filter((item, index, arr) => item !== '...' || arr[index - 1] !== '...');
  });

  // --- Methods ---
  const fetchOrders = async (page = 1, isManualRefresh = false) => {
    if (!isManualRefresh) {
      loading.value = true; // Only show full loading on initial/page change
    } else {
      // Maybe show a subtle refresh indicator instead of full page load
      console.log("Manual refresh triggered");
    }
    error.value = null;

    // Update URL query parameters
    const queryParams = { page };
    if (filters.value.status) queryParams.status = filters.value.status;
    if (filters.value.startDate) queryParams.startDate = filters.value.startDate;
    if (filters.value.endDate) queryParams.endDate = filters.value.endDate;
    // Only replace route if query params actually changed or page changed
    if (JSON.stringify(route.query) !== JSON.stringify(queryParams)) {
      router.replace({ query: queryParams }).catch(err => {
        if (err.name !== 'NavigationDuplicated') console.error('Router replace error:', err);
      });
    }

    try {
      const result = await orderService.getAllOrders(
        { status: filters.value.status, startDate: filters.value.startDate, endDate: filters.value.endDate },
        page,
        pagination.value.limit
      );
      orders.value = result.orders;
      pagination.value = result.pagination;
    } catch (err) {
      error.value = 'Failed to load orders. Please try again.';
      console.error('Error fetching admin orders:', err);
      // Don't clear orders on subsequent load errors if some were previously loaded
      if (page === 1) {
        orders.value = [];
        pagination.value = { page: 1, limit: 15, total: 0, pages: 1 };
      }
    } finally {
      loading.value = false;
    }
  };

  const applyFilters = () => {
    fetchOrders(1); // Reset to page 1 when filters change
  };

  const resetFilters = () => {
    filters.value = { status: '', startDate: '', endDate: '' };
    fetchOrders(1); // Fetch with reset filters
  };

  const changePage = (page) => {
    if (page >= 1 && page <= pagination.value.pages && !loading.value) {
      fetchOrders(page);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    // Simple date format for the table
    return new Date(dateString).toLocaleDateString('en-CA'); // YYYY-MM-DD format
  };

  const getStatusLabel = (statusValue) => {
    const status = statusOptions.value.find(s => s.value === statusValue);
    return status ? status.label : statusValue;
  };

  const getUserName = (order) => {
    if (order.userId && typeof order.userId === 'object') {
      return order.userId.fullName || order.userId.username || 'Unknown';
    }
    return `User ID: ${typeof order.userId === 'string' ? order.userId.substring(0, 8) + '...' : 'Unknown'}`;
  };

  const getCustomerTooltip = (order) => {
    if (order.userId && typeof order.userId === 'object') { let parts = []; if (order.userId.fullName) parts.push(order.userId.fullName); if (order.userId.username) parts.push(`(@${order.userId.username})`); if (order.userId.email) parts.push(order.userId.email); return parts.join(' '); } return `User ID: ${order.userId}`;
  };

  const getTotalQuantity = (order) => {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  // Read initial filters from URL on mount
  const readFiltersFromURL = () => {
    filters.value.status = route.query.status || '';
    filters.value.startDate = route.query.startDate || '';
    filters.value.endDate = route.query.endDate || '';
    return parseInt(route.query.page) || 1;
  };

  // --- Lifecycle ---
  onMounted(() => {
    const initialPage = readFiltersFromURL();
    fetchOrders(initialPage);
  });

  // Watch route query changes (e.g., browser back/forward)
  watch(() => route.query, (newQuery) => {
    const needsRefetch =
      (newQuery.page || '1') !== String(pagination.value.page) ||
      (newQuery.status || '') !== filters.value.status ||
      (newQuery.startDate || '') !== filters.value.startDate ||
      (newQuery.endDate || '') !== filters.value.endDate;

    if (needsRefetch) {
      const newPage = readFiltersFromURL();
      fetchOrders(newPage);
    }
  }, { deep: true });

</script>

<style scoped>
  /* Use styles from main.css where possible */
  .admin-order-management {
    width: 100%;
  }
  /* .admin-page-header, .admin-panel, .panel-title, .data-table, etc */

  /* Filter Panel Specifics */
  .filters-panel .panel-title svg {
    margin-right: 0.5em;
  }

  .order-filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); /* Adjust min width */
    gap: 1rem 1.5rem; /* Row gap, Column gap */
    align-items: end;
  }

  .filter-group {
    min-width: 150px; /* Prevent excessive shrinking */
  }

  .reset-group {
    grid-column: span 1 / -1; /* Span remaining columns */
    justify-self: end; /* Push button to the right */
    margin-top: 0.5rem; /* Add space when it wraps below */
  }

  .reset-btn {
    width: auto;
    min-width: 140px;
  }

    .reset-btn svg {
      margin-right: 0.4em;
    }

  /* Table Styles */
  .orders-data-table {
    /* Ensure table respects panel padding */
    margin: 0 -1.5rem -1.5rem; /* Offset panel padding */
    width: calc(100% + 3rem);
    max-width: calc(100% + 3rem);
    border-top: 1px solid var(--border-color); /* Add top border */
  }

  .table-wrapper {
    overflow-x: auto; /* Enable horizontal scroll on wrapper */
    width: 100%;
  }

  .orders-data-table th,
  .orders-data-table td {
    vertical-align: middle;
    white-space: nowrap; /* Prevent wrapping in most cells */
  }

    .orders-data-table th.actions-header {
      width: 1%; /* Prevent actions column from taking too much space */
    }

  .order-number-cell a {
    color: var(--primary);
    text-decoration: none;
    font-weight: 600;
  }

    .order-number-cell a:hover {
      text-decoration: underline;
    }

  .customer-cell {
    max-width: 250px; /* Limit width */
    white-space: normal; /* Allow wrapping for customer */
    vertical-align: top; /* Align top if wraps */
  }

  .customer-name {
    font-weight: 500;
    display: block; /* Ensure email below */
  }

  .customer-email {
    display: block;
    font-size: 0.85rem;
    color: var(--text-muted);
    font-weight: 400;
    margin-top: 0.1rem;
  }

  .items-cell .item-count-detail {
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .price-cell {
    font-weight: 500;
  }

  .actions-cell {
    white-space: nowrap;
  }
    /* Prevent actions wrapping */
    .actions-cell .action-btn {
      margin: 0 0.15rem; /* Tighter spacing */
    }

    .actions-cell .action-label {
      display: none;
    }
  /* Icon only by default */

  @media (min-width: 768px) {
    .actions-cell .action-label {
      display: inline;
      margin-left: 0.4em;
    }
    /* Show label on larger screens */
  }

  /* Pagination Styles */
  .orders-pagination {
    margin-top: 2rem; /* Add space above pagination */
    /* Inherits base styles from main.css */
  }

  .page-btn-icon { /* Style for icon-only buttons */
    padding: 0.5rem;
    min-width: 38px;
  }

  /* Empty State Enhancements */
  .empty-container .message-icon {
    font-size: 3.5rem;
  }

  .link-button {
    background: none;
    border: none;
    padding: 0;
    color: var(--primary);
    font-weight: 600;
    cursor: pointer;
    text-decoration: underline;
    font-size: inherit;
  }

  /* Mobile Table Styles */
  @media (max-width: 992px) {
    /* Apply card-like styles to rows */
    .orders-data-table thead {
      display: none;
    }

    .orders-data-table tbody tr {
      display: block;
      margin-bottom: 1.5rem;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-small);
      overflow: hidden;
      box-shadow: var(--shadow-soft);
      background: var(--white);
    }

    .orders-data-table tbody td {
      display: flex; /* Use flex for better alignment */
      justify-content: space-between; /* Align label and value */
      align-items: center;
      text-align: right !important; /* Value aligns right */
      border-bottom: 1px dotted var(--border-color);
      padding: 0.75rem 1rem; /* Adjust padding */
      position: relative;
      white-space: normal;
    }

      .orders-data-table tbody td::before {
        content: attr(data-label);
        font-weight: 600;
        color: var(--text-muted);
        text-transform: uppercase;
        font-size: 0.7rem;
        margin-right: 1rem; /* Space between label and value */
        text-align: left;
        white-space: nowrap;
      }

    .orders-data-table tbody tr td:last-child {
      border-bottom: none;
    }

    /* Center content for specific cells in mobile view */
    .orders-data-table .items-cell,
    .orders-data-table .status-cell,
    .orders-data-table .actions-cell {
      justify-content: flex-end; /* Default align value right */
    }

      .orders-data-table .status-cell::before,
      .orders-data-table .actions-cell::before {
        width: auto; /* Let label take natural width */
        flex-shrink: 0;
      }

      .orders-data-table .status-cell .status-badge {
        margin-left: auto; /* Push badge right */
      }

      .orders-data-table .actions-cell .action-btn {
        margin: 0.2rem 0; /* Stack buttons slightly */
      }

    .actions-cell .action-label {
      display: inline;
    }
    /* Ensure label shows on mobile card */
  }

  @media (max-width: 576px) {
    .order-filters-grid {
      grid-template-columns: 1fr;
    }
    /* Stack filters */
    .reset-group {
      justify-self: stretch;
    }

    .reset-btn {
      width: 100%;
    }
  }
</style>
