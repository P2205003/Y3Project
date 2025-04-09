<template>
  <div id="account-popup-overlay" class="popup-overlay" :class="{ active: isActive }" @click="$emit('close')"></div>
  <div id="account-popup" :class="{ active: isActive }" role="dialog" aria-modal="true" aria-labelledby="account-popup-title">
    <div class="popup-header">
      <div class="popup-tabs" id="account-popup-title">
        <button class="popup-tab"
                :class="{ active: activeTab === 'login' }"
                data-tab="login"
                @click="setActiveTab('login')"
                role="tab"
                :aria-selected="activeTab === 'login'"
                aria-controls="login-pane">
          Login
        </button>
        <button class="popup-tab"
                :class="{ active: activeTab === 'register' }"
                data-tab="register"
                @click="setActiveTab('register')"
                role="tab"
                :aria-selected="activeTab === 'register'"
                aria-controls="register-pane">
          Register
        </button>
      </div>
      <button class="popup-close-btn" id="account-popup-close" aria-label="Close Account Panel" @click="$emit('close')">×</button>
    </div>
    <div class="popup-content">
      <!-- Login Pane -->
      <div class="popup-pane"
           id="login-pane"
           :class="{ active: activeTab === 'login' }"
           role="tabpanel"
           aria-labelledby="login-tab"
           v-show="activeTab === 'login'">
        <form class="popup-form" id="login-form" @submit.prevent="handleLogin">
          <div class="form-group">
            <!-- CHANGED: Login uses username, not email, based on backend -->
            <label for="login-username">Username</label>
            <input type="text" id="login-username" name="username" required autocomplete="username" v-model="loginData.username">
          </div>
          <div class="form-group">
            <label for="login-password">Password</label>
            <input type="password" id="login-password" name="password" required autocomplete="current-password" v-model="loginData.password">
          </div>
          <!-- <div class="form-text">
            <a href="#">Forgot Password?</a>
          </div> -->
          <button type="submit" class="submit-btn" :disabled="isSubmitting">
            {{ isSubmitting ? 'Logging in...' : 'Login' }}
          </button>
          <!-- Add error message display area -->
          <p v-if="loginError" class="error-message">{{ loginError }}</p>
        </form>
      </div>
      <!-- Register Pane -->
      <div class="popup-pane"
           id="register-pane"
           :class="{ active: activeTab === 'register' }"
           role="tabpanel"
           aria-labelledby="register-tab"
           v-show="activeTab === 'register'">
        <form class="popup-form" id="register-form" @submit.prevent="handleRegister">
          <!-- ADDED/UPDATED fields to match backend -->
          <div class="form-group">
            <label for="register-fullName">Full Name</label>
            <input type="text" id="register-fullName" name="fullName" required autocomplete="name" v-model="registerData.fullName">
          </div>
          <div class="form-group">
            <label for="register-username">Username</label>
            <input type="text" id="register-username" name="username" required autocomplete="username" v-model="registerData.username">
          </div>
          <div class="form-group">
            <label for="register-email">Email Address</label>
            <input type="email" id="register-email" name="email" required autocomplete="email" v-model="registerData.email">
          </div>
          <div class="form-group">
            <label for="register-password">Password (min 8 chars)</label>
            <input type="password" id="register-password" name="password" required autocomplete="new-password" v-model="registerData.password">
          </div>
          <div class="form-group">
            <label for="register-confirm-password">Confirm Password</label>
            <input type="password" id="register-confirm-password" name="confirm_password" required autocomplete="new-password" v-model="registerData.confirmPassword">
          </div>
          <div class="form-group">
            <label for="register-shippingAddress">Shipping Address</label>
            <input type="text" id="register-shippingAddress" name="shippingAddress" required autocomplete="shipping street-address" v-model="registerData.shippingAddress">
          </div>
          <!-- End ADDED/UPDATED fields -->
          <button type="submit" class="submit-btn" :disabled="isSubmitting">
            {{ isSubmitting ? 'Registering...' : 'Register' }}
          </button>
          <!-- Add error/success message display area -->
          <p v-if="registerError" class="error-message">{{ registerError }}</p>
          <p v-if="registerSuccess" class="success-message">Registration successful! Please log in.</p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import cartService from '@/services/cartService'; // Import cart service for merge

const props = defineProps({
  isActive: Boolean,
  initialTab: {
    type: String,
    default: 'login' // 'login' or 'register'
  }
});

const emit = defineEmits(['close', 'login-success']); // Removed register-success emit for now, handled internally

const activeTab = ref(props.initialTab);
const isSubmitting = ref(false);

// Updated data models to match backend expectations
const loginData = ref({ username: '', password: '' });
const registerData = ref({
  fullName: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  shippingAddress: ''
});

const loginError = ref('');
const registerError = ref('');
const registerSuccess = ref(false);

// Watch for prop changes to update the active tab
watch(() => props.initialTab, (newTab) => {
  activeTab.value = newTab;
});

 // Watch for activation to focus first input
 watch(() => props.isActive, (newValue) => {
    if (newValue) {
        nextTick(() => {
            const firstInput = document.querySelector(`#${activeTab.value}-pane input:not([type="hidden"])`);
            firstInput?.focus();
        });
        // Reset forms/errors when opened
        resetForms();
    }
});


const setActiveTab = (tab) => {
  activeTab.value = tab;
  resetForms(); // Reset errors/success when switching tabs
  nextTick(() => { // Focus after tab switch
        const firstInput = document.querySelector(`#${activeTab.value}-pane input:not([type="hidden"])`);
        firstInput?.focus();
    });
};

const resetForms = () => {
    isSubmitting.value = false; // Ensure submitting state is reset
    loginError.value = '';
    registerError.value = '';
    registerSuccess.value = false;
    // Optionally clear input fields as well
    // loginData.value = { username: '', password: '' };
    // registerData.value = { fullName: '', username: '', email: '', password: '', confirmPassword: '', shippingAddress: '' };
}

const handleLogin = async () => {
  loginError.value = ''; // Clear previous errors
  isSubmitting.value = true;
  console.log('Attempting login:', loginData.value.username);

  try {
    const response = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Crucial for sending/receiving session cookies
      body: JSON.stringify({
        username: loginData.value.username, // Send username
        password: loginData.value.password
      })
    });

    const data = await response.json(); // Try to parse JSON regardless of status

    if (response.ok) {
      console.log('Login successful:', data.user);

      // Merge guest cart with user cart AFTER successful login
      console.log('Attempting to merge carts after login...');
      await cartService.mergeCartsAfterLogin(); // Wait for merge to complete

      // Emit event with user data AFTER merge attempt
      emit('login-success', data.user);
      emit('close');

    } else {
      console.error('Login failed:', data.message || response.statusText);
      loginError.value = data.message || 'Login failed. Please check your credentials.';
    }
  } catch (error) {
    console.error('Network or unexpected error during login:', error);
    loginError.value = 'An error occurred during login. Please try again.';
  } finally {
    isSubmitting.value = false;
  }
};


const handleRegister = async () => {
   registerError.value = ''; // Clear previous errors
   registerSuccess.value = false;

   // Frontend validation (redundant with backend but good UX)
   if (registerData.value.password !== registerData.value.confirmPassword) {
      registerError.value = 'Passwords do not match.';
      return;
   }
   if (registerData.value.password.length < 8) {
      registerError.value = 'Password must be at least 8 characters long.';
      return;
   }
   if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(registerData.value.email)) {
      registerError.value = 'Please enter a valid email address.';
      return;
   }
   // Check other required fields are not empty
   for (const key in registerData.value) {
      if (key !== 'confirmPassword' && !registerData.value[key]) {
          registerError.value = `Please fill in the ${key.replace(/([A-Z])/g, ' $1').toLowerCase()} field.`;
          return;
      }
   }

  isSubmitting.value = true;
  console.log('Attempting registration for:', registerData.value.username);

  try {
    // Prepare data matching backend User model
    const registrationPayload = {
        username: registerData.value.username,
        password: registerData.value.password,
        fullName: registerData.value.fullName,
        email: registerData.value.email,
        shippingAddress: registerData.value.shippingAddress,
    };

    const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // credentials: 'include', // Not strictly necessary for register but doesn't hurt
        body: JSON.stringify(registrationPayload),
    });

    const data = await response.json(); // Try to parse JSON

    if (response.ok) {
        console.log('Registration successful');
        registerSuccess.value = true;
        // Reset form fields after successful registration
        registerData.value = { fullName: '', username: '', email: '', password: '', confirmPassword: '', shippingAddress: '' };
        // Switch to login tab automatically
        setActiveTab('login');
        // You could show a success message for a few seconds before switching,
        // but switching directly is common UX.
    } else {
        console.error('Registration failed:', data.message || response.statusText);
        registerError.value = data.message || 'Registration failed. Please try again.';
    }
  } catch (error) {
      console.error('Network or unexpected error during registration:', error);
      registerError.value = 'An error occurred during registration. Please try again.';
  } finally {
      isSubmitting.value = false;
  }
};

// Handle Escape key press
const handleKeydown = (event) => {
    if (event.key === 'Escape' && props.isActive) {
        emit('close');
    }
};

watch(() => props.isActive, (newValue) => {
    if (newValue) {
        document.addEventListener('keydown', handleKeydown);
    } else {
        document.removeEventListener('keydown', handleKeydown);
    }
});

// Clean up listener on unmount (though App.vue handles it too)
// onUnmounted(() => {
//     document.removeEventListener('keydown', handleKeydown);
// });

</script>

<style scoped>
  /* Add a simple spinner style */
  .spinner {
    display: inline-block;
    width: 1em;
    height: 1em;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
    vertical-align: middle;
    margin-right: 0.5em;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .submit-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
</style>
