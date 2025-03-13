<template>
  <div class="admin-layout">
    <!-- Admin Header -->
    <div class="admin-header">
      <div class="admin-logo">
        <router-link to="/admin">
          <h1>Admin Dashboard</h1>
        </router-link>
      </div>
      <div class="admin-header-right">
        <div class="admin-badge">Admin Mode</div>
        <div class="admin-user-info" v-if="appContext.user">
          {{ appContext.user.username }}
        </div>
        <button @click="switchToUserMode" class="switch-mode-btn">
          Switch to Shop
        </button>
        <button @click="appContext.logout" class="logout-btn">
          Logout
        </button>
      </div>
    </div>

    <!-- Admin Content -->
    <div class="admin-content-wrapper">
      <!-- Admin Sidebar -->
      <div class="admin-sidebar">
        <div class="admin-nav">
          <router-link to="/admin" class="nav-item" exact-active-class="active">
            <span class="icon">📊</span>Dashboard
          </router-link>
          <router-link to="/admin/products" class="nav-item" active-class="active">
            <span class="icon">📦</span>Products
          </router-link>
          <router-link to="/admin/orders" class="nav-item" active-class="active">
            <span class="icon">🚚</span>Orders
          </router-link>
          <router-link to="/admin/users" class="nav-item" active-class="active">
            <span class="icon">👥</span>Users
          </router-link>
          <router-link to="/admin/settings" class="nav-item" active-class="active">
            <span class="icon">⚙️</span>Settings
          </router-link>
        </div>
      </div>

      <!-- Admin Main Content -->
      <div class="admin-main-content">
        <!-- Breadcrumbs -->
        <div class="admin-breadcrumbs">
          <router-link to="/admin">Admin</router-link>
          <span v-if="currentRouteName !== 'AdminDashboard'"> &gt; {{ formatRouteName(currentRouteName) }}</span>
        </div>

        <!-- Router View -->
        <div class="admin-content">
          <router-view />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminLayout',
  data() {
    return {};
  },
  computed: {
    currentRouteName() {
      return this.$route.name;
    }
  },
  inject: {
    appContext: {
      default: () => ({
        user: null,
        isLoggedIn: false,
        logout: () => console.error('appContext not properly injected')
      })
    }
  },
  methods: {
    switchToUserMode() {
      this.$router.push('/');
    },
    formatRouteName(routeName) {
      if (!routeName) return '';
      // Remove 'Admin' prefix and add spaces
      return routeName
        .replace('Admin', '')
        .replace(/([A-Z])/g, ' $1')
        .trim();
    }
  }
};
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

.admin-header {
  background-color: #32325d;
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.admin-logo a {
  text-decoration: none;
  color: white;
}

.admin-logo h1 {
  margin: 0;
  font-size: 1.5rem;
}

.admin-header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.admin-badge {
  background-color: #5D5CDE;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 600;
}

.admin-user-info {
  font-weight: 500;
}

.switch-mode-btn, .logout-btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 500;
  border: none;
  cursor: pointer;
}

.switch-mode-btn {
  background-color: #4caf50;
  color: white;
}

.switch-mode-btn:hover {
  background-color: #43a047;
}

.logout-btn {
  background-color: #f44336;
  color: white;
}

.logout-btn:hover {
  background-color: #e53935;
}

.admin-content-wrapper {
  display: flex;
  flex: 1;
}

.admin-sidebar {
  width: 250px;
  background-color: #ffffff;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.05);
}

.admin-nav {
  padding: 1.5rem 0;
  display: flex;
  flex-direction: column;
}

.nav-item {
  padding: 0.75rem 1.5rem;
  color: #4a5568;
  text-decoration: none;
  font-weight: 500;
  display: flex;
  align-items: center;
  transition: background-color 0.2s, color 0.2s;
}

.nav-item:hover {
  background-color: #f5f7fa;
  color: #5D5CDE;
}

.nav-item.active {
  background-color: #ebf4ff;
  color: #5D5CDE;
  border-left: 3px solid #5D5CDE;
}

.icon {
  margin-right: 1rem;
  font-size: 1.2rem;
}

.admin-main-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.admin-breadcrumbs {
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
  color: #718096;
}

.admin-breadcrumbs a {
  color: #5D5CDE;
  text-decoration: none;
}

.admin-breadcrumbs a:hover {
  text-decoration: underline;
}

.admin-content {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .admin-layout {
    background-color: #1a202c;
    color: #e2e8f0;
  }

  .admin-header {
    background-color: #2d3748;
  }

  .admin-sidebar {
    background-color: #2d3748;
  }

  .admin-nav .nav-item {
    color: #cbd5e0;
  }

  .admin-nav .nav-item:hover {
    background-color: #3a4a5f;
    color: #90cdf4;
  }

  .admin-nav .nav-item.active {
    background-color: #2c3b4d;
    color: #90cdf4;
    border-left-color: #90cdf4;
  }

  .admin-content {
    background-color: #2d3748;
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .admin-content-wrapper {
    flex-direction: column;
  }

  .admin-sidebar {
    width: 100%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .admin-nav {
    flex-direction: row;
    overflow-x: auto;
    padding: 0.5rem;
  }

  .nav-item {
    padding: 0.75rem 1rem;
    white-space: nowrap;
  }

  .nav-item.active {
    border-left: none;
    border-bottom: 3px solid #5D5CDE;
  }

  .icon {
    display: none;
  }

  .admin-main-content {
    padding: 1rem;
  }
}
</style>
