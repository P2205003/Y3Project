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
            <input id="username"
                   v-model="loginForm.username"
                   type="text"
                   class="form-input"
                   placeholder="Enter your username"
                   required />
            <div v-if="errors.username" class="error-message">{{ errors.username }}</div>
          </div>
          <!-- Password Field -->
          <div class="form-item">
            <label for="password" class="form-label">Password</label>
            <input id="password"
                   v-model="loginForm.password"
                   type="password"
                   class="form-input"
                   placeholder="Enter your password"
                   required />
            <div v-if="errors.password" class="error-message">{{ errors.password }}</div>
          </div>
          <!-- Login Button -->
          <div class="form-item">
            <button type="submit" class="login-button" :disabled="isSubmitting">
              <span v-if="isSubmitting" class="spinner"></span>
              {{ isSubmitting ? 'Logging in...' : 'Login' }}
            </button>
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
        isSubmitting: false,
        loginForm: {
          username: "",
          password: "",
        },
        errors: {
          username: "",
          password: ""
        },
        rules: {
          username: [{ required: true, message: "Please enter your username", trigger: "blur" }],
          password: [{ required: true, message: "Please enter your password", trigger: "blur" }],
          email: [{ required: true, message: 'Please enter your email', trigger: 'blur' },
          {
            pattern: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
            message: 'Please fill a valid email address',
            trigger: ['blur', 'change']
          }]
        },
      };
    },
    methods: {
      validateForm() {
        this.errors.username = this.loginForm.username ? "" : "Please enter your username";
        this.errors.password = this.loginForm.password ? "" : "Please enter your password";
        return !this.errors.username && !this.errors.password;
      },
      async handleLogin() {
        if (!this.validateForm()) {
          return;
        }

        this.isSubmitting = true;
        try {
          const response = await fetch('/api/users/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(this.loginForm),
          });

          if (response.ok) {
            const data = await response.json(); // Get user data from the response
            // Check for the "already logged in" message
            if (data.message === 'Already logged in') {
              this.$message.info('You are already logged in!');
              this.appContext.isLoggedIn = true;
              this.appContext.user = data.user;
              this.$router.push('/');
              return; // Stop further processing
            }

            this.$message.success('Login successful!');
            // Update the global login state in App.vue
            this.appContext.isLoggedIn = true;
            this.appContext.user = data.user; // Store the user object

            this.$router.push('/'); // Redirect to home page
          } else {
            const errorData = await response.json();
            this.$message.error(errorData.message || 'Login failed');
          }
        } catch (error) {
          console.error('Login error:', error);
          this.$message.error('An unexpected error occurred. Please try again.');
        } finally {
          this.isSubmitting = false;
        }
      },
    },
    inject: ['appContext'], // Inject the appContext from App.vue
  };
</script>

<style scoped>
  /* Ensure the body and html take up the full height */
  html, body {
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
  .login-button, .register-button {
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

    .login-button:hover:not(:disabled) {
      background-color: #0056b3;
    }

    .login-button:disabled {
      background-color: #6c757d;
      cursor: not-allowed;
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

  .error-message {
    color: #dc3545;
    font-size: 14px;
    margin-top: 4px;
  }

  /* Loading Spinner */
  .spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 3px solid rgba(255,255,255,.3);
    border-radius: 50%;
    border-top-color: #fff;
    animation: spin 1s ease-in-out infinite;
    margin-right: 8px;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
