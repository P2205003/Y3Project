// src/App.vue
<template>
  <!-- Preloader, Glow Background, Scroll Progress -->
  <Preloader :is-loading="isLoading" />
  <GlowBackground />
  <ScrollProgress :scroll-percentage="scrollPercentage" />

  <!-- Header -->
  <TheHeader v-if="!isAdminRoute"
             :is-scrolled="isScrolled"
             @toggle-menu="toggleMobileMenu"
             @toggle-search="toggleSearch"
             @toggle-account-dropdown="toggleAccountDropdown"
             @open-account-popup="openAccountPopup"
             @toggle-cart="toggleCartPopup"
             @logout="handleLogout"
             :is-mobile-menu-active="isMobileMenuActive"
             :is-search-active="isSearchActive"
             :is-account-dropdown-active="isAccountDropdownActive"
             :cart-item-count="totalCartItems"
             :is-logged-in="isLoggedIn"
             :current-user="currentUser" />

  <!-- Mobile Menu Overlay -->
  <div id="menu-overlay" @click="closeMobileMenu" :class="{ active: isMobileMenuActive }"></div>

  <!-- Main Content Area -->
  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" @add-to-cart="handleAddToCart" />
    </transition>
  </router-view>

  <!-- Footer -->
  <TheFooter v-if="!isAdminRoute" />

  <!-- Popups -->
  <AccountPopup :is-active="isAccountPopupActive"
                :initial-tab="accountPopupTab"
                @close="closeAccountPopup"
                @login-success="handleLoginSuccess" />
  <CartPopup :is-active="isCartPopupActive"
             :cart-items="cartData"
             :subtotal="cartSubtotal"
             @close="closeCartPopup"
             @update-quantity="updateCartItemQuantity"
             @remove-item="removeCartItem" />

</template>

<script setup>
  import { ref, onMounted, onUnmounted, computed, nextTick, watch, provide } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { useI18n } from 'vue-i18n';
  import cartService from '@/services/cartService';

  // Layout Components
  import TheHeader from './components/layout/TheHeader.vue';
  import TheFooter from './components/layout/TheFooter.vue';
  import Preloader from './components/layout/Preloader.vue';
  import GlowBackground from './components/layout/GlowBackground.vue';
  import ScrollProgress from './components/layout/ScrollProgress.vue';

  // Feature Components
  import AccountPopup from './components/features/AccountPopup.vue';
  import CartPopup from './components/features/CartPopup.vue';

  // Get i18n essentials
  const { locale } = useI18n();

  // State
  const isLoading = ref(true);
  const appReady = ref(false);
  const isScrolled = ref(false);
  const scrollPercentage = ref(0);
  const isMobileMenuActive = ref(false);
  const isSearchActive = ref(false);
  const isAccountDropdownActive = ref(false);
  const isAccountPopupActive = ref(false);
  const accountPopupTab = ref('login');
  const isCartPopupActive = ref(false);
  const isLoggedIn = ref(false);
  const currentUser = ref(null);
  const cartData = ref([]); // Holds the items array from the cart response
  const totalCartItems = ref(0); // Separate count

  const router = useRouter();
  const route = useRoute();
  const isAdminRoute = computed(() => route.path.startsWith('/admin'));

  // Computed Cart Subtotal
  const cartSubtotal = computed(() => cartService.calculateTotal({ items: cartData.value }));

  // --- UI Toggles & Helpers (Define before Provide) ---
  const handleScroll = () => {
    const scrollY = window.scrollY;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    isScrolled.value = scrollY > 50;
    scrollPercentage.value = scrollHeight > 0 ? Math.min(Math.max((scrollY / scrollHeight) * 100, 0), 100) : 0;
  };

  const toggleMobileMenu = (forceState = null) => {
    isMobileMenuActive.value = typeof forceState === 'boolean' ? forceState : !isMobileMenuActive.value;
    if (isMobileMenuActive.value) { closePopupsAndDropdowns(); }
  };
  const closeMobileMenu = () => toggleMobileMenu(false);

  const toggleSearch = (forceState = null) => {
    isSearchActive.value = typeof forceState === 'boolean' ? forceState : !isSearchActive.value;
    if (isSearchActive.value) { closePopupsAndDropdowns(true); } // Keep search open
  };
  const closeSearch = () => toggleSearch(false);

  const toggleAccountDropdown = (forceState = null) => {
    isAccountDropdownActive.value = typeof forceState === 'boolean' ? forceState : !isAccountDropdownActive.value;
    if (isAccountDropdownActive.value) { closePopupsAndDropdowns(false, true); } // Keep dropdown open
  };
  const closeAccountDropdown = () => toggleAccountDropdown(false);

  // Definition of openAccountPopup NOW BEFORE provide
  function openAccountPopup(tab = 'login') {
    accountPopupTab.value = tab;
    isAccountPopupActive.value = true;
    closePopupsAndDropdowns(false, false, true); // Keep account popup open
  }
  const closeAccountPopup = () => { isAccountPopupActive.value = false; };

  const toggleCartPopup = (forceState = null) => {
    isCartPopupActive.value = typeof forceState === 'boolean' ? forceState : !isCartPopupActive.value;
    if (isCartPopupActive.value) { closePopupsAndDropdowns(false, false, false, true); } // Keep cart open
  };
  const closeCartPopup = () => toggleCartPopup(false);

  // Helper to close UI elements
  const closePopupsAndDropdowns = (keepSearch = false, keepDropdown = false, keepAccountPopup = false, keepCart = false) => {
    if (!keepSearch) isSearchActive.value = false;
    if (!keepDropdown) isAccountDropdownActive.value = false;
    if (!keepAccountPopup) isAccountPopupActive.value = false;
    if (!keepCart) isCartPopupActive.value = false;
    isMobileMenuActive.value = false; // Always close mobile menu
  };

  // --- Authentication & Cart (Define before Provide) ---
  async function handleLogout() {
    console.log('Logging out...');
    try {
      await fetch('/api/users/logout', { method: 'POST', credentials: 'include' });
    } catch (error) { console.error('Error during backend logout:', error); }
    finally {
      isLoggedIn.value = false;
      currentUser.value = null;
      isAccountDropdownActive.value = false; // Ensure dropdown closes on logout
      await fetchCart(); // Fetch guest cart (local storage)
      if (route.meta.requiresAuth && !isAdminRoute.value) {
        router.push('/');
      }
    }
  };

  // --- Provide Application Context (Functions are now defined above) ---
  provide('appContext', {
    isLoggedIn,
    currentUser,
    openAccountPopup, // Now defined
    logout: handleLogout // Now defined
  });

  // --- Methods ---

  const fetchCart = async () => {
    console.log("App.vue: Fetching cart data...");
    try {
      const cart = await cartService.getCart(isLoggedIn.value);
      cartData.value = cart.items || [];
      updateCartCount();
      console.log("App.vue: Cart data AFTER assignment:", JSON.stringify(cartData.value)); // Log the assigned data
    } catch (error) {
      console.error("App.vue: Error fetching cart:", error);
      cartData.value = [];
      updateCartCount();
    }
  };

  const updateCartCount = () => {
    totalCartItems.value = cartData.value.reduce((sum, item) => sum + (item.quantity || 0), 0);
  };

  // Subscribe to cart service internal updates
  const unsubscribeCartUpdate = cartService.onCartUpdate(fetchCart); // Re-fetch on service notification


  // Login Status Check
  const checkLoginStatus = async () => {
    console.log('Checking login status...');
    try {
      const response = await fetch('/api/users/check-login', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        isLoggedIn.value = data.isLoggedIn;
        currentUser.value = data.isLoggedIn ? data.user : null;
        console.log('Login status checked:', { isLoggedIn: isLoggedIn.value, user: currentUser.value });
        // No need to fetch cart here, finally block handles it
      } else {
        console.warn('Failed to check login status, assuming logged out.');
        isLoggedIn.value = false;
        currentUser.value = null;
        // No need to fetch cart here, finally block handles it
      }
    } catch (error) {
      console.error('Error checking login status:', error);
      isLoggedIn.value = false;
      currentUser.value = null;
      // No need to fetch cart here, finally block handles it
    } finally {
      await fetchCart(); // Fetch cart *after* login status is determined
      appReady.value = true;
      setTimeout(() => { isLoading.value = false; }, 200);
    }
  };


  const handleAddToCart = async (itemToAdd) => {
    console.log('Adding to cart (App.vue):', itemToAdd);
    const cartItem = {
      productId: itemToAdd.productId,
      quantity: Math.max(1, itemToAdd.quantity || 1),
      attributes: itemToAdd.attributes || {},
      // Pass display details for local storage fallback
      name: itemToAdd.name,
      price: itemToAdd.price,
      image: itemToAdd.image,
    };

    const updatedCart = await cartService.addItem(cartItem, isLoggedIn.value);
    if (updatedCart) {
      cartData.value = updatedCart.items || [];
      updateCartCount();
    }

    const cartOpenDelay = 300;
    setTimeout(() => {
      if (!isAdminRoute.value) {
        isCartPopupActive.value = true;
      }
    }, cartOpenDelay);
  };

  const updateCartItemQuantity = async ({ productId, change, attributes }) => {
    const item = cartData.value.find(item =>
      item.productId === productId &&
      JSON.stringify(item.attributes || {}) === JSON.stringify(attributes || {})
    );
    if (item) {
      const newQuantity = item.quantity + change;
      let updatedCart;
      if (newQuantity <= 0) {
        updatedCart = await cartService.removeItem(productId, attributes, isLoggedIn.value);
      } else {
        updatedCart = await cartService.updateItemQuantity(productId, newQuantity, attributes, isLoggedIn.value);
      }
      if (updatedCart) {
        cartData.value = updatedCart.items || [];
        updateCartCount();
      }
    }
  };

  const removeCartItem = async ({ productId, attributes }) => {
    const updatedCart = await cartService.removeItem(productId, attributes, isLoggedIn.value);
    if (updatedCart) {
      cartData.value = updatedCart.items || [];
      updateCartCount();
    }
  };

  // Authentication Actions
  const handleLoginSuccess = async (userData) => {
    console.log('Login successful in App.vue, user:', userData);
    isLoggedIn.value = true;
    currentUser.value = userData;
    const finalCart = await cartService.mergeCartsAfterLogin();
    if (finalCart) {
      cartData.value = finalCart.items || [];
      updateCartCount();
      console.log("Cart updated after login/merge:", cartData.value);
    } else {
      await fetchCart(); // Fallback refetch if merge failed
    }
  };
  // handleLogout moved before provide


  // Global Click Listener
  const handleClickOutside = (event) => {
    // Close account dropdown
    const accountTrigger = document.getElementById('account-dropdown-trigger');
    const accountMenu = document.getElementById('account-dropdown-menu');
    if (isAccountDropdownActive.value && accountMenu && accountTrigger && !accountMenu.contains(event.target) && !accountTrigger.contains(event.target)) {
      closeAccountDropdown();
    }
    // Close search
    const searchContainer = document.querySelector('.search-container');
    const searchButton = document.getElementById('search-button');
    if (isSearchActive.value && searchContainer && !searchContainer.contains(event.target) && event.target !== searchButton && !searchButton?.contains(event.target)) {
      closeSearch();
    }
  };

  // --- WATCHERS ---

  // Watch locale changes
  watch(locale, (newLocale, oldLocale) => {
    if (newLocale !== oldLocale && isLoggedIn.value) { // Only refetch for logged-in users
      console.log(`App locale changed to ${newLocale}, refetching cart.`);
      fetchCart();
    } else if (newLocale !== oldLocale && !isLoggedIn.value) {
      console.log(`App locale changed to ${newLocale}, guest cart uses local data.`);
    }
  });

  // Global Body Class Management
  watch([isMobileMenuActive, isAccountPopupActive, isCartPopupActive, isAdminRoute],
    ([mobileActive, accountActive, cartActive, adminActive]) => {
      const body = document.body;
      if (mobileActive) body.classList.add('mobile-menu-active');
      else body.classList.remove('mobile-menu-active');

      if (!adminActive && (mobileActive || accountActive || cartActive)) {
        body.classList.add('popup-open');
      } else {
        body.classList.remove('popup-open');
      }
    }, { immediate: true }
  );

  // --- Lifecycle Hooks ---
  onMounted(async () => {
    await checkLoginStatus(); // Checks login AND fetches initial cart

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    document.addEventListener('click', handleClickOutside);

    router.afterEach((to, from) => {
      // Close popups on route change, except within admin area
      if (!to.path.startsWith('/admin') || !from.path.startsWith('/admin')) {
        closePopupsAndDropdowns();
      }
    });
  });

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
    document.removeEventListener('click', handleClickOutside);
    // Unsubscribe from cart service updates
    if (unsubscribeCartUpdate) {
      unsubscribeCartUpdate();
    }
  });
</script>

<style>
  /* Global styles from main.css */
  body.popup-open {
    overflow: hidden;
  }

  .fade-enter-active, .fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .fade-enter-from, .fade-leave-to {
    opacity: 0;
  }
</style>
