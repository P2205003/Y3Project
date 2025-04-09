<template>
  <header id="header" :class="{ scrolled: isScrolled }">
    <router-link to="/" class="logo">AURORA</router-link>

    <!-- Desktop Navigation -->
    <nav id="main-nav">
      <ul>
        <!-- Use router-link for internal pages, keep hash links as is for now -->
        <li><router-link to="/#hero">Home</router-link></li>
        <li><router-link to="/products">Products</router-link></li>
        <li><router-link to="/#philosophy">Philosophy</router-link></li>
        <li><router-link to="/#showcase">Showcase</router-link></li>
        <li><router-link to="/#testimonials">Reviews</router-link></li>
        <li><router-link to="/#newsletter">Newsletter</router-link></li>
      </ul>
    </nav>

    <div class="header-actions">
      <!-- Search -->
      <div class="search-container" :class="{ active: isSearchActive }">
        <button class="search-button" id="search-button" aria-label="Open search" @click.stop="$emit('toggleSearch')">
          <font-awesome-icon icon="search" />
        </button>
        <input type="search"
               id="search-input"
               class="search-input"
               placeholder="Search products..."
               aria-label="Search products"
               :aria-hidden="!isSearchActive"
               @keydown.esc="$emit('toggleSearch', false)"
               ref="searchInputRef">
      </div>

      <!-- Account Dropdown -->
      <div class="account-menu-container">
        <button id="account-dropdown-trigger"
                aria-label="My Account Menu"
                aria-haspopup="true"
                :aria-expanded="isAccountDropdownActive"
                @click.stop="$emit('toggleAccountDropdown')">
          <font-awesome-icon icon="user" />
        </button>
        <div id="account-dropdown-menu" role="menu" :class="{ active: isAccountDropdownActive }">
          <!-- Logged In State -->
          <template v-if="isLoggedIn && currentUser">
            <div class="dropdown-item user-info" role="menuitem" aria-disabled="true">
              <span>Hi, {{ currentUser.fullName || currentUser.username }}</span>
            </div>
            <router-link to="/account/orders" custom v-slot="{ navigate }">
              <button class="dropdown-item" role="menuitem" @click="navigate(); $emit('toggleAccountDropdown', false)">
                <font-awesome-icon icon="receipt" fixed-width />
                <span>My Orders</span>
              </button>
            </router-link>
            <router-link to="/account/profile" custom v-slot="{ navigate }">
              <button class="dropdown-item" role="menuitem" @click="navigate(); $emit('toggleAccountDropdown', false)">
                <font-awesome-icon icon="user" fixed-width />
                <span>My Profile</span>
              </button>
            </router-link>
            <button class="dropdown-item logout-item" role="menuitem" @click="$emit('logout')">
              <font-awesome-icon icon="sign-out-alt" fixed-width />
              <span>Logout</span>
            </button>
          </template>
          <!-- Logged Out State -->
          <template v-else>
            <button class="dropdown-item" data-action="login" role="menuitem" @click="$emit('openAccountPopup', 'login')">
              <font-awesome-icon icon="sign-in-alt" fixed-width />
              <span>Login</span>
            </button>
            <button class="dropdown-item" data-action="register" role="menuitem" @click="$emit('openAccountPopup', 'register')">
              <font-awesome-icon icon="user-plus" fixed-width />
              <span>Sign Up</span>
            </button>
          </template>
        </div>
      </div>

      <!-- Orders (If keeping separate button, maybe hide when logged in and using dropdown?) -->
      <!-- <button id="orders-trigger" title="View Your Orders" aria-label="View Your Orders">
        <font-awesome-icon icon="receipt" />
      </button> -->
      <!-- Cart -->
      <button id="cart-popup-trigger"
              title="View Cart"
              aria-label="Shopping Cart"
              aria-haspopup="true"
              :aria-expanded="false"
              @click="$emit('toggleCart')">
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="M17,18C15.89,18 15,18.89 15,20A2,2 0 0,0 17,22A2,2 0 0,0 19,20C19,18.89 18.1,18 17,18M1,2V4H3L6.6,11.59L5.24,14.04C5.09,14.32 5,14.64 5,15A2,2 0 0,0 7,17H19V15H7.42A0.25,0.25 0 0,1 7.17,14.75L8.1,13H15.55C16.3,13 16.96,12.58 17.3,11.97L20.88,5.5C20.95,5.34 21,5.17 21,5A1,1 0 0,0 20,4H5.21L4.27,2M7,18C5.89,18 5,18.89 5,20A2,2 0 0,0 7,22A2,2 0 0,0 9,20C9,18.89 8.1,18 7,18Z"></path></svg>
        <span v-if="cartItemCount > 0" class="cart-count">{{ cartItemCount }}</span>
      </button>

      <!-- Mobile Menu Toggle -->
      <button class="menu-toggle"
              id="menu-toggle"
              aria-label="Toggle Menu"
              :aria-expanded="isMobileMenuActive"
              @click="$emit('toggleMenu')">
        <span></span> <span></span> <span></span>
      </button>
    </div>
  </header>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
// Other icons are registered globally or added in App.vue

const props = defineProps({
  isScrolled: Boolean,
  isMobileMenuActive: Boolean,
  isSearchActive: Boolean,
  isAccountDropdownActive: Boolean,
  cartItemCount: {
      type: Number,
      default: 0
  },
  isLoggedIn: { // <-- Add prop for login state
      type: Boolean,
      required: true
  },
  currentUser: { // <-- Add prop for user info
      type: Object,
      default: null // Can be null if not logged in
  }
});

const emit = defineEmits([
    'toggleMenu',
    'toggleSearch',
    'toggleAccountDropdown',
    'openAccountPopup',
    'toggleCart',
    'logout' // <-- Add emit for logout
]);

const searchInputRef = ref(null);

// Focus search input when activated
watch(() => props.isSearchActive, (newValue) => {
    if (newValue) {
        nextTick(() => {
             searchInputRef.value?.focus();
        });
    }
});

</script>

<style scoped>
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
</style>
