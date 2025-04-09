// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ProductsView from '../views/ProductsView.vue'
// Import the new view
import ProductDetailView from '../views/ProductDetailView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { title: 'AURORA Furnishings | Sustainable Craftsmanship' }
    },
    {
      path: '/products',
      name: 'products',
      component: ProductsView,
      meta: { title: 'AURORA Furnishings | Explore Collections' }
    },
    // Add the product detail route
    {
      path: '/product-detail/:id',
      name: 'product-detail',
      component: ProductDetailView, // Use the imported component
      meta: { title: 'Product Details | AURORA Furnishings' } // Dynamic title set in component
    },
    // --- Keep the 404 Route (or add one if missing) ---
    {
      path: '/:pathMatch(.*)*', // Catch-all route
      name: 'NotFound',
      component: () => import('../views/NotFoundView.vue'), // Lazy load a 404 component
      meta: { title: 'Page Not Found | AURORA Furnishings' }
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else if (to.hash) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ el: to.hash, behavior: 'smooth', top: document.querySelector(to.hash)?.offsetTop - 80 /* Adjust offset for header */ });
        }, 300);
      });
    } else {
      // Only scroll to top if not navigating between product pages with filters/pagination
      if (from.name === 'products' && to.name === 'products') {
        // Don't scroll to top if just changing page/filters on products view
        return;
      }
      return { top: 0, behavior: 'smooth' };
    }
  }
})

router.beforeEach((to, from, next) => {
  // Title is now often set within the component for dynamic content
  if (to.meta?.title && !to.params.id) { // Avoid overwriting title set by component
    document.title = to.meta.title;
  } else if (!to.meta?.title) { // Set default if no title exists
    document.title = 'AURORA Furnishings';
  }
  next();
});

export default router
