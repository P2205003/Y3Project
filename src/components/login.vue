<template>
  <div>
    <SiteNav />
    <TopBar />
    <Ribbon />
    <SideMenu />
    <div class="login-page">
      <div class="login-card">
        <h2 class="title">Login</h2>
        <form @submit.prevent="handleLogin" ref="loginForm" class="login-form">
          <!-- Username Field -->
          <div class="form-item">
            <label for="username" class="form-label">Username</label>
            <input
              id="username"
              v-model="loginForm.username"
              type="text"
              class="form-input"
              placeholder="Enter your username"
              required
            />
          </div>
          <!-- Password Field -->
          <div class="form-item">
            <label for="password" class="form-label">Password</label>
            <input
              id="password"
              v-model="loginForm.password"
              type="password"
              class="form-input"
              placeholder="Enter your password"
              required
            />
          </div>
          <!-- Login Button -->
          <div class="form-item">
            <button type="submit" class="login-button">Login</button>
          </div>
          <!-- Register Link -->
          <div class="form-item">
            <router-link to="/register">
              <button type="button" class="register-button">
                Don't have an account? Register now
              </button>
            </router-link>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import SiteNav from "@/components/SiteNav.vue";
import TopBar from "@/components/TopBar.vue";
import Ribbon from "@/components/Ribbon.vue";
import SideMenu from "@/components/SideMenu.vue";

export default {
  name: "Login",
  components: {
    SiteNav,
    TopBar,
    Ribbon,
    SideMenu,
  },
  data() {
    return {
      loginForm: {
        username: "",
        password: "",
      },
    };
  },
  methods: {
    handleLogin() {
      alert(`Logged in as ${this.loginForm.username} (demo only)`);
      // Add your authentication logic here
    },
  },
};
</script>

<style scoped>
/* Ensure the body and html take up the full height */
html,
body {
  height: 100%;
  margin: 0;
}

/* Overall Page Layout */
.login-page {
  display: flex;
  justify-content: center; /* Center horizontally */
  align-items: flex-start; /* Align to the top */
  min-height: 100vh; /* Full height of the viewport */
  background-color: #f5f5f5;
  padding-top: 40px; /* Add some padding from the top */
  box-sizing: border-box;
}

/* Login Card */
.login-card {
  width: 100%;
  max-width: 800px; /* Limit the width of the card */
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  background-color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Title */
.title {
  text-align: center;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 30px;
  color: #333;
}

/* Form */
.login-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Form Items */
.form-item {
  width: 400px;
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #555;
}

.form-input {
  width: 100%;
  font-size: 18px;
  height: 50px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 4px rgba(0, 123, 255, 0.5);
}

/* Buttons */
.login-button,
.register-button {
  width: 100%;
  height: 50px;
  font-size: 18px;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
}

.login-button {
  color: white;
  background-color: #007bff;
  border: none;
}

.login-button:hover {
  background-color: #0056b3;
}

.register-button {
  color: #007bff;
  background: none;
  border: 2px solid #007bff;
}

.register-button:hover {
  background-color: #007bff;
  color: white;
}
</style>