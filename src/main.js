// src/main.js
console.log('--- main.js started ---');

// 1. Core Vue and App Component
import { createApp } from 'vue';
import App from './App.vue';

// 2. Router
import router from './router';

// 3. Global Stylesheet
import './assets/main.css';

// 4. Font Awesome Setup
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
// Import ALL necessary icons from across your application
import {
  faSearch, faUser, faReceipt, faShoppingCart, faSignInAlt, faUserPlus,
  faSignOutAlt, faUserCog, faExclamationTriangle, faBoxOpen, faChevronLeft,
  faChevronRight, faCheck, faRulerCombined, faGem, faSeedling, faWeightHanging,
  faStar, faStarHalfAlt, faThumbsUp, faUserShield, faSave, faFilter,
  faRotateRight, faTimesCircle, faLock, faSpinner, faCompass, faCheckCircle,
  faPlusCircle, faPlus, faTrashAlt, faImage, faEye, faListAlt, faEdit, faTrash,
  faHourglassHalf, faTags, faUsers, faDollarSign, faStore, // <<< Added faUsers here
  faDesktop, faBell, faTools, faSyncAlt, faLanguage, faCaretDown,
  faUserTag, faUserMinus, faFlagUsa, faTachometerAlt // <<< Added faTachometerAlt here
} from '@fortawesome/free-solid-svg-icons'; // <<< Ensure faUsers and faTachometerAlt are in this import
import {
  faStar as faStarRegular,
  faThumbsUp as faThumbsUpRegular
} from '@fortawesome/free-regular-svg-icons';
import {
  faInstagram, faPinterest, faTwitter, faFacebookF
} from '@fortawesome/free-brands-svg-icons';

// Add all imported icons to the library
library.add(
  // Solid
  faSearch, faUser, faReceipt, faShoppingCart, faSignInAlt, faUserPlus,
  faSignOutAlt, faUserCog, faExclamationTriangle, faBoxOpen, faChevronLeft,
  faChevronRight, faCheck, faRulerCombined, faGem, faSeedling, faWeightHanging,
  faStar, faStarHalfAlt, faThumbsUp, faUserShield, faSave, faFilter,
  faRotateRight, faTimesCircle, faLock, faSpinner, faCompass, faCheckCircle,
  faPlusCircle, faPlus, faTrashAlt, faImage, faEye, faListAlt, faEdit, faTrash,
  faHourglassHalf, faTags, faUsers, faDollarSign, faStore, // <<< faUsers is now correctly imported and added
  faDesktop, faBell, faTools, faSyncAlt, faLanguage, faCaretDown,
  faUserTag, faUserMinus, faFlagUsa, faTachometerAlt, // <<< faTachometerAlt is now correctly imported and added
  // Regular
  faStarRegular, faThumbsUpRegular,
  // Brands
  faInstagram, faPinterest, faTwitter, faFacebookF
);

// 5. Internationalization (i18n) Setup
import { createI18n } from 'vue-i18n';

// Import locale messages
import enMessages from './locales/en.json';
import zhMessages from './locales/zh.json';
// import frMessages from './locales/fr.json'; // Add more languages as needed

// --- Centralized Language Configuration ---
export const SUPPORTED_LOCALES = [ // Export for use in Admin components
  { code: 'en', name: 'English' },
  { code: 'zh', name: '中文 (简体)' },
  // { code: 'fr', name: 'Français' },
];
export const DEFAULT_LOCALE = 'en';
// --- End Centralized Language Configuration ---


// --- Helper Function to Determine Initial Locale ---
function getDefaultLocale() {
  const supportedCodes = SUPPORTED_LOCALES.map(l => l.code);

  // 1. Check localStorage
  const savedLocale = localStorage.getItem('user-locale');
  if (savedLocale && supportedCodes.includes(savedLocale)) {
    console.log(`Using saved locale: ${savedLocale}`);
    return savedLocale;
  }

  // 2. Check browser preferences
  if (navigator.languages && navigator.languages.length) {
    for (const lang of navigator.languages) {
      const baseLang = lang.split('-')[0].toLowerCase();
      if (supportedCodes.includes(baseLang)) {
        console.log(`Using browser locale: ${baseLang}`);
        return baseLang;
      }
    }
  }

  // 3. Fallback
  console.log(`Falling back to default locale: ${DEFAULT_LOCALE}`);
  return DEFAULT_LOCALE;
}
// --- End Helper Function ---

// Create i18n instance
const i18n = createI18n({
  legacy: false,
  locale: getDefaultLocale(),
  fallbackLocale: DEFAULT_LOCALE,
  messages: {
    en: enMessages,
    zh: zhMessages,
    // fr: frMessages,
  },
  // Optional: Suppress warnings
  // silentTranslationWarn: process.env.NODE_ENV === 'production',
  // silentFallbackWarn: process.env.NODE_ENV === 'production',
});

// 6. Custom Directives
import tiltDirective from './directives/tilt.js';

// 7. Create Vue App Instance
const app = createApp(App);

// 8. Use Plugins and Router
app.use(router);
app.use(i18n);

// 9. Register Global Components & Directives
app.component('font-awesome-icon', FontAwesomeIcon);
app.directive('tilt', tiltDirective);

// 10. Mount the App
app.mount('#app');

console.log('--- main.js finished mounting ---');
