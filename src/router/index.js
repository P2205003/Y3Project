import { createRouter, createWebHistory } from 'vue-router';
import MainLayout from '../components/MainLayout.vue';
import Page1 from '../views/Page1.vue';
import Page2 from '../views/Page2.vue';
import ShoppingCart from '../components/ShoppingCart.vue';
import SearchPage from '../components/SearchPage.vue';
import ProductPage from '../components/ProductPage.vue';
import AddItem from '../components/AddItem.vue';
import Login from '../components/login.vue';
import Register from '../components/Register.vue';
import AdminDashboard from '../components/AdminDashboard.vue';

const routes = [
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
        path: 'search',
        name: 'SearchPage',
        component: SearchPage
      },
      {
        path: 'product/:id',
        name: 'ProductPage',
        component: ProductPage
      },
      {
        path: 'add-item',
        name: 'AddItem',
        component: AddItem,
        meta: { requiresAuth: true } // Requires authentication
      },
      {
        path: 'admin',
        name: 'AdminDashboard',
        component: AdminDashboard,
        meta: { requiresAuth: true } // Admin route requires authentication
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation Guard
router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth) {
    try {
      const response = await fetch('/api/users/check-login');
      const data = await response.json();
      if (data.isLoggedIn) {
        next(); // User is authenticated
      } else {
        next('/login'); // Redirect to login
      }
    } catch (error) {
      console.error('Error checking login status:', error);
      next('/login');
    }
  } else {
    next();
  }
});

export default router;
