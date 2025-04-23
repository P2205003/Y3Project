<template>
  <div id="account-popup-overlay" class="popup-overlay" :class="{ active: isActive }" @click="requestClose"></div>
  <div id="account-popup" :class="{ active: isActive }" role="dialog" aria-modal="true" aria-labelledby="account-popup-title">
    <div class="popup-header">
      <div class="popup-tabs" id="account-popup-title">
        <button class="popup-tab"
                :class="{ active: activeTab === 'login' }"
                data-tab="login"
                @click="setActiveTab('login')"
                role="tab"
                :aria-selected="activeTab === 'login'"
                aria-controls="login-pane"
                :disabled="isSubmitting || isShowingLoginSuccess">
          <!-- Disable during submit AND success display -->
          {{ t('accountPopup.tabs.login') }}
        </button>
        <button class="popup-tab"
                :class="{ active: activeTab === 'register' }"
                data-tab="register"
                @click="setActiveTab('register')"
                role="tab"
                :aria-selected="activeTab === 'register'"
                aria-controls="register-pane"
                :disabled="isSubmitting || isShowingLoginSuccess">
          <!-- Disable during submit AND success display -->
          {{ t('accountPopup.tabs.register') }}
        </button>
      </div>
      <!-- Disable close button during API call AND during the success message wait -->
      <button class="popup-close-btn" id="account-popup-close" :aria-label="t('accountPopup.closeAriaLabel')" @click="requestClose" :disabled="isSubmitting || isShowingLoginSuccess">×</button>
    </div>
    <div class="popup-content">
      <!-- Login Pane -->
      <div class="popup-pane"
           id="login-pane"
           :class="{ active: activeTab === 'login' }"
           role="tabpanel"
           aria-labelledby="login-tab"
           v-show="activeTab === 'login'">
        <!-- Show Login Form OR Success Message -->
        <!-- Use v-show for the form to preserve state if needed, or keep v-if -->
        <form v-if="!isShowingLoginSuccess" class="popup-form" id="login-form" @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="login-username">{{ t('accountPopup.loginForm.usernameLabel') }}</label>
            <input type="text" id="login-username" name="username" required autocomplete="username" v-model="loginData.username" :disabled="isSubmitting">
          </div>
          <div class="form-group">
            <label for="login-password">{{ t('accountPopup.loginForm.passwordLabel') }}</label>
            <input type="password" id="login-password" name="password" required autocomplete="current-password" v-model="loginData.password" :disabled="isSubmitting">
          </div>
          <button type="submit" class="submit-btn" :disabled="isSubmitting">
            <span v-if="isSubmitting" class="spinner" aria-hidden="true"></span>
            {{ isSubmitting ? t('accountPopup.loginForm.submittingButton') : t('accountPopup.loginForm.submitButton') }}
          </button>
          <p v-if="loginError" class="error-message">{{ loginError }}</p>
        </form>
        <!-- Success Message Area (shown when isShowingLoginSuccess is true) -->
        <div v-else class="popup-message success">
          <p class="success-message">{{ loginSuccessMessage }}</p>
          <span style="font-size: 2rem; color: var(--success); margin-top: 1rem;">✔</span>
        </div>
      </div>
      <!-- Register Pane -->
      <div class="popup-pane"
           id="register-pane"
           :class="{ active: activeTab === 'register' }"
           role="tabpanel"
           aria-labelledby="register-tab"
           v-show="activeTab === 'register'">
        <!-- Registration form: disable submit only during its own submission -->
        <form class="popup-form" id="register-form" @submit.prevent="handleRegister">
          <!-- ... registration form fields ... -->
          <div class="form-group">
            <label for="register-fullName">{{ t('accountPopup.registerForm.fullNameLabel') }}</label>
            <input type="text" id="register-fullName" name="fullName" required autocomplete="name" v-model="registerData.fullName" :disabled="isSubmitting">
          </div>
          <div class="form-group">
            <label for="register-username">{{ t('accountPopup.registerForm.usernameLabel') }}</label>
            <input type="text" id="register-username" name="username" required autocomplete="username" v-model="registerData.username" :disabled="isSubmitting">
          </div>
          <div class="form-group">
            <label for="register-email">{{ t('accountPopup.registerForm.emailLabel') }}</label>
            <input type="email" id="register-email" name="email" required autocomplete="email" v-model="registerData.email" :disabled="isSubmitting">
          </div>
          <div class="form-group">
            <label for="register-password">{{ t('accountPopup.registerForm.passwordLabel') }}</label>
            <input type="password" id="register-password" name="password" required autocomplete="new-password" v-model="registerData.password" :disabled="isSubmitting">
          </div>
          <div class="form-group">
            <label for="register-confirm-password">{{ t('accountPopup.registerForm.confirmPasswordLabel') }}</label>
            <input type="password" id="register-confirm-password" name="confirm_password" required autocomplete="new-password" v-model="registerData.confirmPassword" :disabled="isSubmitting">
          </div>
          <div class="form-group">
            <label for="register-shippingAddress">{{ t('accountPopup.registerForm.shippingAddressLabel') }}</label>
            <input type="text" id="register-shippingAddress" name="shippingAddress" required autocomplete="shipping street-address" v-model="registerData.shippingAddress" :disabled="isSubmitting">
          </div>
          <button type="submit" class="submit-btn" :disabled="isSubmitting">
            <span v-if="isSubmitting" class="spinner" aria-hidden="true"></span>
            {{ isSubmitting ? t('accountPopup.registerForm.submittingButton') : t('accountPopup.registerForm.submitButton') }}
          </button>
          <p v-if="registerError" class="error-message">{{ registerError }}</p>
          <p v-if="registerSuccess" class="success-message">{{ t('accountPopup.registerForm.successMessage') }}</p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, watch, nextTick, onUnmounted } from 'vue';
  import { useI18n } from 'vue-i18n';
  import cartService from '@/services/cartService';

  const { t } = useI18n();

  const props = defineProps({
    isActive: Boolean,
    initialTab: {
      type: String,
      default: 'login'
    }
  });

  const emit = defineEmits(['close', 'login-success']);

  const activeTab = ref(props.initialTab);
  const isSubmitting = ref(false); // True ONLY during fetch
  const isShowingLoginSuccess = ref(false); // True ONLY during the success message display timeout
  const closeTimeoutId = ref(null);

  const loginData = ref({ username: '', password: '' });
  const registerData = ref({
    fullName: '', username: '', email: '', password: '', confirmPassword: '', shippingAddress: ''
  });

  const loginError = ref('');
  const registerError = ref('');
  const registerSuccess = ref(false);
  const loginSuccessMessage = ref('');

  // --- Watchers ---

  watch(() => props.initialTab, (newTab) => {
    if (!isSubmitting.value && !isShowingLoginSuccess.value) {
      activeTab.value = newTab;
    }
  });

  watch(() => props.isActive, (newValue, oldValue) => {
    console.log(`isActive changed from ${oldValue} to ${newValue}`);
    if (newValue) {
      // Popup opened
      clearTimeout(closeTimeoutId.value); // Clear any lingering timeout
      resetStates(); // Reset all relevant states
      activeTab.value = props.initialTab; // Ensure correct tab
      nextTick(() => focusFirstInput());
      document.addEventListener('keydown', handleKeydown);
    } else {
      // Popup closed
      document.removeEventListener('keydown', handleKeydown);
      // Ensure timeout is cleared if closed externally
      clearTimeout(closeTimeoutId.value);
      // Reset states AFTER potential close animation completes might be better,
      // but resetting here ensures clean state if reopened quickly.
      resetStates();
    }
  });

  // --- Methods ---

  const focusFirstInput = () => {
    const paneSelector = `#${activeTab.value}-pane`;
    // Find the first input/button/textarea that is not disabled or hidden
    const focusable = document.querySelector(
      `${paneSelector} input:not([type="hidden"]):not([disabled]), ${paneSelector} button:not([disabled]), ${paneSelector} textarea:not([disabled])`
    );
    focusable?.focus();
    console.log(`Attempted to focus on first element in ${paneSelector}`, focusable);
  };

  const setActiveTab = (tab) => {
    if (!isSubmitting.value && !isShowingLoginSuccess.value) {
      activeTab.value = tab;
      resetErrorsAndMessages(); // Only reset errors/messages, not fields
      nextTick(() => focusFirstInput());
    }
  };

  const resetErrorsAndMessages = () => {
    loginError.value = '';
    registerError.value = '';
    registerSuccess.value = false;
    loginSuccessMessage.value = '';
    // Keep isSubmitting and isShowingLoginSuccess as they are managed elsewhere
    // Keep form data as is
  }

  const resetStates = () => {
    console.log('resetStates called');
    isSubmitting.value = false;
    isShowingLoginSuccess.value = false; // Reset success display flag
    loginError.value = '';
    registerError.value = '';
    registerSuccess.value = false;
    loginSuccessMessage.value = '';
    // Clear form data on reset? Optional, depends on desired UX.
    // loginData.value = { username: '', password: '' };
    // registerData.value = { fullName: '', username: '', email: '', password: '', confirmPassword: '', shippingAddress: '' };
  }


  const requestClose = () => {
    // Prevent manual close ONLY during the success message display timer
    if (isShowingLoginSuccess.value) {
      console.log("Manual close prevented: Success message showing.");
      return;
    }
    // Allow closing if only submitting (e.g., user cancels slow request - though fetch isn't easily cancellable)
    // Or allow closing normally if idle.
    console.log("requestClose called, emitting 'close'.");
    clearTimeout(closeTimeoutId.value); // Clear pending timeout if any
    emit('close');
  }

  const handleLogin = async () => {
    loginError.value = '';
    loginSuccessMessage.value = ''; // Clear previous messages
    isShowingLoginSuccess.value = false; // Ensure this is false before starting
    isSubmitting.value = true; // Start submission indicator
    console.log('Login attempt started...');

    clearTimeout(closeTimeoutId.value); // Clear any previous timeout

    try {
      const response = await fetch('/api/users/login', { /* ... fetch options ... */
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
        console.log('Login API call successful:', data.user);
        isSubmitting.value = false; // Submission finished

        // --- Success Sequence ---
        loginSuccessMessage.value = t('accountPopup.loginForm.successMessage');
        isShowingLoginSuccess.value = true; // Activate success message display
        console.log('Set isShowingLoginSuccess = true');

        emit('login-success', data.user); // Emit success event
        // await cartService.mergeCartsAfterLogin(); // Merge carts (ensure this doesn't block unexpectedly)

        console.log('Starting 2-second close timer...');
        closeTimeoutId.value = setTimeout(() => {
          console.log('Timeout finished. Emitting close.');
          emit('close');
          // No need to reset isShowingLoginSuccess here, watch(isActive) handles it
        }, 2000); // Close after 2 seconds

      } else {
        console.error('Login API call failed:', data.message || response.statusText);
        loginError.value = data.message || t('accountPopup.loginForm.genericError');
        isSubmitting.value = false; // Submission failed
      }
    } catch (error) {
      console.error('Network or unexpected error during login:', error);
      loginError.value = t('accountPopup.loginForm.networkError');
      isSubmitting.value = false; // Submission failed
    }
    // No finally block needed for isSubmitting as it's handled in success/error paths
  };

  const handleRegister = async () => {
    registerError.value = '';
    registerSuccess.value = false;
    // Ensure login-specific states are clear if user switches to register
    loginSuccessMessage.value = '';
    isShowingLoginSuccess.value = false;

    if (registerData.value.password !== registerData.value.confirmPassword) {
      registerError.value = t('accountPopup.registerForm.error.passwordsDoNotMatch');
      return;
    }

    isSubmitting.value = true; // Use the same flag for register submission
    console.log('Register attempt started...');

    try {
      const registrationPayload = {
        fullName: registerData.value.fullName,
        username: registerData.value.username,
        email: registerData.value.email,
        password: registerData.value.password,
        shippingAddress: registerData.value.shippingAddress
      };
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationPayload)
      });
      const data = await response.json();

      if (response.ok) {
        console.log('Registration successful');
        registerSuccess.value = true;
        registerData.value = { fullName: '', username: '', email: '', password: '', confirmPassword: '', shippingAddress: '' };
        nextTick(() => {
          setActiveTab('login'); // Switch to login tab
        });
      } else {
        console.error('Registration failed:', data.message || response.statusText);
        registerError.value = data.message || t('accountPopup.registerForm.error.genericError');
      }
    } catch (error) {
      console.error('Network or unexpected error during registration:', error);
      registerError.value = t('accountPopup.registerForm.error.networkError');
    } finally {
      isSubmitting.value = false; // Registration submission ends
      console.log('Register attempt finished.');
    }
  };

  const handleKeydown = (event) => {
    if (event.key === 'Escape' && props.isActive) {
      requestClose();
    }
  };

  // Cleanup timeout on unmount
  onUnmounted(() => {
    clearTimeout(closeTimeoutId.value);
    document.removeEventListener('keydown', handleKeydown);
  });

</script>

<style scoped>
  /* Base styles assumed to exist */

  .popup-message.success {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 2rem 1rem;
    min-height: 150px; /* Match form height approx */
    box-sizing: border-box;
  }

  .success-message {
    color: var(--success, #28a745);
    font-weight: 600;
    margin-bottom: 1rem;
  }

  .error-message {
    color: var(--danger, #dc3545);
    font-size: 0.9em;
    margin-top: 0.75rem;
    text-align: center;
  }

  .spinner {
    display: inline-block;
    width: 1em;
    height: 1em;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
    vertical-align: text-bottom;
    margin-right: 0.5em;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .submit-btn:disabled,
  .popup-tab:disabled,
  .popup-close-btn:disabled {
    opacity: 0.65; /* Slightly more pronounced disabled state */
    cursor: not-allowed;
  }

  .popup-pane {
    padding: 1rem;
  }
</style>
