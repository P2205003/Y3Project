<template>
  <div class="top">
    <router-link to="/">
      <img src="./icon_result.ico" alt="Website Icon" />
    </router-link>
    <div class="search-bar">
      <input type="text" placeholder="Search..." v-model="searchQuery" />
      <button @click="search">Search</button>
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
        <span>Welcome, {{ appContext.user.username }}!</span>
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
        unsubscribeCartUpdate: null
      };
    },
    methods: {
      search() {
        this.$router.push({ path: '/search', query: { q: this.searchQuery } });
      },
      async updateCartCount() {
        try {
          this.cartItemCount = await cartService.getCartItemCount(this.appContext.isLoggedIn);
        } catch (error) {
          console.error('Error fetching cart count:', error);
        }
      }
    },
    inject: ['appContext'],
    created() {
      // Get initial cart count
      this.updateCartCount();

      // Listen for route changes to update cart count
      this.$router.afterEach(() => {
        this.updateCartCount();
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
      }
    }
  };
</script>

<style scoped>
  /* (Keep existing styles) */
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
  }

    .search-bar input[type='text'] {
      width: 400px;
      padding: 8px;
      border: none;
      border-radius: 4px;
    }

    .search-bar button {
      padding: 8px 12px;
      margin-left: 8px;
      background-color: #555;
      border: none;
      color: white;
      cursor: pointer;
      border-radius: 4px;
    }

  .top .buttons {
    display: flex;
  }

    .top .buttons button {
      margin-left: 10px;
      padding: 10px;
      background-color: #555;
      border: none;
      color: white;
      cursor: pointer;
      border-radius: 4px;
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

  /* Dark mode styles */
  @media (prefers-color-scheme: dark) {
    /* (add dark mode styles if needed) */
  }
</style>
