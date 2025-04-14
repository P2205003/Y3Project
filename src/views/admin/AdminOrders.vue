<template>
  <div class="admin-orders">
    <!-- Page Header -->
    <div class="admin-page-header">
      <h1>Order Management</h1>
      <!-- Optional: Add button for creating manual orders if needed -->
      <!-- <button class="button enhanced-button primary">Create Manual Order</button> -->
    </div>

    <!-- Filters Panel -->
    <div class="admin-panel filters-panel">
      <h2 class="panel-title">
        <font-awesome-icon icon="filter" /> Filter Orders
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
          <input type="date" id="start-date" v-model="filters.startDate" @change="applyFilters" class="enhanced-input" :disabled="loading" />
        </div>
        <div class="filter-group">
          <label for="end-date">Date To</label>
          <input type="date" id="end-date" v-model="filters.endDate" @change="applyFilters" class="enhanced-input" :disabled="loading" />
        </div>

        <!-- Reset Button -->
        <div class="filter-group reset-group">
          <button @click="resetFilters" class="button enhanced-button secondary reset-btn" :disabled="loading || !hasActiveFilters">
            <font-awesome-icon icon="times-circle" /> Reset
          </button>
        </div>
      </div>
    </div>

    <!-- Orders Table Panel -->
    <div class="admin-panel orders-table-panel">
       <transition name="fade-fast" mode="out-in">
        <!-- Loading State -->
        <div v-if="loading" key="loading" class="loading-container orders-loading">
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

        <!-- Orders Table -->
        <div v-else-if="orders.length > 0" key="table" class="table-wrapper">
          <table class="data-table orders-data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Date</th>
                <th>Customer</th>
                <th class="text-center">Items</th>
                <th class="text-right">Total</th>
                <th class="text-center">Status</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in orders" :key="order._id" class="order-row">
                <td data-label="Order #" class="order-number-cell" :title="order.orderNumber">{{ order.orderNumber }}</td>
                <td data-label="Date">{{ formatDate(order.purchaseDate) }}</td>
                <td data-label="Customer" class="customer-cell" :title="getCustomerTooltip(order)">
                  {{ getUserName(order) }}
                  <span v-if="order.userId?.email" class="customer-email">{{ order.userId.email }}</span>
                </td>
                <td data-label="Items" class="text-center">{{ getTotalQuantity(order) }}</td>
                <td data-label="Total" class="price-cell text-right">${{ order.totalAmount.toFixed(2) }}</td>
                <td data-label="Status" class="text-center">
                  <span :class="['status-badge', `status-badge--${order.status}`]">
                    {{ getStatusLabel(order.status) }}
                  </span>
                </td>
                <td data-label="Actions" class="actions-cell text-center">
                   <!-- Use router-link styled as a button -->
                   <router-link :to="{ name: 'AdminOrderDetails', params: { id: order._id } }" class="action-btn view-btn" title="View Order Details">
                      <font-awesome-icon icon="eye" />
                      <span class="action-label">Details</span>
                   </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div v-else key="empty" class="message-container empty-container">
          <font-awesome-icon icon="receipt" class="message-icon empty-icon" />
          <h2>No Orders Found</h2>
          <p v-if="hasActiveFilters">No orders match your current filters. Try <button @click="resetFilters" class="link-button">resetting them</button>.</p>
          <p v-else>There are no orders in the system yet.</p>
        </div>
      </transition>

      <!-- Pagination -->
      <nav v-if="!loading && !error && pagination.pages > 1"
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
    </div>
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
    faSpinner, faEye, faChevronLeft, faChevronRight // Added/updated icons
} from '@fortawesome/free-solid-svg-icons';

library.add(
    faFilter, faTimesCircle, faRotateRight, faExclamationTriangle, faReceipt,
    faSpinner, faEye, faChevronLeft, faChevronRight
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

// --- Computed ---
const hasActiveFilters = computed(() => {
  return filters.value.status || filters.value.startDate || filters.value.endDate;
});

const paginationRange = computed(() => {
    // Reusing the pagination range logic
    const current = pagination.value.page; const last = pagination.value.pages; if (last <= 1) return []; const delta = 1; const left = current - delta; const right = current + delta + 1; const range = []; const rangeWithDots = []; for (let i = 1; i <= last; i++) { if (i === 1 || i === last || (i >= left && i < right)) { range.push(i); } } let l; for (const i of range) { if (l) { if (i - l === 2) rangeWithDots.push(l + 1); else if (i - l !== 1) rangeWithDots.push('...'); } rangeWithDots.push(i); l = i; } return rangeWithDots.filter((item, index, arr) => item !== '...' || arr[index - 1] !== '...');
});

// --- Methods ---
const fetchOrders = async (page = 1) => {
  loading.value = true;
  error.value = null;

  // Update URL query parameters
  const queryParams = { page };
  if (filters.value.status) queryParams.status = filters.value.status;
  if (filters.value.startDate) queryParams.startDate = filters.value.startDate;
  if (filters.value.endDate) queryParams.endDate = filters.value.endDate;
  router.push({ query: queryParams }).catch(err => {
    if (err.name !== 'NavigationDuplicated') console.error('Router push error:', err);
  });

  try {
    // Fetch using the dedicated admin endpoint with filters
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
    orders.value = [];
    pagination.value = { page: 1, limit: 15, total: 0, pages: 1 };
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

// Improved function to display user info, assuming backend populates `userId`
const getUserName = (order) => {
  if (order.userId && typeof order.userId === 'object') {
    return order.userId.fullName || order.userId.username || `User ID: ${order.userId._id.substring(0, 8)}...`;
  }
  // Fallback if userId is just a string
  return `User ID: ${typeof order.userId === 'string' ? order.userId.substring(0, 8) + '...' : 'Unknown'}`;
};

const getCustomerTooltip = (order) => {
    if (order.userId && typeof order.userId === 'object') {
        let parts = [];
        if (order.userId.fullName) parts.push(order.userId.fullName);
        if (order.userId.username) parts.push(`(@${order.userId.username})`);
        if (order.userId.email) parts.push(order.userId.email);
        return parts.join(' ');
    }
    return `User ID: ${order.userId}`;
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

// Watch route changes to re-fetch if query params change externally
watch(() => route.query, (newQuery, oldQuery) => {
    // Prevent infinite loop if fetchOrders itself updates the query
    if (JSON.stringify(newQuery) !== JSON.stringify(oldQuery)) {
        const newPage = readFiltersFromURL();
        fetchOrders(newPage);
    }
}, { deep: true });

</script>

<style scoped>
/* Use styles from main.css */
.admin-orders { width: 100%; }
/* .admin-page-header, .admin-panel, .panel-title, .data-table, etc */

/* Filter Panel Specifics */
.filters-panel .panel-title svg { margin-right: 0.5em; }
.order-filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    align-items: end; /* Align bottom */
}
.reset-group {
   grid-column: span 1 / -1; /* Span remaining columns */
   justify-self: end; /* Push button to the right */
}
.reset-btn {
   width: auto; /* Fit content */
   min-width: 120px;
}
.reset-btn svg { margin-right: 0.4em; }

/* Table Styles */
.orders-data-table th,
.orders-data-table td {
  vertical-align: middle;
}
.order-number-cell {
   font-family: monospace;
   font-size: 0.85rem;
   color: var(--text-muted);
   white-space: nowrap;
}
.customer-cell {
   font-weight: 500;
   line-height: 1.3;
}
.customer-email {
    display: block;
    font-size: 0.8rem;
    color: var(--text-muted);
    font-weight: 400;
    margin-top: 0.1rem;
}
.price-cell {
   font-weight: 500;
}
.actions-cell {
   min-width: 100px;
}
.action-btn {
  padding: 0.5rem 0.8rem;
  font-size: 0.8rem;
}
.action-btn .action-label {
    margin-left: 0.4em;
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

/* Responsive Table with data-label */
@media (max-width: 992px) { /* Adjust breakpoint */
   .orders-data-table thead { display: none; }
   .orders-data-table tbody tr { display: block; margin-bottom: 1rem; border: 1px solid var(--border-color); border-radius: var(--border-radius-small); overflow: hidden; }
   .orders-data-table tbody td { display: block; text-align: right !important; /* Override alignment */ border-bottom: 1px dotted var(--border-color); padding-left: 50%; position: relative; white-space: normal; padding-top: 0.75rem; padding-bottom: 0.75rem; }
   .orders-data-table tbody td::before { content: attr(data-label); position: absolute; left: 1rem; width: calc(50% - 2rem); text-align: left; font-weight: 600; color: var(--text-muted); text-transform: uppercase; font-size: 0.7rem; }
   .orders-data-table tbody td:last-child { border-bottom: none; }
   .actions-cell, .status-cell, .customer-cell { text-align: right !important; } /* Ensure alignment */
   .actions-cell { padding-top: 1rem; }
   .customer-email { text-align: right; }
}

@media (max-width: 576px) {
   .order-filters-grid { grid-template-columns: 1fr; } /* Stack filters */
   .reset-group { justify-self: stretch; } /* Full width reset */
   .reset-btn { width: 100%; }
}

/* Link Button */
.link-button {
    background: none; border: none; padding: 0; color: var(--primary);
    font-weight: 600; cursor: pointer; text-decoration: underline; font-size: inherit;
}
</style>
