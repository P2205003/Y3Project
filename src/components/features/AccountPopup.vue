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
          {{ t('accountPopup.tabs.login') }}
        </button>
        <button class="popup-tab"
                :class="{ active: activeTab === 'register' }"
                data-tab="register"
                @click="setActiveTab('register')"
                role="tab"
                :aria-selected="activeTab === 'register'"
                aria-controls="register-pane">
          {{ t('accountPopup.tabs.register') }}
        </button>
      </div>
      <button class="popup-close-btn" id="account-popup-close" :aria-label="t('accountPopup.closeAriaLabel')" @click="$emit('close')">×</button>
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
            <label for="login-username">{{ t('accountPopup.loginForm.usernameLabel') }}</label>
            <input type="text" id="login-username" name="username" required autocomplete="username" v-model="loginData.username">
          </div>
          <div class="form-group">
            <label for="login-password">{{ t('accountPopup.loginForm.passwordLabel') }}</label>
            <input type="password" id="login-password" name="password" required autocomplete="current-password" v-model="loginData.password">
          </div>
          <!-- <div class="form-text">
            <a href="#">{{ t('accountPopup.loginForm.forgotPassword') }}</a>
          </div> -->
          <button type="submit" class="submit-btn" :disabled="isSubmitting">
            {{ isSubmitting ? t('accountPopup.loginForm.submittingButton') : t('accountPopup.loginForm.submitButton') }}
          </button>
          <!-- Error message display: Display raw message from backend or generic translated message -->
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
            <label for="register-fullName">{{ t('accountPopup.registerForm.fullNameLabel') }}</label>
            <input type="text" id="register-fullName" name="fullName" required autocomplete="name" v-model="registerData.fullName">
          </div>
          <div class="form-group">
            <label for="register-username">{{ t('accountPopup.registerForm.usernameLabel') }}</label>
            <input type="text" id="register-username" name="username" required autocomplete="username" v-model="registerData.username">
          </div>
          <div class="form-group">
            <label for="register-email">{{ t('accountPopup.registerForm.emailLabel') }}</label>
            <input type="email" id="register-email" name="email" required autocomplete="email" v-model="registerData.email">
          </div>
          <div class="form-group">
            <label for="register-password">{{ t('accountPopup.registerForm.passwordLabel') }}</label>
            <input type="password" id="register-password" name="password" required autocomplete="new-password" v-model="registerData.password">
          </div>
          <div class="form-group">
            <label for="register-confirm-password">{{ t('accountPopup.registerForm.confirmPasswordLabel') }}</label>
            <input type="password" id="register-confirm-password" name="confirm_password" required autocomplete="new-password" v-model="registerData.confirmPassword">
          </div>
          <div class="form-group">
            <label for="register-shippingAddress">{{ t('accountPopup.registerForm.shippingAddressLabel') }}</label>
            <input type="text" id="register-shippingAddress" name="shippingAddress" required autocomplete="shipping street-address" v-model="registerData.shippingAddress">
          </div>
          <button type="submit" class="submit-btn" :disabled="isSubmitting">
            {{ isSubmitting ? t('accountPopup.registerForm.submittingButton') : t('accountPopup.registerForm.submitButton') }}
          </button>
          <!-- Error/success message display: Display raw message from backend or translated messages for frontend validation -->
          <p v-if="registerError" class="error-message">{{ registerError }}</p>
          <p v-if="registerSuccess" class="success-message">{{ t('accountPopup.registerForm.successMessage') }}</p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, watch, nextTick } from 'vue';
  import { useI18n } from 'vue-i18n'; // Import useI18n
  import cartService from '@/services/cartService';

  // --- Get translation function ---
  const { t } = useI18n();

  const props = defineProps({
    isActive: Boolean,
    initialTab: {
      type: String,
      default: 'login' // 'login' or 'register'
    }
  });

  const emit = defineEmits(['close', 'login-success']);

  const activeTab = ref(props.initialTab);
  const isSubmitting = ref(false);

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

  watch(() => props.initialTab, (newTab) => {
    activeTab.value = newTab;
  });

  watch(() => props.isActive, (newValue) => {
    if (newValue) {
      nextTick(() => {
        const firstInput = document.querySelector(`#${activeTab.value}-pane input:not([type="hidden"])`);
        firstInput?.focus();
      });
      resetForms();
    }
  });

  const setActiveTab = (tab) => {
    activeTab.value = tab;
    resetForms();
    nextTick(() => {
      const firstInput = document.querySelector(`#${activeTab.value}-pane input:not([type="hidden"])`);
      firstInput?.focus();
    });
  };

  const resetForms = () => {
    isSubmitting.value = false;
    loginError.value = '';
    registerError.value = '';
    registerSuccess.value = false;
  }

  const handleLogin = async () => {
    loginError.value = '';
    isSubmitting.value = true;
    console.log('Attempting login:', loginData.value.username);

    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: loginData.value.username,
          password: loginData.value.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Login successful:', data.user);
        await cartService.mergeCartsAfterLogin();
        emit('login-success', data.user);
        emit('close');
      } else {
        console.error('Login failed:', data.message || response.statusText);
        // Keep backend message if available, otherwise use generic translated one
        loginError.value = data.message || t('accountPopup.loginForm.genericError');
      }
    } catch (error) {
      console.error('Network or unexpected error during login:', error);
      // Use generic translated error for network/other issues
      loginError.value = t('accountPopup.loginForm.networkError');
    } finally {
      isSubmitting.value = false;
    }
  };


  const handleRegister = async () => {
    registerError.value = '';
    registerSuccess.value = false;

    // Frontend validation using translated messages
    if (registerData.value.password !== registerData.value.confirmPassword) {
      registerError.value = t('accountPopup.registerForm.error.passwordsDoNotMatch');
      return;
    }
    if (registerData.value.password.length < 8) {
      registerError.value = t('accountPopup.registerForm.error.passwordTooShort');
      return;
    }
    if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(registerData.value.email)) {
      registerError.value = t('accountPopup.registerForm.error.invalidEmail');
      return;
    }
    // Check other required fields
    const fieldMap = { // Map model key to display name for error message
      fullName: 'Full Name',
      username: 'Username',
      email: 'Email Address',
      password: 'Password',
      shippingAddress: 'Shipping Address'
    };
    for (const key in fieldMap) {
      if (!registerData.value[key]) {
        // Use interpolation for the field name
        registerError.value = t('accountPopup.registerForm.error.fieldRequired', { fieldName: fieldMap[key].toLowerCase() });
        return;
      }
    }

    isSubmitting.value = true;
    console.log('Attempting registration for:', registerData.value.username);

    try {
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
        body: JSON.stringify(registrationPayload),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Registration successful');
        registerSuccess.value = true;
        registerData.value = { fullName: '', username: '', email: '', password: '', confirmPassword: '', shippingAddress: '' };
        setActiveTab('login');
      } else {
        console.error('Registration failed:', data.message || response.statusText);
        // Keep backend message if available, otherwise use generic translated one
        registerError.value = data.message || t('accountPopup.registerForm.error.genericError');
      }
    } catch (error) {
      console.error('Network or unexpected error during registration:', error);
      // Use generic translated error for network/other issues
      registerError.value = t('accountPopup.registerForm.error.networkError');
    } finally {
      isSubmitting.value = false;
    }
  };

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

</script>

<style scoped>
  /* Styles remain the same */
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
