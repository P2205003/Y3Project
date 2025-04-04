<template>
  <header id="header" :class="{ scrolled: isScrolled }">
    <router-link to="/" class="logo">AURORA</router-link>

    <!-- Desktop Navigation -->
    <nav id="main-nav" :class="{ active: isMobileMenuActive }">
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
          <button class="dropdown-item" data-action="login" role="menuitem" @click="$emit('openAccountPopup', 'login')">
            <font-awesome-icon icon="sign-in-alt" fixed-width />
            <span>Login</span>
          </button>
          <button class="dropdown-item" data-action="register" role="menuitem" @click="$emit('openAccountPopup', 'register')">
            <font-awesome-icon icon="user-plus" fixed-width />
            <span>Sign Up</span>
          </button>
        </div>
      </div>

      <!-- Orders (Example: Link or Button) -->
      <button id="orders-trigger" title="View Your Orders" aria-label="View Your Orders">
        <font-awesome-icon icon="receipt" />
      </button>

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
// Font Awesome is registered globally

const props = defineProps({
  isScrolled: Boolean,
  isMobileMenuActive: Boolean,
  isSearchActive: Boolean,
  isAccountDropdownActive: Boolean,
  cartItemCount: {
      type: Number,
      default: 0
  }
});

const emit = defineEmits([
    'toggleMenu',
    'toggleSearch',
    'toggleAccountDropdown',
    'openAccountPopup',
    'toggleCart'
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

// Close mobile menu handled by App.vue via overlay click or router navigation
</script>

<style scoped>

</style>
