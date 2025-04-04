import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ProductsView from '../views/ProductsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { title: 'AURORA Furnishings | Sustainable Craftsmanship' } // Example meta
    },
    {
      path: '/products',
      name: 'products',
      component: ProductsView,
      meta: { title: 'AURORA Furnishings | Explore Collections' }
    }
    // Add other routes later (e.g., product detail, cart, checkout)
    // {
    //   path: '/product-detail/:id', // Example detail route
    //   name: 'product-detail',
    //   // component: () => import('../views/ProductDetailView.vue') // Lazy load
    // },
  ],
  // Scroll behavior to handle anchor links and top-of-page navigation
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else if (to.hash) {
      // Wait a tick for the page to render before scrolling
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ el: to.hash, behavior: 'smooth' });
        }, 300); // Adjust delay if needed
      });
    } else {
      return { top: 0, behavior: 'smooth' };
    }
  }
})

// Update page title on navigation
router.beforeEach((to, from, next) => {
  document.title = to.meta?.title ?? 'AURORA Furnishings';
  next();
});


export default router
