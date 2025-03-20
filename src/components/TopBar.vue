<template>
  <div class="top">
    <router-link to="/">
      <img src="./icon_result.ico" alt="Website Icon" />
    </router-link>
    <div class="search-bar">
      <form @submit.prevent="search">
        <input type="text"
               placeholder="Search products..."
               v-model.trim="searchQuery"
               aria-label="Search products" />
        <button type="submit" aria-label="Search">
          <span class="search-icon">🔍</span>
        </button>
      </form>
    </div>
    <div class="buttons">
      <!-- Conditionally render buttons based on login status -->
      <template v-if="!appContext.isLoggedIn">
        <router-link to="/login">
          <button>Login</button>
        </router-link>
        <router-link to="/register">
          <button>Register</button>
        </router-link>
      </template>
      <template v-else>
        <span class="welcome-text">Welcome, {{ appContext.user.username }}!</span>

        <!-- Admin button (only visible for admin users) -->
        <router-link v-if="isAdmin" to="/admin" class="admin-link">
          <button class="admin-button">Admin Panel</button>
        </router-link>

        <button @click="appContext.logout">Logout</button>
      </template>

      <!-- Shopping cart button with item count -->
      <router-link to="/shopping-cart">
        <button class="cart-button">
          Shopping Cart
          <span v-if="cartItemCount > 0" class="cart-count">{{ cartItemCount }}</span>
        </button>
      </router-link>
      <template v-if="appContext.isLoggedIn">
        <router-link to="/orders">
          <button>My Orders</button>
        </router-link>
      </template>
    </div>
  </div>
</template>

<script>
  import cartService from '@/services/cartService';

  export default {
    name: 'TopBar',
    data() {
      return {
        searchQuery: '',
        cartItemCount: 0,
        unsubscribeCartUpdate: null,
        isAdmin: false
      };
    },
    methods: {
      search() {
        const query = {};

        // Only add q parameter if search query is not empty
        if (this.searchQuery.trim()) {
          query.q = this.searchQuery.trim();
        }

        // Always navigate to search page, with or without query
        this.$router.push({
          path: '/search',
          query
        });
      },
      async updateCartCount() {
        try {
          this.cartItemCount = await cartService.getCartItemCount(this.appContext.isLoggedIn);
        } catch (error) {
          console.error('Error fetching cart count:', error);
        }
      },
      async checkAdminStatus() {
        if (this.appContext.isLoggedIn) {
          try {
            const response = await fetch('/api/users/check-admin', {
              credentials: 'include'
            });

            if (response.ok) {
              const data = await response.json();
              this.isAdmin = data.isAdmin;
            }
          } catch (error) {
            console.error('Error checking admin status:', error);
          }
        } else {
          this.isAdmin = false;
        }
      }
    },
    inject: {
      appContext: {
        default: () => ({
          isLoggedIn: false,
          user: null,
          logout: () => console.error('appContext not properly injected')
        })
      }
    },
    created() {
      // Initialize search query from route if user is already on search page
      if (this.$route.path === '/search' && this.$route.query.q) {
        this.searchQuery = this.$route.query.q;
      }

      // Get initial cart count
      this.updateCartCount();

      // Check if user is admin
      this.checkAdminStatus();

      // Listen for route changes to update cart count and search query
      this.$router.afterEach((to) => {
        this.updateCartCount();

        // Update search box when navigating to search page
        if (to.path === '/search' && to.query.q) {
          this.searchQuery = to.query.q;
        }
      });

      // Subscribe to cart update events from cartService
      this.unsubscribeCartUpdate = cartService.onCartUpdate(() => {
        this.updateCartCount();
      });
    },
    beforeUnmount() {
      // Clean up subscription when component is destroyed
      if (this.unsubscribeCartUpdate) {
        this.unsubscribeCartUpdate();
      }
    },
    watch: {
      // Update cart count when login status changes
      'appContext.isLoggedIn'() {
        this.updateCartCount();
        this.checkAdminStatus();
      }
    }
  };
</script>

<style scoped>
  .top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #000000;
    color: white;
    padding: 10px 20px;
  }

    .top img {
      height: 50px;
    }

  .search-bar {
    display: flex;
    align-items: center;
    flex-grow: 1;
    max-width: 600px;
    margin: 0 20px;
  }

    .search-bar form {
      display: flex;
      width: 100%;
    }

    .search-bar input[type='text'] {
      flex-grow: 1;
      min-width: 150px;
      padding: 10px 16px;
      border: none;
      border-radius: 4px 0 0 4px;
      font-size: 16px;
    }

    .search-bar button {
      padding: 10px 12px;
      background-color: #5D5CDE;
      border: none;
      color: white;
      cursor: pointer;
      border-radius: 0 4px 4px 0;
      font-size: 16px;
      display: flex;
      align-items: center;
    }

      .search-bar button:hover {
        background-color: #4a49b8;
      }

  .search-icon {
    margin-right: 5px;
  }

  .top .buttons {
    display: flex;
    align-items: center;
    gap: 10px;
  }

    .top .buttons button {
      padding: 10px;
      background-color: #555;
      border: none;
      color: white;
      cursor: pointer;
      border-radius: 4px;
      font-size: 16px;
    }

      .top .buttons button:hover {
        background-color: #444;
      }

  .welcome-text {
    margin-right: 8px;
    white-space: nowrap;
  }

  .admin-button {
    background-color: #ff9800 !important;
  }

    .admin-button:hover {
      background-color: #f57c00 !important;
    }

  .cart-button {
    position: relative;
    padding-right: 35px !important;
  }

  .cart-count {
    position: absolute;
    top: -8px;
    right: -8px;
    background-color: #f44336;
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: bold;
  }

  /* Responsive design for mobile */
  @media (max-width: 768px) {
    .top {
      flex-wrap: wrap;
      padding: 10px;
    }

    .search-bar {
      order: 3;
      width: 100%;
      max-width: none;
      margin: 10px 0 0;
    }

    .search-text {
      display: none;
    }

    .search-icon {
      margin-right: 0;
    }

    .top .buttons {
      flex-wrap: wrap;
      justify-content: flex-end;
    }

      .top .buttons button {
        padding: 8px;
        font-size: 14px;
      }

    .welcome-text {
      display: none;
    }
  }

  /* Dark mode styles */
  @media (prefers-color-scheme: dark) {
    .search-bar input[type='text'] {
      background-color: #333;
      color: #fff;
    }

    .top .buttons button {
      background-color: #444;
    }

      .top .buttons button:hover {
        background-color: #555;
      }

    .admin-button {
      background-color: #e65100 !important;
    }

      .admin-button:hover {
        background-color: #bf360c !important;
      }
  }
</style>
