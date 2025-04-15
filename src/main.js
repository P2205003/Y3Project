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
import {
  faSearch, faUser, faReceipt, faShoppingCart, faSignInAlt, faUserPlus,
  faSignOutAlt, faUserCog, faExclamationTriangle, faBoxOpen, faChevronLeft,
  faChevronRight, faCheck, faRulerCombined, faGem, faSeedling,
  faStar, faStarHalfAlt, faThumbsUp, faUserShield, faSave, faFilter,
  faRotateRight, faTimesCircle, faLock, faSpinner, faCompass // Added from various components
} from '@fortawesome/free-solid-svg-icons';
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
  faChevronRight, faCheck, faRulerCombined, faGem, faSeedling,
  faStar, faStarHalfAlt, faThumbsUp, faUserShield, faSave, faFilter,
  faRotateRight, faTimesCircle, faLock, faSpinner, faCompass,
  // Regular
  faStarRegular, faThumbsUpRegular,
  // Brands
  faInstagram, faPinterest, faTwitter, faFacebookF
);

// 5. Internationalization (i18n) Setup
import { createI18n } from 'vue-i18n';

// Import locale messages
import enMessages from './locales/en.json';
// import frMessages from './locales/fr.json'; // <-- Uncomment and add more languages as needed

// --- Helper Function to Determine Initial Locale ---
function getDefaultLocale() {
  const supportedLocales = ['en']; // <-- Add your supported language codes here (e.g., 'fr', 'es')
  const defaultLocale = 'en'; // <-- Your default fallback language

  // 1. Check localStorage for saved preference
  const savedLocale = localStorage.getItem('user-locale');
  if (savedLocale && supportedLocales.includes(savedLocale)) {
    console.log(`Using saved locale: ${savedLocale}`);
    return savedLocale;
  }

  // 2. Check browser language preference
  if (navigator.languages && navigator.languages.length) {
    for (const lang of navigator.languages) {
      const baseLang = lang.split('-')[0]; // Use base language (e.g., 'en' from 'en-US')
      if (supportedLocales.includes(baseLang)) {
        console.log(`Using browser locale: ${baseLang}`);
        return baseLang;
      }
    }
  }

  // 3. Fallback to default
  console.log(`Falling back to default locale: ${defaultLocale}`);
  return defaultLocale;
}
// --- End Helper Function ---

// Create i18n instance
const i18n = createI18n({
  legacy: false, // Use Composition API mode (important!)
  locale: getDefaultLocale(), // Set the initial locale
  fallbackLocale: 'en', // Fallback if a translation key is missing
  messages: {
    en: enMessages,
    // fr: frMessages, // <-- Add other imported messages here
  },
  // Optional: Suppress warnings in production about missing translations or fallbacks
  // silentTranslationWarn: process.env.NODE_ENV === 'production',
  // silentFallbackWarn: process.env.NODE_ENV === 'production',
});

// 6. Custom Directives
import tiltDirective from './directives/tilt.js';

// 7. Create Vue App Instance
const app = createApp(App);

// 8. Use Plugins and Router
app.use(router);
app.use(i18n); // Use the i18n plugin

// 9. Register Global Components & Directives
app.component('font-awesome-icon', FontAwesomeIcon);
app.directive('tilt', tiltDirective);

// 10. Mount the App
app.mount('#app');

console.log('--- main.js finished mounting ---');
