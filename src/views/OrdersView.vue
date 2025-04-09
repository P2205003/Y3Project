<template>
  <main class="orders-view">
    <!-- Page Header -->
    <section class="page-header enhanced-page-header orders-view__header">
      <h1>My Orders</h1>
      <p>Review your past purchases and track their status.</p>
    </section>

    <!-- Orders Content Section -->
    <section class="orders-view__content">

      <!-- Filter Controls -->
      <div class="filter-controls enhanced-filter-controls orders-view__filters">
        <div class="filter-group">
          <label for="orders-view__status-filter">
            <font-awesome-icon icon="filter" /> Filter by Status
          </label>
          <select id="orders-view__status-filter" v-model="statusFilter" @change="fetchOrders(1)" :disabled="loading" class="enhanced-input">
            <option value="">All Orders</option>
            <option v-for="status in statusOptions" :key="status.value" :value="status.value">
              {{ status.label }}
            </option>
          </select>
        </div>
        <div class="filter-actions">
          <button @click="fetchOrders(1)" class="button enhanced-button secondary" :disabled="loading">
            <font-awesome-icon icon="rotate-right" :spin="loading" />
            <span>{{ loading ? 'Refreshing...' : 'Refresh' }}</span>
          </button>
        </div>
      </div>

      <!-- Transition for Content Area -->
      <transition name="fade" mode="out-in">
        <!-- Loading State -->
        <div v-if="loading" key="loading" class="loading-container orders-view__loading">
          <div class="spinner"></div>
          <p>Loading your order history...</p>
        </div>
        <!-- Error State -->
        <div v-else-if="error" key="error" class="message-container error-container orders-view__error">
          <font-awesome-icon icon="exclamation-triangle" class="message-icon error-icon" />
          <h2>Failed to Load Orders</h2>
          <p>{{ error }}</p>
          <button @click="fetchOrders(1)" class="button enhanced-button primary">Try Again</button>
        </div>
        <!-- Empty State -->
        <div v-else-if="!orders.length" key="empty" class="message-container empty-container orders-view__empty">
          <font-awesome-icon icon="box-open" class="message-icon empty-icon" />
          <h2>No Orders Found</h2>
          <p v-if="statusFilter">You don't have any orders with the status "{{ getStatusLabel(statusFilter) }}".</p>
          <p v-else>You haven't placed any orders yet. Let's change that!</p>
          <router-link to="/products" class="button enhanced-button primary">Explore Products</router-link>
        </div>
        <!-- Orders List -->
        <div v-else key="list" class="orders-view__list">
          <div v-for="order in orders" :key="order._id" class="order-card">
            <!-- Order Card Header -->
            <div class="order-card__header">
              <div class="order-card__identifier">
                <h3>Order #{{ order.orderNumber }}</h3>
                <div class="order-card__date">
                  Placed on: {{ formatDate(order.purchaseDate, { dateStyle: 'medium', timeStyle: 'short' }) }}
                </div>
              </div>
              <div class="order-card__status-area">
                <span :class="['status-badge', `status-badge--${order.status}`]">
                  {{ getStatusLabel(order.status) }}
                </span>
                <div class="order-card__status-date" :title="`Last updated: ${formatDate(getStatusDate(order))}`">
                  {{ formatDateRelative(getStatusDate(order)) }}
                </div>
              </div>
            </div>

            <!-- Item Previews -->
            <div v-if="order.items && order.items.length > 0" class="order-card__item-previews">
              <router-link v-for="item in getLimitedItems(order.items)"
                           :key="item.productId"
                           :to="{ name: 'product-detail', params: { id: item.productId } }"
                           class="order-card__item-link"
                           :title="`${item.name} (x${item.quantity})`">
                <img :src="item.image || `https://via.placeholder.com/50?text=${item.name.charAt(0)}`"
                     :alt="item.name"
                     class="order-card__item-image"
                     loading="lazy" />
              </router-link>
              <div v-if="order.items.length > 4" class="order-card__more-items">
                +{{ order.items.length - 4 }} more
              </div>
            </div>

            <!-- Order Card Footer -->
            <div class="order-card__footer">
              <div class="order-card__summary">
                <span>{{ getTotalQuantity(order) }} item{{ getTotalQuantity(order) !== 1 ? 's' : '' }}</span>
                <span class="order-card__separator">|</span>
                <strong class="order-card__total">Total: ${{ order.totalAmount.toFixed(2) }}</strong>
              </div>
              <div class="order-card__actions">
                <button v-if="canCancelOrder(order.status)"
                        @click="requestCancelOrder(order)"
                        :disabled="cancellingOrderId === order._id"
                        class="button enhanced-button danger order-card__cancel-button">
                  <font-awesome-icon icon="times-circle" v-if="cancellingOrderId !== order._id" />
                  <font-awesome-icon icon="spinner" spin v-else />
                  <span>{{ cancellingOrderId === order._id ? 'Cancelling...' : 'Cancel Order' }}</span>
                </button>
                <router-link :to="{ name: 'OrderDetails', params: { id: order._id } }"
                             class="button enhanced-button secondary">
                  View Details
                </router-link>
              </div>
            </div>

            <!-- Cancel Confirmation -->
            <div v-if="confirmCancelId === order._id" class="order-card__cancel-confirmation">
              <p>Are you sure you want to cancel order #{{ order.orderNumber }}?</p>
              <div>
                <button @click="confirmCancel" class="button enhanced-button danger">Yes, Cancel</button>
                <button @click="cancelCancelRequest" class="button enhanced-button secondary">No, Keep Order</button>
              </div>
            </div>

          </div>

          <!-- Pagination -->
          <nav v-if="pagination.pages > 1" class="pagination-container standalone-pagination orders-view__pagination" aria-label="Orders pagination">
            <ul class="pagination">
              <li class="page-item" :class="{ disabled: pagination.page === 1 }">
                <button class="page-link enhanced-page-link" @click="fetchOrders(pagination.page - 1)" :disabled="pagination.page === 1 || loading" aria-label="Previous page">
                  <span aria-hidden="true">«</span>
                  <span class="visually-hidden">Previous</span>
                </button>
              </li>
              <li v-for="page in paginationRange"
                  :key="`page-${page}`"
                  class="page-item"
                  :class="{ active: pagination.page === page, ellipsis: page === '...' }">
                <span v-if="page === '...'" class="page-link enhanced-page-link page-link--ellipsis">...</span>
                <button v-else class="page-link enhanced-page-link" @click="fetchOrders(page)" :disabled="loading" :aria-current="pagination.page === page ? 'page' : null">
                  {{ page }}
                </button>
              </li>
              <li class="page-item" :class="{ disabled: pagination.page === pagination.pages }">
                <button class="page-link enhanced-page-link" @click="fetchOrders(pagination.page + 1)" :disabled="pagination.page === pagination.pages || loading" aria-label="Next page">
                  <span aria-hidden="true">»</span>
                  <span class="visually-hidden">Next</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </transition>

    </section>
  </main>
</template>

<script setup>
// --- Script remains unchanged ---
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import orderService from '@/services/orderService';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faBoxOpen, faExclamationTriangle, faFilter, faRotateRight,
  faSpinner, faTimesCircle
} from '@fortawesome/free-solid-svg-icons';

library.add(faBoxOpen, faExclamationTriangle, faFilter, faRotateRight, faSpinner, faTimesCircle);

const loading = ref(true);
const error = ref(null);
const orders = ref([]);
const pagination = ref({ page: 1, pages: 1, limit: 10, total: 0 });
const statusFilter = ref('');
const statusOptions = ref(orderService.getStatusOptions());
const route = useRoute();
const router = useRouter();
const confirmCancelId = ref(null);
const cancellingOrderId = ref(null);

const paginationRange = computed(() => {
    const current = pagination.value.page;
    const last = pagination.value.pages;
    if (last <= 1) return [];
    const delta = 1; // Show less page numbers for potentially smaller area
    const left = current - delta;
    const right = current + delta + 1;
    const range = [];
    const rangeWithDots = [];

    for (let i = 1; i <= last; i++) {
        if (i === 1 || i === last || (i >= left && i < right)) {
            range.push(i);
        }
    }

    let l;
    for (const i of range) {
        if (l) {
            if (i - l === 2) { rangeWithDots.push(l + 1); }
            else if (i - l !== 1) { rangeWithDots.push('...'); }
        }
        rangeWithDots.push(i);
        l = i;
    }
    // Filter out potential duplicate consecutive dots
    return rangeWithDots.filter((item, index, arr) => item !== '...' || arr[index - 1] !== '...');
});

const fetchOrders = async (page = 1) => {
  loading.value = true;
  error.value = null;
  confirmCancelId.value = null;
  cancellingOrderId.value = null;
  router.push({ query: { page, status: statusFilter.value || undefined } })
    .catch(err => {
      if (err.name !== 'NavigationDuplicated') { console.error('Router push error:', err); }
    });
  try {
    const response = await orderService.getOrders(statusFilter.value || null, page, pagination.value.limit);
    orders.value = response.orders;
    pagination.value = response.pagination;
  } catch (err) {
    console.error("Failed to fetch orders:", err);
    error.value = err.message || "Could not load your order history. Please try again.";
    orders.value = [];
    pagination.value = { page: 1, pages: 1, limit: 10, total: 0 };
  } finally {
    loading.value = false;
  }
};
const formatDate = (dateString, options = { dateStyle: 'medium', timeStyle: 'short' }) => {
    if (!dateString) return 'N/A';
    try { return new Intl.DateTimeFormat('en-US', options).format(new Date(dateString)); }
    catch (e) { return 'Invalid Date'; }
};
const formatDateRelative = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now - date) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);
    const weeks = Math.round(days / 7);
    const months = Math.round(days / 30);
    const years = Math.round(days / 365);
    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
    return `${years} year${years > 1 ? 's' : ''} ago`;
};
const getStatusLabel = (statusValue) => {
  const option = statusOptions.value.find(opt => opt.value === statusValue);
  return option ? option.label : statusValue;
};
const getStatusDate = (order) => {
  if (order.statusHistory && order.statusHistory.length > 0) {
    const sortedHistory = [...order.statusHistory].sort((a, b) => new Date(b.date) - new Date(a.date));
    return sortedHistory[0].date;
  }
  return order.purchaseDate;
};
const getTotalQuantity = (order) => {
  return order.items.reduce((sum, item) => sum + item.quantity, 0);
};
const getLimitedItems = (items, limit = 4) => { return items.slice(0, limit); };
const canCancelOrder = (status) => { return orderService.canBeCancelled(status); };
const requestCancelOrder = (order) => { confirmCancelId.value = order._id; };
const cancelCancelRequest = () => { confirmCancelId.value = null; };
const confirmCancel = async () => {
    if (!confirmCancelId.value) return;
    const orderIdToCancel = confirmCancelId.value;
    cancellingOrderId.value = orderIdToCancel;
    confirmCancelId.value = null;
    try {
        await orderService.cancelOrder(orderIdToCancel);
        await fetchOrders(pagination.value.page);
    } catch (err) {
        console.error(`Failed to cancel order ${orderIdToCancel}:`, err);
        error.value = err.message || "Could not cancel the order. Please try again.";
    } finally {
        cancellingOrderId.value = null;
    }
};
onMounted(() => {
  statusFilter.value = route.query.status || '';
  const initialPage = parseInt(route.query.page) || 1;
  fetchOrders(initialPage);
});
</script>

<style scoped>
  /* --- Base Button Enhancements --- */
  .button.enhanced-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5em;
    border-radius: var(--border-radius-small);
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    transition: all var(--transition-fast);
    will-change: transform, box-shadow, background-color, color, border-color;
    padding: 0.6rem 1.2rem;
    font-size: 0.9rem;
    border: 1px solid transparent;
    line-height: 1.4;
    white-space: nowrap;
  }

    .button.enhanced-button:not(:disabled):hover, .button.enhanced-button:not(:disabled):focus-visible {
      transform: translateY(-2px);
      box-shadow: var(--shadow-soft);
      outline: none;
    }

    .button.enhanced-button:not(:disabled):active {
      transform: translateY(0px) scale(0.98);
      box-shadow: none;
    }

    .button.enhanced-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
    /* --- Variations --- */
    .button.enhanced-button.primary {
      background-color: var(--primary);
      color: var(--white);
      border-color: var(--primary);
    }

      .button.enhanced-button.primary:not(:disabled):hover, .button.enhanced-button.primary:not(:disabled):focus-visible {
        background-color: #3dbbab;
        border-color: #3dbbab;
        box-shadow: 0 6px 15px rgba(78, 205, 196, 0.2);
      }

    .button.enhanced-button.secondary {
      background-color: var(--white);
      color: var(--primary);
      border-color: var(--primary);
    }

      .button.enhanced-button.secondary:not(:disabled):hover, .button.enhanced-button.secondary:not(:disabled):focus-visible {
        background-color: var(--bg-off-light);
        border-color: var(--primary);
        color: #3dbbab;
      }

      .button.enhanced-button.secondary:not(:disabled):active {
        background-color: #e0eef1;
      }

    .button.enhanced-button.danger {
      background-color: transparent;
      color: var(--secondary);
      border-color: var(--secondary);
    }

      .button.enhanced-button.danger:not(:disabled):hover, .button.enhanced-button.danger:not(:disabled):focus-visible {
        background-color: var(--secondary);
        color: var(--white);
        border-color: var(--secondary);
        box-shadow: 0 6px 15px rgba(255, 107, 107, 0.2);
      }

      .button.enhanced-button.danger:not(:disabled):active {
        background-color: #d63031;
        color: var(--white);
        border-color: #d63031;
      }

  /* --- Select Enhancement --- */
  select.enhanced-input {
    padding: 0.8rem 1rem;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-small);
    font-size: 0.95rem;
    background-color: var(--bg-light);
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast), background-color var(--transition-fast);
    height: 44px;
    box-sizing: border-box;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%236c757d'%3E%3Cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.9rem center;
    background-size: 16px 12px;
    padding-right: 2.8rem;
    cursor: pointer;
    width: 100%;
  }

    select.enhanced-input:focus, select.enhanced-input:focus-visible {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px var(--glow-primary);
      background-color: var(--white);
    }

    select.enhanced-input:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      background-color: var(--bg-off-light);
    }

  /* --- Pagination Button Enhancements --- */
  .page-link.enhanced-page-link {
    transition: all var(--transition-fast);
    border-radius: var(--border-radius-small);
    min-width: 38px;
    padding: 0.5rem 0.8rem;
    font-size: 0.85rem;
    will-change: transform, box-shadow, background-color, color, border-color;
  }

  .page-item:not(.disabled) .page-link.enhanced-page-link:hover, .page-item:not(.disabled) .page-link.enhanced-page-link:focus-visible {
    transform: translateY(-2px);
    box-shadow: var(--shadow-soft);
    border-color: var(--primary);
    color: var(--primary);
    background-color: var(--white);
    outline: none;
    z-index: 2;
  }

  .page-item:not(.disabled) .page-link.enhanced-page-link:active {
    transform: translateY(0px) scale(0.97);
    box-shadow: none;
    background-color: var(--bg-off-light);
  }

  .page-item.active .page-link.enhanced-page-link {
    transform: none;
    box-shadow: none;
    background-color: var(--primary);
    border-color: var(--primary);
    color: var(--white);
    z-index: 1;
  }

    .page-item.active .page-link.enhanced-page-link:hover {
      transform: none;
      box-shadow: none;
    }

  .page-item.disabled .page-link.enhanced-page-link {
    transform: none;
    box-shadow: none;
  }

  .page-link.enhanced-page-link.page-link--ellipsis {
    background-color: transparent;
    border-color: transparent;
    color: var(--text-muted);
    pointer-events: none;
    box-shadow: none;
    transform: none;
  }

  /* --- Component Specific Styles (Using Renamed Classes) --- */
  .orders-view {
    padding-bottom: 6rem;
  }

  .orders-view__header {
    padding-top: calc(var(--header-height) + 4rem);
    padding-bottom: 3rem;
  }

  .orders-view__content {
    max-width: 1100px;
    margin: 0 auto;
    padding: 2rem 4%;
  }

  .orders-view__filters {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    margin-bottom: 2.5rem;
    padding: 1.5rem;
  }

    .orders-view__filters .filter-group {
      min-width: 180px;
    }

    .orders-view__filters .filter-actions {
      border-top: none;
      padding-top: 0;
      justify-content: flex-start;
      align-items: flex-end;
    }

    .orders-view__filters .filter-button svg {
      margin-right: 0.5em;
    }

  .orders-view__loading, .orders-view__error, .orders-view__empty {
    min-height: 40vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 2rem;
    background-color: var(--bg-off-light);
    border-radius: var(--border-radius);
  }

    .orders-view__loading .spinner {
      margin-bottom: 1.5rem;
    }

      .orders-view__loading .spinner::after {
        content: '';
        width: 35px;
        height: 35px;
        border: 4px solid var(--accent);
        border-top-color: var(--primary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        display: block;
      }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .orders-view__error .button, .orders-view__empty .button {
    margin-top: 1.5rem;
  }

  .orders-view__list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .order-card {
    background-color: var(--white);
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-soft);
    border: 1px solid var(--border-color);
    overflow: hidden;
    transition: box-shadow var(--transition-fast);
  }

    .order-card:hover {
      box-shadow: var(--shadow-medium);
    }

  .order-card__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 1rem 1.5rem;
    background-color: var(--bg-off-light);
    border-bottom: 1px solid var(--border-color);
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .order-card__identifier h3 {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0 0 0.2rem 0;
    color: var(--text-dark);
  }

  .order-card__date {
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .order-card__status-area {
    text-align: right;
  }

  .status-badge {
    display: inline-block;
    padding: 0.3rem 0.8rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border: 1px solid transparent;
  }

  .status-badge--pending {
    background-color: #fff3cd;
    color: #664d03;
    border-color: #ffe69c;
  }

  .status-badge--shipped {
    background-color: #cfe2ff;
    color: #0a58ca;
    border-color: #b6d4fe;
  }

  .status-badge--delivered {
    background-color: #d1e7dd;
    color: #0f5132;
    border-color: #badbcc;
  }

  .status-badge--cancelled {
    background-color: #f8d7da;
    color: #842029;
    border-color: #f5c2c7;
  }

  .status-badge--hold {
    background-color: #e2e3e5;
    color: #41464b;
    border-color: #d3d6d8;
  }

  .order-card__status-date {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-top: 0.25rem;
    display: block;
  }

  .order-card__item-previews {
    display: flex;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border-bottom: 1px solid var(--border-color);
    background-color: #fdfdfd;
  }

  .order-card__item-link {
    display: block;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-small);
    overflow: hidden;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

    .order-card__item-link:hover {
      transform: scale(1.05);
      box-shadow: var(--shadow-soft);
    }

  .order-card__item-image {
    display: block;
    width: 45px;
    height: 45px;
    object-fit: cover;
  }

  .order-card__more-items {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 45px;
    height: 45px;
    border-radius: var(--border-radius-small);
    background-color: var(--bg-off-light);
    border: 1px solid var(--border-color);
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-muted);
  }

  .order-card__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1.5rem;
    background-color: var(--white);
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .order-card__summary {
    font-size: 0.9rem;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .order-card__separator {
    color: var(--border-color);
  }

  .order-card__total {
    font-weight: 600;
    color: var(--text-dark);
  }

  .order-card__actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

    .order-card__actions .button {
      padding: 0.5rem 1rem;
      font-size: 0.85rem;
    }

  .order-card__cancel-confirmation {
    background-color: #fff9f9;
    border-top: 1px solid var(--secondary);
    padding: 1rem 1.5rem;
    margin-top: -1px;
  }

    .order-card__cancel-confirmation p {
      margin: 0 0 0.75rem 0;
      font-size: 0.9rem;
      color: var(--secondary);
      font-weight: 600;
    }

    .order-card__cancel-confirmation div {
      display: flex;
      gap: 0.75rem;
    }

  .orders-view__pagination {
    margin-top: 2.5rem;
    display: flex;
    justify-content: center;
    position: relative;
    bottom: auto;
    left: auto;
    transform: none;
    box-shadow: none;
    background-color: transparent;
    padding: 1rem 0;
    border: none;
    backdrop-filter: none;
  }

  /* --- Responsive --- */
  @media (max-width: 768px) {
    .orders-view__content {
      padding: 1.5rem 3%;
    }

    .order-card__header, .order-card__footer {
      padding: 1rem;
    }

    .order-card__footer {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }

    .order-card__summary {
      justify-content: space-between;
      width: 100%;
    }

    .order-card__actions {
      width: 100%;
      justify-content: flex-end;
    }

    .order-card__item-previews {
      padding: 0.75rem 1rem;
    }

    .order-card__item-image, .order-card__more-items {
      width: 40px;
      height: 40px;
    }

    .orders-view__pagination {
      margin-top: 2rem;
    }
  }

  @media (max-width: 480px) {
    .order-card__header {
      align-items: center;
    }

    .order-card__status-area {
      text-align: left;
      width: 100%;
      margin-top: 0.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .order-card__status-date {
      margin-top: 0;
    }

    .orders-view__filters .filter-actions {
      justify-content: center;
      margin-top: 1rem;
    }

    .orders-view__filters {
      padding: 1rem;
      gap: 1rem;
    }

    .order-card__actions {
      flex-direction: column;
      align-items: stretch;
    }

      .order-card__actions .button {
        width: 100%;
        text-align: center;
      }
  }
</style>
