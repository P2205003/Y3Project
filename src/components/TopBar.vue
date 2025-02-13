<template>
  <div class="top">
    <router-link to="/">
      <img src="./icon_result.ico" alt="Website Icon">
    </router-link>
    <div class="search-bar">
      <input type="text" placeholder="Search...">
      <button @click="search">Search</button>
    </div>
    <div class="buttons">
      <button>Login</button>
      <router-link to="/shopping-cart">
        <button>Shopping Cart</button>
      </router-link>
    </div>
  </div>
</template>
  
<script>
export default {
  name: 'TopBar',
  data() {
    return {
      searchQuery: ''
    };
  },
  methods: {
    search() {
      this.$router.push({ path: '/search', query: { q: this.searchQuery } });
    }
  }
};
</script>
  
<style scoped>
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
.search-bar {
  display: flex;
  align-items: center;
}
.search-bar input[type="text"] {
  width: 200px;
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
</style>
  