<script>
import SideMenu from './components/SideMenu.vue';
import SiteNav from './components/SiteNav.vue';
import TopBar from './components/TopBar.vue';
import Ribbon from './components/Ribbon.vue';

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

<template>
    <div>
      <div class="context">
        <router-view />
      </div>
    </div>
</template>

<style scoped>
  /* Basic styles for layout */
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
      padding: 20px;
  }
</style>
