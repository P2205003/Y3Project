<template>
  <div class="ribbon">
    <button @click="toggleMenu">≡ All</button>
    <!-- Only show admin link if user is an admin -->
    <router-link v-if="isAdmin" to="/admin">
      <button>Admin Dashboard</button>
    </router-link>
  </div>
  <!-- SideMenu component with overlay click handling -->
  <SideMenu :visible="isMenuVisible" @close="toggleMenu" />
</template>

<script>
  import SideMenu from './SideMenu.vue';
  export default {
    name: 'Ribbon',
    components: {
      SideMenu
    },
    data() {
      return {
        isMenuVisible: false,
        isAdmin: false
      };
    },
    methods: {
      toggleMenu() {
        this.isMenuVisible = !this.isMenuVisible;
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
          user: null
        })
      }
    },
    watch: {
      'appContext.isLoggedIn': {
        immediate: true,
        handler() {
          this.checkAdminStatus();
        }
      }
    },
    created() {
      this.checkAdminStatus();
    }
  };
</script>

<style scoped>
  .ribbon {
    background-color: #93a74b;
    padding: 10px;
    display: flex;
    justify-content: center;
  }

    .ribbon button {
      margin: 0 10px;
      padding: 5px;
      background-color: transparent;
      border: none;
      color: #ffffff;
      cursor: pointer;
      border-radius: 4px;
      font-size: large;
      font-weight: 700;
    }
</style>
