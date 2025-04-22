// src/views/AdminView.vue
<template>
  <div class="admin-layout">
    <!-- Admin Header -->
    <div class="admin-header">
      <div class="admin-logo">
        <router-link to="/admin">
          <!-- Removed H1 for simpler header -->
          <span>ADMIN PANEL</span>
        </router-link>
      </div>
      <div class="admin-header-right">
        <div class="admin-badge">Admin Mode</div>
        <div class="admin-user-info" v-if="appContext.currentUser?.value">
          {{ appContext.currentUser.value.username }}
        </div>
        <!-- Added icons -->
        <button @click="switchToUserMode" class="admin-header-btn switch-mode-btn" title="Switch to Shop View">
          <font-awesome-icon icon="store" />
          <span>Shop</span>
        </button>
        <button @click="logoutAdmin" class="admin-header-btn logout-btn" title="Logout">
          <font-awesome-icon icon="sign-out-alt" />
          <span>Logout</span>
        </button>
      </div>
    </div>

    <!-- Admin Content Wrapper -->
    <div class="admin-content-wrapper">
      <!-- Admin Sidebar -->
      <div class="admin-sidebar">
        <div class="admin-nav">
          <!-- Use exact-active-class for Dashboard -->
          <router-link to="/admin" class="nav-item" exact-active-class="active">
            <font-awesome-icon icon="tachometer-alt" class="nav-icon" />
            <span>Dashboard</span>
          </router-link>
          <router-link to="/admin/products" class="nav-item" active-class="active">
            <font-awesome-icon icon="box-open" class="nav-icon" />
            <span>Products</span>
          </router-link>
          <router-link to="/admin/orders" class="nav-item" active-class="active">
            <font-awesome-icon icon="receipt" class="nav-icon" />
            <span>Orders</span>
          </router-link>
          <!-- router-link to="/admin/users" class="nav-item" active-class="active">
            <font-awesome-icon icon="users" class="nav-icon" />
            <span>Users</span>
          </router-link>
          <router-link to="/admin/settings" class="nav-item" active-class="active">
            <font-awesome-icon icon="cog" class="nav-icon" />
            <span>Settings</span>
          </router-link -->
        </div>
      </div>

      <!-- Admin Main Content -->
      <div class="admin-main-content">
        <!-- Breadcrumbs (Optional but good UX) -->
        <div class="admin-breadcrumbs">
          <router-link to="/admin">Admin</router-link>
          <span v-if="currentRouteName !== 'AdminDashboard'"> > {{ formatRouteName(currentRouteName) }}</span>
        </div>

        <!-- Router View -->
        <div class="admin-view-container">
          <router-view v-slot="{ Component }">
            <transition name="fade-fast" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { computed, inject } from 'vue';
  import { useRouter, useRoute } from 'vue-router';
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
  import { library } from '@fortawesome/fontawesome-svg-core';
  import {
    faTachometerAlt, faBoxOpen, faReceipt, faUsers, faCog,
    faStore, faSignOutAlt
  } from '@fortawesome/free-solid-svg-icons';

  library.add(
    faTachometerAlt, faBoxOpen, faReceipt, faUsers, faCog,
    faStore, faSignOutAlt
  );

  const router = useRouter();
  const route = useRoute();

  // Inject appContext provided by App.vue
  // Use optional chaining and nullish coalescing for safety
  const appContext = inject('appContext', {
    currentUser: { value: null }, // Default structure expected by template
    logout: () => console.warn("Logout function not injected")
  });

  const currentRouteName = computed(() => route.name);

  const switchToUserMode = () => {
    router.push('/');
  };

  const logoutAdmin = () => {
    // Call the logout function from the injected context
    appContext.logout();
    // Optionally redirect to login or home page after logout
    // router.push('/'); // Or a dedicated admin login page
  };

  const formatRouteName = (routeName) => {
    if (!routeName) return '';
    // Improved formatting
    return routeName
      .replace(/^Admin/, '') // Remove 'Admin' prefix only at the start
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .trim();
  };
</script>

<style scoped>
    /* Use variables from main.css */
    .admin-layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background-color: var(--bg-off-light); /* Use off-light for main admin bg */
    }

    /* --- Admin Header --- */
    .admin-header {
      background-color: var(--bg-dark); /* Dark header for contrast */
      color: var(--white);
      padding: 0.8rem 1.5rem; /* Slightly reduced padding */
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: var(--shadow-soft);
      z-index: var(--header-z-index); /* Ensure it's above content */
      height: 60px; /* Fixed height */
    }

    .admin-logo a {
      text-decoration: none;
      color: var(--accent); /* Use accent color */
      font-weight: 700;
      font-size: 1.2rem;
      letter-spacing: 1px;
    }

    .admin-header-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .admin-badge {
      background-color: var(--primary); /* Use primary color */
      color: var(--white);
      padding: 0.25rem 0.6rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .admin-user-info {
      font-weight: 500;
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.85);
    }

    .admin-header-btn {
      background: none;
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: rgba(255, 255, 255, 0.85);
      padding: 0.4rem 0.8rem;
      border-radius: var(--border-radius-small);
      font-weight: 500;
      font-size: 0.85rem;
      cursor: pointer;
      transition: background-color var(--transition-fast), color var(--transition-fast);
      display: inline-flex;
      align-items: center;
      gap: 0.5em;
    }

      .admin-header-btn:hover {
        background-color: rgba(255, 255, 255, 0.1);
        color: var(--white);
        border-color: rgba(255, 255, 255, 0.5);
      }

    .logout-btn {
      border-color: rgba(255, 107, 107, 0.5); /* Secondary color hint */
      color: rgba(255, 107, 107, 0.9);
    }

      .logout-btn:hover {
        background-color: var(--secondary);
        color: var(--white);
        border-color: var(--secondary);
      }

    /* --- Content Wrapper --- */
    .admin-content-wrapper {
      display: flex;
      flex: 1;
      overflow: hidden; /* Prevent wrapper overflow */
    }

    /* --- Admin Sidebar --- */
    .admin-sidebar {
      width: 230px;
      background-color: var(--white);
      box-shadow: 2px 0 5px rgba(0, 0, 0, 0.03);
      flex-shrink: 0;
      overflow-y: auto; /* Allow sidebar scroll if needed */
      display: flex;
      flex-direction: column;
    }

    .admin-nav {
      padding: 1rem 0;
      display: flex;
      flex-direction: column;
      flex-grow: 1; /* Allow nav to fill sidebar */
    }

    .nav-item {
      padding: 0.8rem 1.5rem;
      color: var(--text-muted);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.95rem;
      display: flex;
      align-items: center;
      transition: background-color var(--transition-fast), color var(--transition-fast), border-left-color var(--transition-fast);
      border-left: 4px solid transparent; /* For active indicator */
    }

    .nav-icon {
      margin-right: 0.8rem;
      width: 18px; /* Fixed width for icons */
      text-align: center;
      color: var(--text-muted); /* Muted icon color */
      transition: color var(--transition-fast);
    }

    .nav-item:hover {
      background-color: var(--bg-off-light);
      color: var(--primary);
    }

      .nav-item:hover .nav-icon {
        color: var(--primary);
      }

    .nav-item.active {
      background-color: var(--bg-off-light);
      color: var(--primary);
      border-left-color: var(--primary);
    }

      .nav-item.active .nav-icon {
        color: var(--primary);
      }

    /* --- Admin Main Content --- */
    .admin-main-content {
      flex: 1;
      padding: 1.5rem 2rem;
      overflow-y: auto; /* Enable scrolling for content */
      background-color: var(--bg-off-light);
    }

    .admin-breadcrumbs {
      margin-bottom: 1.5rem;
      font-size: 0.85rem;
      color: var(--text-muted);
    }

      .admin-breadcrumbs a {
        color: var(--primary);
        text-decoration: none;
      }

        .admin-breadcrumbs a:hover {
          text-decoration: underline;
        }

      .admin-breadcrumbs span {
        margin: 0 0.4em;
      }

    .admin-view-container {
      /* Styles for the immediate child of router-view can go here if needed, */
      /* but often better to style within the child components themselves using .admin-panel etc. */
    }

    /* --- General Admin Panel Style (Apply in Child Components) --- */
    /* Moved to main.css as it's used by multiple admin views */
    /*
  .admin-panel {
    background-color: var(--white);
    border-radius: var(--border-radius);
    padding: 1.5rem;
    box-shadow: var(--shadow-soft);
    border: 1px solid var(--border-color);
    margin-bottom: 1.5rem;
  } */

    /* --- Transitions --- */
    .fade-fast-enter-active,
    .fade-fast-leave-active {
      transition: opacity 0.2s ease;
    }

    .fade-fast-enter-from,
    .fade-fast-leave-to {
      opacity: 0;
    }


    /* --- Responsive --- */
    @media (max-width: 768px) {
      .admin-content-wrapper {
        flex-direction: column;
      }

      .admin-sidebar {
        width: 100%;
        height: auto;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        overflow-y: visible;
      }

      .admin-nav {
        flex-direction: row;
        overflow-x: auto;
        padding: 0.5rem 0.5rem;
        justify-content: space-around; /* Or flex-start */
      }

      .nav-item {
        padding: 0.75rem 1rem;
        border-left: none;
        border-bottom: 3px solid transparent;
        white-space: nowrap;
        flex-shrink: 0;
      }

        .nav-item.active {
          border-bottom-color: var(--primary);
          background-color: transparent;
        }

      .nav-icon {
        /* Optionally hide icons on mobile */
        /* display: none; */
      }

      .admin-main-content {
        padding: 1rem;
      }

      .admin-header {
        padding: 0.6rem 1rem;
        height: auto;
      }

      .admin-logo span {
        font-size: 1rem;
      }

      .admin-header-right {
        gap: 0.5rem;
      }

      .admin-user-info {
        display: none; /* Hide username on smaller screens */
      }

      .admin-header-btn {
        padding: 0.3rem 0.6rem;
        font-size: 0.8rem;
      }

        .admin-header-btn span {
          display: none; /* Hide text label on small screens */
        }
    }
</style>
