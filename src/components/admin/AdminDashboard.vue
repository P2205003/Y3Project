<template>
  <div class="admin-dashboard">
    <h1>Admin Dashboard</h1>

    <!-- Quick actions -->
    <div class="dashboard-section">
      <h2>Quick Actions</h2>
      <div class="quick-actions">
        <router-link to="/admin/products/add" class="action-card">
          <div class="action-icon">➕</div>
          <div class="action-title">Add New Product</div>
        </router-link>

        <router-link to="/admin/orders" class="action-card">
          <div class="action-icon">🚚</div>
          <div class="action-title">Manage Orders</div>
        </router-link>

        <router-link to="/admin/products" class="action-card">
          <div class="action-icon">🏷️</div>
          <div class="action-title">Manage Products</div>
        </router-link>

      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminDashboard',
  data() {
    return {
      loading: true,
      stats: {
        totalOrders: 0,
        totalRevenue: 0,
        activeProducts: 0,
        totalUsers: 0,
        orderChange: 0,
        revenueChange: 0,
        userChange: 0
      },
      recentOrders: []
    };
  },
  async created() {
    this.fetchDashboardData();
  },
  methods: {
    async fetchDashboardData() {
      this.loading = true;

      try {
        // In a real implementation, you would fetch this data from your API
        // For now, we'll use dummy data

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Set dummy stats
        this.stats = {
          totalOrders: 156,
          totalRevenue: 12548.75,
          activeProducts: 48,
          totalUsers: 230,
          orderChange: 12,
          revenueChange: 8.5,
          userChange: 15
        };

        // Set dummy recent orders
        this.recentOrders = [
          {
            _id: '1',
            orderNumber: 'ORD-230428-0001',
            purchaseDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            userId: 'user123',
            totalAmount: 149.99,
            status: 'pending'
          },
          {
            _id: '2',
            orderNumber: 'ORD-230427-0005',
            purchaseDate: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
            userId: 'user456',
            totalAmount: 75.50,
            status: 'shipped'
          },
          {
            _id: '3',
            orderNumber: 'ORD-230427-0002',
            purchaseDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
            userId: 'user789',
            totalAmount: 199.95,
            status: 'delivered'
          },
          {
            _id: '4',
            orderNumber: 'ORD-230426-0008',
            purchaseDate: new Date(Date.now() - 36 * 60 * 60 * 1000), // 1.5 days ago
            userId: 'user321',
            totalAmount: 49.99,
            status: 'cancelled'
          }
        ];
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        this.loading = false;
      }
    },

    formatDate(date) {
      if (!date) return 'N/A';
      return new Date(date).toLocaleString();
    },

    getStatusLabel(status) {
      const statusLabels = {
        'pending': 'Pending',
        'shipped': 'Shipped',
        'delivered': 'Delivered',
        'cancelled': 'Cancelled',
        'hold': 'On Hold'
      };

      return statusLabels[status] || status;
    }
  }
};
</script>

<style scoped>
  .admin-dashboard {
    width: 100%;
  }

  h1 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    font-size: 1.8rem;
    color: #333;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .stat-card {
    background-color: white;
    border-radius: 8px;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .stat-icon {
    font-size: 2rem;
    margin-right: 1rem;
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }

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
  }

  .stat-title {
    color: #666;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: 600;
    color: #333;
    margin-bottom: 0.25rem;
  }

  .stat-change {
    font-size: 0.85rem;
  }

  .positive {
    color: #388e3c;
  }

  .negative {
    color: #d32f2f;
  }

  .stat-link a {
    color: #5D5CDE;
    text-decoration: none;
    font-size: 0.9rem;
  }

    .stat-link a:hover {
      text-decoration: underline;
    }

  .dashboard-section {
    margin-bottom: 2rem;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

    .section-header h2 {
      margin: 0;
      font-size: 1.4rem;
      color: #333;
    }

  .view-all-link {
    color: #5D5CDE;
    text-decoration: none;
  }

    .view-all-link:hover {
      text-decoration: underline;
    }

  .admin-panel {
    background-color: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
  }

    .data-table th, .data-table td {
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

  .view-link {
    color: #5D5CDE;
    text-decoration: none;
  }

    .view-link:hover {
      text-decoration: underline;
    }

  .loading-indicator {
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

  .empty-state {
    text-align: center;
    padding: 2rem;
    color: #666;
  }

  .quick-actions {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1.5rem;
  }

  .action-card {
    background-color: white;
    border-radius: 8px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    text-decoration: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    transition: transform 0.2s, box-shadow 0.2s;
  }

    .action-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

  .action-icon {
    font-size: 2rem;
    margin-bottom: 1rem;
  }

  .action-title {
    color: #333;
    font-weight: 500;
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    h1,
    .section-header h2 {
      color: #e2e8f0;
    }

    .stat-card,
    .admin-panel,
    .action-card {
      background-color: #2d3748;
    }

    .stat-title {
      color: #a0aec0;
    }

    .stat-value {
      color: #e2e8f0;
    }

    .data-table th {
      color: #e2e8f0;
    }

    .data-table th,
    .data-table td {
      border-bottom-color: #4a5568;
    }

    .empty-state {
      color: #a0aec0;
    }

    .action-title {
      color: #e2e8f0;
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
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .stats-grid {
      grid-template-columns: 1fr;
    }

    .quick-actions {
      grid-template-columns: 1fr 1fr;
    }
  }

  @media (max-width: 480px) {
    .quick-actions {
      grid-template-columns: 1fr;
    }

    .data-table {
      display: block;
      overflow-x: auto;
    }
  }
</style>
