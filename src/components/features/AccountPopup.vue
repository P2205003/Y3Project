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
            <label for="login-email">Email Address</label>
            <input type="email" id="login-email" name="email" required autocomplete="email" v-model="loginData.email">
          </div>
          <div class="form-group">
            <label for="login-password">Password</label>
            <input type="password" id="login-password" name="password" required autocomplete="current-password" v-model="loginData.password">
          </div>
          <div class="form-text">
            <a href="#">Forgot Password?</a>
          </div>
          <button type="submit" class="submit-btn">Login</button>
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
          <div class="form-group">
            <label for="register-name">Full Name</label>
            <input type="text" id="register-name" name="name" required autocomplete="name" v-model="registerData.name">
          </div>
          <div class="form-group">
            <label for="register-email">Email Address</label>
            <input type="email" id="register-email" name="email" required autocomplete="email" v-model="registerData.email">
          </div>
          <div class="form-group">
            <label for="register-password">Password</label>
            <input type="password" id="register-password" name="password" required autocomplete="new-password" v-model="registerData.password">
          </div>
          <div class="form-group">
            <label for="register-confirm-password">Confirm Password</label>
            <input type="password" id="register-confirm-password" name="confirm_password" required autocomplete="new-password" v-model="registerData.confirmPassword">
          </div>
          <button type="submit" class="submit-btn">Register</button>
          <!-- Add error message display area -->
          <p v-if="registerError" class="error-message">{{ registerError }}</p>
          <p v-if="registerSuccess" class="success-message">Registration successful! Please log in.</p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';

const props = defineProps({
  isActive: Boolean,
  initialTab: {
    type: String,
    default: 'login' // 'login' or 'register'
  }
});

const emit = defineEmits(['close', 'login-success', 'register-success']);

const activeTab = ref(props.initialTab);
const loginData = ref({ email: '', password: '' });
const registerData = ref({ name: '', email: '', password: '', confirmPassword: '' });
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
    loginError.value = '';
    registerError.value = '';
    registerSuccess.value = false;
    // Optionally clear input fields as well
    // loginData.value = { email: '', password: '' };
    // registerData.value = { name: '', email: '', password: '', confirmPassword: '' };
}

const handleLogin = async () => {
  loginError.value = ''; // Clear previous errors
  console.log('Attempting login:', loginData.value);
  // --- TODO: Replace with actual API call ---
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
  const success = Math.random() > 0.3; // Simulate success/failure
  // --- End TODO ---

  if (success) {
    console.log('Login successful (simulated)');
    emit('login-success', { /* user data */ });
    emit('close');
  } else {
    console.error('Login failed (simulated)');
    loginError.value = 'Invalid email or password. Please try again.';
  }
};

const handleRegister = async () => {
   registerError.value = ''; // Clear previous errors
   registerSuccess.value = false;
  if (registerData.value.password !== registerData.value.confirmPassword) {
    registerError.value = 'Passwords do not match.';
    return;
  }
  console.log('Attempting registration:', registerData.value);
   // --- TODO: Replace with actual API call ---
   await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
   const success = Math.random() > 0.3; // Simulate success/failure
   // --- End TODO ---

  if (success) {
      console.log('Registration successful (simulated)');
      registerSuccess.value = true;
      // emit('register-success', { /* user data */ });
      // emit('close'); // Or switch to login tab
      setActiveTab('login'); // Switch to login tab after successful registration
  } else {
      console.error('Registration failed (simulated)');
      registerError.value = 'Registration failed. Please try again (email might be taken).';
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

</style>
