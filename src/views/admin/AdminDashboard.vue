<template>
  <div class="admin-dashboard">
    <div class="admin-page-header">
      <h1>Dashboard Overview</h1>
      <!-- Optional: Add a refresh button or date range selector here if needed -->
    </div>

    <!-- Quick Actions Panel -->
    <div class="admin-panel quick-actions-panel">
      <h2>Quick Actions</h2>
      <div class="quick-actions-grid">
        <router-link to="/admin/products/add" class="action-card">
          <div class="action-icon">
            <font-awesome-icon icon="plus-circle" />
          </div>
          <div class="action-title">Add New Product</div>
          <p class="action-description">Quickly create a new product listing.</p>
        </router-link>

        <router-link to="/admin/orders?status=pending" class="action-card">
          <div class="action-icon">
            <font-awesome-icon icon="hourglass-half" />
          </div>
          <div class="action-title">View Pending Orders</div>
          <p class="action-description">See orders awaiting processing.</p>
        </router-link>

        <router-link to="/admin/products" class="action-card">
          <div class="action-icon">
            <font-awesome-icon icon="tags" />
          </div>
          <div class="action-title">Manage Products</div>
          <p class="action-description">Edit existing product details and status.</p>
        </router-link>

        <!-- router-link to="/admin/users" class="action-card">
          <div class="action-icon">
            <font-awesome-icon icon="users-cog" />
          </div>
          <div class="action-title">Manage Users</div>
          <p class="action-description">View and manage user accounts.</p>
        </router-link -->

      </div>
    </div>

    <!-- Stats Overview Panel (Example - Adapt with real data fetching) -->
    <div class="admin-panel stats-overview-panel">
      <h2>Store Statistics</h2>
      <div v-if="loadingStats" class="loading-container minimal-loader">
        <div class="loading-spinner small"></div> Loading stats...
      </div>
      <div v-else-if="statsError" class="error-container minimal-error">
        {{ statsError }}
      </div>
      <div v-else class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon orders-icon">
            <font-awesome-icon icon="receipt" />
          </div>
          <div class="stat-content">
            <div class="stat-title">Total Orders</div>
            <div class="stat-value">{{ stats.totalOrders }}</div>
            <!-- <div class="stat-change positive">+{{ stats.orderChange }}%</div> -->
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon revenue-icon">
            <font-awesome-icon icon="dollar-sign" />
          </div>
          <div class="stat-content">
            <div class="stat-title">Total Revenue</div>
            <div class="stat-value">${{ formatCurrency(stats.totalRevenue) }}</div>
            <!-- <div class="stat-change positive">+{{ stats.revenueChange }}%</div> -->
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon products-icon">
            <font-awesome-icon icon="box-open" />
          </div>
          <div class="stat-content">
            <div class="stat-title">Active Products</div>
            <div class="stat-value">{{ stats.activeProducts }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon users-icon">
            <font-awesome-icon icon="users" />
          </div>
          <div class="stat-content">
            <div class="stat-title">Total Users</div>
            <div class="stat-value">{{ stats.totalUsers }}</div>
            <!-- <div class="stat-change negative">{{ stats.userChange }}%</div> -->
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Orders Panel (Example - Adapt with real data fetching) -->
    <div class="admin-panel recent-orders-panel">
      <div class="section-header">
        <h2>Recent Orders</h2>
        <router-link to="/admin/orders" class="view-all-link">View All Orders →</router-link>
      </div>
      <div v-if="loadingOrders" class="loading-container minimal-loader">
        <div class="loading-spinner small"></div> Loading recent orders...
      </div>
      <div v-else-if="ordersError" class="error-container minimal-error">
        {{ ordersError }}
      </div>
      <div v-else-if="recentOrders.length === 0" class="empty-state minimal-empty">
        No recent orders found.
      </div>
      <table v-else class="data-table recent-orders-table">
        <thead>
          <tr>
            <th>Order #</th>
            <th>Date</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in recentOrders" :key="order._id">
            <td>{{ order.orderNumber }}</td>
            <td>{{ formatDate(order.purchaseDate) }}</td>
            <td>{{ order.userId?.username || 'Unknown User' }}</td>
            <td>${{ formatCurrency(order.totalAmount) }}</td>
            <td>
              <span :class="['status-badge', `status-${order.status}`]">
                {{ getStatusLabel(order.status) }}
              </span>
            </td>
            <td>
              <router-link :to="`/admin/orders/${order._id}`" class="action-btn view-btn">
                View
              </router-link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script setup>
  import { ref, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
  import { library } from '@fortawesome/fontawesome-svg-core';
  import {
    faPlusCircle, faHourglassHalf, faTags, faUsersCog,
    faReceipt, faDollarSign, faBoxOpen, faUsers // Added icons for stats
  } from '@fortawesome/free-solid-svg-icons';

  // Add icons needed for this component
  library.add(
    faPlusCircle, faHourglassHalf, faTags, faUsersCog,
    faReceipt, faDollarSign, faBoxOpen, faUsers
  );

  const router = useRouter();

  // --- State ---
  const loadingStats = ref(true);
  const loadingOrders = ref(true);
  const statsError = ref(null);
  const ordersError = ref(null);

  const stats = ref({
    totalOrders: 0,
    totalRevenue: 0,
    activeProducts: 0,
    totalUsers: 0,
    // Optional change percentages (example)
    // orderChange: 0,
    // revenueChange: 0,
    // userChange: 0
  });

  const recentOrders = ref([]);

  // --- Methods ---
  const formatCurrency = (amount) => {
    // Ensure amount is a number before calling toFixed
    const numAmount = Number(amount);
    return isNaN(numAmount) ? '0.00' : numAmount.toFixed(2);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    // Use a simpler format for the dashboard table
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const getStatusLabel = (status) => {
    // Simple status labels, ideally fetch from a shared utility or service
    const labels = {
      'pending': 'Pending', 'shipped': 'Shipped', 'delivered': 'Delivered',
      'cancelled': 'Cancelled', 'hold': 'On Hold'
    };
    return labels[status?.toLowerCase()] || status || 'Unknown'; // Added lowercase and fallback
  };

  // --- UPDATED fetchDashboardData function ---
  const fetchDashboardData = async () => {
    // Reset states
    loadingStats.value = true;
    loadingOrders.value = true;
    statsError.value = null;
    ordersError.value = null;

    // --- Fetch Stats ---
    try {
      // --- ACTUAL API CALL for Stats ---
      console.log('Fetching admin stats...'); // Debug log
      const statsResponse = await fetch('/api/admin/stats', {
        credentials: 'include' // Important for sending cookies/auth tokens
      });

      if (!statsResponse.ok) {
        // Handle specific auth errors if possible
        if (statsResponse.status === 401 || statsResponse.status === 403) {
           console.error('Authorization error fetching stats:', statsResponse.status);
           statsError.value = 'You are not authorized to view statistics.';
           // Optionally redirect to login or show a more prominent error
           // router.push('/login'); // Example redirect
        } else {
          throw new Error(`HTTP error ${statsResponse.status} while fetching stats`);
        }
      } else {
        const statsData = await statsResponse.json();
        console.log('Received stats data:', statsData); // Debug log
        stats.value = statsData; // Assign fetched data
      }

    } catch (error) {
      console.error('Error fetching stats:', error);
      // Set error message only if it hasn't been set by specific status handling
      if (!statsError.value) {
          statsError.value = 'Could not load statistics. Please try again later.';
      }
    } finally {
      loadingStats.value = false;
    }

    // --- Fetch Recent Orders ---
    try {
      // --- ACTUAL API CALL for Recent Orders ---
      console.log('Fetching recent orders...'); // Debug log
      const ordersResponse = await fetch('/api/orders/admin/all?limit=5&sort=purchaseDate:desc', {
        credentials: 'include' // Important for sending cookies/auth tokens
      });

      if (!ordersResponse.ok) {
         if (ordersResponse.status === 401 || ordersResponse.status === 403) {
           console.error('Authorization error fetching orders:', ordersResponse.status);
           ordersError.value = 'You are not authorized to view orders.';
         } else {
          throw new Error(`HTTP error ${ordersResponse.status} while fetching recent orders`);
         }
      } else {
        const ordersData = await ordersResponse.json();
        console.log('Received orders data:', ordersData); // Debug log
        // Ensure ordersData.orders is an array, even if the API returns null/undefined
        recentOrders.value = Array.isArray(ordersData?.orders) ? ordersData.orders : [];
      }

    } catch (error) {
      console.error('Error fetching recent orders:', error);
       if (!ordersError.value) {
          ordersError.value = 'Could not load recent orders. Please try again later.';
       }
    } finally {
      loadingOrders.value = false;
    }
  };
  // --- END OF UPDATED function ---

  // --- Lifecycle ---
  onMounted(() => {
    fetchDashboardData();
  });

</script>

<style scoped>
  /* Use styles from main.css */
  .admin-dashboard {
    width: 100%;
  }

  /* .admin-page-header { } */
  /* .admin-panel { } */
  /* .admin-panel h2 { } */

  /* Quick Actions */
  .quick-actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
  }

  .action-card {
    background-color: var(--white);
    border-radius: var(--border-radius);
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    text-decoration: none;
    border: 1px solid var(--border-color);
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
    color: var(--text-dark); /* Ensure text color is set */
  }

    .action-card:hover {
      transform: translateY(-5px);
      box-shadow: var(--shadow-medium);
      border-color: var(--primary);
      color: var(--primary); /* Change text color on hover */
    }

  .action-icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    color: var(--primary); /* Icon color */
    line-height: 1;
  }

  .action-title {
    font-weight: 600;
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
  }

  .action-description {
    font-size: 0.85rem;
    color: var(--text-muted);
    line-height: 1.4;
    margin: 0;
  }

  /* Stats Overview */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1.5rem;
  }

  .stat-card {
    background-color: var(--bg-light); /* Slightly different background for stats */
    border-radius: var(--border-radius);
    padding: 1.25rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    border: 1px solid var(--border-color);
  }

  .stat-icon {
    font-size: 1.8rem; /* Smaller icon */
    width: 45px;
    height: 45px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    flex-shrink: 0;
  }
  /* Specific Stat Icon Colors */
  .orders-icon {
    background-color: #e3f2fd;
    color: #1976d2;
  }

  .revenue-icon {
    background-color: #e8f5e9;
    color: #388e3c;
  }

  .products-icon {
    background-color: #fff8e1;
    color: #f57c00;
  }

  .users-icon {
    background-color: #f3e5f5;
    color: #8e24aa;
  }

  .stat-content {
    flex: 1;
    min-width: 0; /* Prevent overflow */
  }

  .stat-title {
    color: var(--text-muted);
    font-size: 0.85rem;
    margin-bottom: 0.3rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .stat-value {
    font-size: 1.6rem;
    font-weight: 700; /* Bolder value */
    color: var(--text-dark);
    line-height: 1.2;
  }

  .stat-change {
    font-size: 0.8rem;
    font-weight: 500;
    margin-top: 0.2rem;
  }

    .stat-change.positive {
      color: #388e3c;
    }

    .stat-change.negative {
      color: #d32f2f;
    }

  /* Recent Orders */
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

    .section-header h2 { /* Reuse h2 style from admin-panel */
      margin: 0;
      font-size: 1.3rem;
      color: var(--text-dark);
      font-weight: 600;
      padding-bottom: 0; /* Remove padding/border */
      border-bottom: none;
    }

  .view-all-link {
    color: var(--primary);
    text-decoration: none;
    font-size: 0.9rem;
    font-weight: 600;
  }

    .view-all-link:hover {
      text-decoration: underline;
    }

  .recent-orders-table {
    margin-top: 0; /* Table directly follows header */
  }

  /* Use styles from main.css */
  /* .data-table { } */
  /* .data-table th, .data-table td { } */
  /* .status-badge { } */
  /* .action-btn { } */
  /* .view-btn { } */

  /* Minimal Loading/Error/Empty States */
  .minimal-loader, .minimal-error, .minimal-empty {
    padding: 1.5rem;
    font-size: 0.9rem;
    text-align: center;
    color: var(--text-muted);
    background-color: var(--bg-light); /* Subtle background */
    border-radius: var(--border-radius-small);
  }

  .minimal-loader {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5em;
  }

  .loading-spinner.small {
    width: 20px;
    height: 20px;
    border-width: 2px;
    margin: 0;
  }

  .minimal-error {
    color: var(--secondary);
    background-color: #fff9f9;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .stats-grid {
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); /* Adjust min width */
    }

    .quick-actions-grid {
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 1rem;
    }

    .action-card {
      padding: 1rem;
    }

    .action-icon {
      font-size: 2rem;
      margin-bottom: 0.8rem;
    }

    .action-title {
      font-size: 1rem;
    }
  }
</style>
