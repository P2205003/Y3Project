<template>
  <div>
    <SiteNav />
    <TopBar />
    <Ribbon />
    <SideMenu />
    <div class="register-page">
      <div class="register-card">
        <h2 class="title">Register</h2>
        <form @submit.prevent="handleSubmit" ref="registerForm" class="register-form">
          <!-- Full Name Field -->
          <div class="form-item">
            <label for="fullName" class="form-label">Full Name</label>
            <input id="fullName"
                   v-model="registerForm.fullName"
                   type="text"
                   class="form-input"
                   placeholder="Enter your full name"
                   required />
            <p v-if="errors.fullName" class="error-message">{{ errors.fullName }}</p>
          </div>

          <!-- Username Field -->
          <div class="form-item">
            <label for="username" class="form-label">Username</label>
            <input id="username"
                   v-model="registerForm.username"
                   type="text"
                   class="form-input"
                   placeholder="Create a username"
                   required />
            <p v-if="errors.username" class="error-message">{{ errors.username }}</p>
          </div>

          <!-- Email Field -->
          <div class="form-item">
            <label for="email" class="form-label">Email</label>
            <input id="email"
                   v-model="registerForm.email"
                   type="email"
                   class="form-input"
                   placeholder="Enter your email"
                   required />
            <p v-if="errors.email" class="error-message">{{ errors.email }}</p>
          </div>

          <!-- Password Field -->
          <div class="form-item">
            <label for="password" class="form-label">Password</label>
            <input id="password"
                   v-model="registerForm.password"
                   type="password"
                   class="form-input"
                   placeholder="Create a password"
                   required />
            <p v-if="errors.password" class="error-message">{{ errors.password }}</p>
          </div>

          <!-- Confirm Password Field -->
          <div class="form-item">
            <label for="confirmPassword" class="form-label">Confirm Password</label>
            <input id="confirmPassword"
                   v-model="registerForm.confirmPassword"
                   type="password"
                   class="form-input"
                   placeholder="Confirm your password"
                   required />
            <p v-if="errors.confirmPassword" class="error-message">{{ errors.confirmPassword }}</p>
          </div>

          <!-- Shipping Address Field -->
          <div class="form-item">
            <label for="shippingAddress" class="form-label">Shipping Address</label>
            <input id="shippingAddress"
                   v-model="registerForm.shippingAddress"
                   type="text"
                   class="form-input"
                   placeholder="Enter your shipping address"
                   required />
            <p v-if="errors.shippingAddress" class="error-message">{{ errors.shippingAddress }}</p>
          </div>

          <!-- Register Button -->
          <div class="form-item">
            <button type="submit" class="register-button" :disabled="isSubmitting">
              <span v-if="isSubmitting" class="spinner"></span>
              {{ isSubmitting ? 'Registering...' : 'Register' }}
            </button>
          </div>

          <!-- Login Link -->
          <div class="form-item">
            <router-link to="/login">
              <button type="button" class="login-button">Already have an account? Login</button>
            </router-link>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
  import SiteNav from '@/components/SiteNav.vue';
  import TopBar from '@/components/TopBar.vue';
  import Ribbon from '@/components/Ribbon.vue';
  import SideMenu from '@/components/SideMenu.vue';
  import { ElMessage } from 'element-plus';

  export default {
    name: 'Register',
    components: {
      SiteNav,
      TopBar,
      Ribbon,
      SideMenu,
    },
    data() {
      return {
        isSubmitting: false,
        registerForm: {
          fullName: '',
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          shippingAddress: '',
        },
        errors: {
          fullName: '',
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          shippingAddress: '',
        },
        rules: {
          fullName: [{ required: true, message: 'Please enter your full name', trigger: 'blur' }],
          username: [{ required: true, message: 'Please enter a username', trigger: 'blur' }],
          email: [
            { required: true, message: 'Please enter your email', trigger: 'blur' },
            { type: 'email', message: 'Please enter a valid email address', trigger: ['blur', 'change'] },
          ],
          password: [
            { required: true, message: 'Please create a password', trigger: 'blur' },
            { min: 8, message: 'Password must be at least 8 characters', trigger: 'blur' }
          ],
          confirmPassword: [
            { required: true, message: 'Please confirm your password', trigger: 'blur' },
            {
              validator: (rule, value, callback) => {
                if (value !== this.registerForm.password) {
                  callback(new Error('Passwords do not match'));
                } else {
                  callback();
                }
              },
              trigger: 'blur',
            },
          ],
          shippingAddress: [{ required: true, message: 'Please enter your shipping address', trigger: 'blur' }],
        },
      };
    },
    methods: {
      validateForm() {
        let isValid = true;

        // Full Name validation
        if (!this.registerForm.fullName) {
          this.errors.fullName = 'Please enter your full name';
          isValid = false;
        } else {
          this.errors.fullName = '';
        }

        // Username validation
        if (!this.registerForm.username) {
          this.errors.username = 'Please enter a username';
          isValid = false;
        } else {
          this.errors.username = '';
        }

        // Email validation
        if (!this.registerForm.email) {
          this.errors.email = 'Please enter your email';
          isValid = false;
        } else if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(this.registerForm.email)) {
          this.errors.email = 'Please enter a valid email address';
          isValid = false;
        } else {
          this.errors.email = '';
        }

        // Password validation
        if (!this.registerForm.password) {
          this.errors.password = 'Please create a password';
          isValid = false;
        } else if (this.registerForm.password.length < 8) {
          this.errors.password = 'Password must be at least 8 characters';
          isValid = false;
        } else {
          this.errors.password = '';
        }

        // Confirm Password validation
        if (!this.registerForm.confirmPassword) {
          this.errors.confirmPassword = 'Please confirm your password';
          isValid = false;
        } else if (this.registerForm.confirmPassword !== this.registerForm.password) {
          this.errors.confirmPassword = 'Passwords do not match';
          isValid = false;
        } else {
          this.errors.confirmPassword = '';
        }

        // Shipping Address validation
        if (!this.registerForm.shippingAddress) {
          this.errors.shippingAddress = 'Please enter your shipping address';
          isValid = false;
        } else {
          this.errors.shippingAddress = '';
        }

        return isValid;
      },
      async handleSubmit() {
        if (!this.validateForm()) {
          return false;
        }

        this.isSubmitting = true; // Start loading state
        try {
          const response = await fetch('/api/users/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(this.registerForm),
          });

          if (response.ok) {
            ElMessage.success('Registration successful! Redirecting to login...');
            setTimeout(() => {
              this.$router.push('/login'); // Redirect to login page
            }, 1500); // Delay for 1.5 seconds
          } else {
            const errorData = await response.json();
            ElMessage.error(errorData.message || 'Registration failed');
          }
        } catch (error) {
          console.error('Registration error:', error);
          ElMessage.error('An unexpected error occurred. Please try again.');
        } finally {
          this.isSubmitting = false; // End loading state
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
    padding-bottom: 40px;
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
      border-color: #409eff;
      box-shadow: 0 0 4px rgba(64, 158, 255, 0.5);
    }

  /* Buttons */
  .register-button, .login-button {
    width: 100%;
    height: 50px;
    font-size: 18px;
    font-weight: bold;
    border-radius: 8px;
    cursor: pointer;
  }

  .register-button {
    color: white;
    background-color: #409eff;
    border: none;
  }

    .register-button:hover:not(:disabled) {
      background-color: #337ecc;
    }

    .register-button:disabled {
      background-color: #a0cfff;
      cursor: not-allowed;
    }

  .login-button {
    color: #409eff;
    background: none;
    border: 2px solid #409eff;
  }

    .login-button:hover {
      background-color: #409eff;
      color: white;
    }

  /* Error Message */
  .error-message {
    color: #f56c6c;
    font-size: 14px;
    margin-top: 5px;
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

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .form-item {
      width: 100%;
    }

    .register-card {
      width: 90%;
      padding: 20px;
    }
  }
</style>
