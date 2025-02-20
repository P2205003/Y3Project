import './assets/main.css'

import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import ElementPlus from 'element-plus';
// import 'element-plus/dist/index.css'

const app = createApp(App); // Create the app instance first

app.config.globalProperties.appContext = {
  isLoggedIn: false, // Default to false
  user: null,
  logout: () => { } // Add an empty function initially
};


// Mount the app *after* setting up global properties
app.use(router).use(ElementPlus).mount('#app');
