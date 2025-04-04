<!-- src/App.vue -->
<script>
  import SideMenu from '@/components/SideMenu.vue';
  import SiteNav from '@/components/SiteNav.vue';
  import TopBar from '@/components/TopBar.vue';
  import Ribbon from '@/components/Ribbon.vue';
  import { ElMessage } from 'element-plus';
  import cartService from '@/services/cartService';

  export default {
    name: 'App',
    components: { SideMenu, SiteNav, TopBar, Ribbon },
    data() {
      return {
        isMenuVisible: false,
        appContext: {
          isLoggedIn: false,
          user: null,
          logout: () => this.logout()
        }
      };
    },
    provide() {
      return { appContext: this.appContext };
    },
    methods: {
      toggleMenu() {
        this.isMenuVisible = !this.isMenuVisible;
      },
      async logout() {
        try {
          const response = await fetch('/api/users/logout', { method: 'POST' });
          if (response.ok) {
            this.appContext.isLoggedIn = false;
            this.appContext.user = null;
            ElMessage.success('Logout successful!');
            this.$router.push('/');
          }
        } catch (error) {
          ElMessage.error('Logout failed');
        }
      },
      async checkLoginStatus() {
        try {
          const response = await fetch('/api/users/check-login', {
            credentials: 'include'
          });
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          
          // Check if user just logged in (not logged in before, but logged in now)
          const wasLoggedIn = this.appContext.isLoggedIn;
          this.appContext.isLoggedIn = data.isLoggedIn;
          this.appContext.user = data.user || null;
          
          // If user just logged in, merge carts
          if (!wasLoggedIn && data.isLoggedIn) {
            console.log('User just logged in, merging carts...');
            await this.mergeCartsAfterLogin();
          }
        } catch (error) {
          console.error('Session check failed:', error);
          this.appContext.isLoggedIn = false;
          this.appContext.user = null;
        }
      },
      
      async mergeCartsAfterLogin() {
        try {
          console.log('Merging carts after login...');
          const result = await cartService.mergeCartsAfterLogin();
          if (result && result.items) {
            console.log(`Cart merged successfully. ${result.items.length} items in cart.`);
            ElMessage.success('Your shopping cart has been updated with previously added items.');
          }
        } catch (error) {
          console.error('Error merging carts:', error);
          ElMessage.error('Failed to synchronize your shopping cart. Please try refreshing the page.');
        }
      }
    },
    created() {
      this.checkLoginStatus();
    }
  };
</script>

<template>
  <div>
    <div class="context">
      <router-view />
    </div>
  </div>
</template>

<style scoped>
  /* (Keep the existing styles from App.vue) */
  body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 0;
  }

  .site-nav-bd {
    background-color: #f8f8f8;
    padding: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

    .site-nav-bd a {
      text-decoration: none;
      color: #333;
      margin-right: 20px;
    }

  .dropdown {
    position: relative;
    display: inline-block;
  }

  .dropdown-content {
    display: none;
    position: absolute;
    background-color: #f8f8f8;
    min-width: 160px;
    box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
    z-index: 1;
  }

    .dropdown-content a {
      color: #333;
      padding: 12px 16px;
      text-decoration: none;
      display: block;
    }

  .dropdown:hover .dropdown-content {
    display: block;
  }

  .top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #333;
    color: white;
    padding: 10px 20px;
  }

    .top img {
      height: 50px;
    }

    .top input[type="text"] {
      width: 50%;
      padding: 8px;
      border: none;
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

  .ribbon {
    background-color: #f1f1f1;
    padding: 10px;
    display: flex;
    justify-content: center;
  }

    .ribbon button {
      margin: 0 10px;
      padding: 10px;
      background-color: #007bff;
      border: none;
      color: white;
      cursor: pointer;
      border-radius: 4px;
    }

  .context {
    padding: 0px;
  }
</style>
