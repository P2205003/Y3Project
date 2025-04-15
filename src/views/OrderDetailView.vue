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
          <p>{{ error }}</p> <!-- Keep error message raw -->
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
                    {{ getStatusLabel(order.status) }} <!-- Status labels might come from service or this t() -->
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
              <p v-if="cancelError" class="action-error">{{ cancelError }}</p> <!-- Raw error -->
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

                <p v-if="updateError" class="action-error">{{ updateError }}</p> <!-- Raw error -->

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
                          <span class="status-timeline__date">{{ formatDateRelative(record.date) }}</span>
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
                <!-- Use interpolation for item count -->
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
                        {{ capitalize(key) }}: {{ value }} <!-- Attributes are dynamic, keep as is -->
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
          <p v-if="cancelError" class="action-error">{{ cancelError }}</p> <!-- Raw error -->
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

  // --- Get translation function ---
  const { t } = useI18n();

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

  // --- User Role (Placeholder) ---
  const isAdmin = ref(false); // <<-- SET THIS
  const isUser = ref(true); // <<-- SET THIS

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
      // isAdmin.value = await checkUserAdminStatus(); // Fetch role if needed
    } catch (err) {
      // Keep raw error from service
      error.value = err.message || 'Failed to load order details. Please try again.';
      console.error('Error fetching order details:', err);
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
    if (seconds < 60) return t('dates.relative.justNow') || 'just now';
    if (minutes < 60) return t('dates.relative.minutesAgo', { count: minutes }) || `${minutes} min ago`;
    if (hours < 24) return t('dates.relative.hoursAgo', { count: hours }) || `${hours} hr ago`;
    if (days < 7) return t('dates.relative.daysAgo', { count: days }) || `${days} day${days > 1 ? 's' : ''} ago`;
    return formatDate(dateString, { dateStyle: 'short' });
  };

  // Modified getStatusLabel to use translations
  const getStatusLabel = (statusValue) => {
    // Use the translated status label if available, otherwise fallback to the value itself
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
      updateError.value = t('orderDetails.errors.statusUpdateGeneric'); // Use translated generic error
      return;
    }
    isUpdating.value = true;
    updateError.value = null;
    try {
      const updatedOrder = await orderService.updateOrderStatus(orderId.value, newStatus.value, statusNotes.value);
      order.value = updatedOrder;
      newStatus.value = '';
      statusNotes.value = '';
      alert(`Order status updated to ${getStatusLabel(order.value.status)}`);
    } catch (err) {
      updateError.value = err.message || t('orderDetails.errors.statusUpdateGeneric'); // Keep backend error, fallback to translation
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
      order.value = updatedOrder;
      showCancelConfirmation.value = false;
      cancelReason.value = '';
      alert('Your order has been cancelled successfully');
    } catch (err) {
      cancelError.value = err.message || t('orderDetails.errors.cancelGeneric'); // Keep backend error, fallback to translation
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
  /* Styles remain the same */
  /* --- Base & Layout --- */
  .order-detail-view {
    padding-bottom: 6rem;
  }

  .order-detail-view__header {
    padding-top: calc(var(--header-height) + 2rem);
    padding-bottom: 2rem;
    text-align: left;
    position: relative;
  }

    .order-detail-view__header h1 {
      margin-bottom: 0;
      margin-left: 1rem;
      font-size: clamp(1.8rem, 5vw, 2.5rem);
      display: inline-block;
    }

  .order-detail-view__back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5em;
    margin-bottom: 1rem;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-muted);
    text-decoration: none;
    transition: color var(--transition-fast);
    padding: 0.5rem 0;
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
    padding: 1.5rem 4%;
  }

  .order-detail-view__grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  @media (min-width: 992px) {
    .order-detail-view__grid {
      grid-template-columns: minmax(300px, 1fr) 2fr;
      gap: 2rem;
    }
  }

  .order-detail-view__summary-actions {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

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
    margin-bottom: 1.5rem;
  }

  .order-card__header {
    padding: 0.8rem 1.2rem;
    background-color: var(--bg-off-light);
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

    .order-card__header h2, .order-card__header h3 {
      font-size: 1.1rem;
      font-weight: 600;
      margin: 0;
      color: var(--text-dark);
    }

  .order-card__body {
    padding: 1.2rem;
  }

  .order-card__footer {
    padding: 0.8rem 1.2rem;
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
  }

  .summary-item__value {
    font-weight: 500;
    color: var(--text-dark);
    text-align: right;
  }

  .summary-item--total {
    margin-top: 0.5rem;
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
    border-color: var(--secondary);
    border: 1px solid var(--secondary);
    border-radius: var(--border-radius);
  }

    .order-detail-view__user-actions h4 {
      margin: 0 0 0.75rem 0;
      font-weight: 600;
      color: var(--secondary);
      font-size: 1rem;
    }

  .admin-update__title {
    font-size: 1rem !important;
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

  .enhanced-textarea {
    width: 100%;
    padding: 0.7rem 0.9rem;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-small);
    font-size: 0.9rem;
    font-family: var(--font-body);
    background-color: var(--white);
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
    line-height: 1.5;
    resize: vertical;
  }

    .enhanced-textarea:focus, .enhanced-textarea:focus-visible {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 2px var(--glow-primary);
    }

    .enhanced-textarea:disabled {
      background-color: var(--bg-off-light);
      cursor: not-allowed;
      opacity: 0.7;
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
    padding-top: 0.8rem;
    padding-bottom: 0.8rem;
  }

  .order-detail-view__info-card--shipping p {
    margin: 0;
    line-height: 1.6;
    color: var(--text-muted);
  }
  /* --- Status Timeline --- */
  .status-timeline {
    position: relative;
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
    margin-bottom: 0.2rem;
    flex-wrap: wrap;
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

  .status-timeline__notes {
    font-size: 0.85rem;
    color: var(--text-muted);
    margin: 0.3rem 0 0 0;
    padding: 0.5rem;
    background-color: var(--bg-off-light);
    border-radius: var(--border-radius-small);
    line-height: 1.5;
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
    padding: 1rem 1.2rem;
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
  .modal-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(30, 30, 30, 0.7);
    z-index: var(--popup-overlay-z-index);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }

  .modal-fade-enter-active, .modal-fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .modal-fade-enter-from, .modal-fade-leave-to {
    opacity: 0;
  }

  .modal-content {
    background-color: var(--white);
    padding: 2rem;
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

  .modal-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 1.5rem;
  }

    .modal-actions .button {
      min-width: 120px;
    }

  .modal-close-btn {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    background: none;
    border: none;
    font-size: 1.8rem;
    line-height: 1;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0.2rem;
    transition: color var(--transition-fast);
  }

    .modal-close-btn:hover {
      color: var(--secondary);
    }
  /* --- Loading/Error States --- */
  .order-detail-view__loading, .order-detail-view__error {
    min-height: 50vh;
  }

    .order-detail-view__loading .spinner::after {
      content: '';
      width: 40px;
      height: 40px;
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
    }

    .order-item__image-link {
      margin-bottom: 0.5rem;
    }

    .order-item__details {
      width: calc(100% - 75px - 1rem);
    }

    .order-item__subtotal {
      width: 100%;
      text-align: right;
      margin-top: 0.5rem;
      font-size: 1rem;
    }
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
</style>
