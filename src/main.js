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
  faSignOutAlt, faUserCog, faExclamationTriangle, faBoxOpen, faChevronLeft,
  faChevronRight, faCheck, faRulerCombined, faGem, faSeedling,
  // --- NEW REVIEW ICONS ---
  faStar,             // Full star
  faStarHalfAlt,    // Half star (alias for faStarHalfStroke)
  faThumbsUp,       // Thumbs up for helpful
  // --- END NEW REVIEW ICONS ---
} from '@fortawesome/free-solid-svg-icons'
/* import specific REGULAR icons (optional, for empty star/thumbs up) */
import {
    faStar as faStarRegular,            // Empty star
    faThumbsUp as faThumbsUpRegular     // Empty thumbs up
} from '@fortawesome/free-regular-svg-icons'
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
  faCheck, faRulerCombined, faGem, faSeedling,
  // --- NEW REVIEW ICONS ---
  faStar, faStarHalfAlt, faThumbsUp, faStarRegular, faThumbsUpRegular
  // --- END NEW REVIEW ICONS ---
)

// --- Import the custom directive ---
import tiltDirective from './directives/tilt.js';

const app = createApp(App)

app.use(router)
app.component('font-awesome-icon', FontAwesomeIcon) // Keep existing registration

// --- Register the directive ---
app.directive('tilt', tiltDirective);

app.mount('#app')

console.log('--- main.js finished mounting ---');
