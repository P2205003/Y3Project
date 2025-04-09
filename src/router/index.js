// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import ProductsView from '../views/ProductsView.vue';
import ProductDetailView from '../views/ProductDetailView.vue'; // Ensure this import is correct
const OrdersView = () => import('../views/OrdersView.vue');
const OrderDetailView = () => import('../views/OrderDetailView.vue'); // Use lazy loading

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // ... other routes (home) ...
    {
      path: '/products',
      name: 'products',
      component: ProductsView,
      meta: { title: 'AURORA Furnishings | Explore Collections' }
    },

    // --- Add props: true to this route ---
    {
      path: '/product-detail/:id',
      name: 'product-detail', // Correct name used in OrdersView
      component: ProductDetailView,
      meta: { title: 'Product Details | AURORA Furnishings' },
      props: true // <--- ADD THIS LINE
    },
    // --- END CHANGE ---

    {
      path: '/orders',
      name: 'orders-history',
      component: OrdersView,
      meta: {
        title: 'My Orders | AURORA Furnishings',
        requiresAuth: true
      }
    },
    {
        path: '/account/profile',
        name: 'user-profile',
        // component: () => import('../views/UserProfileView.vue'),
        component: HomeView, // Placeholder
        meta: { title: 'My Profile | AURORA', requiresAuth: true }
    },
    {
        path: '/orders/:id',
        name: 'OrderDetails',
        component: OrderDetailView, // Correctly points to OrderDetailView
        meta: {
            title: 'Order Details | AURORA',
            requiresAuth: true
        },
        props: true // This route correctly has props: true
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('../views/NotFoundView.vue'),
      meta: { title: 'Page Not Found | AURORA Furnishings' }
    }
  ],
  // ... scrollBehavior ...
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) { return savedPosition; }
    else if (to.hash) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ el: to.hash, behavior: 'smooth', top: document.querySelector(to.hash)?.offsetTop - 80 });
            }, 300);
        });
    } else {
        if (from.name === 'products' && to.name === 'products') { return; }
        return { top: 0, behavior: 'smooth' };
    }
  }
});

// ... beforeEach navigation guard ...
router.beforeEach(async (to, from, next) => {
  // Set document title
  const defaultTitle = 'AURORA Furnishings';
  document.title = to.meta?.title || defaultTitle;

  // Check if the route requires authentication
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  if (requiresAuth) {
    // Check login status
    let isLoggedIn = false;
    try {
        const response = await fetch('/api/users/check-login', { credentials: 'include' });
        if (response.ok) {
            const data = await response.json();
            isLoggedIn = data.isLoggedIn;
        }
    } catch (error) {
        console.error('Error checking login status for route guard:', error);
        isLoggedIn = false;
    }

    if (!isLoggedIn) {
      console.log(`Route guard: User not authenticated for "${to.path}". Redirecting.`);
      next({ name: 'home' }); // Redirect to home
    } else {
      next(); // User is logged in, proceed
    }
  } else {
    next(); // Route does not require auth
  }
});


export default router;
