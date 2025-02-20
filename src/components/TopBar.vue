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
        <button @click="appContext.logout">Logout</button> <!-- Use appContext.logout -->
        <span>Welcome, {{ appContext.user.username }}!</span>
      </template>
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
    },
    inject: ['appContext'], // Inject the appContext
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
      ;
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
