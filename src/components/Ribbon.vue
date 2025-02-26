<template>
  <div class="ribbon">
    <button @click="toggleMenu">All</button>
    <router-link to="/add-item">
      <button>Add Item</button>
    </router-link>
    <router-link to="/admin">
      <button>Admin Dashboard</button>
    </router-link>
  </div>
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
        isMenuVisible: false
      };
    },
    methods: {
      toggleMenu() {
        this.isMenuVisible = !this.isMenuVisible;
      }
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
