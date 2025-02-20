<script>
  import SideMenu from './components/SideMenu.vue';
  import SiteNav from './components/SiteNav.vue';
  import TopBar from './components/TopBar.vue';
  import Ribbon from './components/Ribbon.vue';
  import { ElMessage } from 'element-plus';


  export default {
    name: 'App',
    components: {
      SideMenu,
      SiteNav,
      TopBar,
      Ribbon
    },
    data() {
      return {
        isMenuVisible: false,
        isLoggedIn: false, // Track login status
        user: null,       // Store user information (e.g., username)
      };
    },
    provide() {
      return {
        appContext: { //provide is a built-in function in vue
          isLoggedIn: this.isLoggedIn,
          user: this.user,
          logout: this.logout, // Expose the logout function
        },
      };
    },
    watch: { //use watch to make data and provider always in synchronization
      isLoggedIn(newValue) {
        this.appContext.isLoggedIn = newValue;
      },
      user(newValue) {
        this.appContext.user = newValue;
      },
    },
    methods: {
      toggleMenu() {
        this.isMenuVisible = !this.isMenuVisible;
      },
      async logout() {
        try {
          const response = await fetch('/api/users/logout', { method: 'POST' });
          if (response.ok) {
            this.isLoggedIn = false; // Update login status
            this.user = null;       // Clear user data
            ElMessage.success('Logout successful!');
            this.$router.push('/'); // Redirect to home page.
          } else {
            const errorData = await response.json();
            ElMessage.error(errorData.message || 'Logout failed');
          }
        } catch (error) {
          console.error('Logout error:', error);
          ElMessage.error('An unexpected error occurred during logout.');
        }
      },
      async checkLoginStatus() { // Check for existing session on app load
        try {
          const response = await fetch('/api/users/check-login'); // New route
          if (response.ok) {
            const data = await response.json();
            this.isLoggedIn = true;
            this.user = data.user;
          } // No 'else' needed - if not logged in, defaults are fine
        } catch (error) {
          console.error('Error checking login status:', error);
          // Don't show an error message here - it's expected on first load if not logged in
        }
      }
    },
    created() {
      this.checkLoginStatus();
    },
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
