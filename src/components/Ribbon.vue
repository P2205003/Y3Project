<template>
  <div class="ribbon">
    <button @click="toggleMenu">≡ All</button>
    <router-link to="/add-item">
      <button>Add Item</button>
    </router-link>
    <button>Button 3</button>
    <!-- SideMenu component with overlay click handling -->
    <SideMenu :visible="isMenuVisible" @close="toggleMenu" />
  </div>
</template>

<script>
import SideMenu from "./SideMenu.vue";

export default {
  name: "Ribbon",
  components: {
    SideMenu,
  },
  data() {
    return {
      isMenuVisible: false, // Menu visibility state
    };
  },
  methods: {
    toggleMenu() {
      this.isMenuVisible = !this.isMenuVisible; // Show or hide the menu
    },
  },
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