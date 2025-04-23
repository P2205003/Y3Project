<!-- src/components/layout/TheHeader.vue -->
<template>
  <header id="header" :class="{ scrolled: isScrolled }">
    <router-link to="/" class="logo">{{ t('appName') }}</router-link>

    <!-- Desktop Navigation -->
    <nav id="main-nav">
      <ul>
        <li><router-link to="/">{{ t('header.home') }}</router-link></li>
        <li><router-link to="/products">{{ t('header.products') }}</router-link></li>
        <li v-if="isAdmin">
          <router-link to="/admin" class="admin-link">{{ t('header.adminPanel') }}</router-link>
        </li>
      </ul>
    </nav>

    <div class="header-actions">
      <!-- Search -->
      <div class="search-container" :class="{ active: isSearchActive }">
        <button class="search-button" id="search-button" :aria-label="t('header.search.openAriaLabel')" @click.stop="$emit('toggleSearch')">
          <font-awesome-icon icon="search" />
        </button>
        <input type="search"
               id="search-input"
               class="search-input"
               :placeholder="t('header.search.placeholder')"
               :aria-label="t('header.search.inputAriaLabel')"
               :aria-hidden="!isSearchActive"
               @keydown.esc="$emit('toggleSearch', false)"
               @keydown.enter="handleSearch"
               v-model="searchQuery"
               ref="searchInputRef">
      </div>

      <!-- Account Dropdown -->
      <div class="account-menu-container">
        <button id="account-dropdown-trigger"
                :aria-label="t('header.account.menuAriaLabel')"
                aria-haspopup="true"
                :aria-expanded="isAccountDropdownActive"
                @click.stop="$emit('toggleAccountDropdown')">
          <font-awesome-icon icon="user" />
        </button>
        <div id="account-dropdown-menu" role="menu" :class="{ active: isAccountDropdownActive }">
          <!-- Logged In State -->
          <template v-if="isLoggedIn && currentUser">
            <div class="dropdown-item user-info" role="menuitem" aria-disabled="true">
              <!-- Use interpolation for greeting -->
              <span>{{ t('header.account.greeting', { name: currentUser.fullName || currentUser.username }) }}</span>
            </div>
            <router-link :to="{ name: 'orders-history' }" custom v-slot="{ navigate }">
              <button class="dropdown-item" role="menuitem" @click="navigate(); $emit('toggleAccountDropdown', false)">
                <font-awesome-icon icon="receipt" fixed-width />
                <span>{{ t('header.account.myOrders') }}</span>
              </button>
            </router-link>
            <!-- router-link to="/account/profile" custom v-slot="{ navigate }">
              <button class="dropdown-item" role="menuitem" @click="navigate(); $emit('toggleAccountDropdown', false)">
                <font-awesome-icon icon="user-cog" fixed-width />
                <span>{{ t('header.account.myProfile') }}</span>
              </button>
            <router-link -->
            <button class="dropdown-item logout-item" role="menuitem" @click="$emit('logout')">
              <font-awesome-icon icon="sign-out-alt" fixed-width />
              <span>{{ t('header.account.logout') }}</span>
            </button>
          </template>
          <!-- Logged Out State -->
          <template v-else>
            <button class="dropdown-item" data-action="login" role="menuitem" @click="$emit('openAccountPopup', 'login')">
              <font-awesome-icon icon="sign-in-alt" fixed-width />
              <span>{{ t('header.account.login') }}</span>
            </button>
            <button class="dropdown-item" data-action="register" role="menuitem" @click="$emit('openAccountPopup', 'register')">
              <font-awesome-icon icon="user-plus" fixed-width />
              <span>{{ t('header.account.signUp') }}</span>
            </button>
          </template>
        </div>
      </div>

      <!-- Cart -->
      <button id="cart-popup-trigger"
              :title="t('header.cart.title')"
              :aria-label="t('header.cart.ariaLabel')"
              aria-haspopup="true"
              :aria-expanded="false"
              @click="$emit('toggleCart')">
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="M17,18C15.89,18 15,18.89 15,20A2,2 0 0,0 17,22A2,2 0 0,0 19,20C19,18.89 18.1,18 17,18M1,2V4H3L6.6,11.59L5.24,14.04C5.09,14.32 5,14.64 5,15A2,2 0 0,0 7,17H19V15H7.42A0.25,0.25 0 0,1 7.17,14.75L8.1,13H15.55C16.3,13 16.96,12.58 17.3,11.97L20.88,5.5C20.95,5.34 21,5.17 21,5A1,1 0 0,0 20,4H5.21L4.27,2M7,18C5.89,18 5,18.89 5,20A2,2 0 0,0 7,22A2,2 0 0,0 9,20C9,18.89 8.1,18 7,18Z"></path></svg>
        <span v-if="cartItemCount > 0" class="cart-count">{{ cartItemCount }}</span>
      </button>

      <!-- Language Switcher **** -->
      <LanguageSwitcher />

      <!-- Mobile Menu Toggle -->
      <button class="menu-toggle"
              id="menu-toggle"
              :aria-label="t('header.mobileMenu.toggleAriaLabel')"
              :aria-expanded="isMobileMenuActive"
              @click="$emit('toggleMenu')">
        <span></span> <span></span> <span></span>
      </button>
    </div>
  </header>
</template>

<script setup>
  import { ref, watch, nextTick, onMounted } from 'vue';
  import LanguageSwitcher from '../ui/LanguageSwitcher.vue';
  import { useI18n } from 'vue-i18n'; // <-- Import useI18n
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
  import { useRouter, useRoute } from 'vue-router';

  // --- Get the translation function ---
  const { t } = useI18n();

  // --- Props definition ---
  const props = defineProps({
    isScrolled: Boolean,
    isMobileMenuActive: Boolean,
    isSearchActive: Boolean,
    isAccountDropdownActive: Boolean,
    cartItemCount: {
      type: Number,
      default: 0
    },
    isLoggedIn: {
      type: Boolean,
      required: true
    },
    currentUser: {
      type: Object,
      default: null
    }
  });

  // --- Emits definition ---
  const emit = defineEmits([
    'toggleMenu',
    'toggleSearch',
    'toggleAccountDropdown',
    'openAccountPopup',
    'toggleCart',
    'logout'
  ]);

  // --- Reactive state ---
  const searchInputRef = ref(null);
  const searchQuery = ref('');
  const isAdmin = ref(false);

  const router = useRouter();
  const route = useRoute();

  // --- **MOVE FUNCTION DEFINITION HERE** ---
  const checkAdminStatus = async () => {
    if (props.isLoggedIn) {
      console.log('Checking admin status...');
      try {
        const response = await fetch('/api/users/check-admin', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          isAdmin.value = data.isAdmin;
          console.log('Admin status:', isAdmin.value);
        } else {
          console.warn('Failed to check admin status, assuming not admin.');
          isAdmin.value = false;
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        isAdmin.value = false;
      }
    } else {
      isAdmin.value = false;
    }
  };

  // --- Watchers ---
  watch(() => props.isSearchActive, (newValue) => {
    if (newValue) {
      nextTick(() => {
        searchInputRef.value?.focus();
      });
    }
  });

  // --- Watch login status to re-check admin status ---
  // Now this watch can safely call checkAdminStatus
  watch(() => props.isLoggedIn, (newValue) => {
    checkAdminStatus();
  }, { immediate: true });

  watch(() => route.query.q, (newQuery) => {
    if (route.name === 'products') {
      searchQuery.value = newQuery || '';
    }
  });

  // --- Methods ---
  const handleSearch = () => {
    const query = {};
    const searchTerm = searchQuery.value.trim();
    if (searchTerm) {
      query.q = searchTerm;
    }
    console.log(`Navigating to search with query:`, query);
    router.push({ name: 'products', query });
  };

  // --- Lifecycle Hooks ---
  onMounted(() => {
    if (route.name === 'products' && route.query.q) {
      searchQuery.value = route.query.q;
    }
    // checkAdminStatus() is already called by the immediate watcher
  });

</script>

<style scoped>
  .header-actions {
    gap: 0.8rem; /* Maybe increase gap slightly */
  }

  /* Optional: Add specific styles for the logged-in user info or logout item */
  .dropdown-item.user-info {
    font-weight: 600;
    color: var(--text-dark);
    cursor: default; /* Not clickable */
    background-color: var(--bg-off-light); /* Subtle background */
    border-bottom: 1px solid var(--border-color);
    margin-bottom: 0.5rem;
    padding-top: 0.9rem;
    padding-bottom: 0.9rem;
  }

    .dropdown-item.user-info span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 150px; /* Adjust as needed */
      display: inline-block; /* Needed for text-overflow */
      vertical-align: middle;
    }

    .dropdown-item.user-info:hover {
      background-color: var(--bg-off-light); /* Don't change on hover */
      color: var(--text-dark);
    }

  .dropdown-item.logout-item {
    color: var(--secondary);
    border-top: 1px solid var(--border-color);
    margin-top: 0.5rem;
  }

    .dropdown-item.logout-item:hover,
    .dropdown-item.logout-item:focus-visible {
      background-color: #ffe8e8; /* Light red background on hover */
      color: #c82333; /* Darker red text */
      outline: none;
    }

      .dropdown-item.logout-item:hover .svg-inline--fa,
      .dropdown-item.logout-item:focus-visible .svg-inline--fa {
        color: #c82333; /* Darker red icon */
      }

  /* Ensure router-link items close dropdown */
  .dropdown-item {
    display: flex; /* Use flex for alignment */
    align-items: center; /* Vertically center icon and text */
    gap: 0.8rem; /* Space between icon and text */
    width: 100%; /* Ensure button takes full width */
    text-align: left; /* Align text left */
    background: none; /* Remove default button background */
    border: none; /* Remove default button border */
    padding: 0.8rem 1.2rem; /* Match existing padding */
    font-size: 0.9rem; /* Match existing font size */
    font-family: var(--font-body); /* Match existing font family */
    color: var(--text-dark); /* Match existing color */
    cursor: pointer; /* Ensure cursor indicates clickability */
    white-space: nowrap; /* Prevent text wrapping */
    transition: background-color var(--transition-fast), color var(--transition-fast);
  }

    .dropdown-item .svg-inline--fa {
      width: 16px; /* Ensure fixed width for alignment */
      text-align: center; /* Center icon if needed */
      color: var(--text-muted);
      transition: color var(--transition-fast);
      flex-shrink: 0; /* Prevent icon from shrinking */
    }

    .dropdown-item:hover,
    .dropdown-item:focus-visible {
      background-color: var(--bg-off-light);
      color: var(--primary);
      outline: none;
    }

      .dropdown-item:hover .svg-inline--fa,
      .dropdown-item:focus-visible .svg-inline--fa {
        color: var(--primary);
      }

  /* **NEW: Style for Admin Link in main nav** */
  .admin-link {
    font-weight: bold;
    color: var(--primary-dark); /* Example: Make it stand out slightly */
  }

    .admin-link:hover {
      color: var(--primary);
    }
</style>
