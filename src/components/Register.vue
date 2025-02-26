<template>
  <div>
    <SiteNav />
    <TopBar />
    <Ribbon />
    <SideMenu />
    <div class="register-page">
      <div class="register-card">
        <h2 class="title">Register</h2>
        <form @submit.prevent="handleRegister" ref="registerForm" class="register-form">
          <!-- Username Field -->
          <div class="form-item">
            <label for="username" class="form-label">Username</label>
            <input
              id="username"
              v-model="registerForm.username"
              type="text"
              class="form-input"
              placeholder="Create a username"
              required
            />
          </div>
          <!-- Password Field -->
          <div class="form-item">
            <label for="password" class="form-label">Password</label>
            <input
              id="password"
              v-model="registerForm.password"
              type="password"
              class="form-input"
              placeholder="Create a password"
              required
            />
          </div>
          <!-- Confirm Password Field -->
          <div class="form-item">
            <label for="confirmPassword" class="form-label">Confirm Password</label>
            <input
              id="confirmPassword"
              v-model="registerForm.confirmPassword"
              type="password"
              class="form-input"
              placeholder="Confirm your password"
              required
            />
            <p v-if="passwordMismatch" class="error-message">Passwords do not match</p>
          </div>
          <!-- Register Button -->
          <div class="form-item">
            <button type="submit" class="register-button">Register</button>
          </div>
          <!-- Login Link -->
          <router-link to="/login" class="login-link">
            <button type="button" class="login-button">Already have an account? Login</button>
          </router-link>
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
  name: "Register",
  components: {
    SiteNav,
    TopBar,
    Ribbon,
    SideMenu,
  },
  data() {
    return {
      registerForm: {
        username: "",
        password: "",
        confirmPassword: "",
      },
      passwordMismatch: false,
    };
  },
  methods: {
    handleRegister() {
      this.passwordMismatch = this.registerForm.password !== this.registerForm.confirmPassword;
      if (!this.passwordMismatch) {
        alert(`Registered as ${this.registerForm.username} (demo only)`);
        // Add your registration logic here
      } else {
        console.log("Validation failed");
      }
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

/* Register Page Layout */
.register-page {
  display: flex;
  justify-content: center; /* Center horizontally */
  align-items: flex-start; /* Align to the top */
  min-height: 100vh; /* Full height of the viewport */
  background-color: #f5f5f5;
  padding-top: 40px; /* Add some padding from the top */
  box-sizing: border-box;
}

/* Register Card */
.register-card {
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
.register-form {
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
.register-button {
  width: 100%;
  height: 50px;
  font-size: 18px;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
}

button.login-button {
  width: 400px;
  height: 50px;
  font-size: 18px;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
}

.register-button {
  color: white;
  background-color: #007bff;
  border: none;
}

.register-button:hover {
  background-color: #0056b3;
}

.login-button {
  color: #007bff;
  background: none;
  border: 2px solid #007bff;
}

.login-button:hover {
  background-color: #007bff;
  color: white;
}

/* Error Message */
.error-message {
  color: red;
  font-size: 14px;
  margin-top: 5px;
}
</style>