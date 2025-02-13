<template>
  <div class="ribbon">
    <button @click="toggleMenu">All</button>
    <router-link to="/add-item">
      <button>Add Item</button>
    </router-link>
    <button>Button 3</button>
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
</style>