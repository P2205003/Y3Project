import { createRouter, createWebHistory } from 'vue-router';
import MainLayout from '../components/MainLayout.vue';
import Page1 from '../views/Page1.vue';
import Page2 from '../views/Page2.vue';
import ShoppingCart from '../components/ShoppingCart.vue';
import SearchPage from '../components/SearchPage.vue';
import ProductPage from '../components/ProductPage.vue';
import AddItem from '@/components/AddItem.vue';

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
        component: ShoppingCart
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
        component: AddItem
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;