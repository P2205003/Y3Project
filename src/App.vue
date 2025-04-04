<template>
  <!-- Preloader, Glow Background, Scroll Progress -->
  <Preloader :is-loading="isLoading" />
  <GlowBackground />
  <ScrollProgress :scroll-percentage="scrollPercentage" />

  <!-- Header -->
  <TheHeader :is-scrolled="isScrolled"
             @toggle-menu="toggleMobileMenu"
             @toggle-search="toggleSearch"
             @toggle-account-dropdown="toggleAccountDropdown"
             @open-account-popup="openAccountPopup"
             @toggle-cart="toggleCartPopup"
             :is-mobile-menu-active="isMobileMenuActive"
             :is-search-active="isSearchActive"
             :is-account-dropdown-active="isAccountDropdownActive"
             :cart-item-count="totalCartItems" />

  <!-- Mobile Menu Overlay -->
  <div id="menu-overlay" @click="closeMobileMenu" :class="{ active: isMobileMenuActive }"></div>

  <!-- Main Content Area -->
  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" @add-to-cart="handleAddToCart" />
    </transition>
  </router-view>

  <!-- Footer -->
  <TheFooter />

  <!-- Popups (Rendered here to overlay everything) -->
  <AccountPopup :is-active="isAccountPopupActive"
                :initial-tab="accountPopupTab"
                @close="closeAccountPopup" />
  <CartPopup :is-active="isCartPopupActive"
             :cart-items="cartData"
             :subtotal="cartSubtotal"
             @close="closeCartPopup"
             @update-quantity="updateCartItemQuantity"
             @remove-item="removeCartItem" />

</template>

<script setup>
  import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue';
  import { useRouter } from 'vue-router'; // Import useRouter

  // Layout Components
  import TheHeader from './components/layout/TheHeader.vue';
  import TheFooter from './components/layout/TheFooter.vue';
  import Preloader from './components/layout/Preloader.vue';
  import GlowBackground from './components/layout/GlowBackground.vue';
  import ScrollProgress from './components/layout/ScrollProgress.vue';

  // Feature Components
  import AccountPopup from './components/features/AccountPopup.vue';
  import CartPopup from './components/features/CartPopup.vue';

  // --- State ---
  const isLoading = ref(true);
  const isScrolled = ref(false);
  const scrollPercentage = ref(0);
  const isMobileMenuActive = ref(false);
  const isSearchActive = ref(false);
  const isAccountDropdownActive = ref(false);
  const isAccountPopupActive = ref(false);
  const accountPopupTab = ref('login'); // 'login' or 'register'
  const isCartPopupActive = ref(false);

  // Simplified Cart State (Replace with Pinia/Vuex later)
  const cartData = ref([]); // Array of { id, name, price, quantity, image }

  const router = useRouter(); // Get router instance

  // --- Computed ---
  const totalCartItems = computed(() => cartData.value.reduce((sum, item) => sum + item.quantity, 0));
  const cartSubtotal = computed(() => cartData.value.reduce((sum, item) => sum + item.price * item.quantity, 0));

  // Global Body Class Management
  const updateBodyClass = () => {
    const body = document.body;
    if (isMobileMenuActive.value || isAccountPopupActive.value || isCartPopupActive.value) {
      body.classList.add('popup-open');
    } else {
      body.classList.remove('popup-open');
    }
  };

  // --- Methods ---
  const handleScroll = () => {
    const scrollY = window.scrollY;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;

    isScrolled.value = scrollY > 50; // SCROLL_OPTIONS.headerScrollThreshold
    scrollPercentage.value = scrollHeight > 0 ? Math.min(Math.max((scrollY / scrollHeight) * 100, 0), 100) : 0;
  };

  const toggleMobileMenu = (forceState = null) => {
    isMobileMenuActive.value = typeof forceState === 'boolean' ? forceState : !isMobileMenuActive.value;
    // Close other overlays when opening menu
    if (isMobileMenuActive.value) {
      isAccountDropdownActive.value = false;
      isSearchActive.value = false; // Optionally close search
    }
    updateBodyClass();
  };
  const closeMobileMenu = () => toggleMobileMenu(false);

  const toggleSearch = (forceState = null) => {
    isSearchActive.value = typeof forceState === 'boolean' ? forceState : !isSearchActive.value;
    if (isSearchActive.value) {
      isAccountDropdownActive.value = false;
      isMobileMenuActive.value = false; // Close menu if search opens
    }
    updateBodyClass(); // Update in case menu was closed
  };
  const closeSearch = () => toggleSearch(false);


  const toggleAccountDropdown = (forceState = null) => {
    isAccountDropdownActive.value = typeof forceState === 'boolean' ? forceState : !isAccountDropdownActive.value;
    if (isAccountDropdownActive.value) {
      isSearchActive.value = false; // Close search if dropdown opens
      isMobileMenuActive.value = false; // Close menu
    }
    updateBodyClass(); // Update in case menu was closed
  };
  const closeAccountDropdown = () => toggleAccountDropdown(false);

  const openAccountPopup = (tab = 'login') => {
    accountPopupTab.value = tab;
    isAccountPopupActive.value = true;
    isAccountDropdownActive.value = false; // Close dropdown when popup opens
    isMobileMenuActive.value = false; // Close menu
    updateBodyClass();
  };
  const closeAccountPopup = () => {
    isAccountPopupActive.value = false;
    updateBodyClass();
  };

  const toggleCartPopup = (forceState = null) => {
    isCartPopupActive.value = typeof forceState === 'boolean' ? forceState : !isCartPopupActive.value;
    if (isCartPopupActive.value) {
      isAccountDropdownActive.value = false;
      isMobileMenuActive.value = false; // Close menu
    }
    updateBodyClass();
  };
  const closeCartPopup = () => toggleCartPopup(false);


  // --- Cart Methods ---
  const handleAddToCart = (itemToAdd) => {
    console.log('Adding to cart (App.vue):', itemToAdd);
    const existingItemIndex = cartData.value.findIndex(item => item.id === itemToAdd.id);
    if (existingItemIndex > -1) {
      cartData.value[existingItemIndex].quantity += itemToAdd.quantity;
    } else {
      // Ensure quantity is part of the object being pushed
      cartData.value.push({ ...itemToAdd, quantity: itemToAdd.quantity || 1 });
    }
    isCartPopupActive.value = true; // Open cart on add
    updateBodyClass();
  };

  const updateCartItemQuantity = ({ productId, change }) => {
    const itemIndex = cartData.value.findIndex(item => item.id === productId);
    if (itemIndex > -1) {
      const newQuantity = cartData.value[itemIndex].quantity + change;
      if (newQuantity <= 0) {
        cartData.value.splice(itemIndex, 1); // Remove if quantity is 0 or less
      } else {
        cartData.value[itemIndex].quantity = newQuantity;
      }
    }
  };

  const removeCartItem = (productId) => {
    cartData.value = cartData.value.filter(item => item.id !== productId);
    // Close popup if cart becomes empty? Optional.
    // if (cartData.value.length === 0) {
    //     isCartPopupActive.value = false;
    //     updateBodyClass();
    // }
  };

  // --- Global Click Listener for Closing Things ---
  const handleClickOutside = (event) => {
    // Close account dropdown if click is outside
    const accountTrigger = document.getElementById('account-dropdown-trigger');
    const accountMenu = document.getElementById('account-dropdown-menu');
    if (isAccountDropdownActive.value && accountMenu && accountTrigger && !accountMenu.contains(event.target) && !accountTrigger.contains(event.target)) {
      closeAccountDropdown();
    }

    // Close search if click is outside
    const searchContainer = document.querySelector('.search-container');
    if (isSearchActive.value && searchContainer && !searchContainer.contains(event.target)) {
      closeSearch();
    }

    // Popups are closed via their overlay/close button click handlers already
    // Mobile menu is closed via its overlay click handler
  };


  // --- Lifecycle Hooks ---
  onMounted(() => {
    // Hide preloader after a delay
    setTimeout(() => {
      isLoading.value = false;
    }, 500); // Adjust timing

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    // Add global click listener
    document.addEventListener('click', handleClickOutside);

    // Handle navigation to close mobile menu/dropdowns
    router.afterEach(() => {
      closeMobileMenu();
      closeAccountDropdown();
      closeSearch();
      // Popups usually stay open on navigation unless explicitly closed
    });
  });

  onUnmounted(() => {
    // Clean up listeners
    window.removeEventListener('scroll', handleScroll);
    document.removeEventListener('click', handleClickOutside);
  });

</script>

<style>
  /* Basic Page Transition */
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  /* Style for the mobile menu overlay */
  #menu-overlay {
    /* Copied from style.css and adapted */
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    z-index: 1040; /* Below mobile nav, above content */
    opacity: 0;
    transition: opacity 0.4s ease;
    pointer-events: none;
  }

    #menu-overlay.active {
      opacity: 1;
      pointer-events: auto;
    }

  /* Ensure popups have correct z-index relative to overlay if needed */
  /* Z-indexes are defined in main.css variables, should be okay */

  /* Add body class style */
  body.popup-open {
    overflow: hidden;
  }
</style>
