<template>
  <header id="header" :class="{ scrolled: isScrolled }">
    <router-link to="/" class="logo">{{ t('appName') }}</router-link>

    <!-- Desktop Navigation -->
    <nav id="main-nav">
      <ul>
        <li><router-link to="/">{{ t('header.home') }}</router-link></li>
        <li><router-link to="/products">{{ t('header.products') }}</router-link></li>
        <li v-if="isAdmin">
          <router-link to="/admin" class="admin-link">
            <font-awesome-icon icon="user-shield" />
            <span>{{ t('header.adminPanel') }}</span>
          </router-link>
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
              <span>{{ t('header.account.greeting', { name: currentUser.fullName || currentUser.username }) }}</span>
            </div>
            <router-link :to="{ name: 'orders-history' }" custom v-slot="{ navigate }">
              <button class="dropdown-item" role="menuitem" @click="navigate(); $emit('toggleAccountDropdown', false)">
                <font-awesome-icon icon="receipt" fixed-width />
                <span>{{ t('header.account.myOrders') }}</span>
              </button>
            </router-link>
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

      <!-- Header Greeting -->
      <transition name="greeting-fade-slide">
        <span v-if="isLoggedIn && currentUser" class="header-greeting">
          {{ t('header.account.greetingShort', { name: currentUser.fullName || currentUser.username }) }}
        </span>
      </transition>

      <!-- Language Switcher -->
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
  // Script content remains the same
  import { ref, watch, nextTick, onMounted } from 'vue';
  import LanguageSwitcher from '../ui/LanguageSwitcher.vue';
  import { useI18n } from 'vue-i18n';
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
  import { useRouter, useRoute } from 'vue-router';

  const { t } = useI18n();

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

  const emit = defineEmits([
    'toggleMenu',
    'toggleSearch',
    'toggleAccountDropdown',
    'openAccountPopup',
    'toggleCart',
    'logout'
  ]);

  const searchInputRef = ref(null);
  const searchQuery = ref('');
  const isAdmin = ref(false);

  const router = useRouter();
  const route = useRoute();

  const checkAdminStatus = async () => {
    if (props.isLoggedIn) {
      try {
        const response = await fetch('/api/users/check-admin', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          isAdmin.value = data.isAdmin;
        } else {
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

  watch(() => props.isSearchActive, (newValue) => {
    if (newValue) {
      nextTick(() => {
        searchInputRef.value?.focus();
      });
    }
  });

  watch(() => props.isLoggedIn, (newValue) => {
    checkAdminStatus();
  }, { immediate: true });

  watch(() => route.query.q, (newQuery) => {
    if (route.name === 'products') {
      searchQuery.value = newQuery || '';
    }
  });

  const handleSearch = () => {
    const query = {};
    const searchTerm = searchQuery.value.trim();
    if (searchTerm) {
      query.q = searchTerm;
    }
    router.push({ name: 'products', query });
  };

  onMounted(() => {
    if (route.name === 'products' && route.query.q) {
      searchQuery.value = route.query.q;
    }
  });
</script>

<style scoped>
  .header-actions {
    gap: 0.8rem;
    display: flex;
    align-items: center;
  }

  /* ****** UPDATED: Header Greeting Styles (Thin Rounded Border) ****** */
  .header-greeting {
    display: inline-block;
    /* Subtle border */
    border: 1px solid var(--border-color); /* Use standard border color */
    border-radius: 20px; /* Keep the pill shape */
    padding: 0.1rem 0.7rem; /* Minimal vertical, moderate horizontal padding */
    background-color: transparent; /* No background */
    /* Subtle text styling */
    font-size: 0.85rem; /* Keep it slightly smaller */
    font-weight: 500;
    color: var(--text-muted);
    line-height: 1.3; /* Adjust for vertical centering within padding */
    /* Text handling */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
    /* Alignment & Spacing */
    vertical-align: middle;
    margin-right: 0.5rem;
    transition: color 0.2s ease, border-color 0.2s ease; /* Added border transition */
    cursor: default;
  }

  /* Optional: Slightly change border on header scroll if needed */
  /* #header.scrolled .header-greeting {
    border-color: #ccc;
  } */

  /* Hide on very small screens if needed */
  @media (max-width: 420px) {
    .header-greeting {
      display: none;
    }
  }
  /* ****** END: Header Greeting Styles ****** */


  /* Greeting Animation Styles (No Change Needed) */
  .greeting-fade-slide-enter-active,
  .greeting-fade-slide-leave-active {
    transition: opacity 0.4s ease, transform 0.4s ease;
  }

  .greeting-fade-slide-enter-from,
  .greeting-fade-slide-leave-to {
    opacity: 0;
    transform: translateX(-10px);
  }

  .greeting-fade-slide-enter-to,
  .greeting-fade-slide-leave-from {
    opacity: 1;
    transform: translateX(0);
  }

  /* --- Styles for Dropdown, Admin Link etc. (Keep previous version's styles) --- */

  /* User Info in Dropdown */
  .dropdown-item.user-info {
    font-weight: 600;
    color: var(--text-dark);
    cursor: default;
    background-color: var(--bg-off-light);
    border-bottom: 1px solid var(--border-color);
    margin-bottom: 0.5rem;
    padding-top: 0.9rem;
    padding-bottom: 0.9rem;
  }

    .dropdown-item.user-info span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 150px;
      display: inline-block;
      vertical-align: middle;
    }

    .dropdown-item.user-info:hover {
      background-color: var(--bg-off-light);
      color: var(--text-dark);
    }

  /* Logout Item in Dropdown */
  .dropdown-item.logout-item {
    color: var(--secondary);
    border-top: 1px solid var(--border-color);
    margin-top: 0.5rem;
  }

    .dropdown-item.logout-item:hover,
    .dropdown-item.logout-item:focus-visible {
      background-color: #ffe8e8;
      color: #c82333;
      outline: none;
    }

      .dropdown-item.logout-item:hover .svg-inline--fa,
      .dropdown-item.logout-item:focus-visible .svg-inline--fa {
        color: #c82333;
      }

  /* General Dropdown Item */
  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    padding: 0.8rem 1.2rem;
    font-size: 0.9rem;
    font-family: var(--font-body);
    color: var(--text-dark);
    cursor: pointer;
    white-space: nowrap;
    transition: background-color var(--transition-fast), color var(--transition-fast);
  }

    .dropdown-item .svg-inline--fa {
      width: 16px;
      text-align: center;
      color: var(--text-muted);
      transition: color var(--transition-fast);
      flex-shrink: 0;
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

  /* Admin Link Style */
  nav#main-nav ul li .admin-link {
    background-color: rgba(254, 202, 87, 0.15);
    color: #b58011;
    border: 1px solid rgba(254, 202, 87, 0.4);
    padding: 0.5rem 1.2rem;
    border-radius: 50px;
    font-weight: 700;
    font-size: 0.9rem;
    display: inline-flex;
    align-items: center;
    gap: 0.5em;
    transition: all var(--transition-fast);
    transform: none;
    box-shadow: none;
  }

    nav#main-nav ul li .admin-link .svg-inline--fa {
      font-size: 0.9em;
      opacity: 0.9;
    }

    nav#main-nav ul li .admin-link:hover,
    nav#main-nav ul li .admin-link:focus-visible {
      background-color: var(--accent);
      color: var(--bg-dark);
      border-color: var(--accent);
      transform: translateY(-2px) scale(1.02);
      box-shadow: 0 4px 10px rgba(254, 202, 87, 0.3);
      outline: none;
    }

      nav#main-nav ul li .admin-link:hover .svg-inline--fa,
      nav#main-nav ul li .admin-link:focus-visible .svg-inline--fa {
        color: var(--bg-dark);
        opacity: 1;
      }

  /* Mobile Menu Adjustments for Admin Link */
  @media (max-width: 1024px) {
    nav#main-nav ul li .admin-link {
      display: flex;
      width: 100%;
      padding: 0.8rem 0;
      border-radius: 0;
      background: none;
      border: none;
      color: var(--accent);
      font-weight: 600;
      font-size: 1.1rem;
      box-shadow: none;
      justify-content: flex-start;
    }

      nav#main-nav ul li .admin-link:hover,
      nav#main-nav ul li .admin-link:focus-visible {
        color: var(--primary);
        background: none;
        transform: translateX(5px);
        box-shadow: none;
      }

        nav#main-nav ul li .admin-link:hover .svg-inline--fa,
        nav#main-nav ul li .admin-link:focus-visible .svg-inline--fa {
          color: var(--primary);
        }
  }
</style>
