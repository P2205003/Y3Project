import { createRouter, createWebHistory } from 'vue-router';
import MainLayout from '../components/MainLayout.vue';
import AdminLayout from '../components/AdminLayout.vue';
import Page1 from '../views/Page1.vue';
import Page2 from '../views/Page2.vue';
import ShoppingCart from '../components/ShoppingCart.vue';
import SearchPage from '../components/SearchPage.vue';
import ProductPage from '../components/ProductPage.vue';
import AddItem from '../components/admin/AddItem.vue';
import Login from '../components/login.vue';
import Register from '../components/Register.vue';
import AdminDashboard from '../components/admin/AdminDashboard.vue';
import AdminProducts from '../components/admin/AdminProducts.vue';
import AdminOrders from '../components/admin/AdminOrders.vue';
import AdminUsers from '../components/admin/AdminUsers.vue';
import AdminSettings from '../components/admin/AdminSettings.vue';
import Checkout from '../components/Checkout.vue';
import OrdersHistory from '../components/OrdersHistory.vue';
import OrderDetails from '../components/OrderDetails.vue';
import NotFound from '../components/NotFound.vue';
import AdminOrderDetails from '../components/admin/AdminOrderDetails.vue';

// Define a function to check if user is admin
const isAdmin = async () => {
  try {
    const response = await fetch('/api/users/check-admin', {
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      return data.isAdmin;
    }

    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

const routes = [
  // User facing routes
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'Home',
        component: Page1
      },
      {
        path: 'page2',
        name: 'Page2',
        component: Page2
      },
      {
        path: 'shopping-cart',
        name: 'ShoppingCart',
        component: ShoppingCart,
      },
      {
        path: '/checkout',
        name: 'Checkout',
        component: Checkout,
        meta: { requiresAuth: true }
      },
      {
        path: '/orders',
        name: 'OrdersHistory',
        component: OrdersHistory,
        meta: { requiresAuth: true }
      },
      {
        path: '/orders/:id',
        name: 'OrderDetails',
        component: OrderDetails,
        meta: { requiresAuth: true }
      },
      {
        path: 'search',
        name: 'SearchPage',
        component: SearchPage
      },
      {
        path: 'product/:id',
        name: 'ProductPage',
        component: ProductPage
      }
    ]
  },
  // Authentication routes
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },

  // Admin routes with AdminLayout
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: AdminDashboard
      },
      {
        path: 'products',
        name: 'AdminProducts',
        component: AdminProducts
      },
      {
        path: 'orders',
        name: 'AdminOrders',
        component: AdminOrders
      },
      {
        path: 'orders/:id',
        name: 'AdminOrderDetails',
        component: AdminOrderDetails
      },
      {
        path: 'products/add',
        name: 'AddItem',
        component: AddItem
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: AdminUsers
      },
      {
        path: 'settings',
        name: 'AdminSettings',
        component: AdminSettings
      }
    ]
  },

  // 404 route
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation Guard
router.beforeEach(async (to, from, next) => {
  // Check if route requires authentication
  if (to.matched.some(record => record.meta.requiresAuth)) {
    try {
      const response = await fetch('/api/users/check-login', {
        credentials: 'include'
      });

      const data = await response.json();

      if (!data.isLoggedIn) {
        // User is not logged in, redirect to login
        return next({
          path: '/login',
          query: { redirect: to.fullPath }
        });
      }

      // If route requires admin privileges
      if (to.matched.some(record => record.meta.requiresAdmin)) {
        const hasAdminAccess = await isAdmin();

        if (!hasAdminAccess) {
          // User is not an admin, redirect to home
          console.warn('Unauthorized access attempt to admin route:', to.path);
          return next({ path: '/' });
        }
      }

      // User has necessary permissions
      next();
    } catch (error) {
      console.error('Auth check error:', error);
      next('/login');
    }
  } else {
    // Route doesn't require authentication
    next();
  }
});

export default router;
