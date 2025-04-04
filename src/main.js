// src/main.js
console.log('--- main.js started ---');

import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

/* import the fontawesome core */
import { library } from '@fortawesome/fontawesome-svg-core'
/* import font awesome icon component */
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
/* import specific SOLID icons */
import {
  faSearch, faUser, faReceipt, faShoppingCart, faSignInAlt, faUserPlus
} from '@fortawesome/free-solid-svg-icons'
/* import specific BRAND icons */
import {
  faInstagram, faPinterest, faTwitter, faFacebookF
} from '@fortawesome/free-brands-svg-icons'

/* add icons to the library */
library.add(
  faSearch, faUser, faReceipt, faShoppingCart, faSignInAlt, faUserPlus,
  faInstagram, faPinterest, faTwitter, faFacebookF
)

// --- Import the custom directive ---
import tiltDirective from './directives/tilt.js'; // Adjust path if needed

const app = createApp(App)

app.use(router)
app.component('font-awesome-icon', FontAwesomeIcon)

// --- Register the directive ---
app.directive('tilt', tiltDirective);

app.mount('#app')

console.log('--- main.js finished mounting ---');
