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
      <!-- Ensure Component exists before rendering -->
      <component v-if="Component" :is="Component" @add-to-cart="handleAddToCart" />
    </transition>
  </router-view>

  <!-- Footer -->
  <TheFooter v-if="!isAdminRoute" />

  <!-- Popups -->
  <AccountPopup :is-active="isAccountPopupActive"
                :initial-tab="accountPopupTab"
                @close="closeAccountPopup"
                @login-success="handleLoginSuccess" />
  <!-- Ensure cartData is passed correctly -->
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

  // --- *** CORRECTED Computed Cart Subtotal *** ---
  const cartSubtotal = computed(() => {
    // Add robust checks: Ensure cartData.value exists and is an array
    if (!cartData.value || !Array.isArray(cartData.value)) {
      // console.log('cartSubtotal: cartData is invalid or empty, returning 0');
      return 0;
    }
    // Calculate total using the items in the reactive cartData ref
    const total = cartData.value.reduce((sum, item) => {
      // Ensure price and quantity are valid numbers, default to 0 if not
      const price = Number(item?.price) || 0;
      const quantity = Number(item?.quantity) || 0;
      return sum + (price * quantity);
    }, 0); // Start sum at 0
    // console.log('cartSubtotal calculated:', total);
    return total;
  });
  // --- *** END CORRECTION *** ---

  // Provide Application Context
  provide('appContext', {
    isLoggedIn,
    currentUser,
    openAccountPopup, // Function defined below
    logout: handleLogout
  });

  // --- Methods ---

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
      } else {
        console.warn('Failed to check login status (status: ' + response.status + '), assuming logged out.');
        isLoggedIn.value = false;
        currentUser.value = null;
      }
    } catch (error) {
      console.error('Error checking login status:', error);
      isLoggedIn.value = false;
      currentUser.value = null;
    } finally {
      // Fetch cart regardless of login status check success/failure
      await fetchCart();
      appReady.value = true;
      // Use nextTick to ensure DOM updates before hiding preloader
      await nextTick();
      setTimeout(() => { isLoading.value = false; }, 200); // Keep a small delay for visual effect
    }
  };

  // Cart Management
  const fetchCart = async () => {
    console.log("App.vue: Fetching cart data...");
    try {
      // Pass the current login state to the service method
      const cart = await cartService.getCart(isLoggedIn.value);
      // Ensure cart.items is always an array
      cartData.value = Array.isArray(cart?.items) ? cart.items : [];
      updateCartCount(); // Update count based on potentially new data
      console.log("App.vue: Cart data updated:", JSON.parse(JSON.stringify(cartData.value))); // Deep copy for logging
    } catch (error) {
      console.error("App.vue: Error fetching cart:", error);
      cartData.value = []; // Reset cart data on error
      updateCartCount(); // Reset item count
    }
  };

  const updateCartCount = () => {
    // Ensure cartData.value is an array before reducing
    totalCartItems.value = Array.isArray(cartData.value)
      ? cartData.value.reduce((sum, item) => sum + (Number(item?.quantity) || 0), 0)
      : 0;
    // console.log("App.vue: Cart item count updated:", totalCartItems.value);
  };

  // Subscribe to cart service internal updates
  // Ensure the listener function is correctly referenced for unsubscription
  const cartUpdateListener = () => {
    console.log("App.vue: Received cart update notification from service.");
    fetchCart();
  };
  const unsubscribeCartUpdate = cartService.onCartUpdate(cartUpdateListener);

  const handleAddToCart = async (itemToAdd) => {
    console.log('Adding to cart (App.vue):', itemToAdd);
    // Ensure itemToAdd has necessary properties
    if (!itemToAdd || !itemToAdd.productId) {
      console.error("App.vue: Invalid item data passed to handleAddToCart:", itemToAdd);
      return;
    }
    const cartItem = {
      productId: itemToAdd.productId,
      quantity: Math.max(1, Number(itemToAdd.quantity) || 1),
      attributes: itemToAdd.attributes || {},
      // Pass display details needed by cartService add methods
      name: itemToAdd.name || 'Unknown Product', // Provide fallback name
      price: Number(itemToAdd.price) || 0,      // Ensure price is a number
      image: itemToAdd.image || '',             // Provide fallback image
    };

    try {
      // Let cartService handle the addition and notification
      await cartService.addItem(cartItem, isLoggedIn.value);
      // fetchCart will be called automatically by the listener

      const cartOpenDelay = 300;
      setTimeout(() => {
        // Ensure we don't open the cart popup on admin routes
        if (!isAdminRoute.value) {
          isCartPopupActive.value = true;
        }
      }, cartOpenDelay);

    } catch (error) {
      console.error("App.vue: Error occurred during handleAddToCart:", error);
      // Optionally show an error message to the user
    }
  };

  const updateCartItemQuantity = async ({ productId, change, attributes }) => {
    const itemIndex = cartData.value.findIndex(item =>
      item.productId === productId &&
      JSON.stringify(item.attributes || {}) === JSON.stringify(attributes || {})
    );

    if (itemIndex > -1) {
      const currentQuantity = Number(cartData.value[itemIndex]?.quantity) || 0;
      const newQuantity = currentQuantity + change;

      try {
        if (newQuantity <= 0) {
          await cartService.removeItem(productId, attributes, isLoggedIn.value);
        } else {
          await cartService.updateItemQuantity(productId, newQuantity, attributes, isLoggedIn.value);
        }
        // fetchCart will be called automatically by the listener
      } catch (error) {
        console.error("App.vue: Error occurred during updateCartItemQuantity:", error);
        // Optionally show an error message
      }
    } else {
      console.warn("App.vue: Item not found for quantity update", { productId, attributes });
    }
  };

  const removeCartItem = async ({ productId, attributes }) => {
    try {
      await cartService.removeItem(productId, attributes, isLoggedIn.value);
      // fetchCart will be called automatically by the listener
    } catch (error) {
      console.error("App.vue: Error occurred during removeCartItem:", error);
      // Optionally show an error message
    }
  };

  // Authentication Actions
  const handleLoginSuccess = async (userData) => {
    console.log('Login successful in App.vue, user:', userData);
    isLoggedIn.value = true;
    currentUser.value = userData;
    closeAccountPopup(); // Close popup first

    try {
      console.log("App.vue: Attempting cart merge...");
      await cartService.mergeCartsAfterLogin(); // This now notifies internally
      console.log("App.vue: Cart merge attempt finished.");
      // Note: fetchCart will be triggered by the notification from mergeCartsAfterLogin
    } catch (error) {
      console.error("App.vue: Error during mergeCartsAfterLogin:", error);
      // Even if merge fails, ensure we fetch the latest server cart state
      console.log("App.vue: Fetching authoritative cart state after merge error...");
      await fetchCart();
    } finally {
      console.log("App.vue: Login success handling complete.");
    }
  };

  async function handleLogout() {
    console.log('Logging out...');
    try {
      await fetch('/api/users/logout', { method: 'POST', credentials: 'include' });
    } catch (error) { console.error('Error during backend logout:', error); }
    finally {
      isLoggedIn.value = false;
      currentUser.value = null;
      isAccountDropdownActive.value = false; // Close dropdown on logout
      isAccountPopupActive.value = false; // Close popup if open
      isCartPopupActive.value = false; // Close cart if open
      isMobileMenuActive.value = false; // Close mobile menu if open

      // Fetch guest cart (local storage). fetchCart updates cartData and count.
      await fetchCart();

      // Redirect if on a protected route (excluding admin)
      if (route.meta.requiresAuth && !isAdminRoute.value) {
        console.log("Redirecting to home after logout from protected route.");
        router.push({ name: 'home' });
      }
      console.log("App.vue: Logout complete.");
    }
  };

  // UI Toggles (Ensure no conflicts with closing logic)
  const handleScroll = () => {
    const scrollY = window.scrollY;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    isScrolled.value = scrollY > 50;
    scrollPercentage.value = scrollHeight > 0 ? Math.min(Math.max((scrollY / scrollHeight) * 100, 0), 100) : 0;
  };

  const toggleMobileMenu = (forceState = null) => {
    const newState = typeof forceState === 'boolean' ? forceState : !isMobileMenuActive.value;
    if (newState) { closePopupsAndDropdowns(false, false, false, false); } // Close others when opening menu
    isMobileMenuActive.value = newState;
  };
  const closeMobileMenu = () => toggleMobileMenu(false);

  const toggleSearch = (forceState = null) => {
    const newState = typeof forceState === 'boolean' ? forceState : !isSearchActive.value;
    if (newState) { closePopupsAndDropdowns(true, false, false, false); } // Close others, keep search
    isSearchActive.value = newState;
  };
  const closeSearch = () => toggleSearch(false);

  const toggleAccountDropdown = (forceState = null) => {
    const newState = typeof forceState === 'boolean' ? forceState : !isAccountDropdownActive.value;
    if (newState) { closePopupsAndDropdowns(false, true, false, false); } // Close others, keep dropdown
    isAccountDropdownActive.value = newState;
  };
  const closeAccountDropdown = () => toggleAccountDropdown(false);

  // Provided function to open popup
  function openAccountPopup(tab = 'login') {
    accountPopupTab.value = tab;
    isAccountPopupActive.value = true;
    closePopupsAndDropdowns(false, false, true, false); // Close others, keep account popup
  }
  const closeAccountPopup = () => { isAccountPopupActive.value = false; };

  const toggleCartPopup = (forceState = null) => {
    const newState = typeof forceState === 'boolean' ? forceState : !isCartPopupActive.value;
    if (newState) { closePopupsAndDropdowns(false, false, false, true); } // Close others, keep cart
    isCartPopupActive.value = newState;
  };
  const closeCartPopup = () => toggleCartPopup(false);

  // Refined helper to close UI elements
  const closePopupsAndDropdowns = (keepSearch = false, keepDropdown = false, keepAccountPopup = false, keepCart = false) => {
    if (!keepSearch) isSearchActive.value = false;
    if (!keepDropdown) isAccountDropdownActive.value = false;
    if (!keepAccountPopup) isAccountPopupActive.value = false;
    if (!keepCart) isCartPopupActive.value = false;
    // Only close mobile menu if it wasn't the one being kept open (though opening logic handles this)
    if (isMobileMenuActive.value && !(keepSearch || keepDropdown || keepAccountPopup || keepCart)) {
      isMobileMenuActive.value = false;
    }
  };


  // Global Click Listener
  const handleClickOutside = (event) => {
    // Close account dropdown if click is outside trigger and menu
    const accountTrigger = document.getElementById('account-dropdown-trigger');
    const accountMenu = document.getElementById('account-dropdown-menu');
    if (isAccountDropdownActive.value && accountTrigger && accountMenu && !accountTrigger.contains(event.target) && !accountMenu.contains(event.target)) {
      // console.log("Closing account dropdown due to outside click");
      closeAccountDropdown();
    }

    // Close search if click is outside search container and button
    const searchContainer = document.querySelector('.search-container');
    const searchButton = document.getElementById('search-button'); // Assuming this ID exists on the trigger
    if (isSearchActive.value && searchContainer && searchButton && !searchContainer.contains(event.target) && !searchButton.contains(event.target)) {
      // console.log("Closing search due to outside click");
      closeSearch();
    }

    // Add similar logic for other popups/menus if needed, e.g., closing mobile menu on outside click
    const mobileMenu = document.getElementById('mobile-menu'); // Assuming mobile menu has this ID
    const menuToggle = document.getElementById('menu-toggle-button'); // Assuming toggle has this ID
    if (isMobileMenuActive.value && mobileMenu && menuToggle && !mobileMenu.contains(event.target) && !menuToggle.contains(event.target)) {
      // console.log("Closing mobile menu due to outside click");
      closeMobileMenu();
    }
  };

  // Global Body Class Management
  watch([isMobileMenuActive, isAccountPopupActive, isCartPopupActive, isAdminRoute],
    ([mobileActive, accountActive, cartActive, adminActive]) => {
      const body = document.body;
      if (mobileActive) body.classList.add('mobile-menu-active');
      else body.classList.remove('mobile-menu-active');

      // Add popup-open class if any relevant popup/menu is open AND not on an admin route
      if (!adminActive && (mobileActive || accountActive || cartActive)) {
        body.classList.add('popup-open');
      } else {
        body.classList.remove('popup-open');
      }
    }, { immediate: true, deep: true } // Use deep watch if needed, though likely not here
  );

  // Watch locale changes
  watch(locale, (newLocale, oldLocale) => {
    if (newLocale !== oldLocale && isLoggedIn.value) { // Only refetch for logged-in users
      console.log(`App locale changed to ${newLocale}, refetching cart.`);
      fetchCart(); // Trigger backend fetch which handles translation
    }
  });

  // Lifecycle Hooks
  onMounted(async () => {
    console.log("App.vue: Mounted.");
    await checkLoginStatus(); // Checks login AND fetches initial cart

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    document.addEventListener('click', handleClickOutside, true); // Use capture phase if needed

    // Setup router navigation guard for closing popups
    router.afterEach((to, from) => {
      // Close popups on navigation, unless staying within admin or navigating to/from admin specifically handled elsewhere
      if (!to.path.startsWith('/admin') || !from.path.startsWith('/admin')) {
        // console.log("Closing popups due to route change");
        closePopupsAndDropdowns();
      }
    });
    console.log("App.vue: Mount complete.");
  });

  onUnmounted(() => {
    console.log("App.vue: Unmounting.");
    window.removeEventListener('scroll', handleScroll);
    document.removeEventListener('click', handleClickOutside, true);
    // Unsubscribe from cart service updates
    if (unsubscribeCartUpdate) {
      unsubscribeCartUpdate();
      console.log("App.vue: Unsubscribed from cart updates.");
    }
  });

</script>

<style>
  /* Global styles from main.css */
  body.popup-open {
    /* Consider more specific locking if needed, e.g., position: fixed */
    overflow: hidden;
  }

  .fade-enter-active, .fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .fade-enter-from, .fade-leave-to {
    opacity: 0;
  }
</style>
