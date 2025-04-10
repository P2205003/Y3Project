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
  <TheFooter />

  <!-- Popups (Rendered here to overlay everything) -->
  <AccountPopup :is-active="isAccountPopupActive"
                :initial-tab="accountPopupTab"
                @close="closeAccountPopup"
                @login-success="handleLoginSuccess" /> <!-- Handle login success -->
  <CartPopup :is-active="isCartPopupActive"
             :cart-items="cartData"
             :subtotal="cartSubtotal"
             @close="closeCartPopup"
             @update-quantity="updateCartItemQuantity"
             @remove-item="removeCartItem" />

</template>

<script setup>
  // --- IMPORTANT: Import provide ---
  import { ref, onMounted, onUnmounted, computed, nextTick, watch, provide } from 'vue';
  import { useRouter } from 'vue-router';
  import cartService from '@/services/cartService'; // Import cart service

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
  const isLoading = ref(true); // Preloader state
  const appReady = ref(false); // State to track if initial checks are done
  const isScrolled = ref(false);
  const scrollPercentage = ref(0);
  const isMobileMenuActive = ref(false);
  const isSearchActive = ref(false);
  const isAccountDropdownActive = ref(false);
  const isAccountPopupActive = ref(false);
  const accountPopupTab = ref('login'); // 'login' or 'register'
  const isCartPopupActive = ref(false);

  // --- Authentication State ---
  const isLoggedIn = ref(false);
  const currentUser = ref(null); // Store { username, fullName, _id (optional but useful) }

  // --- Cart State ---
  const cartData = ref([]); // Now managed by cartService interaction
  const totalCartItems = ref(0); // Reactive cart item count
  const cartSubtotal = computed(() => cartService.calculateTotal({ items: cartData.value })); // Use service calculator

  const router = useRouter(); // Get router instance

  // --- Provide Application Context ---
  // Make reactive state and methods available to descendants
  provide('appContext', {
    isLoggedIn, // Provide the ref directly for reactivity
    currentUser, // Provide the ref directly
    openAccountPopup, // Provide the method
    // Add other things if needed by descendants later
  });
  // --- End Provide ---


  // --- Methods ---

  // --- Login Status Check ---
  const checkLoginStatus = async () => {
    console.log('Checking login status...');
    try {
        const response = await fetch('/api/users/check-login', { credentials: 'include' });
        if (response.ok) {
            const data = await response.json();
            isLoggedIn.value = data.isLoggedIn;
            currentUser.value = data.isLoggedIn ? data.user : null; // user object now includes shippingAddress
            console.log('Login status checked:', { isLoggedIn: isLoggedIn.value, user: currentUser.value });
            await fetchCart(); // Fetch cart after confirming login status
        } else {
            console.warn('Failed to check login status, assuming logged out.');
            isLoggedIn.value = false;
            currentUser.value = null;
            await fetchCart(); // Fetch local cart if status check fails
        }
    } catch (error) {
        console.error('Error checking login status:', error);
        isLoggedIn.value = false;
        currentUser.value = null;
        await fetchCart(); // Fetch local cart on error
    } finally {
        appReady.value = true; // Indicate app is ready after check
        setTimeout(() => { isLoading.value = false; }, 200); // Hide preloader slightly after check
    }
  };

  // --- Cart Management ---
  const fetchCart = async () => {
    console.log("App.vue: Fetching cart data...");
    try {
        const cart = await cartService.getCart(isLoggedIn.value);
        cartData.value = cart.items || [];
        updateCartCount(); // Update count after fetching
        console.log("App.vue: Cart data updated:", cartData.value);
    } catch (error) {
        console.error("App.vue: Error fetching cart:", error);
        cartData.value = []; // Ensure cart is empty on error
        updateCartCount();
    }
  };

  // Update cart count separately
  const updateCartCount = () => {
      totalCartItems.value = cartData.value.reduce((sum, item) => sum + (item.quantity || 0), 0); // Ensure quantity exists
  };

  // Call fetchCart whenever cart needs refresh (add, update, remove, login, logout)
  cartService.onCartUpdate(fetchCart); // Subscribe to cart service updates

  const handleAddToCart = async (itemToAdd) => {
    console.log('Adding to cart (App.vue):', itemToAdd);
    const cartItem = {
        productId: itemToAdd.id,
        quantity: Math.max(1, itemToAdd.quantity || 1),
        name: itemToAdd.name,
        price: itemToAdd.price,
        image: itemToAdd.image,
        attributes: itemToAdd.attributes || {}
    };

    // --- Add loading state for cart action ---
    // You might want a more global loading indicator for this
    // isLoading.value = true; // Example: reuse main loader, or use a dedicated one

    await cartService.addItem(cartItem, isLoggedIn.value);

    // isLoading.value = false; // Turn off loader
    // fetchCart() will be triggered by cartService.notifyCartUpdated()

    const cartOpenDelay = 300; // Shorten delay slightly
    console.log(`Cart popup will open in ${cartOpenDelay}ms`);
    setTimeout(() => {
      isCartPopupActive.value = true;
      console.log("Opening cart popup now.");
    }, cartOpenDelay);
  };

  const updateCartItemQuantity = async ({ productId, change, attributes }) => { // Expect attributes if needed
    const item = cartData.value.find(item =>
        item.productId === productId &&
        JSON.stringify(item.attributes || {}) === JSON.stringify(attributes || {})
    );
    if (item) {
        const newQuantity = item.quantity + change;
        if (newQuantity <= 0) {
            await cartService.removeItem(productId, attributes, isLoggedIn.value);
        } else {
            await cartService.updateItemQuantity(productId, newQuantity, attributes, isLoggedIn.value);
        }
        // fetchCart() triggered by service
    }
  };

  const removeCartItem = async ({ productId, attributes }) => { // Expect attributes
    await cartService.removeItem(productId, attributes, isLoggedIn.value);
    // fetchCart() triggered by service
  };


  // --- Authentication Actions ---
  const handleLoginSuccess = async (userData) => { // Make async
    console.log('Login successful in App.vue, user:', userData);
    isLoggedIn.value = true;
    currentUser.value = userData;
    // Explicitly fetch cart again AFTER login success event is handled in App.vue
    await fetchCart();
  };

  const handleLogout = async () => {
    console.log('Logging out...');
    try {
        const response = await fetch('/api/users/logout', {
            method: 'POST',
            credentials: 'include'
        });
        if (response.ok) {
            console.log('Logout successful on backend.');
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('Logout failed:', errorData.message || response.statusText);
        }
    } catch (error) {
        console.error('Error during logout:', error);
    } finally {
        // Ensure client-side state is always reset
        isLoggedIn.value = false;
        currentUser.value = null;
        isAccountDropdownActive.value = false; // Close dropdown
        await fetchCart(); // Fetch local cart
        if (router.currentRoute.value.meta.requiresAuth) {
            router.push('/'); // Redirect if on protected page
        }
    }
  };

  // --- UI Toggles ---
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

  // Updated function signature
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

  // Helper to close things
  const closePopupsAndDropdowns = (keepSearch = false, keepDropdown = false, keepAccountPopup = false, keepCart = false) => {
      if (!keepSearch) isSearchActive.value = false;
      if (!keepDropdown) isAccountDropdownActive.value = false;
      if (!keepAccountPopup) isAccountPopupActive.value = false;
      if (!keepCart) isCartPopupActive.value = false;
      isMobileMenuActive.value = false; // Always close mobile menu
  };


  // --- Global Click Listener ---
  const handleClickOutside = (event) => {
    // Close account dropdown
    const accountTrigger = document.getElementById('account-dropdown-trigger');
    const accountMenu = document.getElementById('account-dropdown-menu');
    if (isAccountDropdownActive.value && accountMenu && accountTrigger && !accountMenu.contains(event.target) && !accountTrigger.contains(event.target)) {
        closeAccountDropdown();
    }
    // Close search
    const searchContainer = document.querySelector('.search-container');
    const searchButton = document.getElementById('search-button'); // Target button too
    if (isSearchActive.value && searchContainer && !searchContainer.contains(event.target) && event.target !== searchButton && !searchButton?.contains(event.target)) {
      closeSearch();
    }
  };

  // --- Global Body Class Management ---
  watch([isMobileMenuActive, isAccountPopupActive, isCartPopupActive],
    ([mobileActive, accountActive, cartActive]) => {
      const body = document.body;
      if (mobileActive) body.classList.add('mobile-menu-active');
      else body.classList.remove('mobile-menu-active');

      if (mobileActive || accountActive || cartActive) body.classList.add('popup-open');
      else body.classList.remove('popup-open');
    }, { immediate: true }
  );

  // --- Lifecycle Hooks ---
  onMounted(async () => {
    await checkLoginStatus(); // Check login and fetch initial cart
    // isLoading is now set inside checkLoginStatus's finally block

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    document.addEventListener('click', handleClickOutside);

    router.afterEach(() => { // Close UI elements on route change
      closePopupsAndDropdowns();
    });
  });

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
    document.removeEventListener('click', handleClickOutside);
    // Unsubscribe? cartService cleans up its own listeners usually.
  });

</script>

<style>
  /* Add styles for popup-open if not already present */
  body.popup-open {
    overflow: hidden;
  }
</style>
