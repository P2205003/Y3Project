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
  faSearch, faUser, faReceipt, faShoppingCart, faSignInAlt, faUserPlus,
  faSignOutAlt, // <-- Added
  faUserCog,    // <-- Added (for My Account example)
  faExclamationTriangle, faBoxOpen, faChevronLeft, faChevronRight, // From ProductDetail
  faCheck, faRulerCombined, faGem, faSeedling // From ProductDetail
} from '@fortawesome/free-solid-svg-icons'
/* import specific BRAND icons */
import {
  faInstagram, faPinterest, faTwitter, faFacebookF
} from '@fortawesome/free-brands-svg-icons'

/* add icons to the library */
library.add(
  // Base Icons
  faSearch, faUser, faReceipt, faShoppingCart, faSignInAlt, faUserPlus,
  faSignOutAlt, faUserCog, // Auth icons
  // Brand Icons
  faInstagram, faPinterest, faTwitter, faFacebookF,
  // ProductDetail Icons
  faExclamationTriangle, faBoxOpen, faChevronLeft, faChevronRight,
  faCheck, faRulerCombined, faGem, faSeedling
)

// --- Import the custom directive ---
import tiltDirective from './directives/tilt.js';

const app = createApp(App)

app.use(router)
app.component('font-awesome-icon', FontAwesomeIcon)

// --- Register the directive ---
app.directive('tilt', tiltDirective);

app.mount('#app')

console.log('--- main.js finished mounting ---');
