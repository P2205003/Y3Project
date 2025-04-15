<!-- src/views/OrderDetailView.vue -->
<template>
  <main class="order-detail-view">
    <!-- Page Header with Back Link -->
    <section class="page-header enhanced-page-header order-detail-view__header">
      <router-link :to="{ name: 'orders-history' }" class="order-detail-view__back-link">
        <font-awesome-icon icon="chevron-left" />
        <span>{{ t('orderDetails.backLink') }}</span>
      </router-link>
      <h1>{{ t('orderDetails.pageTitle') }}</h1>
    </section>

    <!-- Main Content Area -->
    <section class="order-detail-view__content">
      <transition name="fade" mode="out-in">
        <!-- Loading State -->
        <div v-if="loading" key="loading" class="loading-container order-detail-view__loading">
          <div class="spinner"></div>
          <p>{{ t('orderDetails.loading') }}</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" key="error" class="message-container error-container order-detail-view__error">
          <font-awesome-icon icon="exclamation-triangle" class="message-icon error-icon" />
          <h2>{{ t('orderDetails.errorTitle') }}</h2>
          <p>{{ error }}</p> <!-- Keep specific error message -->
          <button @click="fetchOrderDetails" class="button enhanced-button primary">{{ t('orderDetails.tryAgainButton') }}</button>
        </div>

        <!-- Order Found -->
        <div v-else-if="order" key="order-content" class="order-detail-view__grid">

          <!-- Column 1: Summary & Actions -->
          <div class="order-detail-view__summary-actions">
            <!-- Order Summary Card -->
            <div class="order-card order-detail-view__summary-card">
              <div class="order-card__header">
                <div class="order-card__identifier">
                  <h2>{{ t('orderDetails.orderNumberPrefix') }}{{ order.orderNumber }}</h2>
                </div>
                <div class="order-card__status-area">
                  <span :class="['status-badge', `status-badge--${order.status}`]">
                    {{ getStatusLabel(order.status) }}
                  </span>
                </div>
              </div>
              <div class="order-card__body order-detail-view__summary-body">
                <div class="summary-item">
                  <span class="summary-item__label">{{ t('orderDetails.summary.orderDate') }}</span>
                  <span class="summary-item__value">{{ formatDate(order.purchaseDate) }}</span>
                </div>
                <div v-if="order.statusDates && order.statusDates[order.status]" class="summary-item">
                  <span class="summary-item__label">{{ t('orderDetails.summary.statusUpdated') }}</span>
                  <span class="summary-item__value">{{ formatDate(order.statusDates[order.status]) }}</span>
                </div>
                <div class="summary-item summary-item--total">
                  <span class="summary-item__label">{{ t('orderDetails.summary.orderTotal') }}</span>
                  <strong class="summary-item__value">${{ order.totalAmount.toFixed(2) }}</strong>
                </div>
              </div>
            </div>

            <!-- User Actions (Cancel) -->
            <div v-if="isUser && canCancelOrder" class="order-detail-view__user-actions">
              <h4>{{ t('orderDetails.userActions.cancelPrompt') }}</h4>
              <button @click="showCancelConfirmation = true" class="button enhanced-button danger full-width" :disabled="isCancelling">
                <font-awesome-icon icon="times-circle" v-if="!isCancelling" />
                <font-awesome-icon icon="spinner" spin v-else />
                <span>{{ isCancelling ? t('orderDetails.userActions.cancellingButton') : t('orderDetails.userActions.requestCancelButton') }}</span>
              </button>
              <p v-if="cancelError" class="action-error">{{ cancelError }}</p> <!-- Keep raw error -->
            </div>

            <!-- Admin Actions (Status Update) -->
            <div v-if="isAdmin" class="order-card order-detail-view__admin-update">
              <div class="order-card__header">
                <h3 class="admin-update__title">{{ t('orderDetails.adminActions.updateStatusTitle') }}</h3>
              </div>
              <div class="order-card__body">
                <div class="form-group">
                  <label for="admin-status-select">{{ t('orderDetails.adminActions.newStatusLabel') }}</label>
                  <select id="admin-status-select"
                          v-model="newStatus"
                          :disabled="isUpdating || allowedStatusTransitions.length === 0"
                          class="enhanced-input">
                    <option value="" disabled>{{ t('orderDetails.adminActions.selectStatusPlaceholder') }}</option>
                    <option v-for="status in allowedStatusTransitions"
                            :key="status"
                            :value="status">
                      {{ getStatusLabel(status) }}
                    </option>
                  </select>
                  <p v-if="allowedStatusTransitions.length === 0 && !isUpdating" class="info-text">
                    {{ t('orderDetails.adminActions.noUpdatesPossible', { statusLabel: getStatusLabel(order.status) }) }}
                  </p>
                </div>

                <div class="form-group">
                  <label for="admin-status-notes">{{ t('orderDetails.adminActions.notesLabel') }}</label>
                  <textarea id="admin-status-notes"
                            v-model="statusNotes"
                            :placeholder="t('orderDetails.adminActions.notesPlaceholder')"
                            :disabled="isUpdating || !newStatus"
                            class="enhanced-textarea"
                            rows="3"></textarea>
                </div>

                <p v-if="updateError" class="action-error">{{ updateError }}</p> <!-- Keep raw error -->

                <button @click="updateOrderStatus"
                        class="button enhanced-button primary full-width"
                        :disabled="isUpdating || !newStatus">
                  <font-awesome-icon icon="spinner" spin v-if="isUpdating" />
                  <font-awesome-icon icon="save" v-else />
                  <span>{{ isUpdating ? t('orderDetails.adminActions.savingButton') : t('orderDetails.adminActions.saveButton') }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Column 2: Info & Items -->
          <div class="order-detail-view__info-items">
            <!-- Shipping & History Row -->
            <div class="order-detail-view__info-row">
              <!-- Shipping Address Card -->
              <div class="order-card order-detail-view__info-card order-detail-view__info-card--shipping">
                <div class="order-card__header"><h3>{{ t('orderDetails.info.shippingAddressTitle') }}</h3></div>
                <div class="order-card__body">
                  <p>{{ order.shippingAddress }}</p>
                </div>
              </div>

              <!-- Status History Card -->
              <div class="order-card order-detail-view__info-card order-detail-view__info-card--history">
                <div class="order-card__header"><h3>{{ t('orderDetails.info.statusHistoryTitle') }}</h3></div>
                <div class="order-card__body">
                  <div v-if="sortedStatusHistory.length" class="status-timeline">
                    <div v-for="(record, index) in sortedStatusHistory" :key="record._id || index" class="status-timeline__item">
                      <div class="status-timeline__connector">
                        <div :class="['status-timeline__dot', `status-badge--${record.status}`]"></div>
                        <div v-if="index < sortedStatusHistory.length - 1" class="status-timeline__line"></div>
                      </div>
                      <div class="status-timeline__content">
                        <div class="status-timeline__header">
                          <span class="status-timeline__status-label">{{ getStatusLabel(record.status) }}</span>
                          <span class="status-timeline__date">{{ formatDateRelative(record.date) }}</span> <!-- Updated function -->
                        </div>
                        <div v-if="record.changedBy && record.changedBy.username && isAdmin" class="status-timeline__updater">
                          <font-awesome-icon icon="user-shield" /> {{ t('orderDetails.info.historyUpdaterPrefix') }} {{ record.changedBy.username }}
                        </div>
                        <p v-if="record.notes" class="status-timeline__notes">
                          {{ record.notes }}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p v-else class="empty-message">{{ t('orderDetails.info.noHistory') }}</p>
                </div>
              </div>
            </div>

            <!-- Items Card -->
            <div class="order-card order-detail-view__items-card">
              <div class="order-card__header">
                <h3>{{ t('orderDetails.items.title', { itemCount: getTotalQuantity(order) }) }}</h3>
              </div>
              <div class="order-card__body order-detail-view__items-list">
                <div v-for="(item, index) in order.items" :key="item.productId + index" class="order-item">
                  <router-link :to="{ name: 'product-detail', params: { id: item.productId } }" class="order-item__image-link">
                    <img :src="item.image || placeholderImage" :alt="item.name" class="order-item__image">
                  </router-link>
                  <div class="order-item__details">
                    <router-link :to="{ name: 'product-detail', params: { id: item.productId } }" class="order-item__name">
                      {{ item.name }}
                    </router-link>
                    <div v-if="item.attributes && Object.keys(item.attributes).length > 0" class="order-item__attributes">
                      <span v-for="(value, key) in item.attributes" :key="key" class="order-item__attribute">
                        {{ capitalize(key) }}: {{ value }}
                      </span>
                    </div>
                    <div class="order-item__meta">
                      <span>{{ formatCurrency(item.price) }}</span>
                      <span>× {{ item.quantity }}</span>
                    </div>
                  </div>
                  <div class="order-item__subtotal">
                    {{ formatCurrency(item.subtotal) }}
                  </div>
                </div>
              </div>
              <div class="order-card__footer order-detail-view__items-footer">
                <span>{{ t('orderDetails.items.footerTotal') }}</span>
                <strong>{{ formatCurrency(order.totalAmount) }}</strong>
              </div>
            </div>

          </div> <!-- End Column 2 -->

        </div> <!-- End Grid -->
      </transition>
    </section>

    <!-- Cancel Confirmation Modal -->
    <transition name="modal-fade">
      <div v-if="showCancelConfirmation" class="modal-overlay" @click.self="closeCancelModal">
        <div class="modal-content order-detail-view__cancel-modal">
          <h3>{{ t('orderDetails.cancelModal.title') }}</h3>
          <p>{{ t('orderDetails.cancelModal.confirmationText') }}</p>
          <div class="form-group">
            <label for="cancel-reason">{{ t('orderDetails.cancelModal.reasonLabel') }}</label>
            <textarea id="cancel-reason"
                      v-model="cancelReason"
                      class="enhanced-textarea"
                      :placeholder="t('orderDetails.cancelModal.reasonPlaceholder')"
                      rows="3"></textarea>
          </div>
          <div class="modal-actions">
            <button @click="cancelOrder" class="button enhanced-button danger" :disabled="isCancelling">
              <font-awesome-icon icon="spinner" spin v-if="isCancelling" />
              <span>{{ isCancelling ? t('orderDetails.userActions.cancellingButton') : t('orderDetails.cancelModal.confirmButton') }}</span>
            </button>
            <button @click="closeCancelModal" class="button enhanced-button secondary" :disabled="isCancelling">
              {{ t('orderDetails.cancelModal.keepButton') }}
            </button>
          </div>
          <p v-if="cancelError" class="action-error">{{ cancelError }}</p> <!-- Keep raw error -->
          <button @click="closeCancelModal" class="modal-close-btn" :aria-label="t('orderDetails.cancelModal.closeAriaLabel')">×</button>
        </div>
      </div>
    </transition>

  </main>
</template>

<script setup>
  import { ref, computed, onMounted } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { useI18n } from 'vue-i18n'; // Import useI18n
  import orderService from '@/services/orderService';
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
  import { library } from '@fortawesome/fontawesome-svg-core';
  import {
    faChevronLeft, faExclamationTriangle, faSpinner, faTimesCircle,
    faUserShield, faSave
  } from '@fortawesome/free-solid-svg-icons';

  library.add(
    faChevronLeft, faExclamationTriangle, faSpinner, faTimesCircle,
    faUserShield, faSave
  );

  // --- Get translation function and locale ---
  const { t, locale } = useI18n();

  // --- State ---
  const order = ref(null);
  const loading = ref(true);
  const error = ref(null);
  const newStatus = ref('');
  const statusNotes = ref('');
  const isUpdating = ref(false);
  const updateError = ref(null);
  const placeholderImage = `https://via.placeholder.com/100x100/cccccc/FFFFFF?text=N/A`;
  const showCancelConfirmation = ref(false);
  const cancelReason = ref('');
  const isCancelling = ref(false);
  const cancelError = ref(null);
  const route = useRoute();
  const router = useRouter();

  // --- User Role (Placeholder - Update with your actual role logic) ---
  const isAdmin = ref(false); // Set based on user context
  const isUser = ref(true); // Set based on user context

  // --- Computed ---
  const orderId = computed(() => route.params.id);
  const statusOptions = computed(() => orderService.getStatusOptions());
  const allowedStatusTransitions = computed(() => {
    if (!order.value) return [];
    return orderService.getAllowedTransitions(order.value.status);
  });
  const sortedStatusHistory = computed(() => {
    if (!order.value?.statusHistory) return [];
    return [...order.value.statusHistory].sort((a, b) => new Date(b.date) - new Date(a.date));
  });
  const canCancelOrder = computed(() => {
    return order.value ? orderService.canBeCancelled(order.value.status) : false;
  });

  // --- Methods ---
  const fetchOrderDetails = async () => {
    loading.value = true;
    error.value = null;
    order.value = null;
    try {
      order.value = await orderService.getOrderById(orderId.value);
      newStatus.value = '';
      // Update isAdmin based on actual user role if needed
      // isAdmin.value = await checkUserAdminStatus();
    } catch (err) {
      error.value = err.message || t('orderDetails.errors.loadErrorFallback'); // Use translated fallback
      console.error('Error fetching order details:', err);
    } finally {
      loading.value = false;
    }
  };

  // --- UPDATED formatDate ---
  const formatDate = (dateString, options = { dateStyle: 'medium', timeStyle: 'short' }) => {
    if (!dateString) return 'N/A';
    try {
      const currentLocaleCode = t('dates.localeCode'); // Get BCP 47 code
      return new Intl.DateTimeFormat(currentLocaleCode, options).format(new Date(dateString));
    }
    catch (e) { return 'Invalid Date'; }
  };

  // --- UPDATED formatDateRelative ---
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

    if (seconds < 60) return t('dates.relative.justNow', 'just now');
    if (minutes < 60) return t(minutes > 1 ? 'dates.relative.minutesAgo' : 'dates.relative.minuteAgo', { count: minutes }, `${minutes} min ago`);
    if (hours < 24) return t(hours > 1 ? 'dates.relative.hoursAgo' : 'dates.relative.hourAgo', { count: hours }, `${hours} hr ago`);
    if (days === 1 && locale.value === 'zh') return t('dates.relative.dayAgo', 'yesterday');
    if (days < 7) return t(days > 1 ? 'dates.relative.daysAgo' : 'dates.relative.dayAgo', { count: days }, `${days} day${days > 1 ? 's' : ''} ago`);
    if (weeks < 4) return t(weeks > 1 ? 'dates.relative.weeksAgo' : 'dates.relative.weekAgo', { count: weeks }, `${weeks} week${weeks > 1 ? 's' : ''} ago`);
    if (months < 12) return t(months > 1 ? 'dates.relative.monthsAgo' : 'dates.relative.monthAgo', { count: months }, `${months} month${months > 1 ? 's' : ''} ago`);

    const formattedDate = formatDate(dateString, { dateStyle: 'short' });
    return t('dates.relative.default', { date: formattedDate }, `on ${formattedDate}`);
  };

  const getStatusLabel = (statusValue) => {
    return t(`orderDetails.statusLabels.${statusValue}`, statusValue);
  };

  const getTotalQuantity = (order) => {
    return order?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  };

  const capitalize = (s) => {
    if (typeof s !== 'string' || !s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '$--.--';
    return `$${Number(amount).toFixed(2)}`;
  };

  const updateOrderStatus = async () => {
    if (!newStatus.value) {
      updateError.value = t('orderDetails.errors.statusUpdateGeneric');
      return;
    }
    isUpdating.value = true;
    updateError.value = null;
    try {
      const updatedOrder = await orderService.updateOrderStatus(orderId.value, newStatus.value, statusNotes.value);
      order.value = updatedOrder; // Update local order data
      newStatus.value = '';
      statusNotes.value = '';
      alert(`Order status updated to ${getStatusLabel(order.value.status)}`); // Use translated label
    } catch (err) {
      updateError.value = err.message || t('orderDetails.errors.statusUpdateGeneric'); // Use translated fallback
      console.error('Error updating order status:', err);
    } finally {
      isUpdating.value = false;
    }
  };

  const closeCancelModal = () => {
    showCancelConfirmation.value = false;
    cancelError.value = null;
  }

  const cancelOrder = async () => {
    isCancelling.value = true;
    cancelError.value = null;
    try {
      const updatedOrder = await orderService.cancelOrder(orderId.value, cancelReason.value);
      order.value = updatedOrder; // Update local order data
      showCancelConfirmation.value = false;
      cancelReason.value = '';
      alert('Your order has been cancelled successfully'); // Consider a more integrated notification
    } catch (err) {
      cancelError.value = err.message || t('orderDetails.errors.cancelGeneric'); // Use translated fallback
      console.error('Error cancelling order:', err);
    } finally {
      isCancelling.value = false;
    }
  };

  // --- Lifecycle ---
  onMounted(() => {
    fetchOrderDetails();
  });

</script>

<style scoped>
  /* --- Base & Layout --- */
  .order-detail-view {
    padding-bottom: 6rem;
  }

  .order-detail-view__header {
    padding-top: calc(var(--header-height) + 2rem);
    padding-bottom: 2rem;
    text-align: left;
    position: relative; /* Needed for absolute positioning of back link potentially */
    border-bottom: 1px solid var(--border-color);
    background-color: var(--bg-light);
    max-width: 1200px;
    margin: 0 auto;
    padding-left: 4%;
    padding-right: 4%;
  }

    .order-detail-view__header h1 {
      margin-bottom: 0;
      margin-left: 0; /* Reset margin */
      font-size: clamp(1.8rem, 5vw, 2.5rem);
      display: block; /* Make it block */
      margin-top: 0.5rem; /* Space below back link */
    }

  .order-detail-view__back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5em;
    margin-bottom: 0.5rem; /* Reduced margin */
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-muted);
    text-decoration: none;
    transition: color var(--transition-fast);
  }

    .order-detail-view__back-link:hover {
      color: var(--primary);
    }

    .order-detail-view__back-link svg {
      transition: transform 0.2s ease-out;
    }

    .order-detail-view__back-link:hover svg {
      transform: translateX(-3px);
    }

  .order-detail-view__content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 4% 0; /* Added top padding */
  }

  .order-detail-view__grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  @media (min-width: 992px) {
    .order-detail-view__grid {
      grid-template-columns: minmax(300px, 1fr) 2fr; /* Adjust column ratio if needed */
      gap: 2.5rem;
    }

    .order-detail-view__summary-actions {
      position: sticky;
      top: calc(var(--header-height) + 1.5rem); /* Stick below header */
      align-self: start;
    }
  }

  .order-detail-view__summary-actions,
  .order-detail-view__info-items {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  /* --- Shared Order Card Styles --- */
  .order-card {
    background-color: var(--white);
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-soft);
    border: 1px solid var(--border-color);
    overflow: hidden;
    /* Removed margin-bottom, handled by gap */
  }

  .order-card__header {
    padding: 1rem 1.2rem;
    background-color: var(--bg-off-light);
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap; /* Allow wrapping */
    gap: 0.5rem;
  }

    .order-card__header h2, .order-card__header h3 {
      font-size: 1.1rem;
      font-weight: 600;
      margin: 0;
      color: var(--text-dark);
      line-height: 1.3;
    }

  .order-card__body {
    padding: 1.2rem;
  }

  .order-card__footer {
    padding: 1rem 1.2rem;
    background-color: var(--bg-off-light);
    border-top: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-dark);
  }

  /* --- Summary Card --- */
  .order-detail-view__summary-card .order-card__identifier {
    flex-grow: 1;
  }

  .order-detail-view__summary-card .status-badge {
    flex-shrink: 0;
    align-self: flex-start; /* Align badge top */
  }

  .order-detail-view__summary-body {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .summary-item {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 0.9rem;
    line-height: 1.4;
  }

  .summary-item__label {
    color: var(--text-muted);
    margin-right: 1em;
    flex-shrink: 0;
  }

  .summary-item__value {
    font-weight: 500;
    color: var(--text-dark);
    text-align: right;
  }

  .summary-item--total {
    margin-top: 0.8rem;
    padding-top: 0.8rem;
    border-top: 1px dashed var(--border-color);
  }

    .summary-item--total .summary-item__label {
      font-weight: 600;
      font-size: 1rem;
      color: var(--text-dark);
    }

    .summary-item--total .summary-item__value {
      font-weight: 700;
      font-size: 1.2rem;
      color: var(--primary);
    }
  /* --- User/Admin Actions --- */
  .order-detail-view__user-actions {
    padding: 1.2rem;
    background-color: #fff9f9;
    border: 1px solid #ffccd0;
    border-radius: var(--border-radius);
  }

    .order-detail-view__user-actions h4 {
      margin: 0 0 0.75rem 0;
      font-weight: 600;
      color: var(--secondary);
      font-size: 1rem;
    }

  .order-detail-view__admin-update { /* Style as a card */
  }

  .admin-update__title {
    font-size: 1rem !important; /* Override generic card header */
  }

  .form-group {
    margin-bottom: 1rem;
  }

    .form-group:last-child {
      margin-bottom: 0;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.4rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-dark);
    }

  .enhanced-textarea { /* Use style from main.css */
  }

  select.enhanced-input { /* Use style from main.css */
  }

  .info-text {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin-top: 0.5rem;
  }

  .action-error {
    color: var(--secondary);
    font-size: 0.85rem;
    margin-top: 0.75rem;
    text-align: center;
  }

  .button.full-width {
    width: 100%;
  }

  .button svg {
    margin-right: 0.5em;
  }

  /* --- Shipping & History Cards --- */
  .order-detail-view__info-row {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  @media(min-width: 768px) {
    .order-detail-view__info-row {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .order-detail-view__info-card .order-card__body {
    padding: 1rem 1.2rem;
  }

  .order-detail-view__info-card--shipping p {
    margin: 0;
    line-height: 1.6;
    color: var(--text-muted);
  }

  /* --- Status Timeline --- */
  .status-timeline {
    position: relative;
    margin-top: 0.5rem;
  }

  .status-timeline__item {
    display: flex;
    position: relative;
    padding-bottom: 1.5rem;
  }

    .status-timeline__item:last-child {
      padding-bottom: 0;
    }

      .status-timeline__item:last-child .status-timeline__line {
        display: none;
      }

  .status-timeline__connector {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-right: 1rem;
    flex-shrink: 0;
  }

  .status-timeline__dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid var(--white);
    box-shadow: 0 0 0 1px var(--border-color);
    z-index: 1;
  }

  .status-timeline__line {
    width: 2px;
    background-color: var(--border-color);
    flex-grow: 1;
    margin-top: 4px;
    margin-bottom: 4px;
  }

  .status-timeline__content {
    flex-grow: 1;
    padding-top: 0;
  }

  .status-timeline__header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 0.3rem;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .status-timeline__status-label {
    font-weight: 600;
    font-size: 0.95rem;
    color: var(--text-dark);
  }

  .status-timeline__date {
    font-size: 0.8rem;
    color: var(--text-muted);
    flex-shrink: 0;
    margin-left: 0.5rem;
  }

  .status-timeline__updater {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin-bottom: 0.3rem;
    display: flex;
    align-items: center;
    gap: 0.3em;
  }

    .status-timeline__updater svg {
      font-size: 0.9em;
    }

  .status-timeline__notes {
    font-size: 0.85rem;
    color: var(--text-dark);
    margin: 0.5rem 0 0 0;
    padding: 0.6rem 0.8rem;
    background-color: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: var(--border-radius-small);
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .empty-message {
    font-size: 0.9rem;
    color: var(--text-muted);
    text-align: center;
    padding: 1rem 0;
  }

  /* --- Items Card & List --- */
  .order-detail-view__items-list {
    display: flex;
    flex-direction: column;
    gap: 0;
    padding: 0;
  }

  .order-item {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.2rem;
    border-bottom: 1px solid var(--border-color);
  }

    .order-item:last-child {
      border-bottom: none;
    }

  .order-item__image-link {
    flex-shrink: 0;
  }

  .order-item__image {
    display: block;
    width: 75px;
    height: 75px;
    object-fit: cover;
    border-radius: var(--border-radius-small);
    border: 1px solid var(--border-color);
    background-color: var(--bg-light);
  }

  .order-item__details {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .order-item__name {
    font-weight: 600;
    color: var(--text-dark);
    text-decoration: none;
    font-size: 0.95rem;
    transition: color var(--transition-fast);
    line-height: 1.3;
  }

    .order-item__name:hover {
      color: var(--primary);
    }

  .order-item__attributes {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .order-item__meta {
    font-size: 0.85rem;
    color: var(--text-muted);
    display: flex;
    gap: 1rem;
    margin-top: 0.2rem;
  }

  .order-item__subtotal {
    text-align: right;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-dark);
    margin-left: auto;
    flex-shrink: 0;
  }

  .order-detail-view__items-footer {
    font-size: 1.1rem;
  }

    .order-detail-view__items-footer strong {
      color: var(--primary);
    }

  /* --- Cancel Modal --- */
  .modal-overlay { /* Use style from main.css */
  }

  .modal-fade-enter-active, .modal-fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .modal-fade-enter-from, .modal-fade-leave-to {
    opacity: 0;
  }

  .modal-content {
    background-color: var(--white);
    padding: 1.5rem 2rem;
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-strong);
    max-width: 500px;
    width: 90%;
    position: relative;
    transform: scale(0.95);
    opacity: 0;
    animation: modal-scale-up 0.3s ease forwards;
  }

  @keyframes modal-scale-up {
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  .modal-content h3 {
    margin: 0 0 1rem 0;
    font-size: 1.3rem;
    font-family: var(--font-heading);
    color: var(--text-dark);
    text-align: center;
  }

  .modal-content p {
    margin: 0 0 1.5rem 0;
    font-size: 0.95rem;
    color: var(--text-muted);
    text-align: center;
    line-height: 1.6;
  }

  .order-detail-view__cancel-modal .form-group {
    margin-bottom: 1.5rem;
  }
  /* Add margin below textarea */
  .modal-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 1.5rem;
  }

    .modal-actions .button {
      min-width: 120px;
    }

  .modal-close-btn { /* Use style from main.css */
  }

  /* --- Loading/Error States --- */
  .order-detail-view__loading, .order-detail-view__error {
    min-height: 60vh;
  }

    .order-detail-view__loading .spinner::after { /* Use style from main.css */
    }

  /* --- Status Badge Colors --- */
  .status-badge--pending, .status-timeline__dot.status-badge--pending {
    background-color: #fff3cd;
    color: #664d03;
    border-color: #ffe69c;
  }

  .status-badge--shipped, .status-timeline__dot.status-badge--shipped {
    background-color: #cfe2ff;
    color: #0a58ca;
    border-color: #b6d4fe;
  }

  .status-badge--delivered, .status-timeline__dot.status-badge--delivered {
    background-color: #d1e7dd;
    color: #0f5132;
    border-color: #badbcc;
  }

  .status-badge--cancelled, .status-timeline__dot.status-badge--cancelled {
    background-color: #f8d7da;
    color: #842029;
    border-color: #f5c2c7;
  }

  .status-badge--hold, .status-timeline__dot.status-badge--hold {
    background-color: #e2e3e5;
    color: #41464b;
    border-color: #d3d6d8;
  }

  /* --- Responsive Adjustments --- */
  @media (max-width: 768px) {
    .order-detail-view__content {
      padding: 1.5rem 3%;
    }

    .order-detail-view__header {
      padding-top: calc(var(--header-height) + 1rem);
      padding-bottom: 1.5rem;
    }

    .order-card__header, .order-card__footer, .order-card__body {
      padding: 1rem;
    }

    .order-item {
      padding: 1rem;
    }

    .order-item__image {
      width: 60px;
      height: 60px;
    }

    .order-item__details {
      gap: 0.2rem;
    }

    .order-item__name {
      font-size: 0.9rem;
    }

    .order-item__meta {
      font-size: 0.8rem;
      gap: 0.75rem;
    }

    .order-item__subtotal {
      font-size: 0.9rem;
    }

    .modal-content {
      padding: 1.5rem;
    }

    .modal-actions {
      flex-direction: column;
      gap: 0.8rem;
    }

      .modal-actions .button {
        width: 100%;
      }
  }

  @media (max-width: 576px) {
    .status-timeline__header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.1rem;
    }

    .status-timeline__date {
      margin-left: 0;
    }

    .order-item {
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .order-item__image-link {
      margin-bottom: 0.5rem;
      flex-basis: 75px;
    }

    .order-item__details {
      width: calc(100% - 75px - 1rem);
      flex-basis: calc(100% - 75px - 1rem);
    }

    .order-item__subtotal {
      width: 100%;
      text-align: right;
      margin-top: 0.5rem;
      font-size: 1rem;
      flex-basis: 100%;
    }
  }
</style>
